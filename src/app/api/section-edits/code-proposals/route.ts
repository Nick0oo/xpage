import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import postcss from "postcss";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MODEL_CHOICE } from "@/lib/model-choice";
import { recordTraceStep } from "@/lib/generation-traces";
import { isLocalRequest } from "@/lib/media/request-guard";
import { getDocumentMediaMarkup, getDocumentSlotIds, getEditableSections } from "@/lib/section-edits/document";
import { landingFingerprint } from "@/lib/section-edits/fingerprint";
import { codeEditProposalRequestSchema } from "@/lib/section-edits/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isLocalRequest(request)) return NextResponse.json({ error: "El editor solo está disponible en este equipo." }, { status: 403 });
  const parsed = codeEditProposalRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisa el código y el resumen de la edición." }, { status: 400 });
  const input = parsed.data;
  const landing = await prisma.savedLanding.findUnique({ where: { id: input.savedLandingId } });
  if (!landing) return NextResponse.json({ error: "No encontramos esta landing en la Biblioteca." }, { status: 404 });
  if (landing.sectionRevision !== input.baseRevision) return NextResponse.json({ error: "La landing cambió desde que abriste el editor. Actualiza antes de proponer código." }, { status: 409, headers: { "X-XPage-Code": "stale_revision" } });
  try {
    postcss.parse(input.css);
    const previousSections = getEditableSections(landing.html);
    const nextSections = getEditableSections(input.html);
    const nextIds = nextSections.map((section) => section.id);
    if (nextSections.some((section) => !section.editable) || new Set(nextIds).size !== nextIds.length) throw new Error("Cada sección debe tener un marcador único válido.");
    if (previousSections.some((section) => !nextIds.includes(section.id))) throw new Error("El cambio debe conservar los marcadores de las secciones actuales.");
    if (JSON.stringify(getDocumentSlotIds(landing.html)) !== JSON.stringify(getDocumentSlotIds(input.html))) throw new Error("El cambio debe conservar todos los espacios de medios actuales.");
    if (JSON.stringify(getDocumentMediaMarkup(landing.html)) !== JSON.stringify(getDocumentMediaMarkup(input.html))) throw new Error("El cambio debe conservar los medios colocados. Usa el panel de medios para sustituirlos.");
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "El código no conserva la estructura de secciones y medios." }, { status: 400 });
  }
  const proposalId = randomUUID();
  try {
    const proposal = await prisma.sectionEditProposal.create({ data: {
      id: proposalId, savedLandingId: landing.id, baseRevision: landing.sectionRevision,
      baseFingerprint: landingFingerprint(landing), sectionId: "__document__", techniqueIdsJson: JSON.stringify(input.techniqueIds ?? []),
      modelChoice: input.modelChoice ?? DEFAULT_MODEL_CHOICE, instruction: input.summary,
      patchJson: JSON.stringify({ html: input.html, css: input.css, js: input.js, summary: input.summary, warnings: [] }),
    } });
    await recordTraceStep(landing.traceId ?? undefined, {
      eventType: "revision", phase: "code-edit-proposal", title: "Código preparado para revisión",
      output: { proposalId: proposal.id, summary: input.summary }, decisionSummary: input.summary,
      references: [{ kind: "landing", id: landing.id, label: landing.title }],
    }).catch(() => undefined);
    return NextResponse.json({
      proposalId: proposal.id, baseRevision: landing.sectionRevision,
      beforeCode: { title: landing.title, html: landing.html, css: landing.css, js: landing.js },
      afterCode: { title: landing.title, html: input.html, css: input.css, js: input.js }, summary: input.summary,
    });
  } catch {
    return NextResponse.json({ error: "No se pudo guardar la propuesta de código." }, { status: 500 });
  }
}
