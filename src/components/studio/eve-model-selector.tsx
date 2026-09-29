"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ModelChoice } from "@/lib/model-choice";

type ModelInfo = { id: ModelChoice; label: string; enabled: boolean };

export function EveModelSelector({ value, onChange }: { value: ModelChoice; onChange: (model: ModelChoice) => void }) {
  const [models, setModels] = useState<ModelInfo[]>([
    { id: "gpt-5.6-luna", label: "GPT-5.6 Luna", enabled: true },
    { id: "gpt-6-luna", label: "GPT-6 Luna", enabled: true },
    { id: "gemini", label: "Gemini", enabled: false },
    { id: "qwen", label: "Qwen", enabled: false },
  ]);
  const [status, setStatus] = useState("Consultando proveedores…");
  const [saving, setSaving] = useState(false);
  const [imageConfigured, setImageConfigured] = useState(false);

  useEffect(() => {
    void fetch("/api/eve-model")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "No se pudo consultar Eve.");
        const nextModels: ModelInfo[] = [
          { id: "gpt-5.6-luna", label: "GPT-5.6 Luna", enabled: true },
          { id: "gpt-6-luna", label: "GPT-6 Luna", enabled: true },
          { id: "gemini", label: `Gemini · ${payload.geminiModel}`, enabled: payload.geminiConfigured === true },
          { id: "qwen", label: `Qwen · ${payload.qwenModel}`, enabled: payload.qwenConfigured === true },
        ];
        setModels(nextModels);
        setImageConfigured(payload.imageConfigured === true);
        const health = await fetch("/eve/v1/health");
        if (!health.ok) throw new Error("Eve no responde.");
        setStatus("Eve conectado. El acceso a ChatGPT se administra localmente desde Eve.");
      })
      .catch(() => setStatus("Inicia pnpm dev y configura /login → ChatGPT Subscription en Eve."));
  }, []);

  function saveModel(nextModel: ModelChoice) {
    setSaving(true);
    window.localStorage.setItem("xpage.model-choice", nextModel);
    onChange(nextModel);
    setStatus("Selección guardada en este navegador. Se aplica a la siguiente generación.");
    setSaving(false);
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <label htmlFor="eve-model" className="block text-sm font-semibold">Modelo de generación</label>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">El modelo elegido trabaja dentro de Eve para el plan y el código de la landing. La portada se genera con OpenRouter.</p>
      <select
        id="eve-model"
        value={value}
        disabled={saving}
        onChange={(event) => void saveModel(event.currentTarget.value as ModelChoice)}
        className="mt-3 min-h-10 w-full max-w-sm rounded-lg border border-input bg-background px-3 text-sm"
      >
        {models.map((model) => <option key={model.id} value={model.id} disabled={!model.enabled}>{model.label}{!model.enabled ? " · sin clave" : ""}</option>)}
      </select>
      <p className="mt-2 text-xs text-muted-foreground" role="status" aria-live="polite">{status}</p>
      <p className="mt-1 text-xs text-muted-foreground">Imagen de portada: {imageConfigured ? "OpenRouter configurado" : "requiere OPENROUTER_API_KEY"} · selección de modelo guardada en este navegador.</p>
      <p className="mt-2 text-xs text-muted-foreground">
        Sesión ChatGPT: ejecuta <code>pnpm eve:dev</code> en otra terminal y usa <code>/login</code> → <code>ChatGPT Subscription</code>.
        <Link href="/eve-prueba" className="ml-2 font-medium text-primary underline underline-offset-2">Probar conexión</Link>
      </p>
    </div>
  );
}
