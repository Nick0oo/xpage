import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recordTraceStep } from "@/lib/generation-traces";
import { downloadPexelsFile, pexelsRequest } from "@/lib/media/pexels";
import { removeStoredMedia, storeMediaBuffer } from "@/lib/media/storage";
import { isLocalRequest } from "@/lib/media/request-guard";
import { insertMediaIntoLanding } from "@/lib/media/insertion";
import { publicMediaAsset } from "@/lib/media/types";
import { validateMediaDestination } from "@/lib/media/plan-validation";

export const runtime = "nodejs";

const selectionSchema = z.object({
  id: z.number().int().positive(),
  type: z.enum(["image", "video"]),
  query: z.string().trim().min(2).max(120),
  savedLandingId: z.string().uuid(),
  traceId: z.string().uuid().optional(),
  sectionId: z.string().regex(/^[a-z0-9-]{1,80}$/),
  slotId: z.string().regex(/^[a-z0-9-]{1,80}$/),
  altText: z.string().trim().max(300).optional(),
});

type PexelsPhotoDetail = { id: number; url: string; photographer: string; photographer_url: string; width: number; height: number; alt: string; src: { large2x?: string; large?: string; original: string } };
type PexelsVideoDetail = { id: number; url: string; user: { name: string; url: string }; width: number; height: number; duration: number; image: string; video_files: { width: number | null; height: number | null; quality: string; file_type: string; link: string }[] };

