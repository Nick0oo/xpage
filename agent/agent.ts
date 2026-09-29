import { defineAgent, defineDynamic } from "eve";
import { chatgpt } from "eve/models/openai";
import { createGoogle } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export default defineAgent({
  model: defineDynamic({
    events: {
      "step.started": (_event, ctx) => {
        const serializedMessages = JSON.stringify(ctx.messages);
        if (serializedMessages.includes("XPage model selection: gpt-6-luna")) {
          return { model: chatgpt("gpt-6-luna"), modelContextWindowTokens: 272_000 };
        }
        if (serializedMessages.includes("XPage model selection: gpt-5.6-luna")) {
          return { model: chatgpt("gpt-5.6-luna"), modelContextWindowTokens: 272_000 };
        }
        if (serializedMessages.includes("XPage model selection: gemini")) {
          const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
          if (!apiKey) throw new Error("Gemini no está configurado. Define GOOGLE_GENERATIVE_AI_API_KEY.");
          const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
          return createGoogle({ apiKey })(model);
        }
        if (serializedMessages.includes("XPage model selection: qwen")) {
          const apiKey = process.env.OPENROUTER_API_KEY?.trim();
          if (!apiKey) throw new Error("Qwen no está configurado. Define OPENROUTER_API_KEY.");
          const model = process.env.OPENROUTER_MODEL?.trim() || "qwen/qwen3.8-27b:free";
          return createOpenRouter({ apiKey })(model);
        }
        return { model: chatgpt("gpt-5.6-luna"), modelContextWindowTokens: 272_000 };
      },
    },
  }),
});
