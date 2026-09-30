"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ModelChoice } from "@/lib/model-choice";

type ModelInfo = { id: ModelChoice; label: string; enabled: boolean };
type ChatGptAuthState = "checking" | "disconnected" | "connecting" | "connected" | "error";

export function EveModelSelector({ value, onChange }: { value: ModelChoice; onChange: (model: ModelChoice) => void }) {
  const [models, setModels] = useState<ModelInfo[]>([
    { id: "gpt-5.6-luna", label: "GPT-5.6 Luna", enabled: true },
    { id: "gpt-6-luna", label: "GPT-6 Luna", enabled: true },
    { id: "gemini", label: "Gemini", enabled: false },
    { id: "qwen", label: "Qwen", enabled: false },
  ]);
  const [status, setStatus] = useState("Consultando Eve…");
  const [saving, setSaving] = useState(false);
  const [imageConfigured, setImageConfigured] = useState(false);
  const [authState, setAuthState] = useState<ChatGptAuthState>("checking");
  const [codexAvailable, setCodexAvailable] = useState(true);
  const [authMessage, setAuthMessage] = useState("");

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
        setStatus(payload.eveAvailable === true
          ? "Eve está disponible. El acceso a ChatGPT aún debe confirmarse con una generación."
          : "Eve no responde todavía. Inicia la aplicación y vuelve a consultar.");
      })
      .catch(() => setStatus("No se pudo consultar Eve. Comprueba que la aplicación local esté iniciada."));
    void fetch("/api/eve-model/auth")
      .then(async (response) => {
        if (!response.ok) throw new Error("No se pudo consultar el inicio de sesión.");
        const payload = await response.json();
        setAuthState(payload.state);
        setCodexAvailable(payload.codexAvailable === true);
      })
      .catch(() => {
        setAuthState("error");
        setAuthMessage("No se pudo consultar el estado de inicio de sesión.");
      });
  }, []);

  async function connectChatGpt() {
    setAuthState("connecting");
    setAuthMessage("Abriendo el inicio de sesión de ChatGPT en el navegador del sistema…");
    try {
      const response = await fetch("/api/eve-model/auth", { method: "POST" });
      if (!response.ok) throw new Error("No se pudo iniciar el acceso a ChatGPT.");
      let attempts = 0;
      const poll = async () => {
        attempts += 1;
        try {
          const statusResponse = await fetch("/api/eve-model/auth");
          if (!statusResponse.ok) throw new Error();
          const payload = await statusResponse.json();
          setCodexAvailable(payload.codexAvailable === true);
          setAuthState(payload.state);
          if (payload.state === "connecting" && attempts < 230) {
            window.setTimeout(() => void poll(), 1_500);
          } else if (payload.state === "connected") {
            setAuthMessage("Sesión de ChatGPT confirmada por Codex. Prueba Eve para confirmar la generación.");
          } else if (payload.state === "error") {
            setAuthMessage("Codex no pudo iniciar el acceso. Revisa la instalación del CLI y vuelve a intentar.");
          } else if (payload.state === "disconnected") {
            setAuthMessage("No hay una sesión de ChatGPT activa en Codex.");
          }
        } catch {
          setAuthState("error");
          setAuthMessage("No se pudo consultar el estado de inicio de sesión.");
        }
      };
      void poll();
    } catch {
      setAuthState("error");
      setAuthMessage("No se pudo iniciar el acceso a ChatGPT desde esta aplicación.");
    }
  }

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
      <div className="mt-4 border-t border-border pt-4">
        <p className="text-sm font-semibold">Conexión ChatGPT Subscription</p>
        <p className="mt-1 text-xs text-muted-foreground" role="status" aria-live="polite">
          {authMessage || (authState === "checking" ? "Consultando sesión local de Codex…"
            : authState === "connected" ? "Codex tiene una sesión de ChatGPT activa."
              : authState === "connecting" ? "Iniciando sesión…"
                : !codexAvailable ? "No se encontró Codex CLI en el entorno de XPage."
                  : "No hay una sesión de ChatGPT activa en Codex.")}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void connectChatGpt()}
            disabled={authState === "checking" || authState === "connecting" || !codexAvailable}
            className="min-h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {authState === "connecting" ? "Esperando inicio de sesión…" : authState === "connected" ? "Cambiar sesión de ChatGPT" : "Conectar ChatGPT Subscription"}
          </button>
          <Link href="/eve-prueba" className="text-sm font-medium text-primary underline underline-offset-2">Probar conexión con Eve</Link>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">La sesión se guarda localmente por Codex. La prueba con Eve confirma que el modelo también puede generar.</p>
      </div>
    </div>
  );
}
