import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BookOpen, ExternalLink, GitBranch } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { DownloadHtmlButton } from "@/components/preview/download-html-button";
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

export default async function TraceDetailPage({ params }: PageProps<"/trazabilidad/[id]">) {
  const { id } = await params;
  const trace = await getGenerationTrace(id);
  const hasLandingGeneration = trace?.steps.some((step) => step.phase === "landing-generation") ?? false;

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
        <div className="mx-auto max-w-4xl space-y-7">
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
              trace.steps.map((step) => {
                const stepTechniques = techniqueList(step.techniqueIds);
                const output = asRecord(step.output);
                const outputCode = landingOutput(output);
                const image = output && typeof output.image === "string" && typeof output.mediaType === "string"
                  ? { base64: output.image, mediaType: output.mediaType }
                  : null;
                const duration = formatDuration(step.durationMs);
                return (
                  <article key={step.id} className="overflow-hidden rounded-xl border border-border bg-card">
                    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
                      <div>
                        <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                          Paso {String(step.sequence).padStart(2, "0")} · {step.phase.replaceAll("-", " ")}
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

                      {step.outputText ? (
                        <details className="rounded-lg border border-border p-3">
                          <summary className="cursor-pointer text-sm font-medium">Prompt producido por este paso</summary>
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
                );
              })
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
