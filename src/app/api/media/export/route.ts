import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createZip } from "@/lib/zip";
import { readStoredMedia } from "@/lib/media/storage";
import { isLocalRequest } from "@/lib/media/request-guard";
import { buildPreviewDocument, escapeHtml, makeDownloadName } from "@/lib/preview-document";
import { recordTraceStep } from "@/lib/generation-traces";

export const runtime = "nodejs";

function extension(filename: string) {
  return filename.slice(filename.lastIndexOf(".") + 1);
}

export async function GET(request: Request) {
  if (!isLocalRequest(request)) return NextResponse.json({ error: "La exportación solo está disponible desde XPage en este equipo." }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: "El identificador de landing no es válido." }, { status: 400 });
  const landing = await prisma.savedLanding.findUnique({ where: { id }, include: { mediaAssets: { where: { isCurrent: true }, orderBy: { createdAt: "asc" } } } });
  if (!landing) return NextResponse.json({ error: "Guarda primero la landing en Biblioteca." }, { status: 404 });
  if (landing.mediaAssets.length === 0) return NextResponse.json({ error: "Esta landing no tiene medios locales para empaquetar." }, { status: 409 });

  try {
    const entries: { name: string; data: Buffer }[] = [];
    let html = landing.html;
    const creditLines = [`Créditos de medios para ${landing.title}`, ""];
    const creditHtml = landing.mediaAssets.map((asset) => {
      const fileName = `${asset.id}.${extension(asset.localPath)}`;
      const sourcePath = `assets/${fileName}`;
      const posterFile = asset.posterPath ? `${asset.id}.${extension(asset.posterPath)}` : null;
      const posterPath = posterFile ? `assets/posters/${posterFile}` : null;
      html = html.replaceAll(`/api/media/assets/${asset.id}?poster=1`, posterPath ?? sourcePath);
      html = html.replaceAll(`/api/media/assets/${asset.id}`, sourcePath);
      const description = `${asset.type === "image" ? "Foto" : "Video"} · ${asset.author} · ${asset.provider} · ${asset.license}`;
      creditLines.push(`${description}\n${asset.sourceUrl}\nCrédito: ${asset.creditUrl}`, "");
      return `<li>${asset.type === "image" ? "Foto" : "Video"}: <a href="${escapeHtml(asset.creditUrl)}">${escapeHtml(asset.author)}</a> · <a href="${escapeHtml(asset.sourceUrl)}">${escapeHtml(asset.provider)}</a></li>`;
    }).join("");
    const creditsSection = `<section aria-label="Créditos de medios"><h2>Créditos de medios</h2><ul>${creditHtml}</ul></section>`;
    html = html.includes("</body>") ? html.replace("</body>", `${creditsSection}</body>`) : `${html}${creditsSection}`;
    const htmlDocument = buildPreviewDocument({ title: landing.title, html, css: landing.css, js: landing.js }, { relativeMedia: true });
    entries.push({ name: "index.html", data: Buffer.from(htmlDocument, "utf8") });
    entries.push({ name: "CREDITOS.txt", data: Buffer.from(creditLines.join("\n"), "utf8") });
    let totalBytes = entries[0].data.byteLength;
    for (const asset of landing.mediaAssets) {
      const data = await readStoredMedia(asset.localPath);
      totalBytes += data.byteLength;
      if (asset.posterPath) {
        const poster = await readStoredMedia(asset.posterPath);
        totalBytes += poster.byteLength;
        entries.push({ name: `assets/posters/${asset.id}.${extension(asset.posterPath)}`, data: poster });
      }
      if (totalBytes > 220 * 1024 * 1024) return NextResponse.json({ error: "El paquete supera 220 MB. Reduce el número o tamaño de los clips e inténtalo de nuevo." }, { status: 413 });
      entries.push({ name: `assets/${asset.id}.${extension(asset.localPath)}`, data });
    }
    const zip = createZip(entries);
    if (landing.traceId) {
      await recordTraceStep(landing.traceId, {
        eventType: "export",
        phase: "media-export",
        title: "Paquete ZIP de landing exportado",
        output: { filename: `${makeDownloadName(landing.title).replace(/\.html$/, "")}-medios.zip`, byteLength: zip.byteLength, mediaCount: landing.mediaAssets.length },
        references: [{ kind: "landing", id: landing.id, label: landing.title }, ...landing.mediaAssets.map((asset) => ({ kind: "media-asset" as const, id: asset.id, label: `${asset.type} · ${asset.author}` }))],
      }).catch(() => undefined);
    }
    return new NextResponse(new Uint8Array(zip), { headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${makeDownloadName(landing.title).replace(/\.html$/, "")}-medios.zip"`,
      "Content-Length": String(zip.byteLength),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    return NextResponse.json({ error: "Falta algún archivo local. Vuelve a seleccionar el medio antes de exportar." }, { status: 409 });
  }
}
