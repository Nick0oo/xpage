import { createHash } from "node:crypto";

export function landingFingerprint(input: { sectionRevision: number; html: string; css: string; js: string }) {
  return createHash("sha256")
    .update(JSON.stringify([input.sectionRevision, input.html, input.css, input.js]))
    .digest("hex");
}
