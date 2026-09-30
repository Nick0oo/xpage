import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BookOpen, CircleCheck, CircleDot, Clock3, ExternalLink, GitBranch, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { DownloadHtmlButton } from "@/components/preview/download-html-button";
import { compositionRecipes } from "@/lib/design-templates/compositions";
import { getGenerationTrace } from "@/lib/generation-traces";
import { techniques } from "@/lib/techniques";

export const dynamic = "force-dynamic";

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function techniqueList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((id) => {
    if (typeof id !== "string") return [];
    const technique = techniques.find((item) => item.id === id);
    return technique ? [technique] : [];
  });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "full", timeStyle: "short" }).format(new Date(value));
}

function formatDuration(value: number | null) {
  if (value === null) return null;
  return value >= 1_000 ? `${(value / 1_000).toFixed(1)} s` : `${value} ms`;
}

function providerLabel(value: string | null) {
  switch (value) {
    case "gemini": return "Gemini";
    case "openrouter": return "OpenRouter · Qwen";
    case "openrouter-fallback": return "OpenRouter · GLM";
    case "openrouter-recraft": return "OpenRouter · Recraft";
    case "openrouter-muse": return "OpenRouter · Muse Image";
    default: return value;
  }
}

function landingOutput(value: Record<string, unknown> | null) {
  if (!value) return null;
  if (
    typeof value.title !== "string" ||
    typeof value.html !== "string" ||
    typeof value.css !== "string" ||
    typeof value.js !== "string"
  ) return null;
  return { title: value.title, html: value.html, css: value.css, js: value.js };
}

const TRACE_STAGES = [
  { id: "origen", title: "Brief y dirección", description: "Lo que llegó del brief y las alternativas creativas." },
  { id: "metodos", title: "Métodos", description: "El trabajo de cada skill y el aporte que dejó." },
  { id: "combinacion", title: "Combinación", description: "Cómo Eve integró los aportes en una dirección común." },
  { id: "construccion", title: "Construcción", description: "La generación de la landing y sus intentos." },
  { id: "iteracion", title: "Revisión y cambios", description: "Propuestas, decisiones, aplicación y reversión de cambios." },
  { id: "medios", title: "Medios", description: "Búsqueda, generación, selección y exportación de activos." },
  { id: "entrega", title: "Entrega", description: "Archivos y resultados vinculados a esta ejecución." },
] as const;

function stageFor(phase: string, eventType: string) {
  const value = phase.toLocaleLowerCase();
  if (/design-review|landing-quality-review/.test(value)) return "iteracion";
  if (/export|landing-save|library/.test(value) || eventType === "export") return "entrega";
  if (/media|image-generation|asset/.test(value) || eventType === "asset") return "medios";
  if (/section-edit|revision|undo|reject|apply|review|critic/.test(value) || eventType === "revision") return "iteracion";
  if (/landing-generation|build|html-generation/.test(value)) return "construccion";
  if (/combined|combine|design-plan/.test(value)) return "combinacion";
  if (/technique|method|skill/.test(value)) return "metodos";
  return "origen";
}

function readablePhase(phase: string) {
  const known: Record<string, string> = {
    "creative-direction-options": "Alternativas creativas",
    "creative-direction-selected": "Dirección elegida",
    "creative-prompt-edited": "Revisión del prompt creativo",
    "technique-contribution": "Aporte de método",
    "technique-contribution-edited": "Aporte editado",
    "combined-design-plan": "Integración de métodos",
    "combined-prompt-edited": "Prompt combinado editado",
    "landing-generation": "Construcción de landing",
    "section-edit-proposal": "Propuesta de cambio",
    "section-edit-apply": "Cambio aplicado",
    "section-edit-reject": "Propuesta descartada",
    "section-edit-undo": "Cambio revertido",
    "media-search": "Búsqueda de medio",
    "media-selection": "Medio seleccionado",
    "image-generation": "Generación de imagen",
    "media-export": "Medio exportado",
    "html-export": "HTML exportado",
    "prompt-context": "Prompt de origen",
    "design-review": "Revisión visual del diseño",
    "landing-quality-review": "Juicio visual de la landing",
  };
  return known[phase] ?? phase.replaceAll("-", " ");
}

