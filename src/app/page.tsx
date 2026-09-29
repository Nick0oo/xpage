"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Download, GitBranch, ImagePlus, LoaderCircle, Save, Sparkles } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { BriefForm } from "@/components/studio/brief-form";
import { PromptResults } from "@/components/studio/prompt-results";
import { TechniqueSelector } from "@/components/studio/technique-selector";
import { EveModelSelector } from "@/components/studio/eve-model-selector";
import { Button } from "@/components/ui/button";
import { CoverImageGenerator } from "@/components/preview/cover-image-generator";
import { briefSchema, landingCodeSchema, type Brief, type PromptRequest } from "@/lib/schemas";
import type { TechniqueId } from "@/lib/techniques";
import type { ActiveLanding, PromptResult } from "@/lib/studio-types";
import { saveLanding } from "@/lib/landing-storage";
import { buildPreviewDocument, makeDownloadName } from "@/lib/preview-document";
import { DEFAULT_MODEL_CHOICE, type ModelChoice } from "@/lib/model-choice";

const emptyBrief: Brief = {
  topic: "",
  offer: "",
  audience: "",
  tone: "",
  cta: "",
};

type CreationStep = 1 | 2 | 3;

type ApiResponse = {
  prompt?: unknown;
  image?: unknown;
  mediaType?: unknown;
  traceId?: unknown;
  error?: unknown;
  designPlan?: unknown;
  generationMode?: unknown;
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("No se pudo conectar con XPage. Revisa que el servidor esté activo.");
  }

  const payload = (await response.json().catch(() => null)) as ApiResponse | null;
  if (!response.ok) {
    throw new Error(
      typeof payload?.error === "string"
        ? payload.error
        : "La solicitud no pudo completarse. Inténtalo de nuevo.",
    );
  }

  return payload as T;
}

