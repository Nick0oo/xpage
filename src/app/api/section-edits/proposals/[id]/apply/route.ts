import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordTraceStep } from "@/lib/generation-traces";
import { isLocalRequest } from "@/lib/media/request-guard";
import { applySectionFragment, extractSection, validateScopedCss } from "@/lib/section-edits/document";
import { landingFingerprint } from "@/lib/section-edits/fingerprint";
import { sectionEditApplySchema, sectionPatchSchema } from "@/lib/section-edits/schemas";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isLocalRequest(request)) return NextResponse.json({ error: "El editor solo está disponible en este equipo." }, { status: 403 });
  const parsed = sectionEditApplySchema.safeParse({ proposalId: (await context.params).id });
  if (!parsed.success) return NextResponse.json({ error: "La propuesta no es válida." }, { status: 400 });
  const proposal = await prisma.sectionEditProposal.findUnique({ where: { id: parsed.data.proposalId } });
  if (!proposal || proposal.status !== "pending") return NextResponse.json({ error: "Esta propuesta ya no está pendiente. Genera otra sobre la revisión actual." }, { status: 409 });
  const landing = await prisma.savedLanding.findUnique({ where: { id: proposal.savedLandingId } });
  if (!landing) return NextResponse.json({ error: "La landing ya no existe." }, { status: 404 });
  const stale = landing.sectionRevision !== proposal.baseRevision || landingFingerprint(landing) !== proposal.baseFingerprint;
  if (stale) {
    await prisma.sectionEditProposal.updateMany({ where: { id: proposal.id, status: "pending" }, data: { status: "stale" } });
    await recordTraceStep(landing.traceId ?? undefined, {
      eventType: "revision", phase: "section-edit-reject", title: "Propuesta descartada por revisión obsoleta", status: "failed",
      errorMessage: "La landing cambió mientras se preparaba la propuesta.", techniqueIds: JSON.parse(proposal.techniqueIdsJson),
      references: [{ kind: "landing", id: landing.id, label: landing.title }, { kind: "section", id: proposal.sectionId }],
      output: { proposalId: proposal.id, reason: "stale_revision" },
    }).catch(() => undefined);
    return NextResponse.json({ error: "La landing cambió mientras se preparaba la propuesta. Actualiza la vista y vuelve a proponer el cambio." }, { status: 409, headers: { "X-XPage-Code": "stale_revision" } });
  }

  try {
    const patch = sectionPatchSchema.parse(JSON.parse(proposal.patchJson));
    if (patch.sectionId !== proposal.sectionId) throw new Error("La propuesta apunta a otra sección.");
    const currentSection = extractSection(landing.html, proposal.sectionId);
    const scopedCss = validateScopedCss(patch.css, proposal.sectionId);
    const nextHtml = applySectionFragment(landing.html, proposal.sectionId, patch.html, currentSection.slotIds, currentSection.mediaMarkup);
    const nextCss = [landing.css, scopedCss].filter(Boolean).join("\n");
    const revisionId = randomUUID();
    const result = await prisma.$transaction(async (tx) => {
      const update = await tx.savedLanding.updateMany({
        where: { id: landing.id, sectionRevision: proposal.baseRevision, html: landing.html, css: landing.css, js: landing.js },
        data: { html: nextHtml, css: nextCss, sectionRevision: { increment: 1 } },
      });
      if (update.count !== 1) throw new Error("stale_revision");
      let parent = await tx.sectionRevision.findUnique({ where: { savedLandingId_revision: { savedLandingId: landing.id, revision: proposal.baseRevision } } });
      if (!parent && proposal.baseRevision === 0) {
        parent = await tx.sectionRevision.create({ data: {
          id: randomUUID(), savedLandingId: landing.id, revision: 0, summary: "Versión original", html: landing.html, css: landing.css, js: landing.js,
        } });
      }
      const revision = await tx.sectionRevision.create({ data: {
        id: revisionId, savedLandingId: landing.id, revision: proposal.baseRevision + 1,
        parentRevisionId: parent?.id ?? null, sectionId: proposal.sectionId, summary: patch.summary,
        html: nextHtml, css: nextCss, js: landing.js,
      } });
      const updatedProposal = await tx.sectionEditProposal.updateMany({ where: { id: proposal.id, status: "pending" }, data: { status: "applied", revisionId } });
      if (updatedProposal.count !== 1) throw new Error("proposal_consumed");
      return revision;
    });
    await recordTraceStep(landing.traceId ?? undefined, {
      eventType: "revision", phase: "section-edit-apply", title: `Revisión ${result.revision} aplicada · ${proposal.sectionId}`,
      techniqueIds: JSON.parse(proposal.techniqueIdsJson), provider: "eve-local", model: proposal.modelChoice,
      output: { proposalId: proposal.id, revisionId, revision: result.revision, summary: patch.summary, warnings: patch.warnings },
      decisionSummary: patch.summary,
      references: [{ kind: "landing", id: landing.id, label: landing.title }, { kind: "section", id: proposal.sectionId }, { kind: "revision", id: revisionId }],
    }).catch(() => undefined);
    return NextResponse.json({ revision: result.revision, revisionId, html: nextHtml, css: nextCss, js: landing.js, summary: patch.summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo aplicar la propuesta.";
    if (message === "stale_revision") {
      await prisma.sectionEditProposal.updateMany({ where: { id: proposal.id, status: "pending" }, data: { status: "stale" } }).catch(() => undefined);
      return NextResponse.json({ error: "La landing cambió antes de aplicar. Actualiza la vista y vuelve a proponer." }, { status: 409, headers: { "X-XPage-Code": "stale_revision" } });
    }
    return NextResponse.json({ error: message === "proposal_consumed" ? "La propuesta ya se aplicó." : message }, { status: message === "proposal_consumed" ? 409 : 400 });
  }
}