function qualityJudgment(phase: string, decisionSummary: string | null, output: Record<string, unknown> | null, outputText: string | null) {
  if (!/design-review|landing-quality-review/i.test(phase)) return null;
  const nestedReviews = [output?.visualReview, output?.qualityReview, output?.designReview, output?.review, output?.judgment, output?.judgement]
    .map(asRecord)
    .filter((value): value is Record<string, unknown> => value !== null);
  const records = [output, ...nestedReviews].filter((value): value is Record<string, unknown> => value !== null);
  const summaryKeys = ["visualReviewSummary", "qualityReviewSummary", "designReviewSummary", "visualSummary", "qualitySummary", "judgmentSummary", "judgementSummary", "summary", "overallAssessment", "assessment", "verdict", "recommendation", "conclusion", "judgment", "judgement"];
  const summary = decisionSummary?.trim() || records.flatMap((record) => summaryKeys.map((key) => record[key]).filter((value): value is string => typeof value === "string" && value.trim().length > 0))[0] || outputText?.trim().slice(0, 1200) || "";
  const findingsKeys = ["findings", "issues", "observations", "improvements", "checks"];
  const findings = records.flatMap((record) => findingsKeys.flatMap((key) => Array.isArray(record[key]) ? record[key].filter((value): value is string => typeof value === "string" && value.trim().length > 0) : []));
  return summary || findings.length ? { summary, findings: [...new Set(findings)].slice(0, 8) } : null;
}

