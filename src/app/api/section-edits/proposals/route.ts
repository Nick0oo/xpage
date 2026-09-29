import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runEveStructured } from "@/lib/eve-runtime";
import { recordTraceStep } from "@/lib/generation-traces";
import { isLocalRequest } from "@/lib/media/request-guard";
import { getTechnique } from "@/lib/techniques";
import { extractSection, relevantCss, validateScopedCss, getSectionCode } from "@/lib/section-edits/document";
import { landingFingerprint } from "@/lib/section-edits/fingerprint";
import { sectionEditProposalRequestSchema, sectionPatchSchema } from "@/lib/section-edits/schemas";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  if (!isLocalRequest(request)) return NextResponse.json({ error: "El editor solo está disponible en este equipo." }, { status: 403 });
  const parsed = sectionEditProposalRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisa la instrucción, técnicas y revisión seleccionadas." }, { status: 400 });
  const input = parsed.data;
  const landing = await prisma.savedLanding.findUnique({
    where: { id: input.savedLandingId },
    include: { mediaAssets: { where: { isCurrent: true, sectionId: input.sectionId } } },
  });
  if (!landing) return NextResponse.json({ error: "No encontramos esta landing en la Biblioteca." }, { status: 404 });
  if (landing.sectionRevision !== input.baseRevision) {
    return NextResponse.json({ error: "La landing cambió desde que abriste el editor. Actualiza la vista antes de proponer." }, { status: 409, headers: { "X-XPage-Code": "stale_revision" } });
  }

  let target: ReturnType<typeof extractSection>;
  try {
    target = extractSection(landing.html, input.sectionId);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "La sección no se puede editar." }, { status: 409 });
  }
  let cssContext: string;
  let brief: unknown;
  try {
    cssContext = relevantCss(landing.css, input.sectionId, target.html);
    brief = JSON.parse(landing.briefJson) as unknown;
  } catch {
    return NextResponse.json({ error: "El HTML, CSS o brief guardado no se puede editar con seguridad." }, { status: 409 });
  }
  const techniques = input.techniqueIds.map((id) => {
    const technique = getTechnique(id);
    return `- ${technique.name}: propósito: ${technique.purpose} Entradas: ${technique.inputs} Aporte concreto: ${technique.artifact} Instrucción: ${technique.instruction}`;
  }).join("\n");
  const assets = landing.mediaAssets.map((asset) => ({ type: asset.type, provider: asset.provider, author: asset.author, altText: asset.altText, slotId: asset.slotId }));
  const message = `Eres editor de una sola sección de una landing. Devuelve exclusivamente SectionPatch con sectionId, html (solo el contenido interior, sin wrapper section), css, summary y warnings. No reveles razonamiento privado; summary y warnings describen decisiones visibles.

ALCANCE: cambia solo la sección indicada. Mantén las ranuras data-xpage-slot exactamente con los mismos IDs y conserva literalmente cada nodo <img>, <video> y <source> existente. No cambies JavaScript ni la estructura de otras secciones. HTML semántico, responsive, accesible, texto natural y claims respaldados por brief. No agregues script/style/iframe ni manejadores HTML. El CSS debe comenzar cada selector con [data-xpage-section="${input.sectionId}"]; puede usar @media con scope idéntico. No uses URLs, selectores globales ni @import.

TÉCNICAS SELECCIONADAS:
${techniques}

BRIEF:
${JSON.stringify(brief)}

INSTRUCCIÓN DE EDICIÓN:
${input.instruction}

SECCIÓN ACTUAL (innerHTML):
${target.innerHtml}

CSS ACTUAL RELACIONADO:
${cssContext}

MEDIOS LOCALES QUE DEBES CONSERVAR:
${JSON.stringify(assets)}

Devuelve html y css completos de esta sección. El summary resume el cambio que verá la persona. Incluye advertencias solo si existe un límite concreto.`;
  const startedAt = Date.now();
  try {
    const result = await runEveStructured({ modelChoice: input.modelChoice, message, outputSchema: sectionPatchSchema });
    const patch = sectionPatchSchema.parse(result.data);
    if (patch.sectionId !== input.sectionId) throw new Error("Eve respondió para otra sección.");
    const css = validateScopedCss(patch.css, input.sectionId);
    const html = getSectionCode(landing.html, input.sectionId, patch.html);
    const proposalId = randomUUID();
    const baseFingerprint = landingFingerprint(landing);
    const proposal = await prisma.sectionEditProposal.create({
      data: {
        id: proposalId,
        savedLandingId: landing.id,
        baseRevision: landing.sectionRevision,
        baseFingerprint,
        sectionId: input.sectionId,
        techniqueIdsJson: JSON.stringify(input.techniqueIds),
        modelChoice: input.modelChoice,
        instruction: input.instruction,
        patchJson: JSON.stringify({ ...patch, css }),
      },
    });
    await recordTraceStep(landing.traceId ?? undefined, {
      eventType: "revision",
      phase: "section-edit-proposal",
      title: `Propuesta para ${input.sectionId}`,
      techniqueIds: input.techniqueIds,
      provider: "eve-local",
      model: input.modelChoice,
      userPrompt: input.instruction,
      output: { proposalId: proposal.id, sectionId: input.sectionId, summary: patch.summary, warnings: patch.warnings },
      decisionSummary: patch.summary,
      durationMs: Date.now() - startedAt,
      references: [{ kind: "landing", id: landing.id, label: landing.title }, { kind: "section", id: input.sectionId }],
    }).catch(() => undefined);
    return NextResponse.json({
      proposalId: proposal.id,
      baseRevision: landing.sectionRevision,
      beforeHtml: target.html,
      afterHtml: html,
      css: patch.css,
      nextCss: [landing.css, patch.css].filter(Boolean).join("\n"),
      patch,
    });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "No se pudo proponer el cambio.";
    await recordTraceStep(landing.traceId ?? undefined, {
      eventType: "revision", phase: "section-edit-proposal", title: `Propuesta fallida para ${input.sectionId}`,
      status: "failed", techniqueIds: input.techniqueIds, provider: "eve-local", model: input.modelChoice,
      userPrompt: input.instruction, errorMessage: messageText.slice(0, 500), durationMs: Date.now() - startedAt,
      references: [{ kind: "landing", id: landing.id, label: landing.title }, { kind: "section", id: input.sectionId }],
    }).catch(() => undefined);
    return NextResponse.json({ error: `Eve no pudo proponer este cambio con ${input.modelChoice}. ${messageText}` }, { status: 503 });
  }
}
