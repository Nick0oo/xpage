import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isLocalRequest } from "@/lib/media/request-guard";
import { readStoredMedia } from "@/lib/media/storage";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isLocalRequest(request, true)) return NextResponse.json({ error: "El archivo solo está disponible desde XPage en este equipo." }, { status: 403 });
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: "El identificador del medio no es válido." }, { status: 400 });
  const asset = await prisma.mediaAsset.findUnique({ where: { id }, select: { type: true, mimeType: true, localPath: true, posterPath: true } });
  if (!asset) return NextResponse.json({ error: "El medio ya no está disponible." }, { status: 404 });
  const poster = new URL(request.url).searchParams.get("poster") === "1";
  const filename = poster ? asset.posterPath : asset.localPath;
  if (!filename) return NextResponse.json({ error: "Este medio no tiene poster disponible." }, { status: 404 });
  try {
    const bytes = await readStoredMedia(filename);
    const contentType = poster ? filename.endsWith(".png") ? "image/png" : filename.endsWith(".webp") ? "image/webp" : "image/jpeg" : asset.mimeType;
    return new NextResponse(new Uint8Array(bytes), { headers: {
      "Content-Type": contentType,
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Cross-Origin-Resource-Policy": "same-site",
    } });
  } catch {
    return NextResponse.json({ error: "El archivo local falta o está dañado. Vuelve a seleccionar el medio." }, { status: 404 });
  }
}