export default async function TraceDetailPage({ params }: PageProps<"/trazabilidad/[id]">) {
  const { id } = await params;
  const trace = await getGenerationTrace(id);
  const hasLandingGeneration = trace?.steps.some((step) => step.phase === "landing-generation") ?? false;
  const stages = trace ? TRACE_STAGES.map((stage) => ({
    ...stage,
    steps: trace.steps.filter((step) => stageFor(step.phase, step.eventType) === stage.id),
  })).filter((stage) => stage.steps.length > 0) : [];
  const combinedPlanStep = trace?.steps.slice().reverse().find((step) => step.phase === "combined-design-plan");
  const combinedPlan = combinedPlanStep?.output;
  const combinedRecord = asRecord(combinedPlan);
  const designSystem = asRecord(combinedRecord?.designSystem);
  const compositionRecipeIds = Array.isArray(designSystem?.compositionRecipeIds)
    ? designSystem.compositionRecipeIds.filter((value): value is string => typeof value === "string")
    : [];
  const designDNA = asRecord(combinedRecord?.designDNA);
  const creativeSettings = asRecord(combinedRecord?.creativeSettings);
  const planSections = Array.isArray(combinedRecord?.sections) ? combinedRecord.sections.flatMap((item) => asRecord(item) ? [asRecord(item)!] : []) : [];
  const contentRequirements = Array.isArray(combinedRecord?.explicitContentRequirements) ? combinedRecord.explicitContentRequirements.flatMap((item) => asRecord(item) ? [asRecord(item)!] : []) : [];
  const creatorCritic = asRecord(combinedRecord?.creatorCritic);
  const selectedDirection = trace?.steps.slice().reverse().find((step) => step.phase === "creative-direction-selected");
  const selectedDirectionData = asRecord(selectedDirection?.output);
  const contributions = Array.isArray(combinedRecord?.contributions)
    ? combinedRecord.contributions.flatMap((item) => asRecord(item) ? [asRecord(item)!] : [])
    : (trace?.steps ?? []).filter((step) => step.phase === "technique-contribution").flatMap((step) => {
      const contribution = asRecord(step.output);
      return contribution ? [contribution] : [];
    });
  const latestStepDate = trace?.steps.at(-1)?.createdAt ?? trace?.updatedAt;
  const totalDuration = trace?.steps.reduce((sum, step) => sum + (step.durationMs ?? 0), 0) ?? 0;
  const failureCount = trace?.steps.filter((step) => step.status === "failed").length ?? 0;

  return (
    <AppShell currentPage="traces">
      {!trace ? (
        <section className="mx-auto max-w-xl rounded-2xl border border-border bg-card px-6 py-10 text-center">
          <h1 className="font-display text-3xl">No encontramos este proceso</h1>
          <p className="mt-2 text-sm text-muted-foreground">La trazabilidad pudo haberse eliminado o el enlace no es válido.</p>
          <Link href="/trazabilidad" className={buttonVariants({ className: "mt-5" })}>
            <ArrowLeft size={14} aria-hidden="true" /> Volver a trazabilidad
          </Link>
        </section>
      ) : (
        <div className="mx-auto max-w-6xl space-y-7">
          <header className="border-b border-border pb-5">
            <Link href="/trazabilidad" className={buttonVariants({ variant: "ghost", className: "-ml-2 mb-3" })}>
              <ArrowLeft size={14} aria-hidden="true" /> Trazabilidad
            </Link>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em]">
              <p className="inline-flex items-center gap-2 text-primary">
                <GitBranch size={14} aria-hidden="true" /> {trace.category} · {trace.status === "completed" ? "completado" : trace.status === "failed" ? "falló" : trace.status === "prompt-ready" ? "prompt listo" : "en curso"}
              </p>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 normal-case tracking-normal ${trace.landings.length ? "border-primary/20 bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}>
                {trace.landings.length ? <BookOpen size={13} aria-hidden="true" /> : <GitBranch size={13} aria-hidden="true" />}
                {trace.landings.length ? "En Biblioteca" : hasLandingGeneration ? "Solo trazabilidad" : "Origen de prompts"}
              </span>
            </div>
            <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">{trace.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Iniciado {formatDate(trace.createdAt)}</p>
            <p className="mt-1 break-words text-xs text-muted-foreground">
              Ejecución {trace.executionId} · raíz <Link className="underline underline-offset-2" href={`/trazabilidad/${trace.rootTraceId ?? trace.id}`}>{trace.rootTraceId ?? trace.id}</Link>
              {trace.parentTraceId ? <> · continuación de <Link className="underline underline-offset-2" href={`/trazabilidad/${trace.parentTraceId}`}>{trace.parentTraceId}</Link></> : null}
              {trace.sourceTraceId && trace.sourceTraceId !== trace.parentTraceId ? <> · insumos desde <Link className="underline underline-offset-2" href={`/trazabilidad/${trace.sourceTraceId}`}>{trace.sourceTraceId}</Link></> : null}
            </p>
            {trace.landings.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {trace.landings.map((landing) => (
                  <Link key={landing.id} href={`/library/${landing.id}`} className={buttonVariants({ variant: "outline" })}>
                    <ExternalLink size={14} aria-hidden="true" /> Abrir {landing.title}
                  </Link>
                ))}
              </div>
            ) : null}
          </header>

          <section aria-label="Resumen de esta ejecución" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="flex items-center gap-2 text-xs text-muted-foreground"><CircleCheck size={14} aria-hidden="true" /> Eventos registrados</p>
              <p className="mt-2 font-display text-2xl">{trace.steps.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">En {stages.length} fases del proceso</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="flex items-center gap-2 text-xs text-muted-foreground"><Sparkles size={14} aria-hidden="true" /> Métodos registrados</p>
              <p className="mt-2 font-display text-2xl">{contributions.length || techniqueList(asRecord(trace.context)?.techniqueIds).length}</p>
              <p className="mt-1 text-xs text-muted-foreground">{contributions.length ? "Con aporte visible en la combinación" : "Según la selección inicial"}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 size={14} aria-hidden="true" /> Tiempo de modelo medido</p>
              <p className="mt-2 font-display text-2xl">{totalDuration ? formatDuration(totalDuration) : "—"}</p>
              <p className="mt-1 text-xs text-muted-foreground">Suma de eventos con duración reportada</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="flex items-center gap-2 text-xs text-muted-foreground"><CircleDot size={14} aria-hidden="true" /> Estado de la ejecución</p>
              <p className={`mt-2 font-display text-2xl ${failureCount ? "text-destructive" : ""}`}>{failureCount ? `${failureCount} ${failureCount === 1 ? "fallo" : "fallos"}` : trace.status === "completed" ? "Completada" : trace.status === "prompt-ready" ? "Prompt listo" : "En curso"}</p>
              <p className="mt-1 text-xs text-muted-foreground">Último evento {latestStepDate ? formatDate(latestStepDate) : "sin actividad"}</p>
            </div>
          </section>

          {stages.length ? (
            <nav aria-label="Fases de esta trazabilidad" className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Ir a una fase</p>
              <ol className="mt-3 flex flex-wrap gap-2">
                {stages.map((stage, index) => (
                  <li key={stage.id}>
                    <a href={`#fase-${stage.id}`} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border px-3 text-xs transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary">
                      <span className="text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>{stage.title}<span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">{stage.steps.length}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          {(() => {
            const context = asRecord(trace.context);
            const brief = asRecord(context?.brief);
            const selected = techniqueList(context?.techniqueIds);
            return (
              <section className="space-y-5 rounded-2xl border border-border bg-card p-5 sm:p-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Brief de origen</p>
                  {brief ? (
                    <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                      {[
                        { label: "Tema", value: stringValue(brief.topic) },
                        { label: "Oferta", value: stringValue(brief.offer) },
                        { label: "Público", value: stringValue(brief.audience) },
                        { label: "Dirección visual", value: stringValue(brief.tone) },
                        { label: "CTA", value: stringValue(brief.cta) },
                      ].filter(({ value }) => value.trim()).map(({ label, value }) => (
                        <div key={String(label)} className="rounded-lg bg-muted/50 p-3">
                          <dt className="text-xs text-muted-foreground">{label}</dt>
                          <dd className="mt-1 text-sm leading-5">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">Este proceso no guarda un brief estructurado.</p>
                  )}
                </div>

                {selected.length ? (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Técnicas seleccionadas y su aporte</p>
                    <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                      {selected.map((technique) => (
                        <li key={technique.id} className="rounded-lg border border-border p-3">
                          <h2 className="text-sm font-medium">{technique.name}</h2>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">{technique.summary}</p>
                          <details className="mt-2">
                            <summary className="cursor-pointer text-xs font-medium text-primary">Ver instrucción aplicada</summary>
                            <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">{technique.instruction}</p>
                          </details>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            );
          })()}

          {contributions.length ? (
            <section id="aportes-metodos" aria-labelledby="method-contributions-heading" className="scroll-mt-6 space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-primary">Aportes y decisiones</p>
                  <h2 id="method-contributions-heading" className="mt-1 font-display text-2xl">Qué aportó cada método</h2>
                </div>
                <a href={combinedPlanStep ? `#evento-${combinedPlanStep.id}` : "#trace-steps-heading"} className="text-xs font-medium text-primary underline underline-offset-4">Ver cómo se combinaron</a>
              </div>
              <ul className="grid gap-3 lg:grid-cols-2">
                {contributions.map((item, index) => {
                  const techniqueId = stringValue(item.techniqueId);
                  const technique = techniques.find((candidate) => candidate.id === techniqueId);
                  const sourceStep = trace.steps.find((step) => step.phase === "technique-contribution" && Array.isArray(step.techniqueIds) && step.techniqueIds.includes(techniqueId));
                  const status = stringValue(item.status);
                  return (
                    <li key={`${techniqueId}-${index}`} className="rounded-xl border border-border bg-background p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-medium">{technique?.name ?? techniqueId}</h3>
                        <span className={`rounded-full px-2.5 py-1 text-xs ${status === "applied" ? "bg-primary/10 text-primary" : status === "omitted" ? "bg-muted text-muted-foreground" : "bg-accent text-accent-foreground"}`}>{status === "applied" ? "Aplicado" : status === "modified" ? "Adaptado" : status === "omitted" ? "Omitido" : status || "Registrado"}</span>
                      </div>
                      {technique ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{technique.summary}</p> : null}
                      <p className="mt-3 text-sm leading-6">{stringValue(item.decision) || "La integración no registró una decisión legible."}</p>
                      {item.artifact ? <div className="mt-3 rounded-lg bg-muted/60 p-3"><p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Artefacto que dejó</p><p className="mt-1 text-sm leading-5">{String(item.artifact)}</p></div> : null}
                      {item.reason ? <p className="mt-2 text-xs leading-5 text-muted-foreground">Motivo: {String(item.reason)}</p> : null}
                      {Array.isArray(item.tensions) && item.tensions.length ? <div className="mt-2 text-xs leading-5"><p className="font-medium">Tensiones detectadas</p><ul className="mt-1 list-inside list-disc text-muted-foreground">{item.tensions.map((tension, tensionIndex) => <li key={tensionIndex}>{String(tension)}</li>)}</ul></div> : null}
                      {item.resolution ? <p className="mt-2 text-xs leading-5"><span className="font-medium">Resolución de tensión:</span> {String(item.resolution)}</p> : null}
                      {technique ? <details className="mt-3 rounded-lg border border-border p-3"><summary className="cursor-pointer text-xs font-medium">Cómo se aplicó este método</summary><dl className="mt-3 space-y-2 text-xs leading-5"><div><dt className="font-medium">Propósito</dt><dd className="text-muted-foreground">{technique.purpose}</dd></div><div><dt className="font-medium">Entradas previstas</dt><dd className="text-muted-foreground">{technique.inputs}</dd></div><div><dt className="font-medium">Instrucción de la skill</dt><dd className="whitespace-pre-wrap text-muted-foreground">{technique.instruction}</dd></div></dl></details> : null}
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {item.skillVersion ? <span>Skill {String(item.skillVersion)}</span> : null}
                        {sourceStep ? <a href={`#evento-${sourceStep.id}`} className="font-medium text-primary underline underline-offset-4">Abrir evento del método</a> : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {designDNA || designSystem || selectedDirectionData || creativeSettings ? (
            <section aria-labelledby="design-system-heading" className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Sparkles size={18} aria-hidden="true" /></span>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-primary">Dirección y sistema de diseño</p>
                  <h2 id="design-system-heading" className="mt-1 font-display text-2xl">Las reglas visuales de esta propuesta</h2>
                  {selectedDirectionData ? <p className="mt-1 text-sm text-muted-foreground">Dirección elegida: {stringValue(selectedDirectionData.title) || stringValue(selectedDirectionData.id)}</p> : null}
                </div>
              </div>
              {selectedDirectionData && stringValue(selectedDirectionData.rationale) ? <p className="mt-4 rounded-lg bg-primary/5 p-3 text-sm leading-6">{stringValue(selectedDirectionData.rationale)}</p> : null}
              {designSystem ? (
                <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium">Sistema compositivo: {stringValue(designSystem.name) || "Sistema sin nombre"}</h3>
                    {typeof designSystem.id === "string" ? <code className="rounded bg-background/80 px-2 py-1 text-[11px] text-muted-foreground">{designSystem.id}</code> : null}
                    {combinedPlanStep ? <a href={`#evento-${combinedPlanStep.id}`} className="ml-auto text-xs font-medium text-primary underline underline-offset-4">Ver decisión de combinación</a> : null}
                  </div>
                  {typeof designSystem.rationale === "string" && designSystem.rationale.trim() ? <p className="mt-2 text-sm leading-6">{designSystem.rationale}</p> : null}
                  {compositionRecipeIds.length ? (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-muted-foreground">Recetas de composición seleccionadas</p>
                      <ul className="mt-2 flex flex-wrap gap-2">{compositionRecipeIds.map((recipeId, index) => {
                        const recipe = compositionRecipes.find((item) => item.id === recipeId);
                        return <li key={`${recipeId}-${index}`} className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs"><span className="font-medium">{recipe?.name ?? recipeId}</span><code className="text-[10px] text-muted-foreground">{recipeId}</code></li>;
                      })}</ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {creativeSettings ? (
                <dl className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ["Objetivo", creativeSettings.objective], ["Variedad", creativeSettings.variety],
                    ["Movimiento", creativeSettings.movement], ["Densidad", creativeSettings.density],
                  ].filter(([, value]) => typeof value === "string" && value.trim()).map(([label, value]) => (
                    <div key={String(label)} className="rounded-lg border border-border p-3"><dt className="text-xs text-muted-foreground">{String(label)}</dt><dd className="mt-1 text-sm">{String(value)}</dd></div>
                  ))}
                </dl>
              ) : null}
              {designDNA ? (
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {typeof designDNA.brandMotif === "string" ? <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Motivo visual</p><p className="mt-1 text-sm leading-5">{designDNA.brandMotif}</p></div> : null}
                  {typeof designDNA.typography === "string" ? <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Tipografía</p><p className="mt-1 text-sm leading-5">{designDNA.typography}</p></div> : null}
                  {typeof designDNA.composition === "string" ? <div className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">Composición</p><p className="mt-1 text-sm leading-5">{designDNA.composition}</p></div> : null}
                  {Array.isArray(designDNA.palette) && designDNA.palette.length ? (
                    <div className="rounded-lg border border-border p-3 lg:col-span-2"><p className="text-xs text-muted-foreground">Paleta por función</p><ul className="mt-2 flex flex-wrap gap-2">{designDNA.palette.flatMap((item, index) => { const color = asRecord(item); return color ? [<li key={`${String(color.role)}-${index}`} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs"><span className="size-3 rounded-full border border-border" style={{ backgroundColor: typeof color.value === "string" ? color.value : "transparent" }} aria-hidden="true" />{String(color.role)} · {String(color.value)}</li>] : []; })}</ul></div>
                  ) : null}
                  {Array.isArray(designDNA.invariants) && designDNA.invariants.length ? <div className="rounded-lg border border-border p-3 lg:col-span-2"><p className="text-xs text-muted-foreground">Invariantes que mantienen consistencia entre secciones</p><ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">{designDNA.invariants.map((item, index) => <li key={index} className="flex gap-2"><span className="text-primary">•</span>{String(item)}</li>)}</ul></div> : null}
                </div>
              ) : null}
            </section>
          ) : null}

          {planSections.length || creatorCritic || contentRequirements.length ? (
            <section aria-labelledby="design-plan-heading" className="space-y-4">
              <header>
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-primary">Artefacto de estrategia</p>
                <h2 id="design-plan-heading" className="mt-1 font-display text-2xl">Mapa de contenido y revisión</h2>
                <p className="mt-1 text-sm text-muted-foreground">Cada sección queda ligada a su función, copy y requisitos observables del brief.</p>
              </header>
              {planSections.length ? (
                <ol className="grid gap-3 lg:grid-cols-2">
                  {planSections.map((item, index) => (
                    <li key={`${String(item.id)}-${index}`} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-start gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-xs font-medium">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><p className="text-xs text-muted-foreground">{stringValue(item.role) || "Sección"} · {stringValue(item.id)}</p><h3 className="mt-1 font-medium">{stringValue(item.headline) || "Sin titular registrado"}</h3></div></div>
                      {item.purpose ? <p className="mt-3 text-sm leading-5 text-muted-foreground">{String(item.purpose)}</p> : null}
                      {item.copy ? <details className="mt-3 rounded-lg border border-border p-3"><summary className="cursor-pointer text-xs font-medium">Ver copy previsto</summary><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{String(item.copy)}</p></details> : null}
                      {item.cta ? <p className="mt-2 text-xs"><span className="font-medium">CTA:</span> {String(item.cta)}</p> : null}
                      {Array.isArray(item.mediaSlotIds) && item.mediaSlotIds.length ? <p className="mt-2 text-xs text-muted-foreground">Slots de medios: {item.mediaSlotIds.map(String).join(" · ")}</p> : null}
                    </li>
                  ))}
                </ol>
              ) : null}
              {contentRequirements.length ? (
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="font-medium">Entregables verificables del brief</h3>
                  <ul className="mt-3 grid gap-3 sm:grid-cols-2">{contentRequirements.map((item, index) => <li key={`${String(item.id)}-${index}`} className="rounded-lg bg-muted/50 p-3 text-sm"><p>{String(item.statement)}</p><p className="mt-1 text-xs text-muted-foreground">Sección {String(item.sectionId)}{typeof item.targetCount === "number" ? ` · ${item.targetCount} elementos requeridos` : ""}</p>{Array.isArray(item.requiredItems) && item.requiredItems.length ? <details className="mt-2"><summary className="cursor-pointer text-xs font-medium">Ver inventario exacto ({item.requiredItems.length})</summary><ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-5">{item.requiredItems.map((required, requiredIndex) => <li key={requiredIndex}>{String(required)}</li>)}</ul></details> : null}</li>)}</ul>
                </div>
              ) : null}
              {creatorCritic ? (
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="font-medium">Revisión creador · crítico</h3>
                  {creatorCritic.proposal ? <p className="mt-2 text-sm leading-5">Propuesta: {String(creatorCritic.proposal)}</p> : null}
                  {Array.isArray(creatorCritic.findings) && creatorCritic.findings.length ? <div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="rounded-lg bg-destructive/5 p-3"><p className="text-xs font-medium">Hallazgos observables</p><ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-5">{creatorCritic.findings.map((finding, index) => <li key={index}>{String(finding)}</li>)}</ul></div><div className="rounded-lg bg-primary/5 p-3"><p className="text-xs font-medium">Revisión aplicada</p><p className="mt-2 text-sm leading-5">{String(creatorCritic.revision ?? "Sin revisión registrada")}</p></div></div> : null}
                </div>
              ) : null}
            </section>
          ) : null}

          <section aria-labelledby="trace-steps-heading" className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Registro paso a paso</p>
              <h2 id="trace-steps-heading" className="mt-1 font-display text-2xl">Prompts y resultados</h2>
            </div>

            {trace.steps.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                Todavía no hay llamadas registradas para este proceso.
              </p>
            ) : (
              stages.map((stage) => (
                <section key={stage.id} id={`fase-${stage.id}`} aria-labelledby={`heading-${stage.id}`} className="scroll-mt-5 space-y-3">
                  <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">Fase del proceso · {stage.steps.length} {stage.steps.length === 1 ? "evento" : "eventos"}</p>
                      <h3 id={`heading-${stage.id}`} className="mt-1 font-display text-2xl">{stage.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{stage.description}</p>
                    </div>
                    <a href="#trace-steps-heading" className="text-xs text-muted-foreground underline underline-offset-4">Volver al índice</a>
                  </header>
                  <ol className="space-y-3">
                  {stage.steps.map((step) => {
                const stepTechniques = techniqueList(step.techniqueIds);
                const output = asRecord(step.output);
                const contributions = output && Array.isArray(output.contributions) ? output.contributions.flatMap((item) => asRecord(item) ? [asRecord(item)!] : []) : [];
                const claims = output && Array.isArray(output.claims) ? output.claims.flatMap((item) => asRecord(item) ? [asRecord(item)!] : []) : [];
                const outputCode = landingOutput(output);
                const visualJudgment = qualityJudgment(step.phase, step.decisionSummary, output, step.outputText);
                const mediaAssetId = output && typeof output.assetId === "string" && /^[0-9a-f-]{36}$/.test(output.assetId)
                  ? output.assetId
                  : output && typeof output.imageReference === "string" && /^[0-9a-f-]{36}$/.test(output.imageReference)
                    ? output.imageReference
                    : null;
                const mediaType = output && output.type === "video" ? "video" : "image";
                const image = output && typeof output.image === "string" && typeof output.mediaType === "string"
                  ? { base64: output.image, mediaType: output.mediaType }
                  : null;
                const duration = formatDuration(step.durationMs);
                  return (
                  <li key={step.id}>
                  <article id={`evento-${step.id}`} className="scroll-mt-5 overflow-hidden rounded-xl border border-border bg-card">
                    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
                      <div>
                        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                          Paso {String(step.sequence).padStart(2, "0")} · {readablePhase(step.phase)}
                        </p>
                        <h3 className="mt-1 font-display text-xl">{step.title}</h3>
                        {stepTechniques.length ? (
                          <p className="mt-1 text-sm text-muted-foreground">{stepTechniques.map((technique) => technique.name).join(" · ")}</p>
                        ) : null}
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs ${step.status === "completed" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                        {step.status === "completed" ? "Correcto" : "Falló"}
                      </span>
                    </header>

                    <div className="space-y-4 p-4 sm:p-5">
                      <dl className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                        {step.provider ? <div><dt className="sr-only">Proveedor</dt><dd>Proveedor: {providerLabel(step.provider)}</dd></div> : null}
                        {step.model ? <div><dt className="sr-only">Modelo</dt><dd>Modelo: {step.model}</dd></div> : null}
                        {duration ? <div><dt className="sr-only">Duración</dt><dd>Duración: {duration}</dd></div> : null}
                        <div><dt className="sr-only">Fecha</dt><dd>{formatDate(step.createdAt)}</dd></div>
                      </dl>

                      {step.errorMessage ? <p className="rounded-lg bg-destructive/5 p-3 text-sm text-destructive">{step.errorMessage}</p> : null}

                      {visualJudgment ? (
                        <section aria-label="Juicio visual de calidad" className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-primary">Juicio visual</h4>
                          {visualJudgment.summary ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{visualJudgment.summary}</p> : null}
                          {visualJudgment.findings.length ? <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-5">{visualJudgment.findings.map((finding, index) => <li key={index}>{finding}</li>)}</ul> : null}
                        </section>
                      ) : step.decisionSummary ? <p className="whitespace-pre-wrap rounded-lg bg-primary/5 p-3 text-sm leading-6">Síntesis de decisiones: {step.decisionSummary}</p> : null}
                      {step.skillVersions && asRecord(step.skillVersions) ? <p className="text-xs text-muted-foreground">Versiones de skills: {Object.entries(asRecord(step.skillVersions)!).map(([key, value]) => `${key} ${String(value)}`).join(" · ")}</p> : null}
                      {contributions.length && step.phase !== "combined-design-plan" ? (
                        <section className="space-y-2" aria-label="Aportes por método">
                          <h4 className="text-sm font-medium">Aportes por método</h4>
                          <ul className="grid gap-2 sm:grid-cols-2">{contributions.map((item, index) => <li key={`${String(item.techniqueId)}-${index}`} className="rounded-lg border border-border p-3 text-sm"><strong>{String(item.techniqueId)} · {String(item.status)}</strong><p className="mt-1">{String(item.decision)}</p><p className="mt-1 text-xs text-muted-foreground">Artefacto: {String(item.artifact)}</p></li>)}</ul>
                        </section>
                      ) : null}
                      {claims.length ? (
                        <section className="space-y-2" aria-label="Afirmaciones y fuentes">
                          <h4 className="text-sm font-medium">Afirmaciones y evidencia</h4>
                          <ul className="space-y-2">{claims.map((claim, index) => <li key={index} className="rounded-lg border border-border p-3 text-sm"><span className="rounded bg-muted px-2 py-0.5 text-xs">{String(claim.status)}</span><p className="mt-2">{String(claim.text)}</p>{claim.source ? <p className="mt-1 text-xs text-muted-foreground">Fuente: {String(claim.source)}</p> : null}</li>)}</ul>
                        </section>
                      ) : null}
                      {Array.isArray(step.references) && step.references.length ? (
                        <section aria-label="Fuentes y elementos relacionados" className="rounded-lg border border-border p-3">
                          <h4 className="text-xs font-medium">Fuentes y elementos relacionados</h4>
                          <ul className="mt-2 flex flex-wrap gap-2">{step.references.flatMap((item, index) => {
                            const ref = asRecord(item);
                            if (!ref) return [];
                            const sourceTypes: Record<string, string> = { brief: "Brief", documento: "Documento", web: "Web", proveedor: "Proveedor" };
                            const claimStatuses: Record<string, string> = { provided: "Dato aportado", "external-evidence": "Evidencia externa", hypothesis: "Hipótesis", inference: "Inferencia" };
                            const label = `${String(ref.label ?? ref.id)}${typeof ref.sourceType === "string" ? ` · ${sourceTypes[ref.sourceType] ?? ref.sourceType}` : ""}${typeof ref.claimStatus === "string" ? ` · ${claimStatuses[ref.claimStatus] ?? ref.claimStatus}` : ""}`;
                            const href = typeof ref.url === "string" && /^https?:\/\//i.test(ref.url) ? ref.url : null;
                            return [<li key={`${String(ref.kind)}-${String(ref.id)}-${index}`} className="rounded-md bg-muted/60 px-2.5 py-1.5 text-xs"><span className="mr-1 text-muted-foreground">{String(ref.kind)}:</span>{href ? <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-2">{label}</a> : label}</li>];
                          })}</ul>
                        </section>
                      ) : null}

                      {step.outputText ? (
                        <details className="rounded-lg border border-border p-3">
                          <summary className="cursor-pointer text-sm font-medium">{step.phase.includes("prompt") ? "Prompt producido por este paso" : "Salida textual completa"}</summary>
                          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap font-mono text-xs leading-5">{step.outputText}</pre>
                        </details>
                      ) : null}

                      {image ? (
                        <div className="overflow-hidden rounded-lg border border-border">
                          <Image
                            src={`data:${image.mediaType};base64,${image.base64}`}
                            alt="Imagen creada durante este proceso"
                            width={1536}
                            height={1024}
                            unoptimized
                            className="aspect-video w-full object-cover"
                          />
                        </div>
                      ) : null}

                      {mediaAssetId ? (
                        <section aria-label="Medio colocado en la landing" className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,0.8fr)] sm:items-center">
                          {mediaType === "video" ? (
                            <video src={`/api/media/assets/${mediaAssetId}`} poster={`/api/media/assets/${mediaAssetId}?poster=1`} controls playsInline preload="metadata" className="aspect-video w-full rounded-md bg-muted object-cover" />
                          ) : (
                            <Image src={`/api/media/assets/${mediaAssetId}`} alt={output && typeof output.altText === "string" ? output.altText : "Imagen seleccionada para la landing"} width={960} height={540} unoptimized loading="lazy" className="aspect-video w-full rounded-md bg-muted object-cover" />
                          )}
                          <div className="min-w-0 space-y-1 text-sm">
                            <p className="font-medium">{mediaType === "video" ? "Video de stock" : "Imagen seleccionada"}</p>
                            <p className="break-words text-xs text-muted-foreground">{output && typeof output.author === "string" ? output.author : output && typeof output.model === "string" ? output.model : "Activo local"}</p>
                            {output && typeof output.sectionId === "string" && typeof output.slotId === "string" ? <p className="text-xs text-muted-foreground">Sección {output.sectionId} · espacio {output.slotId}</p> : null}
                            {output && typeof output.sourceUrl === "string" && output.sourceUrl.startsWith("https://") ? <a href={output.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex text-xs text-primary underline">Ver fuente y licencia</a> : null}
                            {output && typeof output.estimatedCostUsd === "number" ? <p className="text-xs text-muted-foreground">Costo estimado: US$ {output.estimatedCostUsd.toFixed(4)}</p> : output?.estimatedCostUsd === null ? <p className="text-xs text-muted-foreground">Costo: no disponible; revisa el proveedor configurado.</p> : null}
                          </div>
                        </section>
                      ) : null}

                      {step.systemPrompt ? (
                        <details className="rounded-lg border border-border p-3">
                          <summary className="cursor-pointer text-sm font-medium">Instrucciones del modelo</summary>
                          <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap font-mono text-xs leading-5 text-muted-foreground">{step.systemPrompt}</pre>
                        </details>
                      ) : null}

                      {step.userPrompt ? (
                        <details className="rounded-lg border border-border p-3">
                          <summary className="cursor-pointer text-sm font-medium">Entrada exacta enviada al modelo</summary>
                          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap font-mono text-xs leading-5 text-muted-foreground">{step.userPrompt}</pre>
                        </details>
                      ) : null}

                      {outputCode ? (
                        <DownloadHtmlButton code={outputCode} />
                      ) : step.output && !image ? (
                        <details className="rounded-lg border border-border p-3">
                          <summary className="cursor-pointer text-sm font-medium">Resultado estructurado</summary>
                          <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap font-mono text-xs leading-5 text-muted-foreground">{JSON.stringify(step.output, null, 2)}</pre>
                        </details>
                      ) : null}
                    </div>
                  </article>
                  </li>
                );
                  })}
                  </ol>
                </section>
              ))
            )}
          </section>

          <p className="text-xs leading-5 text-muted-foreground">
            La trazabilidad conserva instrucciones, entradas, salidas y metadatos de proveedores; no registra razonamiento privado interno de los modelos.
          </p>
        </div>
      )}
    </AppShell>
  );
}
