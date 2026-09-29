import { randomUUID } from "node:crypto";
import { readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { imageRequestSchema } from "@/lib/schemas";
import { runEveStructured } from "@/lib/eve-runtime";
import { recordProviderAttempts, type ProviderAttemptTrace } from "@/lib/generation-traces";
import { DEFAULT_OPENROUTER_IMAGE_MODEL, isOpenRouterConfigured } from "@/lib/ai/providers";

export const runtime = "nodejs";

const imageResultSchema = z.object({
  artifactId: z.string().uuid(),
  mediaType: z.enum(["image/png", "image/jpeg", "image/webp"]),
});
const imageDirectory = path.resolve(process.cwd(), ".eve", "xpage-images");

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = imageRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Revisa el brief antes de generar la imagen.", code: "invalid_input" }, { status: 400 });
  }
  if (!isOpenRouterConfigured()) {
    return NextResponse.json({ error: "Configura OPENROUTER_API_KEY en .env.local para generar imágenes.", code: "missing_api_key" }, { status: 503 });
  }

  const { brief, traceId, modelChoice } = parsed.data;
  const artifactId = randomUUID();
  const userPrompt = [
    `Tema o industria: ${brief.topic}.`,
    `Producto y beneficio: ${brief.offer}.`,
    `Público: ${brief.audience}.`,
    `Dirección visual: ${brief.tone}.`,
    "Genera una imagen de portada panorámica 16:9 con sujeto focal claro y espacio negativo útil para el titular. Usa una paleta y luz coherentes con la dirección visual. No incluyas texto, logotipos, marcas de agua, interfaces ni collages.",
  ].join("\n");
  const message = `Crea el activo visual solicitado llamando a la herramienta generate_image. Pasa exactamente artifactId=${artifactId}. La herramienta guarda el binario fuera de la traza; devuelve en el esquema solo la misma referencia y el tipo MIME que entrega la herramienta. No describas ni incluyas datos de imagen en la respuesta.\n\n${userPrompt}`;
  const startedAt = Date.now();
  const attempts: ProviderAttemptTrace[] = [];

  try {
    const { data } = await runEveStructured({ modelChoice, message, outputSchema: imageResultSchema });
    const result = imageResultSchema.safeParse(data);
    if (!result.success || result.data.artifactId !== artifactId) {
      throw new Error("Eve no confirmó la referencia de imagen solicitada.");
    }

    const filePath = path.join(imageDirectory, artifactId);
    const image = await readFile(filePath);
    await unlink(filePath).catch(() => undefined);
    attempts.push({
      provider: "eve-image-tool",
      model: process.env.OPENROUTER_IMAGE_MODEL?.trim() || DEFAULT_OPENROUTER_IMAGE_MODEL,
      status: "completed",
      durationMs: Date.now() - startedAt,
      output: { mediaType: result.data.mediaType, byteLength: image.byteLength },
    });
    await recordImageAttempts(traceId, userPrompt, attempts);
    return NextResponse.json({ image: image.toString("base64"), mediaType: result.data.mediaType });
  } catch (error) {
    await unlink(path.join(imageDirectory, artifactId)).catch(() => undefined);
    attempts.push({
      provider: "eve-image-tool",
      model: process.env.OPENROUTER_IMAGE_MODEL?.trim() || DEFAULT_OPENROUTER_IMAGE_MODEL,
      status: "failed",
      durationMs: Date.now() - startedAt,
      errorMessage: error instanceof Error ? error.message.slice(0, 500) : "unknown error",
    });
    await recordImageAttempts(traceId, userPrompt, attempts).catch(() => undefined);
    return NextResponse.json({
      error: `Eve no pudo generar la imagen. Revisa OpenRouter e inténtalo otra vez.`,
      code: "eve_image_unavailable",
    }, { status: 503 });
  }
}

async function recordImageAttempts(traceId: string | undefined, prompt: string, attempts: ProviderAttemptTrace[]) {
  await recordProviderAttempts({
    traceId,
    phase: "image-generation",
    title: "Generación de imagen · Eve",
    userPrompt: prompt,
    attempts,
  });
}
