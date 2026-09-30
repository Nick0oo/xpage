"use client";

import { Check, CircleAlert, CircleDashed, Clapperboard, Image, LoaderCircle, Merge, MessageCircle, Palette, Route, RotateCw, ScanSearch, Scissors, ShieldCheck } from "lucide-react";
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

const methodVisuals = {
  "seed-strings": { Icon: Palette, color: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300" },
  "ambitious-prompts": { Icon: Route, color: "bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  "creator-critic": { Icon: ScanSearch, color: "bg-amber-500/10 text-amber-800 dark:text-amber-300" },
  "image-assets": { Icon: Image, color: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
  "video-assets": { Icon: Clapperboard, color: "bg-cyan-500/10 text-cyan-800 dark:text-cyan-300" },
  "subtractive-design": { Icon: Scissors, color: "bg-rose-500/10 text-rose-700 dark:text-rose-300" },
  "negative-constraints": { Icon: ShieldCheck, color: "bg-orange-500/10 text-orange-800 dark:text-orange-300" },
  "human-copy": { Icon: MessageCircle, color: "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300" },
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

      <div aria-label="Síntesis de aportes por método" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {runs.map((run) => {
          const technique = getTechnique(run.techniqueId);
          const visual = methodVisuals[run.techniqueId];
          return (
            <a key={run.id} href={`#method-${run.techniqueId}`} className="group flex min-h-24 gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/30 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${visual.color}`}><visual.Icon size={17} aria-hidden="true" /></span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold">{technique.name} · {run.status === "ready" ? "listo" : run.status === "error" ? "error" : run.status === "loading" ? "en curso" : "en cola"}</span>
                <span className="mt-1 line-clamp-2 block text-xs leading-4 text-muted-foreground">{run.contribution?.artifact ?? technique.artifact}</span>
              </span>
            </a>
          );
        })}
      </div>

      <ol className="grid gap-4 xl:grid-cols-2">
        {runs.map((run, index) => {
          const technique = getTechnique(run.techniqueId);
          const contribution = run.contribution;
          const visual = methodVisuals[run.techniqueId];
          const Icon = run.status === "ready" ? Check : run.status === "error" ? CircleAlert : run.status === "loading" ? LoaderCircle : CircleDashed;
          return (
            <li key={run.id} id={`method-${run.techniqueId}`} className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="flex items-start justify-between gap-3 border-b border-border/70 bg-muted/30 p-4 sm:p-5">
                <div className="flex min-w-0 gap-3">
                  <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${visual.color}`}><visual.Icon size={19} aria-hidden="true" /></span>
                  <div className="min-w-0">
                    <h4 className="font-semibold"><span className="mr-2 font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>{technique.name}</h4>
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
                    Eve está aplicando la skill y preparando el aporte propio de {technique.name.toLowerCase()}.
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
                        <Textarea aria-label={`Artefacto de ${technique.name}`} value={contribution.artifact} onChange={(event) => onEdit(run.techniqueId, "artifact", event.target.value)} onBlur={() => onCommit(run)} disabled={editDisabled} maxLength={technique.id === "seed-strings" ? 6000 : 3000} className="min-h-28 resize-y text-sm font-normal leading-5 text-foreground" />
                      </label>
                    </div>
                    <details className="rounded-xl border border-border bg-muted/20 p-3">
                      <summary className="cursor-pointer text-xs font-medium text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring">{"Ver contexto del m\u00e9todo"}</summary>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-muted/40 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Entradas consideradas</p>
                        <p className="mt-1.5 text-sm leading-5">{technique.inputs}</p>
                      </div>
                      <div className="rounded-xl bg-muted/40 p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Qué entrega este método</p>
                        <p className="mt-1.5 text-sm leading-5">{contribution.artifact}</p>
                      </div>
                      </div>
                    </details>
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
