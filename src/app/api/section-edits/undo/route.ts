import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordTraceStep } from "@/lib/generation-traces";
import { isLocalRequest } from "@/lib/media/request-guard";
import { landingFingerprint } from "@/lib/section-edits/fingerprint";
import { sectionEditUndoSchema } from "@/lib/section-edits/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isLocalRequest(request)) return NextResponse.json({ error: "El editor solo está disponible en este equipo." }, { status: 403 });
  const parsed = sectionEditUndoSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "La revisión que quieres recuperar no es válida." }, { status: 400 });
  const input = parsed.data;
  const landing = await prisma.savedLanding.findUnique({ where: { id: input.savedLandingId } });
  if (!landing) return NextResponse.json({ error: "No encontramos esta landing." }, { status: 404 });
  if (landing.sectionRevision !== input.baseRevision) return NextResponse.json({ error: "La landing cambió. Actualiza antes de deshacer." }, { status: 409 });
  const currentRevision = landing.sectionRevision > 0
    ? await prisma.sectionRevision.findUnique({ where: { savedLandingId_revision: { savedLandingId: landing.id, revision: landing.sectionRevision } } })
    : null;
  if (!currentRevision || landingFingerprint(landing) !== landingFingerprint({ ...currentRevision, sectionRevision: landing.sectionRevision })) {
    return NextResponse.json({ error: "La landing cambió después de esta revisión. Actualiza para evitar perder cambios o medios." }, { status: 409, headers: { "X-XPage-Code": "stale_revision" } });
  }
  const target = await prisma.sectionRevision.findFirst({ where: { id: input.targetRevisionId, savedLandingId: landing.id } });
  if (!target) return NextResponse.json({ error: "No encontramos la versión anterior." }, { status: 404 });
  const revisionId = randomUUID();
  const summary = `Restaurar revisión ${target.revision}`;
  try {
    const revision = await prisma.$transaction(async (tx) => {
      const update = await tx.savedLanding.updateMany({
        where: { id: landing.id, sectionRevision: input.baseRevision, html: landing.html, css: landing.css, js: landing.js },
        data: { html: target.html, css: target.css, js: target.js, sectionRevision: { increment: 1 } },
      });
      if (update.count !== 1) throw new Error("stale_revision");
      return tx.sectionRevision.create({ data: {
        id: revisionId, savedLandingId: landing.id, revision: input.baseRevision + 1,
        parentRevisionId: currentRevision.id, sourceRevisionId: target.id, sectionId: currentRevision.sectionId,
        summary, html: target.html, css: target.css, js: target.js,
      } });
    });
    await recordTraceStep(landing.traceId ?? undefined, {
      eventType: "revision", phase: "section-edit-undo", title: summary,
      output: { revisionId, revision: revision.revision, restoredRevisionId: target.id },
      decisionSummary: summary,
      references: [{ kind: "landing", id: landing.id, label: landing.title }, ...(currentRevision.sectionId ? [{ kind: "section" as const, id: currentRevision.sectionId }] : []), { kind: "revision", id: target.id, label: `Revisión ${target.revision}` }, { kind: "revision", id: revisionId, label: `Revisión ${revision.revision}` }],
    }).catch(() => undefined);
    return NextResponse.json({ revision: revision.revision, revisionId, html: target.html, css: target.css, js: target.js, summary });
  } catch {
    return NextResponse.json({ error: "La landing cambió mientras se deshacía. Actualiza e inténtalo otra vez." }, { status: 409 });
  }
}
