import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateImage } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { defineTool } from "eve/tools";
import { z } from "zod";

const outputDirectory = path.resolve(process.cwd(), ".eve", "xpage-images");

export default defineTool({
  description: "Genera una imagen de portada con OpenRouter y guarda el archivo fuera del historial del modelo. Devuelve solo una referencia temporal y el tipo de medio.",
  inputSchema: z.object({
    artifactId: z.string().uuid(),
    prompt: z.string().min(20).max(4_000),
  }),
  outputSchema: z.object({
    artifactId: z.string().uuid(),
    mediaType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  }),
  label: {
    start: () => "Generando imagen local",
    complete: () => "Imagen lista",
  },
  async execute({ artifactId, prompt }, ctx) {
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) throw new Error("La generación de imágenes requiere OPENROUTER_API_KEY.");
    ctx.abortSignal.throwIfAborted();

    const modelId = process.env.OPENROUTER_IMAGE_MODEL?.trim() || "recraft/recraft-v4.1-flash";
    const { image } = await generateImage({
      model: createOpenRouter({ apiKey }).imageModel(modelId),
      prompt,
      aspectRatio: "16:9",
      maxRetries: 0,
      abortSignal: ctx.abortSignal,
    });
    if (!["image/png", "image/jpeg", "image/webp"].includes(image.mediaType)) {
      throw new Error(`El proveedor devolvió un formato no admitido: ${image.mediaType}.`);
    }

    await mkdir(outputDirectory, { recursive: true });
    await writeFile(path.join(outputDirectory, artifactId), image.uint8Array, { flag: "wx" });
    return { artifactId, mediaType: image.mediaType as "image/png" | "image/jpeg" | "image/webp" };
  },
});
