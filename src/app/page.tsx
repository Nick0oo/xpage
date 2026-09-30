"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Check, Download, GitBranch, ImagePlus, LoaderCircle, Save, Sparkles } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { BriefForm } from "@/components/studio/brief-form";
import { PromptResults } from "@/components/studio/prompt-results";
import { TechniqueSelector } from "@/components/studio/technique-selector";
import { EveModelSelector } from "@/components/studio/eve-model-selector";
import { MethodContributionWorkspace } from "@/components/studio/method-contribution-workspace";
import { SectionEditorWorkspace } from "@/components/studio/section-editor-workspace";
import { Button } from "@/components/ui/button";
import { MediaWorkspace } from "@/components/media/media-workspace";
import { briefSchema, landingCodeSchema, type Brief, type PromptRequest } from "@/lib/schemas";
import { designPlanSchema, techniqueContributionSchema } from "@/lib/design-plan";
import { TECHNIQUE_IDS, type TechniqueId } from "@/lib/techniques";
import type { ActiveLanding, PromptResult, TechniqueRun } from "@/lib/studio-types";
import { getLanding, recordHtmlExport, saveLanding } from "@/lib/landing-storage";
import { buildPreviewDocument, makeDownloadName } from "@/lib/preview-document";
import { DEFAULT_MODEL_CHOICE, MODEL_CHOICES, type ModelChoice } from "@/lib/model-choice";
import { designSystems } from "@/lib/design-systems/catalog";
import { techniques } from "@/lib/techniques";

const emptyBrief: Brief = {
  topic: "",
  offer: "",
  audience: "",
  tone: "",
  cta: "",
  brand: "",
  palette: "",
  references: "",
  avoid: "",
  objective: "",
  variety: "equilibrada",
  movement: "moderado",
  density: "equilibrada",
};

function storedCreativeDirection(result: PromptResult) {
  if (result.creativeDirection) return result.creativeDirection;
  const plan = result.designPlan;
  if (!plan) return null;
  return {
    id: plan.creativeDirection?.id ?? "integrated-plan",
    title: plan.creativeDirection?.title ?? plan.concept,
    concept: plan.concept,
    firstScreen: plan.sections[0]?.headline ?? plan.concept,
    narrative: plan.sections.map((section) => `${section.role}: ${section.purpose}`).join(" → "),
    palette: plan.designDNA.palette.map((color) => `${color.role}: ${color.value}`).join(", "),
    typography: plan.designDNA.typography,
    motif: plan.designDNA.brandMotif,
    mediaUse: plan.mediaSlots.map((slot) => `${slot.id}: ${slot.purpose}`).join("; ") || "Sin medios definidos",
    rationale: plan.creativeDirection?.rationale ?? "Síntesis integrada de los métodos seleccionados.",
    structuralDifference: plan.creativeDirection?.structuralDifference ?? ["Plan integrado de métodos", "Sin dirección creativa independiente"],
    designPlan: plan,
  };
}

type CreationStep = 1 | 2 | 3;

