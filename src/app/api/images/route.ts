import { randomUUID } from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { imageRequestSchema } from "@/lib/schemas";
import { runEveStructured } from "@/lib/eve-runtime";
import { recordProviderAttempts, recordTraceStep, type ProviderAttemptTrace } from "@/lib/generation-traces";
import { DEFAULT_OPENROUTER_IMAGE_MODEL, isOpenRouterConfigured } from "@/lib/ai/providers";
import { prisma } from "@/lib/prisma";
import { isLocalRequest } from "@/lib/media/request-guard";
import { insertMediaIntoLanding } from "@/lib/media/insertion";
import { publicMediaAsset } from "@/lib/media/types";
import { removeStoredMedia, storeMediaBuffer } from "@/lib/media/storage";
import { validateMediaDestination } from "@/lib/media/plan-validation";

export const runtime = "nodejs";

const imageResultSchema = z.object({
  artifactId: z.string().uuid(),
  mediaType: z.enum(["image/png", "image/jpeg", "image/webp"]),
});
const imageDirectory = path.resolve(process.cwd(), ".eve", "xpage-images");

export async function POST(request: Request) {
  if (!isLocalRequest(request)) return NextResponse.json({ error: "Esta acción solo está disponible desde XPage en este equipo." }, { status: 403 });
  const body = await request.json().catch(() => null);
  const parsed = imageRequestSchema.safeParse(body);
  if (!parsed.success || !parsed.data.destination) {
    return NextResponse.json({ error: "Selecciona una sección y un espacio de imagen antes de generar." }, { status: 400 });
  }
  if (!isOpenRouterConfigured()) {
    return NextResponse.json({ error: "Configura OPENROUTER_API_KEY en .env.local para generar imágenes.", code: "missing_api_key" }, { status: 503 });
  }

  const { brief, traceId, modelChoice, destination } = parsed.data;
  const landing = await prisma.savedLanding.findUnique({ where: { id: destination.savedLandingId } });
  if (!landing) return NextResponse.json({ error: "Guarda primero la landing en Biblioteca para asociar sus medios." }, { status: 409 });
  if (traceId && traceId !== landing.traceId) return NextResponse.json({ error: "La traza y la landing no coinciden. Vuelve al Studio para seguir." }, { status: 400 });
  if (!(await validateMediaDestination({ savedLandingId: landing.id, sectionId: destination.sectionId, slotId: destination.slotId, type: "image" }))) {
    return NextResponse.json({ error: "La sección y el espacio no coinciden con el DesignPlan guardado. Vuelve a construir la landing." }, { status: 409 });
  }
  if (traceId && !(await prisma.generationTrace.findUnique({ where: { id: traceId }, select: { id: true } }))) {
    return NextResponse.json({ error: "La traza indicada no existe." }, { status: 400 });
  }

  const artifactId = randomUUID();
  const altText = destination.altText || "Imagen generada para la landing";
  let html: string;
  try {
    html = insertMediaIntoLanding(landing.html, {
      id: artifactId, type: "image", sectionId: destination.sectionId, slotId: destination.slotId, altText,
      author: "", creditUrl: "https://openrouter.ai", providerLabel: "Imagen generada con OpenRouter", providerUrl: "https://openrouter.ai",
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "El espacio de imagen no coincide con la landing." }, { status: 409 });
  }
  const userPrompt = [
    `Tema o industria: ${brief.topic}.`,
    `Producto y beneficio: ${brief.offer}.`,
    `Público: ${brief.audience}.`,
    `Dirección visual: ${brief.tone}.`,
    "Genera una imagen que encaje con este espacio de la landing. Usa una paleta y luz coherentes con la dirección visual. No incluyas texto, logotipos, marcas de agua, interfaces ni collages.",
  ].join("\n");
  const message = `Crea el activo visual solicitado llamando a la herramienta generate_image. Pasa exactamente artifactId=${artifactId}. La herramienta guarda el binario fuera de la traza; devuelve en el esquema solo la misma referencia y el tipo MIME que entrega la herramienta. No describas ni incluyas datos de imagen en la respuesta.\n\n${userPrompt}`;
  const startedAt = Date.now();
  const attempts: ProviderAttemptTrace[] = [];
  let storedPath: string | null = null;
  try {
    const { data } = await runEveStructured({ modelChoice, message, outputSchema: imageResultSchema });
    const result = imageResultSchema.safeParse(data);
    if (!result.success || result.data.artifactId !== artifactId) throw new Error("Eve no confirmó la referencia de imagen solicitada.");

    const artifactPath = path.join(imageDirectory, artifactId);
    const image = await readFile(artifactPath);
    await unlink(artifactPath).catch(() => undefined);
    const stored = await storeMediaBuffer(artifactId, image, "image");
    storedPath = stored.path;
    const model = process.env.OPENROUTER_IMAGE_MODEL?.trim() || DEFAULT_OPENROUTER_IMAGE_MODEL;
    const asset = {
      id: artifactId,
      type: "image",
      sourceType: "generated",
      provider: "openrouter",
      providerAssetId: model,
      author: `Imagen generada · ${model}`,
      sourceUrl: "https://openrouter.ai",
      creditUrl: "https://openrouter.ai",
      license: "Imagen generada; aplican las condiciones del proveedor configurado.",
      mimeType: stored.mimeType,
      width: null,
      height: null,
      durationSeconds: null,
      localPath: stored.path,
      posterPath: null,
      sectionId: destination.sectionId,
      slotId: destination.slotId,
      altText,
      savedLandingId: landing.id,
    } as const;
    const replaced = await prisma.mediaAsset.findFirst({ where: { savedLandingId: landing.id, sectionId: destination.sectionId, slotId: destination.slotId }, select: { localPath: true, posterPath: true } });
    await prisma.$transaction(async (tx) => {
      await tx.mediaAsset.deleteMany({ where: { savedLandingId: landing.id, sectionId: destination.sectionId, slotId: destination.slotId } });
      await tx.mediaAsset.create({ data: asset });
      await tx.savedLanding.update({ where: { id: landing.id }, data: { html } });
    });
    if (replaced) {
      await removeStoredMedia(replaced.localPath);
      await removeStoredMedia(replaced.posterPath);
    }
    attempts.push({
      provider: "eve-image-tool", model, status: "completed", durationMs: Date.now() - startedAt,
      output: { mediaType: result.data.mediaType, byteLength: image.byteLength, artifactId },
    });
    await recordImageAttempts(traceId, userPrompt, attempts);
    await recordTraceStep(traceId, {
      eventType: "asset", phase: "image-generation", title: "Imagen generada y colocada · Eve",
      provider: "openrouter", model,
      userPrompt,
      output: { type: "image", provider: "openrouter", model, estimatedCostUsd: null, mimeType: stored.mimeType, byteLength: image.byteLength, sectionId: destination.sectionId, slotId: destination.slotId, altText, imageReference: artifactId },
      references: [{ kind: "media-asset", id: artifactId, label: `Imagen · ${model}` }, { kind: "section", id: destination.sectionId }, { kind: "url", id: "https://openrouter.ai", url: "https://openrouter.ai", label: "OpenRouter", sourceType: "proveedor" }],
    }).catch(() => undefined);
    return NextResponse.json({ asset: publicMediaAsset({ ...asset, createdAt: new Date().toISOString() }), url: `/api/media/assets/${artifactId}`, html });
  } catch (error) {
    await unlink(path.join(imageDirectory, artifactId)).catch(() => undefined);
    if (storedPath) await removeStoredMedia(storedPath);
    attempts.push({
      provider: "eve-image-tool",
      model: process.env.OPENROUTER_IMAGE_MODEL?.trim() || DEFAULT_OPENROUTER_IMAGE_MODEL,
      status: "failed",
      durationMs: Date.now() - startedAt,
      errorMessage: error instanceof Error ? error.message.slice(0, 500) : "unknown error",
    });
    await recordImageAttempts(traceId, userPrompt, attempts).catch(() => undefined);
    return NextResponse.json({ error: "Eve no pudo generar o colocar la imagen. Revisa OpenRouter, el plan y el espacio seleccionado.", code: "eve_image_unavailable" }, { status: 503 });
  }
}

async function recordImageAttempts(traceId: string | undefined, prompt: string, attempts: ProviderAttemptTrace[]) {
  await recordProviderAttempts({ traceId, phase: "image-generation", title: "Generación de imagen · Eve", userPrompt: prompt, attempts });
}
