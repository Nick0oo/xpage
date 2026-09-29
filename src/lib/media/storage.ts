import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const assetRoot = path.resolve(process.cwd(), "data", "assets");
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 60 * 1024 * 1024;

export type StoredMedia = { path: string; mimeType: string; bytes: number };

function sniffMime(buffer: Buffer, requestedType: "image" | "video") {
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  if (requestedType === "video" && buffer.toString("ascii", 4, 8) === "ftyp") return "video/mp4";
  throw new Error("El archivo recibido no coincide con un formato de imagen o video permitido.");
}

export async function storeMediaBuffer(id: string, buffer: Buffer, requestedType: "image" | "video"): Promise<StoredMedia> {
  const mimeType = sniffMime(buffer, requestedType);
  if ((requestedType === "image" && !mimeType.startsWith("image/")) || (requestedType === "video" && mimeType !== "video/mp4")) {
    throw new Error("El tipo de archivo no coincide con el espacio seleccionado.");
  }
  if (buffer.byteLength > (requestedType === "image" ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES)) {
    throw new Error("El archivo supera el límite permitido para este medio.");
  }
  const extension = mimeType === "image/jpeg" ? "jpg" : mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "mp4";
  const filename = `${id}.${extension}`;
  await mkdir(assetRoot, { recursive: true });
  await writeFile(path.join(assetRoot, filename), buffer, { flag: "wx" });
  return { path: filename, mimeType, bytes: buffer.byteLength };
}

export async function readStoredMedia(filename: string) {
  if (!/^[0-9a-f-]{36}\.(?:jpg|png|webp|mp4)$/.test(filename)) throw new Error("Ruta de medio no válida.");
  return readFile(path.join(assetRoot, filename));
}

export async function removeStoredMedia(filename: string | null | undefined) {
  if (!filename || !/^[0-9a-f-]{36}\.(?:jpg|png|webp|mp4)$/.test(filename)) return;
  await unlink(path.join(assetRoot, filename)).catch(() => undefined);
}
