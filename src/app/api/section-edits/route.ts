import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEditableSections } from "@/lib/section-edits/document";
import { isLocalRequest } from "@/lib/media/request-guard";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isLocalRequest(request)) return NextResponse.json({ error: "El editor solo está disponible en este equipo." }, { status: 403 });
  const id = new URL(request.url).searchParams.get("landingId");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Selecciona una landing guardada." }, { status: 400 });
  const landing = await prisma.savedLanding.findUnique({ where: { id }, select: { id: true, html: true, sectionRevision: true } });
  if (!landing) return NextResponse.json({ error: "No encontramos esta landing en la Biblioteca." }, { status: 404 });
  const current = landing.sectionRevision > 0
    ? await prisma.sectionRevision.findUnique({ where: { savedLandingId_revision: { savedLandingId: id, revision: landing.sectionRevision } }, select: { parentRevisionId: true, summary: true } })
    : null;
  return NextResponse.json({
    revision: landing.sectionRevision,
    sections: getEditableSections(landing.html),
    undoRevisionId: current?.summary.startsWith("Deshacer:") ? null : current?.parentRevisionId ?? null,
    currentSummary: current?.summary ?? null,
  });
}
