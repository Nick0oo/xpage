import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recordTraceStep } from "@/lib/generation-traces";
import { isLocalRequest } from "@/lib/media/request-guard";
import { reorderSections } from "@/lib/section-edits/document";
import { landingFingerprint } from "@/lib/section-edits/fingerprint";

export const runtime = "nodejs";

const requestSchema = z.object({
  savedLandingId: z.string().uuid(),
  baseRevision: z.number().int().nonnegative(),
  orderedIds: z.array(z.string().regex(/^[a-z0-9-]{1,80}$/)).min(1).max(80),
}).refine((input) => new Set(input.orderedIds).size === input.orderedIds.length, "Una sección aparece más de una vez.");

export async function POST(request: Request) {
  if (!isLocalRequest(request)) return NextResponse.json({ error: "El editor solo está disponible en este equipo." }, { status: 403 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "La lista de secciones no es válida." }, { status: 400 });
  const input = parsed.data;
  const landing = await prisma.savedLanding.findUnique({ where: { id: input.savedLandingId } });
  if (!landing) return NextResponse.json({ error: "No encontramos esta landing." }, { status: 404 });
  if (landing.sectionRevision !== input.baseRevision) return NextResponse.json({ error: "La landing cambió. Actualiza antes de reordenar." }, { status: 409, headers: { "X-XPage-Code": "stale_revision" } });
  const current = input.baseRevision > 0
    ? await prisma.sectionRevision.findUnique({ where: { savedLandingId_revision: { savedLandingId: landing.id, revision: input.baseRevision } } })
    : null;
  if (input.baseRevision > 0 && !current) return NextResponse.json({ error: "La revisión base ya no está disponible. Actualiza antes de reordenar." }, { status: 409, headers: { "X-XPage-Code": "stale_revision" } });
  if (current && landingFingerprint(landing) !== landingFingerprint({ ...current, sectionRevision: input.baseRevision })) {
    return NextResponse.json({ error: "El contenido o los medios cambiaron desde la última revisión. Actualiza antes de reordenar." }, { status: 409, headers: { "X-XPage-Code": "stale_revision" } });
  }
  let html: string;
  try { html = reorderSections(landing.html, input.orderedIds); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudieron reordenar las secciones." }, { status: 409 }); }
  const revisionId = randomUUID();
  const summary = "Reordenar secciones";
  try {
    const revision = await prisma.$transaction(async (tx) => {
      const update = await tx.savedLanding.updateMany({
        where: { id: landing.id, sectionRevision: input.baseRevision, html: landing.html, css: landing.css, js: landing.js },
        data: { html, sectionRevision: { increment: 1 } },
      });
      if (update.count !== 1) throw new Error("stale_revision");
      let parent = current;
      if (!parent && input.baseRevision === 0) parent = await tx.sectionRevision.create({ data: {
        id: randomUUID(), savedLandingId: landing.id, revision: 0, summary: "Versión original", html: landing.html, css: landing.css, js: landing.js,
      } });
      return tx.sectionRevision.create({ data: {
        id: revisionId, savedLandingId: landing.id, revision: input.baseRevision + 1,
        parentRevisionId: parent?.id ?? null, sectionId: null, summary, html, css: landing.css, js: landing.js,
      } });
    });
    await recordTraceStep(landing.traceId ?? undefined, {
      eventType: "revision", phase: "section-reorder", title: summary,
      output: { revisionId, revision: revision.revision, orderedIds: input.orderedIds }, decisionSummary: summary,
      references: [{ kind: "landing", id: landing.id, label: landing.title }, { kind: "revision", id: revisionId, label: `Revisión ${revision.revision}` }],
    }).catch(() => undefined);
    return NextResponse.json({ revision: revision.revision, revisionId, html, css: landing.css, js: landing.js, summary });
  } catch {
    return NextResponse.json({ error: "La landing cambió mientras se guardaba el nuevo orden. Actualiza e inténtalo otra vez." }, { status: 409 });
  }
}
