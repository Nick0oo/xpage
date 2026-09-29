import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEditableSections } from "@/lib/section-edits/document";
import { landingFingerprint } from "@/lib/section-edits/fingerprint";
import { isLocalRequest } from "@/lib/media/request-guard";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isLocalRequest(request)) return NextResponse.json({ error: "El editor solo está disponible en este equipo." }, { status: 403 });
  const id = new URL(request.url).searchParams.get("landingId");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Selecciona una landing guardada." }, { status: 400 });
  const landing = await prisma.savedLanding.findUnique({ where: { id }, select: { id: true, html: true, css: true, js: true, sectionRevision: true } });
  if (!landing) return NextResponse.json({ error: "No encontramos esta landing en la Biblioteca." }, { status: 404 });
  const current = landing.sectionRevision > 0
    ? await prisma.sectionRevision.findUnique({ where: { savedLandingId_revision: { savedLandingId: id, revision: landing.sectionRevision } }, select: { parentRevisionId: true, summary: true, html: true, css: true, js: true } })
    : null;
  const codeMatchesRevision = Boolean(current && landingFingerprint({ ...landing, sectionRevision: landing.sectionRevision }) === landingFingerprint({ ...current, sectionRevision: landing.sectionRevision }));
  return NextResponse.json({
    revision: landing.sectionRevision,
    sections: getEditableSections(landing.html),
    undoRevisionId: current?.summary.startsWith("Deshacer:") || !codeMatchesRevision ? null : current?.parentRevisionId ?? null,
    undoUnavailable: Boolean(current && !codeMatchesRevision),
    currentSummary: current?.summary ?? null,
  });
}
