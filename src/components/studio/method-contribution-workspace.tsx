"use client";

import { Check, CircleAlert, CircleDashed, LoaderCircle, Merge, RotateCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getTechnique } from "@/lib/techniques";
import type { TechniqueRun } from "@/lib/studio-types";

type Props = {
  runs: TechniqueRun[];
  combining: boolean;
  disabled?: boolean;
  editDisabled?: boolean;
  onEdit: (id: TechniqueRun["techniqueId"], field: "decision" | "artifact", value: string) => void;
  onCommit: (run: TechniqueRun) => void;
  onRetry: (run: TechniqueRun) => void;
  onCombine: () => void;
};

const stateCopy = {
  queued: "En cola",
  loading: "Eve está trabajando",
  ready: "Aporte listo para revisar",
  error: "Necesita atención",
} as const;

export function MethodContributionWorkspace({ runs, combining, disabled = false, editDisabled = false, onEdit, onCommit, onRetry, onCombine }: Props) {
  const ready = runs.length > 0 && runs.every((run) => run.status === "ready" && run.contribution?.decision.trim() && run.contribution.artifact.trim());
  const doneCount = runs.filter((run) => run.status === "ready").length;

  return (
    <section aria-labelledby="method-workspace-title" className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Trabajo por método · {doneCount}/{runs.length} listos</p>
          <h3 id="method-workspace-title" className="mt-1 font-display text-xl sm:text-2xl">Revisa cada aporte antes de combinarlos</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Cada tarjeta corresponde a una ejecución real de Eve. Puedes corregir sus decisiones y artefactos; la combinación recibirá exactamente esta versión.</p>
        </div>
        <Button type="button" onClick={onCombine} disabled={!ready || combining || disabled} className="w-full sm:w-auto">
          {combining ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Merge aria-hidden="true" />}
          {combining ? "Combinando aportes…" : "Combinar aportes con Eve"}
        </Button>
      </header>

      <ol className="grid gap-4 xl:grid-cols-2">
        {runs.map((run, index) => {
          const technique = getTechnique(run.techniqueId);
          const contribution = run.contribution;
          const Icon = run.status === "ready" ? Check : run.status === "error" ? CircleAlert : run.status === "loading" ? LoaderCircle : CircleDashed;
          return (
            <li key={run.id} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex items-start justify-between gap-3 border-b border-border/70 bg-muted/30 p-4 sm:p-5">
                <div className="flex min-w-0 gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 font-display text-sm font-semibold text-primary">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <h4 className="font-semibold">{technique.name}</h4>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">{technique.purpose}</p>
                  </div>
                </div>
                <span role="status" className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${run.status === "error" ? "border-destructive/30 text-destructive" : run.status === "ready" ? "border-primary/25 text-primary" : "border-border text-muted-foreground"}`}>
                  <Icon size={13} className={run.status === "loading" ? "animate-spin" : ""} aria-hidden="true" />
                  <span className="hidden sm:inline">{stateCopy[run.status]}</span>
                  <span className="sm:hidden">{run.status === "ready" ? "Listo" : run.status === "error" ? "Error" : run.status === "loading" ? "En curso" : "En cola"}</span>
                </span>
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                {run.status === "error" ? (
                  <div className="rounded-xl border border-destructive/25 bg-destructive/[0.04] p-3.5" role="alert">
                    <p className="text-sm leading-6 text-destructive">{run.error}</p>
                    <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => onRetry(run)} disabled={disabled}>
                      <RotateCw size={15} aria-hidden="true" /> Reintentar solo este método
                    </Button>
                  </div>
                ) : null}
                {run.status === "loading" ? (
                  <div className="flex items-center gap-3 rounded-xl bg-primary/[0.04] px-3.5 py-4 text-sm text-muted-foreground" role="status">
                    <LoaderCircle size={17} className="animate-spin text-primary" aria-hidden="true" />
                    Eve está aplicando la skill y preparando un plan inspeccionable para {technique.name.toLowerCase()}.
                  </div>
                ) : null}
                {run.status === "queued" ? <p className="text-sm text-muted-foreground">Esperando a que inicie esta ejecución.</p> : null}

                {contribution ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1.5 text-xs font-semibold text-muted-foreground">
                        Decisión
                        <Textarea aria-label={`Decisión de ${technique.name}`} value={contribution.decision} onChange={(event) => onEdit(run.techniqueId, "decision", event.target.value)} onBlur={() => onCommit(run)} disabled={editDisabled} maxLength={1200} className="min-h-28 resize-y text-sm font-normal leading-5 text-foreground" />
                      </label>
                      <label className="space-y-1.5 text-xs font-semibold text-muted-foreground">
                        Artefacto visible
                        <Textarea aria-label={`Artefacto de ${technique.name}`} value={contribution.artifact} onChange={(event) => onEdit(run.techniqueId, "artifact", event.target.value)} onBlur={() => onCommit(run)} disabled={editDisabled} maxLength={3000} className="min-h-28 resize-y text-sm font-normal leading-5 text-foreground" />
                      </label>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-background p-3.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Propuesta estructurada</p>
                      <p className="mt-2 text-sm font-medium leading-5">{run.designPlan?.concept}</p>
                      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                        {run.designPlan?.sections.slice(0, 4).map((section) => (
                          <li key={section.id} className="rounded-lg bg-muted/50 p-2.5">
                            <span className="block text-xs font-semibold">{section.headline}</span>
                            <span className="mt-1 block text-xs leading-4 text-muted-foreground">{section.purpose}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {contribution.tensions.length > 0 || contribution.resolution ? (
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3 text-sm">
                        <p className="font-medium">Tensiones y resolución</p>
                        {contribution.tensions.length > 0 ? <p className="mt-1 text-muted-foreground">{contribution.tensions.join(" · ")}</p> : null}
                        {contribution.resolution ? <p className="mt-1 text-muted-foreground">{contribution.resolution}</p> : null}
                      </div>
                    ) : null}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>Estado del aporte: {contribution.status} · skill {contribution.skillVersion}</span>
                      <Link className="font-medium text-primary underline-offset-4 hover:underline" href={`/trazabilidad/${run.traceId}`}>Ver traza completa</Link>
                    </div>
                  </>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
