"use client";

import { useState } from "react";
import { useEveAgent } from "eve/react";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DEFAULT_MODEL_CHOICE, MODEL_CHOICES, type ModelChoice } from "@/lib/model-choice";

const modelLabels: Record<ModelChoice, string> = {
  "gpt-5.6-luna": "GPT-5.6 Luna",
  "gpt-6-luna": "GPT-6 Luna",
  gemini: "Gemini",
  qwen: "Qwen",
};

const outputSchema = z.object({
  estado: z.literal("ok"),
  resumen: z.string().min(1),
});

export function EveSmokeTest() {
  const agent = useEveAgent();
  const [error, setError] = useState("");
  const [testedModel, setTestedModel] = useState<ModelChoice | null>(null);
  const busy = agent.status === "submitted" || agent.status === "streaming" || agent.status === "resuming";
  const completion = [...agent.events].reverse().find((event) => event.type === "result.completed");
  const parsedResult = completion?.type === "result.completed"
    ? outputSchema.safeParse(completion.data.result)
    : null;
  const result = parsedResult?.success ? parsedResult.data : null;

  async function runCheck() {
    setError("");
    const savedChoice = window.localStorage.getItem("xpage.model-choice");
    const modelChoice = MODEL_CHOICES.find((choice) => choice === savedChoice) ?? DEFAULT_MODEL_CHOICE;
    setTestedModel(modelChoice);
    try {
      await agent.send(
        `XPage model selection: ${modelChoice}\n\nHaz la prueba local de XPage con el tema: comprobar que el acceso con suscripción funciona.`,
        { outputSchema },
      );
    } catch {
      setError("No se pudo iniciar la solicitud. Comprueba que Eve esté activa y conecta ChatGPT desde el selector.");
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Conexión local</p>
        <h1 className="mt-2 font-display text-4xl">Prueba de Eve</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Envía una solicitud al agente local con una salida JSON validada y el modelo elegido en XPage. XPage no solicita ni guarda claves.
        </p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Estado del agente: <span className="font-medium text-foreground">{agent.status}</span></p>
        {testedModel ? <p className="mt-2 text-sm text-muted-foreground">Modelo probado: <span className="font-medium text-foreground">{modelLabels[testedModel]}</span></p> : null}
        <Button className="mt-4" disabled={busy} onClick={() => void runCheck()}>
          {busy ? "Esperando a Eve…" : "Enviar prueba estructurada"}
        </Button>
        {result ? (
          <pre className="mt-4 overflow-auto rounded-lg bg-muted p-4 text-sm" role="status">
            {JSON.stringify(result, null, 2)}
          </pre>
        ) : null}
        {error || agent.error || (parsedResult && !parsedResult.success) ? (
          <div className="mt-4 space-y-2 text-sm text-destructive" role="alert">
            {error || (parsedResult && !parsedResult.success
              ? "Eve respondió, pero el resultado no coincide con el esquema esperado."
              : "No hay una sesión disponible o Eve no pudo usarla.")}
            <p><Link href="/" className="font-medium text-primary underline underline-offset-2">Ve al selector para conectar ChatGPT Subscription</Link></p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