export async function POST(request: Request) {
  if (!isLocalRequest(request)) return NextResponse.json({ error: "Esta acción solo está disponible desde XPage en este equipo." }, { status: 403 });
  const body = await request.json().catch(() => null);
  const parsed = selectionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "La selección del medio no es válida." }, { status: 400 });
  const input = parsed.data;
  const landing = await prisma.savedLanding.findUnique({ where: { id: input.savedLandingId } });
  if (!landing) return NextResponse.json({ error: "Guarda primero la landing en Biblioteca para asociar sus medios." }, { status: 409 });
  if (input.traceId && input.traceId !== landing.traceId) return NextResponse.json({ error: "La traza y la landing no coinciden. Vuelve al Studio para seguir." }, { status: 400 });
  if (!(await validateMediaDestination({ savedLandingId: landing.id, sectionId: input.sectionId, slotId: input.slotId, type: input.type }))) {
    return NextResponse.json({ error: "La sección y el espacio no coinciden con el DesignPlan guardado. Vuelve a construir la landing." }, { status: 409 });
  }
  if (input.traceId && !(await prisma.generationTrace.findUnique({ where: { id: input.traceId }, select: { id: true } }))) {
    return NextResponse.json({ error: "La traza indicada no existe." }, { status: 400 });
  }

  let stored: { path: string; mimeType: string } | null = null;
  let posterPath: string | null = null;
  const id = randomUUID();
  try {
    let author: string;
    let sourceUrl: string;
    let creditUrl: string;
    let width: number;
    let height: number;
    let durationSeconds: number | null = null;
    let altText = input.altText ?? "";
    let sourceFileUrl: string;
    let posterUrl: string | null = null;
    if (input.type === "image") {
      const photo = await pexelsRequest<PexelsPhotoDetail>(new URL(`https://api.pexels.com/v1/photos/${input.id}`));
      if (photo.id !== input.id || !photo.url.startsWith("https://www.pexels.com/photo/") || !photo.photographer_url.startsWith("https://www.pexels.com/")) throw new Error("El resultado de Pexels no es válido.");
      author = photo.photographer;
      sourceUrl = photo.url;
      creditUrl = photo.photographer_url;
      width = photo.width;
      height = photo.height;
      altText ||= photo.alt || `Foto de ${author}`;
      sourceFileUrl = photo.src.large2x ?? photo.src.large ?? photo.src.original;
    } else {
      const video = await pexelsRequest<PexelsVideoDetail>(new URL(`https://api.pexels.com/v1/videos/videos/${input.id}`));
      if (video.id !== input.id || !video.url.startsWith("https://www.pexels.com/video/") || !video.user.url.startsWith("https://www.pexels.com/")) throw new Error("El resultado de Pexels no es válido.");
      author = video.user.name;
      sourceUrl = video.url;
      creditUrl = video.user.url;
      const file = video.video_files.filter((item) => item.file_type === "video/mp4" && item.link.startsWith("https://videos.pexels.com/"))
        .sort((left, right) => (right.width ?? 0) - (left.width ?? 0)).find((item) => (item.width ?? 0) <= 1920);
      if (!file) throw new Error("Pexels no ofrece un archivo MP4 compatible para este video.");
      width = file.width ?? video.width;
      height = file.height ?? video.height;
      durationSeconds = video.duration;
      altText ||= `Video de ${author}`;
      sourceFileUrl = file.link;
      posterUrl = video.image;
    }

    const buffer = await downloadPexelsFile(sourceFileUrl, input.type === "image" ? 15 * 1024 * 1024 : 60 * 1024 * 1024);
    stored = await storeMediaBuffer(id, buffer, input.type);
    if (posterUrl) {
      const posterId = id;
      const poster = await downloadPexelsFile(posterUrl, 2 * 1024 * 1024);
      const posterStored = await storeMediaBuffer(posterId, poster, "image");
      posterPath = posterStored.path;
    }

    const asset = {
      id, type: input.type, sourceType: "stock", provider: "pexels", providerAssetId: String(input.id), author,
      sourceUrl, creditUrl, license: "Pexels License", mimeType: stored.mimeType, width, height, durationSeconds,
      localPath: stored.path, posterPath, sectionId: input.sectionId, slotId: input.slotId, altText, savedLandingId: landing.id,
    } as const;
    const nextHtml = insertMediaIntoLanding(landing.html, { sectionId: input.sectionId, slotId: input.slotId, id, type: input.type, altText, author, creditUrl, providerLabel: "Pexels", providerUrl: "https://www.pexels.com" });
    await prisma.$transaction(async (tx) => {
      await tx.mediaAsset.updateMany({ where: { savedLandingId: landing.id, sectionId: input.sectionId, slotId: input.slotId, isCurrent: true }, data: { isCurrent: false } });
      await tx.mediaAsset.create({ data: asset });
      await tx.savedLanding.update({ where: { id: landing.id }, data: { html: nextHtml } });
    });
    if (input.traceId) {
      await recordTraceStep(input.traceId, {
        eventType: "asset", phase: "media-selection", title: `${input.type === "image" ? "Foto" : "Video"} de Pexels añadido`,
        provider: "pexels", model: "Pexels API", userPrompt: input.query,
        output: { assetId: id, type: input.type, provider: "Pexels", providerAssetId: String(input.id), query: input.query, author, sourceUrl, creditUrl, license: "Pexels License", mimeType: stored.mimeType, byteLength: buffer.byteLength, sectionId: input.sectionId, slotId: input.slotId, altText },
        references: [{ kind: "media-asset", id, label: `${input.type} · ${author}` }, { kind: "section", id: input.sectionId }, { kind: "source", id: String(input.id), url: sourceUrl, label: `Pexels · ${author}`, sourceType: "proveedor" }],
      }).catch(() => undefined);
    }
    return NextResponse.json({ asset: publicMediaAsset({ ...asset, createdAt: new Date().toISOString() }), url: `/api/media/assets/${id}`, html: nextHtml });
  } catch (error) {
    await removeStoredMedia(stored?.path);
    await removeStoredMedia(posterPath);
    const message = error instanceof Error ? error.message : "No se pudo guardar el medio.";
    const status = message === "missing_api_key" ? 503 : message === "rate_limited" ? 429 : message.includes("landing") || message.includes("sección") || message.includes("espacio") ? 409 : 502;
    return NextResponse.json({ error: message === "missing_api_key" ? "Configura PEXELS_API_KEY antes de seleccionar medios." : message === "rate_limited" ? "Pexels alcanzó su límite temporal; espera e inténtalo de nuevo." : message }, { status });
  }
}
