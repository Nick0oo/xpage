export const MODEL_CHOICES = ["gpt-5.6-luna", "gpt-6-luna", "gemini", "qwen"] as const;
export type ModelChoice = (typeof MODEL_CHOICES)[number];
export const DEFAULT_MODEL_CHOICE: ModelChoice = "gpt-5.6-luna";
export const isEveModel = (model: ModelChoice) => model === "gpt-5.6-luna" || model === "gpt-6-luna";