export default function Home() {
  const [brief, setBrief] = useState<Brief>(emptyBrief);
  const [selectedIds, setSelectedIds] = useState<TechniqueId[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Brief, string>>>({});
  const [formError, setFormError] = useState("");
  const [promptResults, setPromptResults] = useState<PromptResult[]>([]);
  const [activeResultId, setActiveResultId] = useState<string | null>(null);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [step, setStep] = useState<CreationStep>(1);
  const [view, setView] = useState<"create" | "preview">("create");
  const [activeLanding, setActiveLanding] = useState<ActiveLanding | null>(null);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [modelChoice, setModelChoice] = useState<ModelChoice>(DEFAULT_MODEL_CHOICE);

  const busy = batchGenerating || activeResultId !== null;

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }, [step]);

  function changeBrief(field: keyof Brief, value: string) {
    const changed = brief[field] !== value;
    setBrief((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    if (changed && promptResults.length > 0) {
      setPromptResults([]);
      setStep(1);
      setFormError("Cambiaste el brief. Revisa los métodos y genera prompts nuevos para esta versión.");
    } else {
      setFormError("");
    }
  }

  function toggleTechnique(id: TechniqueId) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((selected) => selected !== id) : [...current, id],
    );
    if (promptResults.length > 0) {
      setPromptResults([]);
      setStep(2);
      setFormError("Cambiaste las técnicas. Genera prompts nuevos para aplicar esta selección.");
    } else {
      setFormError("");
    }
  }

  function validatedBrief() {
    const parsed = briefSchema.safeParse(brief);
    if (parsed.success) {
      setFieldErrors({});
      setFormError("");
      return parsed.data;
    }

    const nextErrors: Partial<Record<keyof Brief, string>> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof Brief;
      if (!nextErrors[field]) nextErrors[field] = issue.message;
    }
    setStep(1);
    setFieldErrors(nextErrors);
    setFormError("Completa los campos marcados antes de pedirle algo a la IA.");
    return null;
  }

  function goToStep(target: CreationStep) {
    if (target === 1) {
      setStep(1);
      return;
    }

    if (target === 2) {
      if (!validatedBrief()) return;
      setStep(2);
      return;
    }

    if (promptResults.length > 0) setStep(3);
  }

  async function createTrace(
    parsedBrief: Brief,
    techniqueIds: TechniqueId[],
    mode: "individual" | "combined",
  ) {
    const payload = await postJson<{ id: string }>("/api/traces", {
      category: "landing-page",
      title: parsedBrief.topic,
      context: { brief: parsedBrief, techniqueIds, mode, modelChoice },
    });
    if (typeof payload.id !== "string" || !payload.id) {
      throw new Error("No se pudo iniciar la trazabilidad de esta landing.");
    }
    return payload.id;
  }

  async function createLandingTrace(result: PromptResult) {
    const payload = await postJson<{ id: string }>("/api/traces", {
      category: "landing-page",
      title: result.brief.topic,
      context: {
        brief: result.brief,
        techniqueIds: result.techniqueIds,
        mode: result.combined ? "combined" : "individual",
        prompt: result.prompt,
        generationMode: result.generationMode ?? "legacy-prompt",
        designPlan: result.designPlan ?? null,
        sourcePromptTraceId: result.traceId,
        modelChoice: result.modelChoice,
      },
      sourceTraceId: result.traceId,
    });
    if (typeof payload.id !== "string" || !payload.id) {
      throw new Error("No se pudo iniciar la trazabilidad de esta landing.");
    }
    return payload.id;
  }

  async function generatePrompt(resultId: string, traceId: string, request: PromptRequest) {
    setActiveResultId(resultId);
    setPromptResults((current) =>
      current.map((result) =>
        result.id === resultId ? { ...result, status: "loading", error: undefined } : result,
      ),
    );

    try {
      const payload = await postJson<Pick<PromptResult, "prompt" | "designPlan" | "generationMode">>("/api/prompts", { ...request, modelChoice: request.modelChoice, traceId });
      if (typeof payload.prompt !== "string" || !payload.prompt.trim()) {
        throw new Error("La IA devolvió una respuesta vacía. Inténtalo de nuevo.");
      }
      setPromptResults((current) =>
        current.map((result) =>
          result.id === resultId
            ? { ...result, prompt: payload.prompt, designPlan: payload.designPlan ?? null, generationMode: payload.generationMode ?? "legacy-prompt", status: "ready", error: undefined }
            : result,
        ),
      );
    } catch (error) {
      setPromptResults((current) =>
        current.map((result) =>
          result.id === resultId
            ? {
                ...result,
                status: "error",
                error: error instanceof Error ? error.message : "No se pudo generar el prompt.",
              }
            : result,
        ),
      );
    } finally {
      setActiveResultId(null);
    }
  }

  async function generateIndividualPrompts() {
    const parsedBrief = validatedBrief();
    if (!parsedBrief) return;
    if (selectedIds.length === 0) {
      setFormError("Selecciona al menos una técnica para generar prompts.");
      return;
    }

    setStep(3);
    const ids = [...selectedIds];
    setPromptResults([]);
    setBatchGenerating(true);
    setFormError("");

    try {
      for (const techniqueId of ids) {
        const traceId = await createTrace(parsedBrief, [techniqueId], "individual");
        const resultId = crypto.randomUUID();
        const result: PromptResult = {
          id: resultId,
          brief: parsedBrief,
          techniqueIds: [techniqueId],
          combined: false,
          traceId,
          prompt: "",
          status: "loading",
          modelChoice,
        };
        setPromptResults((current) => [...current, result]);
        await generatePrompt(resultId, traceId, {
          mode: "technique",
          brief: parsedBrief,
          techniqueId,
          modelChoice,
        });
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo registrar el proceso.");
    } finally {
      setBatchGenerating(false);
    }
  }

  async function generateCombinedPrompt() {
    const parsedBrief = validatedBrief();
    if (!parsedBrief) return;
    if (selectedIds.length < 2) {
      setFormError("Selecciona dos o más técnicas para combinarlas.");
      return;
    }

    setStep(3);
    setBatchGenerating(true);
    setFormError("");
    const resultId = crypto.randomUUID();
    const techniqueIds = [...selectedIds];
    try {
      const traceId = await createTrace(parsedBrief, techniqueIds, "combined");
      setPromptResults((current) => [
        ...current,
        {
          id: resultId,
          brief: parsedBrief,
          techniqueIds,
          combined: true,
          traceId,
          prompt: "",
          status: "loading",
          modelChoice,
        },
      ]);
      await generatePrompt(resultId, traceId, { mode: "combine", brief: parsedBrief, techniqueIds, modelChoice });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo registrar la combinación.");
    } finally {
      setBatchGenerating(false);
    }
  }

  function retryPrompt(resultId: string) {
    const result = promptResults.find((item) => item.id === resultId);
    if (!result) return;

    const request: PromptRequest = result.combined
      ? { mode: "combine", brief: result.brief, techniqueIds: result.techniqueIds, modelChoice: result.modelChoice }
      : { mode: "technique", brief: result.brief, techniqueId: result.techniqueIds[0], modelChoice: result.modelChoice };
    void generatePrompt(resultId, result.traceId, request);
  }

  async function buildLanding(resultId: string) {
    const result = promptResults.find((item) => item.id === resultId);
    if (!result || result.status !== "ready" || !result.prompt.trim()) return;

    setActiveResultId(resultId);
    setFormError("");
    try {
      const traceId = await createLandingTrace(result);
      const payload = await postJson<unknown>("/api/landings", {
        prompt: result.prompt,
        modelChoice: result.modelChoice,
        traceId,
      });
      const parsedCode = landingCodeSchema.safeParse(payload);
      if (!parsedCode.success) {
        throw new Error("La IA devolvió código incompleto. Ajusta el prompt o inténtalo de nuevo.");
      }
      const landingTraceId =
        typeof payload === "object" && payload !== null && "traceId" in payload && typeof payload.traceId === "string"
          ? payload.traceId
          : traceId;

      const parsedBrief = briefSchema.safeParse(result.brief);
      if (!parsedBrief.success) {
        throw new Error("El brief cambió y ya no es válido. Revísalo antes de guardar.");
      }

      setActiveLanding({
        code: parsedCode.data,
        brief: parsedBrief.data,
        techniqueIds: result.techniqueIds,
        prompt: result.prompt,
        traceId: landingTraceId,
        imageDataUrl: null,
        savedId: null,
        modelChoice: result.modelChoice,
      });
      setImageError("");
      setSaveMessage("");
      setView("preview");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo construir la landing.");
    } finally {
      setActiveResultId(null);
    }
  }

  async function generateCoverImage() {
    if (!activeLanding) return;
    setImageLoading(true);
    setImageError("");

    try {
      const payload = await postJson<{ image: string; mediaType: string }>("/api/images", {
        brief: activeLanding.brief,
        modelChoice: activeLanding.modelChoice,
        traceId: activeLanding.traceId,
      });
      if (
        typeof payload.image !== "string" ||
        typeof payload.mediaType !== "string" ||
        !payload.mediaType.startsWith("image/")
      ) {
        throw new Error("OpenRouter no devolvió una imagen válida. Inténtalo de nuevo.");
      }

      setActiveLanding((current) =>
        current
          ? { ...current, imageDataUrl: `data:${payload.mediaType};base64,${payload.image}` }
          : current,
      );
    } catch (error) {
      setImageError(error instanceof Error ? error.message : "No se pudo generar la imagen.");
    } finally {
      setImageLoading(false);
    }
  }

  function downloadLanding() {
    if (!activeLanding) return;
    const blob = new Blob([buildPreviewDocument(activeLanding.code)], {
      type: "text/html;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = makeDownloadName(activeLanding.code.title);
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function saveCurrentLanding() {
    if (!activeLanding || activeLanding.savedId || saveLoading) return;
    const id = crypto.randomUUID();
    setSaveLoading(true);
    setSaveMessage("");
    try {
      await saveLanding({
        id,
        title: activeLanding.code.title,
        brief: activeLanding.brief,
        techniqueIds: activeLanding.techniqueIds,
        prompt: activeLanding.prompt,
        html: activeLanding.code.html,
        css: activeLanding.code.css,
        js: activeLanding.code.js,
        traceId: activeLanding.traceId,
        createdAt: new Date().toISOString(),
      });
      setActiveLanding((current) => (current ? { ...current, savedId: id } : current));
      setSaveMessage("Guardada en la Biblioteca local.");
    } catch (error) {
      setSaveMessage(
        error instanceof Error ? error.message : "No se pudo guardar. Libera espacio e inténtalo de nuevo.",
      );
    } finally {
      setSaveLoading(false);
    }
  }

  if (view === "preview" && activeLanding) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden bg-background">
        <header className="relative z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-card/95 px-2.5 shadow-sm sm:px-4">
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setView("create")} aria-label="Volver al estudio">
              <ArrowLeft aria-hidden="true" />
              <span className="hidden sm:inline">Estudio</span>
            </Button>
            <span className="hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
            <h1 className="min-w-0 truncate text-xs font-medium sm:max-w-[30vw] sm:text-sm lg:max-w-md" title={activeLanding.code.title}>
              {activeLanding.code.title}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <details className="relative">
              <summary
                aria-label="Opciones de portada"
                title="Opciones de portada"
                className="inline-flex h-8 cursor-pointer list-none items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden sm:px-2.5"
              >
                <ImagePlus size={15} aria-hidden="true" />
                <span className="hidden sm:inline">Portada</span>
              </summary>
              <div className="absolute right-0 top-full mt-2 w-[min(24rem,calc(100vw-1.25rem))]">
                <CoverImageGenerator
                  imageDataUrl={activeLanding.imageDataUrl}
                  loading={imageLoading}
                  error={imageError}
                  onGenerate={() => void generateCoverImage()}
                />
              </div>
            </details>

            <Button type="button" variant="outline" size="sm" onClick={downloadLanding} aria-label="Descargar HTML" title="Descargar HTML">
              <Download aria-hidden="true" />
              <span className="hidden md:inline">HTML</span>
            </Button>

            <Link
              href={`/trazabilidad/${activeLanding.traceId}`}
              aria-label="Ver trazabilidad"
              title="Ver trazabilidad"
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-2.5"
            >
              <GitBranch size={15} aria-hidden="true" />
              <span className="hidden md:inline">Trazabilidad</span>
            </Link>

            {activeLanding.savedId ? (
              <Link
                href={`/library/${activeLanding.savedId}`}
                aria-label="Ver en Biblioteca"
                title="Guardada en Biblioteca"
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-2.5"
              >
                <BookOpen size={15} aria-hidden="true" />
                <span className="hidden md:inline">Biblioteca</span>
              </Link>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => void saveCurrentLanding()}
                disabled={saveLoading}
                aria-label={saveLoading ? "Guardando en Biblioteca" : "Guardar en Biblioteca"}
                title="Guardar en Biblioteca"
              >
                {saveLoading ? (
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                ) : (
                  <Save aria-hidden="true" />
                )}
                <span className="hidden sm:inline">{saveLoading ? "Guardando…" : "Guardar"}</span>
              </Button>
            )}
          </div>
        </header>

        {saveMessage ? (
          <p role="status" className="absolute left-1/2 top-16 z-30 max-w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-primary/20 bg-card px-4 py-2 text-center text-sm shadow-lg">
            {saveMessage}
          </p>
        ) : null}

        <iframe
          title={`Página completa: ${activeLanding.code.title}`}
          srcDoc={buildPreviewDocument(activeLanding.code)}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          className="min-h-0 w-full flex-1 border-0 bg-white"
        />
      </div>
    );
  }

  const selectedCount = selectedIds.length;

  return (
    <AppShell currentPage="create">
      <div className="mx-auto max-w-5xl space-y-7">
        <section className="flex flex-col justify-between gap-5 border-b border-border pb-6 sm:flex-row sm:items-end">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <Sparkles size={14} aria-hidden="true" />
              Estudio asistido por IA
            </p>
            <h1 className="mt-3 max-w-2xl font-display text-4xl leading-[1.08] tracking-[-0.04em] sm:text-5xl">
              Hagamos visible tu próxima idea.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Avanza de a una decisión: define el brief, elige cómo trabajar y revisa los prompts antes de construir.
            </p>
          </div>
          <p className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground sm:self-auto">
            <span className="font-semibold tabular-nums text-foreground">3</span>
            pasos hasta tu página
          </p>
        </section>

        <EveModelSelector value={modelChoice} onChange={setModelChoice} />

        <nav aria-label="Progreso de creación" className="rounded-2xl border border-border bg-card p-2 sm:p-3">
          <ol className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {([
              { number: 1, title: "Brief", subtitle: "Tu idea y público" },
              { number: 2, title: "Método", subtitle: "Técnicas de diseño" },
              { number: 3, title: "Prompts", subtitle: "Revisar y construir" },
            ] satisfies { number: CreationStep; title: string; subtitle: string }[]).map((item) => {
              const current = step === item.number;
              const complete = step > item.number;
              const unavailable = busy || (item.number === 3 && promptResults.length === 0 && step !== 3);

              return (
                <li key={item.number}>
                  <button
                    type="button"
                    aria-current={current ? "step" : undefined}
                    disabled={unavailable}
                    onClick={() => goToStep(item.number)}
                    className={`flex min-h-[58px] w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45 sm:gap-3 sm:px-3 ${
                      current ? "bg-primary text-primary-foreground" : complete ? "bg-accent/60 text-foreground hover:bg-accent" : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <span className={`grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold tabular-nums ${current ? "border-primary-foreground/30 bg-primary-foreground/10" : complete ? "border-primary/20 bg-primary text-primary-foreground" : "border-border bg-background"}`}>
                      {complete ? <Check size={15} aria-hidden="true" /> : `0${item.number}`}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{item.title}</span>
                      <span className={`hidden truncate text-[11px] sm:block ${current ? "text-primary-foreground/75" : "text-muted-foreground"}`}>
                        {item.subtitle}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {step === 1 ? (
          <section id="creation-step-panel" aria-labelledby="brief-heading" className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Etapa 01 · Contexto</p>
                <h2 id="brief-heading" className="mt-1 font-display text-2xl sm:text-3xl">Cuéntanos qué quieres lanzar</h2>
                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Un poco de contexto ayuda a que la página y sus mensajes sean específicos para tu oferta.
                </p>
              </div>
              <span className="text-xs text-muted-foreground">4 campos requeridos · acción principal opcional</span>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
              <BriefForm brief={brief} errors={fieldErrors} disabled={busy} onChange={changeBrief} />
            </div>

            {formError ? <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">{formError}</p> : null}

            <div className="flex justify-end">
              <Button type="button" onClick={() => goToStep(2)} disabled={busy}>
                Elegir métodos
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section id="creation-step-panel" aria-labelledby="technique-heading" className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Etapa 02 · Método</p>
                <h2 id="technique-heading" className="mt-1 font-display text-2xl sm:text-3xl">Elige cómo diseñar tu página</h2>
                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Selecciona una o varias técnicas. Abre «Qué hará en tu prompt» para ver cómo influye cada una.
                </p>
              </div>
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                {selectedCount} seleccionada{selectedCount === 1 ? "" : "s"}
              </span>
            </div>

            <TechniqueSelector selected={selectedIds} disabled={busy} onToggle={toggleTechnique} />
            <div className="grid gap-3 sm:grid-cols-2">
              <section className="flex flex-col rounded-2xl border border-border bg-card p-4 sm:p-5">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles size={16} aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-foreground">Probar técnicas por separado</h3>
                </div>
                <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">
                  Eve crea un DesignPlan y un prompt editable para cada técnica seleccionada, uno después de otro.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {selectedCount > 0 ? `${selectedCount} resultado${selectedCount === 1 ? "" : "s"} · ${modelChoice}` : "Selecciona al menos una técnica"}
                </p>
                <Button type="button" className="mt-4 w-full" onClick={() => void generateIndividualPrompts()} disabled={busy || selectedCount === 0}>
                  {batchGenerating ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
                  {batchGenerating ? "Preparando prompts…" : "Generar por separado"}
                </Button>
              </section>

              <section className="flex flex-col rounded-2xl border border-border bg-card p-4 sm:p-5">
                <div className="flex items-center gap-2 text-primary">
                  <GitBranch size={16} aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-foreground">Combinar técnicas</h3>
                </div>
                <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">
                  Un plan de Eve integra las técnicas, resuelve tensiones y genera un solo prompt para la landing.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {selectedCount >= 2 ? `${selectedCount} técnicas · ${modelChoice}` : "Selecciona al menos dos técnicas"}
                </p>
                <Button type="button" variant="outline" className="mt-4 w-full" onClick={() => void generateCombinedPrompt()} disabled={busy || selectedCount < 2}>
                  {batchGenerating ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <GitBranch aria-hidden="true" />}
                  {selectedCount < 2 ? "Selecciona 2 o más técnicas" : "Generar prompt combinado"}
                </Button>
              </section>
            </div>

            {formError ? <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">{formError}</p> : null}

            <div className="flex justify-start">
              <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={busy}>
                <ArrowLeft aria-hidden="true" />
                Volver al brief
              </Button>
            </div>
          </section>
        ) : null}

        {step === 3 ? (
          <section id="creation-step-panel" aria-labelledby="prompt-results-heading" className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Etapa 03 · Revisión</p>
                <h2 id="prompt-results-heading" className="mt-1 font-display text-2xl sm:text-3xl">Ajusta tus prompts antes de construir</h2>
                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Cada resultado tiene su propio registro. Edita el texto, compara alternativas y construye la versión que prefieras.
                </p>
              </div>
              <Button type="button" variant="ghost" onClick={() => goToStep(2)} disabled={busy}>
                <ArrowLeft aria-hidden="true" />
                Volver a métodos
              </Button>
            </div>

            {formError ? <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">{formError}</p> : null}

            {batchGenerating && promptResults.length === 0 ? (
              <div role="status" className="flex min-h-36 items-center gap-3 rounded-2xl border border-border bg-card px-5 py-6">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">Preparando tu primer prompt</span>
                  <span className="mt-1 block text-sm text-muted-foreground">Este paso puede tardar un momento; los resultados aparecerán aquí.</span>
                </span>
              </div>
            ) : null}

            <PromptResults
              results={promptResults}
              activeResultId={activeResultId}
              onPromptChange={(id, value) =>
                setPromptResults((current) =>
                  current.map((result) => (result.id === id ? { ...result, prompt: value } : result)),
                )
              }
              onRun={(id) => void buildLanding(id)}
              onRetry={retryPrompt}
            />
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
