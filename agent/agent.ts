import { defineAgent, defineDynamic } from "eve";
import { chatgpt } from "eve/models/openai";

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
        return { model: chatgpt("gpt-5.6-luna"), modelContextWindowTokens: 272_000 };
      },
    },
  }),
});
