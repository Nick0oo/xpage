import { z } from "zod";

export const pexelsMediaSchema = z.object({
  id: z.number().int().positive(),
  type: z.enum(["image", "video"]),
  previewUrl: z.string().url(),
  sourceUrl: z.string().url(),
  mediaUrl: z.string().url().optional(),
  creditUrl: z.string().url(),
  author: z.string().min(1),
  altText: z.string(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  durationSeconds: z.number().int().positive().nullable(),
});

export type PexelsMedia = z.infer<typeof pexelsMediaSchema>;

export async function pexelsRequest<T>(url: URL): Promise<T> {
  const apiKey = process.env.PEXELS_API_KEY?.trim();
  if (!apiKey) throw new Error("missing_api_key");
  const response = await fetch(url, {
    headers: { Authorization: apiKey },
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (response.status === 429) throw new Error("rate_limited");
  if (!response.ok) throw new Error(`pexels_${response.status}`);
  return response.json() as Promise<T>;
}

export async function downloadPexelsFile(startUrl: string, maxBytes: number) {
  let current = new URL(startUrl);
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    if (current.protocol !== "https:" || !["images.pexels.com", "videos.pexels.com"].includes(current.hostname)) {
      throw new Error("La descarga de Pexels devolvió un dominio no permitido.");
    }
    const response = await fetch(current, { redirect: "manual", signal: AbortSignal.timeout(30_000), cache: "no-store" });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirects === 3) throw new Error("La descarga de Pexels redirigió demasiadas veces.");
      current = new URL(location, current);
      continue;
    }
    if (!response.ok || !response.body) throw new Error("Pexels no pudo entregar el archivo seleccionado.");
    const headerLength = Number(response.headers.get("content-length") ?? 0);
    if (headerLength > maxBytes) throw new Error("El medio supera el tamaño máximo permitido.");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error("El medio supera el tamaño máximo permitido.");
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
  }
  throw new Error("No se pudo descargar el medio de Pexels.");
}
