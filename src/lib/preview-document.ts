import type { LandingCode } from "@/lib/schemas";

const PREVIEW_CSP = [
  "default-src 'none'",
  "base-uri 'none'",
  "object-src 'none'",
  "connect-src 'none'",
  "navigate-to 'none'",
  "form-action 'none'",
  "frame-src 'none'",
  "child-src 'none'",
  "img-src data: blob: http://localhost:* http://127.0.0.1:*",
  "media-src data: blob: http://localhost:* http://127.0.0.1:*",
  "font-src data: blob:",
  "style-src 'unsafe-inline'",
  "script-src 'unsafe-inline'",
].join("; ");

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeStyleContent(value: string) {
  return value.replace(/<\/style/gi, "<\\/style");
}

function escapeScriptContent(value: string) {
  return value.replace(/<\/script/gi, "<\\/script");
}

export function buildPreviewDocument(code: LandingCode) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}">
  <meta name="referrer" content="no-referrer">
  <title>${escapeHtml(code.title)}</title>
  <style>${escapeStyleContent(code.css)}</style>
</head>
<body>
${code.html}
<script>${escapeScriptContent(code.js)}</script>
</body>
</html>`;
}

export function openPreviewDocument(code: LandingCode) {
  const blob = new Blob([buildPreviewDocument(code)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function makeDownloadName(title: string) {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);

  return `${slug || "xpage-landing"}.html`;
}