type ApiResponse = {
  prompt?: unknown;
  image?: unknown;
  mediaType?: unknown;
  traceId?: unknown;
  error?: unknown;
  designPlan?: unknown;
  contribution?: unknown;
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

function HomeContent() {
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const [brief, setBrief] = useState<Brief>(emptyBrief);
  const [selectedIds, setSelectedIds] = useState<TechniqueId[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof Brief, string>>>({});
  const [formError, setFormError] = useState("");
  const [promptResults, setPromptResults] = useState<PromptResult[]>([]);
  const [methodRuns, setMethodRuns] = useState<TechniqueRun[]>([]);
  const [activeResultId, setActiveResultId] = useState<string | null>(null);
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [combiningMethods, setCombiningMethods] = useState(false);
  const [step, setStep] = useState<CreationStep>(1);
  const [view, setView] = useState<"create" | "preview">("create");
  const [activeLanding, setActiveLanding] = useState<ActiveLanding | null>(null);
  const [studioActive, setStudioActive] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [modelChoice, setModelChoice] = useState<ModelChoice>(DEFAULT_MODEL_CHOICE);
  const pendingPromptTraces = useRef(new Map<string, { prompt: string; promise: Promise<void> }>());
  const restoredLandingId = useRef<string | null>(null);
  const mediaMenuRef = useRef<HTMLDetailsElement>(null);
  const skipWorkflowWrite = useRef(true);

  const busy = batchGenerating || combiningMethods || activeResultId !== null;

  useEffect(() => {
    const raw = window.sessionStorage.getItem("xpage-method-workflow");
    let restoredWorkflowModel = false;
    if (raw) {
      try {
        const draft = JSON.parse(raw) as Record<string, unknown>;
        const parsedBrief = briefSchema.safeParse(draft.brief);
        if (draft.version === 1 && parsedBrief.success) {
          setBrief(parsedBrief.data);
          if (Array.isArray(draft.selectedIds)) setSelectedIds(draft.selectedIds.filter((id): id is TechniqueId => typeof id === "string" && ["seed-strings", "ambitious-prompts", "creator-critic", "image-assets", "video-assets", "subtractive-design", "negative-constraints", "human-copy"].includes(id)));
          if (typeof draft.modelChoice === "string" && MODEL_CHOICES.includes(draft.modelChoice as ModelChoice)) {
            setModelChoice(draft.modelChoice as ModelChoice);
            restoredWorkflowModel = true;
          }
          if (Array.isArray(draft.methodRuns)) {
            const restored = draft.methodRuns.flatMap((value) => {
              if (!value || typeof value !== "object") return [];
              const run = value as TechniqueRun;
              const contribution = run.contribution ? techniqueContributionSchema.safeParse(run.contribution) : null;
              if (typeof run.id !== "string" || typeof run.traceId !== "string" || !run.traceId || !TECHNIQUE_IDS.includes(run.techniqueId) || !MODEL_CHOICES.includes(run.modelChoice)) return [];
              if (run.contribution && !contribution?.success) return [];
              if (!["queued", "loading", "ready", "error"].includes(run.status)) return [];
              return [{ ...run, status: run.status === "loading" ? "error" as const : run.status, error: run.status === "loading" ? "La ejecución se interrumpió al recargar. Reintenta este método." : run.error, contribution: contribution?.success ? contribution.data : null }];
            });
            setMethodRuns(restored);
            if (restored.length) setStep(3);
          }
          if (Array.isArray(draft.promptResults)) {
            const restoredResults = draft.promptResults.flatMap((value) => {
              if (!value || typeof value !== "object") return [];
              const result = value as PromptResult;
              const plan = result.designPlan ? designPlanSchema.safeParse(result.designPlan) : null;
              if (typeof result.id !== "string" || typeof result.traceId !== "string" || typeof result.prompt !== "string" || !plan?.success || !MODEL_CHOICES.includes(result.modelChoice)) return [];
              return [{ ...result, designPlan: plan.data, status: "ready" as const }];
            });
            setPromptResults(restoredResults);
            if (restoredResults.length) setStep(3);
          }
        }
      } catch {
        window.sessionStorage.removeItem("xpage-method-workflow");
      }
    }
    if (!restoredWorkflowModel) {
      const savedModel = window.localStorage.getItem("xpage.model-choice");
      if (savedModel && MODEL_CHOICES.includes(savedModel as ModelChoice)) setModelChoice(savedModel as ModelChoice);
    }
    const preferredDesignSystem = window.localStorage.getItem("xpage.design-system-id");
    if (preferredDesignSystem && designSystems.some((recipe) => recipe.id === preferredDesignSystem)) {
      setBrief((current) => current.designSystemId ? current : { ...current, designSystemId: preferredDesignSystem });
    }
    skipWorkflowWrite.current = true;
  }, []);

  useEffect(() => {
    if (skipWorkflowWrite.current) {
      skipWorkflowWrite.current = false;
      return;
    }
    try {
      window.sessionStorage.setItem("xpage-method-workflow", JSON.stringify({
        version: 1, brief, selectedIds, methodRuns, promptResults, modelChoice,
      }));
    } catch {
      // The server trace remains the durable record if browser storage is full.
    }
  }, [brief, selectedIds, methodRuns, promptResults, modelChoice, step]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }, [step]);

  useEffect(() => {
    const params = new URLSearchParams(searchKey);
    const landingId = params.get("landingId");
    const draftId = params.get("draft");
    const resourceId = landingId ?? draftId;
    if (!resourceId || restoredLandingId.current === resourceId) return;
    let current = true;
    const load = landingId
      ? getLanding(landingId)
      : fetch(`/api/drafts/${encodeURIComponent(draftId!)}`, { cache: "no-store" }).then(async (response) => {
          const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
          if (!response.ok) throw new Error(typeof payload?.error === "string" ? payload.error : "No se pudo recuperar esta generación.");
          if (!payload || typeof payload.id !== "string" || typeof payload.html !== "string") throw new Error("La traza no contiene una salida HTML que se pueda abrir en Studio.");
          const parsedBrief = briefSchema.safeParse(payload.brief);
          const techniqueIds = Array.isArray(payload.techniqueIds)
            ? payload.techniqueIds.filter((id): id is TechniqueId => typeof id === "string" && TECHNIQUE_IDS.includes(id as TechniqueId))
            : [];
          const trace = payload.trace && typeof payload.trace === "object" ? payload.trace as Record<string, unknown> : {};
          const context = payload.context && typeof payload.context === "object" ? payload.context as Record<string, unknown> : {};
          const prompt = typeof payload.prompt === "string" ? payload.prompt : "";
          const code = landingCodeSchema.safeParse({ title: typeof payload.title === "string" ? payload.title : "Borrador sin guardar", html: payload.html, css: payload.css ?? "", js: payload.js ?? "" });
          if (!code.success) throw new Error("La salida HTML de la traza está incompleta o supera el límite del editor.");
          const plan = context.designPlan ? designPlanSchema.safeParse(context.designPlan) : null;
          return {
            id: payload.id, title: code.data.title, html: code.data.html, css: code.data.css, js: code.data.js,
            brief: parsedBrief.success ? parsedBrief.data : null, techniqueIds, prompt: prompt || null,
            modelChoice: typeof payload.modelChoice === "string" && MODEL_CHOICES.includes(payload.modelChoice as ModelChoice) ? payload.modelChoice as ModelChoice : null,
            trace: { category: typeof trace.category === "string" ? trace.category : "", status: typeof trace.status === "string" ? trace.status : "", rootTraceId: trace.rootTraceId, parentTraceId: trace.parentTraceId, sourceTraceId: trace.sourceTraceId },
            completeness: {
              hasBrief: parsedBrief.success, hasPrompt: Boolean(prompt), hasTechniques: techniqueIds.length > 0,
              hasModel: typeof payload.modelChoice === "string" && MODEL_CHOICES.includes(payload.modelChoice as ModelChoice),
            },
            originalModel: typeof payload.originalModel === "string" ? payload.originalModel : null,
            designPlan: plan?.success ? plan.data : null,
          };
        });
    void load.then((landing) => {
      if (!current) return;
      if (!landing) throw new Error("No encontramos esta landing en la Biblioteca local.");
      restoredLandingId.current = resourceId;
      if ("completeness" in landing) {
        const parsedBrief = briefSchema.safeParse(landing.brief);
        const missing = landing.completeness as { hasBrief: boolean; hasPrompt: boolean; hasTechniques: boolean; hasModel: boolean };
        setActiveLanding({
          code: { title: landing.title as string, html: landing.html as string, css: landing.css as string, js: landing.js as string },
          brief: parsedBrief.success ? parsedBrief.data : emptyBrief,
          techniqueIds: landing.techniqueIds as TechniqueId[], prompt: typeof landing.prompt === "string" ? landing.prompt : "",
          traceId: landing.id as string, savedId: null,
          modelChoice: (landing.modelChoice as ModelChoice | null) ?? modelChoice,
          designPlan: (landing.designPlan as ActiveLanding["designPlan"]) ?? null,
          creativeDirection: null, mediaAssets: [], draftIncomplete: missing,
          originalModel: typeof landing.originalModel === "string" ? landing.originalModel : null,
        });
        setSaveMessage("Borrador recuperado desde la traza. Sus cambios siguen sin guardar; elige Guardar cuando esté completo.");
        setStudioActive(true);
        setView("preview");
        return;
      }
      setActiveLanding({
        code: { title: landing.title, html: landing.html, css: landing.css, js: landing.js },
        brief: landing.brief,
        techniqueIds: landing.techniqueIds,
        prompt: landing.prompt,
        traceId: landing.traceId ?? "",
        savedId: landing.id,
        modelChoice: landing.modelChoice,
        designPlan: landing.creativeDirection?.designPlan ?? null,
        creativeDirection: landing.creativeDirection ?? null,
        mediaAssets: landing.mediaAssets ?? [],
      });
      setModelChoice(landing.modelChoice);
      setStudioActive(false);
      setSaveMessage("Landing guardada y lista. Activa Studio para editar secciones y medios.");
      setView("preview");
    }).catch((error: unknown) => {
      if (current) setFormError(error instanceof Error ? error.message : "No se pudo reabrir la landing.");
    });
    return () => { current = false; };
  }, [searchKey]);

  function changeBrief(field: keyof Brief, value: string) {
    const changed = brief[field] !== value;
    setBrief((current) => {
      if (field === "designSystemId" && !value) {
        const next = { ...current };
        delete next.designSystemId;
        return next;
      }
      return { ...current, [field]: value };
    });
    if (field === "designSystemId") {
      if (value && designSystems.some((recipe) => recipe.id === value)) window.localStorage.setItem("xpage.design-system-id", value);
      else window.localStorage.removeItem("xpage.design-system-id");
    }
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    if (changed && (promptResults.length > 0 || methodRuns.length > 0)) {
      setPromptResults([]);
      setMethodRuns([]);
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
    if (promptResults.length > 0 || methodRuns.length > 0) {
      setPromptResults([]);
      setMethodRuns([]);
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

    if (promptResults.length > 0 || methodRuns.length > 0) setStep(3);
  }

  async function createTrace(
    parsedBrief: Brief,
    techniqueIds: TechniqueId[],
    mode: "individual" | "combined" | "directions",
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
        creativeDirection: result.creativeDirection ? {
          id: result.creativeDirection.id,
          title: result.creativeDirection.title,
          rationale: result.creativeDirection.rationale,
        } : null,
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

  async function runMethod(techniqueId: TechniqueId, traceId: string, parsedBrief: Brief, choice: ModelChoice) {
    setMethodRuns((runs) => runs.map((run) => run.techniqueId === techniqueId ? { ...run, status: "loading", error: undefined } : run));
    try {
      const payload = await postJson<ApiResponse & { contribution?: unknown }>("/api/prompts", {
        mode: "technique", brief: parsedBrief, techniqueId, modelChoice: choice, traceId,
      });
      const parsed = techniqueContributionSchema.safeParse(payload.contribution);
      if (!parsed.success || parsed.data.techniqueId !== techniqueId) throw new Error("Eve respondió, pero el aporte de este método no cumple la estructura revisable.");
      setMethodRuns((runs) => runs.map((run) => run.techniqueId === techniqueId
        ? { ...run, status: "ready", contribution: parsed.data, error: undefined } : run));
    } catch (error) {
      setMethodRuns((runs) => runs.map((run) => run.techniqueId === techniqueId
        ? { ...run, status: "error", error: error instanceof Error ? error.message : "No se pudo completar este método." } : run));
    }
  }

  async function runSelectedMethods() {
    const parsedBrief = validatedBrief();
    if (!parsedBrief) return;
    if (selectedIds.length === 0) {
      setFormError("Selecciona al menos un método para iniciar el trabajo.");
      return;
    }
    setBatchGenerating(true);
    setFormError("");
    const techniqueIds = [...selectedIds];
    try {
      setPromptResults([]);
      setMethodRuns([]);
      const traceId = await createTrace(parsedBrief, techniqueIds, techniqueIds.length > 1 ? "combined" : "individual");
      setMethodRuns(techniqueIds.map((techniqueId) => ({
        id: crypto.randomUUID(), techniqueId, traceId, modelChoice, status: "queued" as const, contribution: null,
      })));
      setStep(3);
      for (const techniqueId of techniqueIds) {
        await runMethod(techniqueId, traceId, parsedBrief, modelChoice);
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudieron iniciar los métodos.");
    } finally {
      setBatchGenerating(false);
    }
  }

  function updateMethodContribution(techniqueId: TechniqueId, field: "decision" | "artifact", value: string) {
    setMethodRuns((runs) => runs.map((run) => run.techniqueId === techniqueId && run.contribution
      ? { ...run, contribution: { ...run.contribution, [field]: value } } : run));
    setPromptResults([]);
  }

  async function commitMethodContribution(run: TechniqueRun) {
    if (!run.contribution) return;
    await postJson(`/api/traces/${run.traceId}/events`, {
      type: "method-contribution-edit", techniqueId: run.techniqueId,
      decision: run.contribution.decision, artifact: run.contribution.artifact,
    });
  }

  async function combineMethods() {
    const parsedBrief = validatedBrief();
    if (!parsedBrief || methodRuns.length === 0 || methodRuns.some((run) => run.status !== "ready" || !run.contribution)) return;
    const traceId = methodRuns[0].traceId;
    const techniqueIds = methodRuns.map((run) => run.techniqueId);
    setCombiningMethods(true);
    setFormError("");
    try {
      const payload = await postJson<ApiResponse & { designPlan?: unknown }>("/api/prompts", {
        mode: "combine", brief: parsedBrief, techniqueIds,
        methodContributions: methodRuns.map((run) => run.contribution!), modelChoice, traceId,
      });
      const parsed = designPlanSchema.safeParse(payload.designPlan);
      if (!parsed.success) throw new Error("Eve no devolvió un plan combinado revisable. Puedes combinar de nuevo sin perder los aportes.");
      setPromptResults([{
        id: crypto.randomUUID(), brief: parsedBrief, techniqueIds, combined: true, traceId,
        prompt: parsed.data.prompt, designPlan: parsed.data,
        methodContributions: methodRuns.map((run) => run.contribution!),
        generationMode: "eve-design-plan", status: "ready", modelChoice,
      }]);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudieron combinar los aportes. Puedes reintentar esta etapa.");
    } finally {
      setCombiningMethods(false);
    }
  }

  function changeModelChoice(value: ModelChoice) {
    if (value === modelChoice) return;
    setModelChoice(value);
    if (methodRuns.length > 0 || promptResults.length > 0) {
      setMethodRuns([]);
      setPromptResults([]);
      setStep(2);
      setFormError("Cambiaste el modelo. Ejecuta de nuevo los métodos para mantener una traza coherente.");
    }
  }

  async function recordPromptEdit(resultId: string, prompt: string) {
    const result = promptResults.find(({ id }) => id === resultId);
    if (!result || prompt === result.designPlan?.prompt || prompt === result.lastTracedPrompt) return;
    const pending = pendingPromptTraces.current.get(resultId);
    if (pending?.prompt === prompt) return pending.promise;
    const body = result.creativeDirection
      ? { type: "prompt-edit", directionId: result.creativeDirection.id, prompt }
      : { type: "final-prompt-edit", techniqueIds: result.techniqueIds, prompt };
    const promise = postJson(`/api/traces/${result.traceId}/events`, body).then(() => {
      setPromptResults((current) => current.map((item) => item.id === resultId ? { ...item, lastTracedPrompt: prompt } : item));
    }).catch((error: unknown) => {
      setFormError(error instanceof Error ? error.message : "No se pudo guardar la edición en la traza.");
      throw error;
    }).finally(() => {
      if (pendingPromptTraces.current.get(resultId)?.promise === promise) pendingPromptTraces.current.delete(resultId);
    });
    pendingPromptTraces.current.set(resultId, { prompt, promise });
    return promise;
  }

  function retryPrompt(resultId: string) {
    const result = promptResults.find((item) => item.id === resultId);
    if (!result) return;

    const request: PromptRequest = result.combined
      ? { mode: "combine", brief: result.brief, techniqueIds: result.techniqueIds, methodContributions: result.methodContributions ?? [], modelChoice: result.modelChoice }
      : { mode: "technique", brief: result.brief, techniqueId: result.techniqueIds[0], modelChoice: result.modelChoice };
    void generatePrompt(resultId, result.traceId, request);
  }

  async function buildLanding(resultId: string) {
    const result = promptResults.find((item) => item.id === resultId);
    if (!result || result.status !== "ready" || !result.prompt.trim()) return;

    setActiveResultId(resultId);
    setFormError("");
    try {
      await recordPromptEdit(resultId, result.prompt);
      const traceId = await createLandingTrace(result);
      const payload = await postJson<unknown>("/api/landings", {
        prompt: result.prompt,
        plannedSectionIds: result.designPlan?.sections.map((section) => section.id) ?? [],
        explicitContentRequirements: result.designPlan?.explicitContentRequirements ?? [],
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
        savedId: null,
        modelChoice: result.modelChoice,
        designPlan: result.designPlan ?? result.creativeDirection?.designPlan ?? null,
        creativeDirection: storedCreativeDirection(result),
        mediaAssets: [],
      });
      setSaveMessage("Vista previa lista. Puedes volver a tus prompts o abrir Studio cuando quieras.");
      setSaveError("");
      setStudioActive(false);
      setView("preview");
      setFormError("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No se pudo construir la landing.");
    } finally {
      setActiveResultId(null);
    }
  }

  async function downloadLanding() {
    if (!activeLanding) return;
    setDownloadError("");
    if (activeLanding.mediaAssets.length > 0) {
      if (!activeLanding.savedId) {
        setDownloadError("Guarda primero esta landing para empaquetar sus medios locales.");
        return;
      }
      try {
        const response = await fetch(`/api/media/export?id=${encodeURIComponent(activeLanding.savedId)}`);
        if (!response.ok) {
          const payload = await response.json().catch(() => null) as { error?: unknown } | null;
          throw new Error(typeof payload?.error === "string" ? payload.error : "No se pudo crear el paquete de medios.");
        }
        const url = URL.createObjectURL(await response.blob());
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = makeDownloadName(activeLanding.code.title).replace(/\.html$/, "-medios.zip");
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (error) {
        setDownloadError(error instanceof Error ? error.message : "No se pudo crear el paquete de medios.");
      }
      return;
    }
    await recordHtmlExport(activeLanding.traceId, activeLanding.savedId, makeDownloadName(activeLanding.code.title));
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
    if (activeLanding.draftIncomplete && (!activeLanding.draftIncomplete.hasBrief || !activeLanding.draftIncomplete.hasPrompt || !activeLanding.draftIncomplete.hasTechniques || !activeLanding.draftIncomplete.hasModel)) {
      setSaveError("Este borrador no tiene todos los datos para Biblioteca. Completa un brief válido, al menos un método, el prompt y confirma el modelo antes de guardarlo.");
      return;
    }
    const id = crypto.randomUUID();
    setSaveLoading(true);
    setSaveMessage("");
    setSaveError("");
    try {
      await saveLanding({
        id,
        title: activeLanding.code.title,
        brief: activeLanding.brief,
        techniqueIds: activeLanding.techniqueIds,
        prompt: activeLanding.prompt,
        creativeDirection: activeLanding.creativeDirection ?? null,
        modelChoice: activeLanding.modelChoice,
        html: activeLanding.code.html,
        css: activeLanding.code.css,
        js: activeLanding.code.js,
        traceId: activeLanding.traceId,
        createdAt: new Date().toISOString(),
      });
      setActiveLanding((current) => (current ? { ...current, savedId: id } : current));
      setSaveMessage("Guardada en Biblioteca. Activa Studio para editar secciones.");
      setSaveError("");
    } catch (error) {
      setSaveMessage("");
      setSaveError(
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
            <Button type="button" variant="outline" size="sm" onClick={() => { if (!studioActive) setSaveMessage(""); setStudioActive(!studioActive); }} aria-label={studioActive ? "Volver a ver la landing" : "Activar Studio para editar secciones"}>
              <span className="hidden sm:inline">{studioActive ? "Ver landing" : "Activar Studio · Editar"}</span>
              <span className="sm:hidden">{studioActive ? "Vista" : "Editar"}</span>
            </Button>
            <details ref={mediaMenuRef} className="relative">
              <summary
                aria-label="Opciones de portada"
                title="Opciones de portada"
                className="inline-flex h-8 cursor-pointer list-none items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden sm:px-2.5"
              >
                <ImagePlus size={15} aria-hidden="true" />
                <span className="hidden sm:inline">Medios</span>
              </summary>
              <div className="absolute right-0 top-full mt-2 w-[min(24rem,calc(100vw-1.25rem))]">
                <MediaWorkspace
                  brief={activeLanding.brief}
                  modelChoice={activeLanding.modelChoice}
                  modelChoiceConfirmed={!activeLanding.draftIncomplete || activeLanding.draftIncomplete.hasModel}
                  traceId={activeLanding.traceId}
                  savedLandingId={activeLanding.savedId}
                  designPlan={activeLanding.designPlan}
                  assets={activeLanding.mediaAssets}
                  onAssetAdded={(asset, html) => setActiveLanding((current) => current ? {
                    ...current,
                    code: { ...current.code, html },
                    mediaAssets: [...current.mediaAssets.filter((item) => item.slotId !== asset.slotId || item.sectionId !== asset.sectionId), asset],
                  } : current)}
                />
              </div>
            </details>

            <Button type="button" variant="outline" size="sm" onClick={downloadLanding} aria-label={activeLanding.mediaAssets.length ? "Descargar paquete ZIP" : "Descargar HTML"} title={activeLanding.mediaAssets.length ? "Descargar paquete ZIP" : "Descargar HTML"}>
              <Download aria-hidden="true" />
              <span className="hidden md:inline">{activeLanding.mediaAssets.length ? "Paquete ZIP" : "HTML"}</span>
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
          {downloadError ? <p role="alert" className="px-3 pb-2 text-xs text-destructive">{downloadError}</p> : null}
        </header>

        {saveMessage && !studioActive ? (
          <p role="status" className="absolute left-1/2 top-16 z-30 max-w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-primary/20 bg-card px-4 py-2 text-center text-sm shadow-lg">
            {saveMessage}
          </p>
        ) : null}
        {saveError ? <p role="alert" className="shrink-0 border-b border-destructive/20 bg-destructive/5 px-4 py-2 text-center text-xs text-destructive">{saveError}</p> : null}

        {activeLanding.draftIncomplete && (!activeLanding.draftIncomplete.hasBrief || !activeLanding.draftIncomplete.hasPrompt || !activeLanding.draftIncomplete.hasTechniques || !activeLanding.draftIncomplete.hasModel) ? <details className="shrink-0 border-b border-amber-500/30 bg-amber-500/5 px-4 py-2">
          <summary className="cursor-pointer text-xs font-semibold">Completar datos del borrador para guardarlo en Biblioteca</summary>
          <div className="mx-auto grid max-h-[40dvh] max-w-5xl gap-4 overflow-y-auto py-3 lg:grid-cols-2">
            <div className="grid gap-2 sm:grid-cols-2">
              {!activeLanding.draftIncomplete.hasModel ? <label className="text-[11px] font-medium text-muted-foreground sm:col-span-2">Confirma un modelo para guardar y continuar<select value="" onChange={(event) => { if (!event.target.value) return; const selected = event.target.value as ModelChoice; setActiveLanding((current) => current ? { ...current, modelChoice: selected, draftIncomplete: { ...current.draftIncomplete!, hasModel: true } } : current); }} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-xs"><option value="">Selecciona un modelo</option>{MODEL_CHOICES.map((choice) => <option key={choice} value={choice}>{choice}</option>)}</select>{activeLanding.originalModel ? <span className="mt-1 block text-[10px] font-normal">La traza conserva el identificador original “{activeLanding.originalModel}”. La selección anterior no se pudo normalizar.</span> : null}</label> : null}
              {(["topic", "offer", "audience", "tone"] as const).map((field) => <label key={field} className="text-[11px] font-medium text-muted-foreground">{{ topic: "Tema", offer: "Oferta", audience: "Público", tone: "Tono" }[field]}<input value={activeLanding.brief[field]} onChange={(event) => setActiveLanding((current) => {
                if (!current) return current;
                const nextBrief = { ...current.brief, [field]: event.target.value };
                const parsed = briefSchema.safeParse(nextBrief);
                return { ...current, brief: nextBrief, draftIncomplete: { ...current.draftIncomplete!, hasBrief: parsed.success } };
              })} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 text-xs" /></label>)}
              <label className="text-[11px] font-medium text-muted-foreground sm:col-span-2">Prompt<textarea value={activeLanding.prompt} onChange={(event) => { setActiveLanding((current) => current ? { ...current, prompt: event.target.value, draftIncomplete: { ...current.draftIncomplete!, hasPrompt: Boolean(event.target.value.trim()) } } : current); }} maxLength={12_000} rows={3} className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs" /></label>
            </div>
            <fieldset className="space-y-1"><legend className="text-[11px] font-medium text-muted-foreground">Métodos que describen esta página (elige al menos uno)</legend><div className="grid gap-1 sm:grid-cols-2">{techniques.map((technique) => <label key={technique.id} className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-[11px]"><input type="checkbox" checked={activeLanding.techniqueIds.includes(technique.id)} onChange={(event) => { setActiveLanding((current) => {
                  if (!current) return current;
                  const nextIds = event.target.checked ? [...current.techniqueIds, technique.id] : current.techniqueIds.filter((id) => id !== technique.id);
                  return { ...current, techniqueIds: nextIds, draftIncomplete: { ...current.draftIncomplete!, hasTechniques: nextIds.length > 0 } };
                }); }} />{technique.name}</label>)}</div></fieldset>
          </div>
          <p className="mx-auto max-w-5xl text-[10px] text-muted-foreground">Estado: brief {activeLanding.draftIncomplete.hasBrief ? "completo" : "pendiente"} · métodos {activeLanding.draftIncomplete.hasTechniques ? "listos" : "pendientes"} · prompt {activeLanding.draftIncomplete.hasPrompt ? "listo" : "pendiente"} · modelo {activeLanding.draftIncomplete.hasModel ? "confirmado" : "pendiente"}. Guardar sigue siendo una acción explícita.</p>
        </details> : null}

        {studioActive ? (
          <SectionEditorWorkspace
            landingId={activeLanding.savedId}
            traceId={activeLanding.traceId}
            code={activeLanding.code}
            brief={activeLanding.brief}
            modelChoice={activeLanding.modelChoice}
            modelChoiceConfirmed={!activeLanding.draftIncomplete || activeLanding.draftIncomplete.hasModel}
            onApplied={(code) => setActiveLanding((current) => current ? { ...current, code } : current)}
            onOpenMedia={() => { if (mediaMenuRef.current) mediaMenuRef.current.open = true; }}
          />
        ) : (
          <iframe title={`Vista previa: ${activeLanding.code.title}`} srcDoc={buildPreviewDocument(activeLanding.code)} sandbox="allow-scripts" referrerPolicy="no-referrer" className="min-h-0 w-full flex-1 border-0 bg-white" />
        )}
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
          <div className="flex shrink-0 flex-wrap items-center gap-2 self-start sm:self-auto">
            {activeLanding ? <>
              <Button type="button" variant="outline" size="sm" onClick={() => { setStudioActive(false); setView("preview"); }}>Ver landing</Button>
              <Button type="button" size="sm" onClick={() => { setStudioActive(true); setView("preview"); }}>Abrir Studio</Button>
            </> : null}
            <p className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
              <span className="font-semibold tabular-nums text-foreground">3</span>
              pasos hasta tu página
            </p>
          </div>
        </section>

        <EveModelSelector value={modelChoice} onChange={changeModelChoice} />

        <nav aria-label="Progreso de creación" className="rounded-2xl border border-border bg-card p-2 sm:p-3">
          <ol className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {([
              { number: 1, title: "Brief", subtitle: "Tu idea y público" },
              { number: 2, title: "Método", subtitle: "Técnicas de diseño" },
              { number: 3, title: "Prompts", subtitle: "Revisar y construir" },
            ] satisfies { number: CreationStep; title: string; subtitle: string }[]).map((item) => {
              const current = step === item.number;
              const complete = step > item.number;
              const unavailable = busy || (item.number === 3 && promptResults.length === 0 && methodRuns.length === 0 && step !== 3);

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
                  Selecciona una o varias técnicas. Abre cada método para ver su propósito, entradas y aporte.
                </p>
              </div>
              <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground">
                {selectedCount} seleccionada{selectedCount === 1 ? "" : "s"}
              </span>
            </div>

            <TechniqueSelector selected={selectedIds} disabled={busy} onToggle={toggleTechnique} />
            <section className="grid gap-4 rounded-2xl border border-primary/20 bg-primary/[0.025] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Ejecuciones independientes</p>
                <h3 className="mt-1 font-display text-xl">Un aporte revisable por técnica</h3>
                <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">Eve trabaja cada método por separado. Inspecciona y ajusta sus decisiones antes de pedir una combinación que use todos los aportes seleccionados.</p>
                <p className="mt-2 text-xs text-muted-foreground">{selectedCount > 0 ? `${selectedCount} método${selectedCount === 1 ? "" : "s"} · ${modelChoice}` : "Selecciona al menos un método"}</p>
              </div>
              <Button type="button" onClick={() => void runSelectedMethods()} disabled={busy || selectedCount === 0} className="w-full sm:w-auto">
                {batchGenerating ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
                {batchGenerating ? "Iniciando métodos…" : "Ejecutar métodos"}
              </Button>
            </section>

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
                <h2 id="prompt-results-heading" className="mt-1 font-display text-2xl sm:text-3xl">Aportes primero; prompt final después</h2>
                <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Inspecciona, edita o reintenta cada método. Cuando estén listos, combínalos y aprueba el prompt que se enviará a construir la landing.
                </p>
              </div>
              <Button type="button" variant="ghost" onClick={() => goToStep(2)} disabled={busy}>
                <ArrowLeft aria-hidden="true" />
                Volver a métodos
              </Button>
            </div>

            {formError ? <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">{formError}</p> : null}

            {batchGenerating && methodRuns.length === 0 ? (
              <div role="status" className="flex min-h-28 items-center gap-3 rounded-2xl border border-border bg-card px-5 py-6">
                <LoaderCircle className="animate-spin text-primary" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">Preparando la traza común para las ejecuciones seleccionadas…</span>
              </div>
            ) : null}

            {methodRuns.length > 0 ? (
              <MethodContributionWorkspace
                runs={methodRuns}
                combining={combiningMethods}
                disabled={busy}
                editDisabled={combiningMethods}
                onEdit={updateMethodContribution}
                onCommit={(run) => void commitMethodContribution(run).catch((error: unknown) => setFormError(error instanceof Error ? error.message : "No se pudo guardar el cambio en la traza."))}
                onRetry={(run) => void runMethod(run.techniqueId, run.traceId, brief, run.modelChoice)}
                onCombine={() => void combineMethods()}
              />
            ) : null}

            {combiningMethods ? <p role="status" className="rounded-xl border border-primary/20 bg-primary/[0.03] px-4 py-3 text-sm text-muted-foreground">Eve está integrando los aportes revisados en un plan y prompt final…</p> : null}

            {promptResults.length > 0 ? <div className="rounded-2xl border border-primary/20 bg-primary/[0.025] p-4 sm:p-5"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Resultado de la combinación</p><p className="mt-1 text-sm text-muted-foreground">Edita y confirma el prompt final. Solo este texto aprobado se usará para construir HTML.</p></div> : null}
            {promptResults.length > 0 ? <PromptResults
              results={promptResults}
              activeResultId={activeResultId}
              onPromptChange={(id, value) =>
                setPromptResults((current) =>
                  current.map((result) => (result.id === id ? { ...result, prompt: value } : result)),
                )
              }
              onPromptCommit={(id, value) => void recordPromptEdit(id, value).catch(() => undefined)}
              onRun={(id) => void buildLanding(id)}
              onRetry={retryPrompt}
            /> : null}
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

export default function Home() {
  return <Suspense fallback={<main className="grid min-h-dvh place-items-center text-sm text-muted-foreground">Abriendo el Studio…</main>}><HomeContent /></Suspense>;
}
