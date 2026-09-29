import { GitBranch, LoaderCircle, Play, RefreshCw, WandSparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { techniques } from "@/lib/techniques";
import type { PromptResult } from "@/lib/studio-types";

type PromptResultsProps = {
  results: PromptResult[];
  activeResultId: string | null;
  onPromptChange: (id: string, prompt: string) => void;
  onRun: (id: string) => void;
  onRetry: (id: string) => void;
};

export function PromptResults({
  results,
  activeResultId,
  onPromptChange,
  onRun,
  onRetry,
}: PromptResultsProps) {
  if (results.length === 0) return null;

  return (
    <section aria-labelledby="prompt-results-heading" className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Siguiente paso
          </p>
          <h2 id="prompt-results-heading" className="mt-1 font-display text-2xl">
            Tus prompts
          </h2>
        </div>
        <span className="text-xs text-muted-foreground">
          Edita el texto antes de construir la página
        </span>
      </div>

      <div className="space-y-3">
        {results.map((result, index) => {
          const names = result.techniqueIds
            .map((id) => techniques.find((technique) => technique.id === id)?.name)
            .filter(Boolean);
          const isActive = activeResultId === result.id;
          const isLoading = result.status === "loading";

          return (
            <Card key={result.id} className="gap-0 overflow-hidden border-border/90 py-0 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/80 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <span className="text-xs tabular-nums text-muted-foreground">0{index + 1}</span>
                    <span className="truncate">{result.combined ? "Prompt combinado" : names[0]}</span>
                  </CardTitle>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{names.join(" · ")} · {result.modelChoice}</p>
                </div>
                {isLoading ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
                    <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />
                    Generando
                  </span>
                ) : result.status === "ready" ? (
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-primary">
                    <WandSparkles size={14} aria-hidden="true" />
                    Listo
                  </span>
                ) : null}
              </CardHeader>

              <CardContent className="space-y-3 p-4 sm:p-5">
                {result.status === "error" ? (
                  <div className="flex flex-col gap-3 rounded-lg border border-destructive/25 bg-destructive/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-destructive">{result.error}</p>
                    <Button variant="outline" size="sm" onClick={() => onRetry(result.id)} disabled={activeResultId !== null}>
                      <RefreshCw size={14} aria-hidden="true" />
                      Reintentar con {result.modelChoice}
                    </Button>
                  </div>
                ) : null}

                <Textarea
                  value={result.prompt}
                  onChange={(event) => onPromptChange(result.id, event.target.value)}
                  placeholder={isLoading ? "Preparando el prompt…" : "El prompt aparecerá aquí."}
                  disabled={isLoading || result.status !== "ready"}
                  aria-label={`Prompt de ${names.join(" y ")}`}
                  rows={Math.min(12, Math.max(5, Math.ceil(result.prompt.length / 90)))}
                  className="max-h-[340px] resize-y bg-background font-mono text-xs leading-6"
                />

                {result.status === "ready" ? (
                  <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-xs font-semibold">
                      {result.generationMode === "eve-design-plan" ? `DesignPlan verificado · ${result.modelChoice}` : `Resultado guardado · ${result.modelChoice}`}
                    </p>
                    {result.designPlan ? (
                      <>
                        <p className="text-sm">{result.designPlan.concept}</p>
                        <ol className="grid gap-2 sm:grid-cols-2">
                          {result.designPlan.sections.map((section) => (
                            <li key={section.id} className="rounded-md border border-border bg-background p-2.5">
                              <p className="text-xs font-semibold">{section.role} · {section.id}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{section.purpose}</p>
                            </li>
                          ))}
                        </ol>
                        <ul className="flex flex-wrap gap-1.5">
                          {result.designPlan.contributions.map((item) => (
                            <li key={item.techniqueId} className="rounded-full bg-background px-2 py-1 text-[11px]">
                              {techniques.find(({ id }) => id === item.techniqueId)?.name}: {item.status}
                            </li>
                          ))}
                        </ul>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {result.designPlan.contributions.map((item) => (
                            <article key={`${item.techniqueId}-detail`} className="rounded-lg border border-border bg-background p-3">
                              <h3 className="text-xs font-semibold">{techniques.find(({ id }) => id === item.techniqueId)?.name}</h3>
                              <p className="mt-1 text-xs leading-5">{item.decision}</p>
                              <p className="mt-1 text-xs leading-5 text-muted-foreground">Aporte: {item.artifact}</p>
                              {item.tensions.length > 0 ? <p className="mt-1 text-xs leading-5 text-muted-foreground">Tensión: {item.tensions.join("; ")} {item.resolution ? `· Resolución: ${item.resolution}` : ""}</p> : null}
                            </article>
                          ))}
                        </div>
                        {result.designPlan.creatorCritic ? (
                          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                            <p className="text-xs font-semibold">Revisión creador · crítico</p>
                            <p className="mt-1 text-xs leading-5">{result.designPlan.creatorCritic.revision}</p>
                            {result.designPlan.creatorCritic.findings.length > 0 ? <p className="mt-1 text-xs leading-5 text-muted-foreground">Hallazgos resueltos: {result.designPlan.creatorCritic.findings.join("; ")}</p> : null}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">El texto editable se conserva de una generación anterior. Las nuevas generaciones usan Eve y requieren un DesignPlan válido.</p>
                    )}
                  </div>
                ) : null}

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                  <p className="text-xs text-muted-foreground">Eve construirá la landing con {result.modelChoice}; puedes seguir editando el prompt antes.</p>
                    <Link
                      href={`/trazabilidad/${result.traceId}`}
                      className="mt-2 inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-primary hover:bg-accent"
                    >
                      <GitBranch size={13} aria-hidden="true" /> Ver trazabilidad del prompt
                    </Link>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={() => onRun(result.id)}
                      disabled={result.status !== "ready" || !result.prompt.trim() || activeResultId !== null}
                      className="w-full sm:w-auto"
                    >
                      {isActive ? (
                        <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
                      ) : (
                        <Play size={15} aria-hidden="true" />
                      )}
                      {isActive ? "Construyendo…" : "Construir landing"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
