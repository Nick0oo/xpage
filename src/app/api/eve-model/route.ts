import { NextResponse } from "next/server";
import { Client } from "eve/client";
import {
  DEFAULT_GEMINI_MODEL,
  DEFAULT_OPENROUTER_TEXT_MODEL,
  isGeminiConfigured,
  isOpenRouterConfigured,
} from "@/lib/ai/providers";

export const runtime = "nodejs";

function isLocalRequest(request: Request) {
  if (process.env.NODE_ENV !== "development") return false;
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  const requestUrl = new URL(request.url);
  if (!localHosts.has(requestUrl.hostname)) return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    return originUrl.origin === requestUrl.origin && localHosts.has(originUrl.hostname);
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  if (!isLocalRequest(request)) {
    return NextResponse.json({ error: "Solo disponible desde XPage en desarrollo local." }, { status: 404 });
  }
  let eveAvailable = false;
  try {
    const host = process.env.EVE_ORIGIN?.trim() || "http://127.0.0.1:3000";
    await new Client({ host: host.replace(/\/$/, "") }).health();
    eveAvailable = true;
  } catch {
    // Eve being reachable only confirms the local agent server is running.
    // ChatGPT subscription authorization is verified by an actual model call.
  }

  return NextResponse.json({
    modelId: "gpt-5.6-luna",
    eveAvailable,
    geminiConfigured: isGeminiConfigured(),
    geminiModel: process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
    qwenConfigured: isOpenRouterConfigured(),
    qwenModel: process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_TEXT_MODEL,
    imageConfigured: isOpenRouterConfigured(),
  });
}
