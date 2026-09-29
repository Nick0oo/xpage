import { NextResponse } from "next/server";
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
  return NextResponse.json({
    modelId: "gpt-5.6-luna",
    geminiConfigured: isGeminiConfigured(),
    geminiModel: process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
    qwenConfigured: isOpenRouterConfigured(),
    qwenModel: process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_TEXT_MODEL,
  });
}
