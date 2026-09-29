import type { LandingCode } from "@/lib/schemas";

function previewCsp(relativeMedia = false) {
  const mediaSource = relativeMedia ? "'self'" : "http://localhost:* http://127.0.0.1:*";
  return [
  "default-src 'none'",
  `base-uri ${relativeMedia ? "'self'" : "'none'"}`,
  "object-src 'none'",
  "connect-src 'none'",
  "navigate-to 'none'",
  "form-action 'none'",
  "frame-src 'none'",
  "child-src 'none'",
  `img-src data: blob: ${mediaSource}`,
  `media-src data: blob: ${mediaSource}`,
  "font-src data: blob:",
  "style-src 'unsafe-inline'",
  "script-src 'unsafe-inline'",
  ].join("; ");
}

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

export function buildPreviewDocument(code: LandingCode, options: { relativeMedia?: boolean } = {}) {
  const base = options.relativeMedia ? '<base href="./">' : "";
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="${previewCsp(options.relativeMedia)}">
  <meta name="referrer" content="no-referrer">
  ${base}
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
  const localMediaHtml = code.html.replace(/(src|poster)="\/api\/media\/assets\//g, `$1="${window.location.origin}/api/media/assets/`);
  const blob = new Blob([buildPreviewDocument({ ...code, html: localMediaHtml })], { type: "text/html;charset=utf-8" });
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
