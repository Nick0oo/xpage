import { Client } from "eve/client";
import { z } from "zod";
import type { ModelChoice } from "@/lib/model-choice";

const modelChoices = new Set<ModelChoice>(["gpt-5.6-luna", "gpt-6-luna", "gemini", "qwen"]);

function getClient() {
  const host = process.env.EVE_ORIGIN?.trim() || "http://127.0.0.1:3000";
  return new Client({ host: host.replace(/\/$/, "") });
}

export async function runEveStructured<T>(input: {
  modelChoice: ModelChoice;
  message: string;
  outputSchema: z.ZodType<T>;
}) {
  if (!modelChoices.has(input.modelChoice)) throw new Error("Modelo Eve no permitido.");
  const { response } = await getClient().sessions.create({
    message: `XPage model selection: ${input.modelChoice}\n\n${input.message}`,
    outputSchema: input.outputSchema,
  });
  const result = await response.result();
  if (result.status === "failed") {
    const failure = result.events.find((event) => event.type === "session.failed");
    throw new Error(failure?.data.message || "Eve no pudo completar la generación.");
  }
  if (result.data === undefined) throw new Error("Eve no devolvió una salida estructurada.");
  return { data: result.data as T, sessionId: result.sessionId };
}
