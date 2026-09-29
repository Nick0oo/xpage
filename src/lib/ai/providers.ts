export const DEFAULT_GEMINI_MODEL = "gemini-3.8-flash";
export const DEFAULT_OPENROUTER_TEXT_MODEL = "qwen/qwen3.8-27b:free";
export const DEFAULT_OPENROUTER_IMAGE_MODEL = "recraft/recraft-v4.1-flash";

export function isGeminiConfigured() {
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim());
}

export function isOpenRouterConfigured() {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}
