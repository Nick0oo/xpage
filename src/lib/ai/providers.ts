import { google } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  ProviderCallError,
  shouldFallbackToOpenRouter,
  TextFallbackError,
} from "@/lib/ai/errors";

export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
export const DEFAULT_OPENROUTER_TEXT_MODEL = "qwen/qwen3.8-27b:free";
export const DEFAULT_OPENROUTER_TEXT_FALLBACK_MODEL = "z-ai/glm-5.2:free";
export const DEFAULT_OPENROUTER_IMAGE_MODEL = "recraft/recraft-v4.1-flash";
export const DEFAULT_OPENROUTER_IMAGE_FALLBACK_MODEL = "meta/muse-image";

export type TextProvider = "gemini" | "openrouter" | "openrouter-fallback";

export function isGeminiConfigured() {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim());
}

export function isOpenRouterConfigured() {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

export function isTextProviderConfigured() {
  return isGeminiConfigured() || isOpenRouterConfigured();
}

export function getGeminiModel() {
  const modelId = process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  return google(modelId);
}

function getOpenRouterProvider() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error("OpenRouter is not configured.");
  return createOpenRouter({ apiKey });
}

export function getOpenRouterTextModel() {
  const modelId = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_TEXT_MODEL;
  return getOpenRouterProvider()(modelId);
}

export function getOpenRouterTextFallbackModel() {
  const modelId =
    process.env.OPENROUTER_FALLBACK_MODEL?.trim() || DEFAULT_OPENROUTER_TEXT_FALLBACK_MODEL;
  return getOpenRouterProvider()(modelId);
}

export function getOpenRouterImageModel() {
  const modelId = process.env.OPENROUTER_IMAGE_MODEL?.trim() || DEFAULT_OPENROUTER_IMAGE_MODEL;
  return getOpenRouterProvider().imageModel(modelId);
}

export function getOpenRouterImageFallbackModel() {
  const modelId =
    process.env.OPENROUTER_IMAGE_FALLBACK_MODEL?.trim() || DEFAULT_OPENROUTER_IMAGE_FALLBACK_MODEL;
  // Muse Image is exposed through OpenRouter chat completions and returns images in message.images.
  return getOpenRouterProvider()(modelId);
}

export async function generateTextWithFallback<T>(
  run: (provider: TextProvider) => Promise<T>,
): Promise<T> {
  if (!isGeminiConfigured()) {
    if (!isOpenRouterConfigured()) {
      throw new Error("No text-generation provider is configured.");
    }

    return runOpenRouterTextChain(run);
  }

  try {
    return await run("gemini");
  } catch (error) {
    const primaryError = new ProviderCallError("gemini", error);
    if (!isOpenRouterConfigured() || !shouldFallbackToOpenRouter(primaryError)) {
      throw primaryError;
    }

    try {
      return await runOpenRouterTextChain(run, [primaryError]);
    } catch (fallbackError) {
      throw fallbackError;
    }
  }
}

async function runOpenRouterTextChain<T>(
  run: (provider: TextProvider) => Promise<T>,
  previousErrors: ProviderCallError[] = [],
): Promise<T> {
  try {
    return await run("openrouter");
  } catch (error) {
    const qwenError = new ProviderCallError("openrouter", error);
    if (!shouldFallbackToOpenRouter(qwenError)) {
      if (previousErrors.length > 0) throw new TextFallbackError([...previousErrors, qwenError]);
      throw qwenError;
    }

    try {
      return await run("openrouter-fallback");
    } catch (fallbackError) {
      throw new TextFallbackError([
        ...previousErrors,
        qwenError,
        new ProviderCallError("openrouter-fallback", fallbackError),
      ]);
    }
  }
}
