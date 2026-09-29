export function isLocalRequest(request: Request, allowOpaqueOrigin = false) {
  const hostname = new URL(request.url).hostname.toLowerCase();
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname)) return false;
  const origin = request.headers.get("origin");
  if (origin === "null") return allowOpaqueOrigin;
  return !origin || origin === new URL(request.url).origin;
}
