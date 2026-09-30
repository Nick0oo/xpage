"use client";

import { Check, CircleAlert, CircleDashed, Clapperboard, Image, LoaderCircle, Merge, MessageCircle, Palette, Route, RotateCw, ScanSearch, Scissors, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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

type MediaCandidate = { id: number; type: "image" | "video"; previewUrl: string; mediaUrl?: string; sourceUrl: string; creditUrl: string; author: string; altText: string; durationSeconds: number | null };

function MethodMediaCandidates({ run, onChoose }: { run: TechniqueRun; onChoose: (text: string) => boolean }) {
  const type = run.techniqueId === "video-assets" ? "video" : "image";
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<MediaCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [choiceError, setChoiceError] = useState("");
  async function search() {
    if (query.trim().length < 2) { setError("Escribe una búsqueda de al menos dos caracteres."); return; }
    setLoading(true); setError(""); setItems([]);
    try {
      const response = await fetch(`/api/media/search?q=${encodeURIComponent(query.trim())}&type=${type}&page=1&traceId=${encodeURIComponent(run.traceId)}`, { cache: "no-store" });
      const payload = await response.json() as { items?: MediaCandidate[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "No se pudo buscar en Pexels.");
      setItems(payload.items ?? []);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "No se pudo buscar en Pexels."); }
    finally { setLoading(false); }
  }
  return <section className="space-y-2 rounded-xl border border-border bg-muted/20 p-3" aria-label={`Candidatos Pexels para método ${type}`}>
    <div><p className="text-[11px] font-semibold">{type === "image" ? "Candidatos de imagen · Pexels" : "Candidatos de video · Pexels"}</p><p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">Busca con una consulta del artefacto. Elegir registra una preferencia; todavía no coloca el medio.</p></div>
    <div className="flex gap-2"><Input aria-label={`Consulta Pexels ${type}`} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void search(); } }} placeholder="Escribe una consulta concreta" maxLength={120} /><Button type="button" size="sm" variant="outline" disabled={loading || query.trim().length < 2} onClick={() => void search()}>{loading ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Search aria-hidden="true" />}Buscar</Button></div>
    {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
    {choiceError ? <p role="alert" className="text-xs text-destructive">{choiceError}</p> : null}
    {items.length ? <ul className="grid max-h-96 gap-2 overflow-y-auto sm:grid-cols-2">{items.map((item) => <li key={item.id} className="overflow-hidden rounded-lg border border-border bg-background">
      {item.type === "video" && previewId === item.id && item.mediaUrl ? <video controls autoPlay muted playsInline poster={item.previewUrl} className="aspect-video w-full object-cover"><source src={item.mediaUrl} type="video/mp4" /></video> : <img src={item.previewUrl} alt={item.altText} loading="lazy" className="aspect-video w-full bg-muted object-cover" />}
      <div className="space-y-1.5 p-2"><p className="truncate text-[11px]">Por <a href={item.creditUrl} target="_blank" rel="noreferrer" className="text-primary underline">{item.author}</a>{item.durationSeconds ? ` · ${item.durationSeconds}s` : ""}</p><a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-[10px] text-muted-foreground underline">Fuente Pexels</a>
        {item.type === "video" && item.mediaUrl ? <Button type="button" size="sm" variant="ghost" className="w-full" onClick={() => setPreviewId((current) => current === item.id ? null : item.id)}>{previewId === item.id ? "Cerrar video" : "Ver video"}</Button> : null}
        <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => { const saved = onChoose(`Preferencia de medio seleccionada desde búsqueda real de Pexels (${type}; consulta “${query.trim()}”; resultado ${item.id}; autor ${item.author}; fuente ${item.sourceUrl}). Pendiente de colocar en un espacio de la landing.`); setChoiceError(saved ? "" : "Esta preferencia no cabe en el artefacto de 6000 caracteres. Edita el artefacto antes de elegirla."); }}>Elegir preferencia</Button>
      </div>
    </li>)}</ul> : null}
    {!items.length && !loading && !error ? <p className="text-[10px] text-muted-foreground">La búsqueda no se ha ejecutado. Pexels requiere una clave de servidor configurada.</p> : null}
  </section>;
}

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
                <span className="mt-1 line-clamp-2 block text-xs leading-4 text-muted-foreground">{run.contribution?.decision ?? technique.purpose}</span>
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
                    {run.techniqueId === "image-assets" || run.techniqueId === "video-assets" ? <MethodMediaCandidates run={run} onChoose={(text) => {
                      const nextArtifact = `${contribution.artifact.trim()}\n\n${text}`;
                      if (nextArtifact.length > 6000) return false;
                      const nextContribution = { ...contribution, artifact: nextArtifact };
                      onEdit(run.techniqueId, "artifact", nextArtifact);
                      onCommit({ ...run, contribution: nextContribution });
                      return true;
                    }} /> : null}
                    <details className="rounded-xl border border-border bg-muted/20 p-3">
                      <summary className="cursor-pointer text-xs font-medium text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring">Ver resumen y decisiones</summary>
                      <div className="mt-3 space-y-3">
                        <div><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Resumen del método</p><p className="mt-1 text-sm leading-5">{contribution.decision}</p></div>
                        <div><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Artefacto editable</p><p className="mt-1 whitespace-pre-wrap text-sm leading-5">{contribution.artifact}</p></div>
                      </div>
                    </details>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1.5 text-xs font-semibold text-muted-foreground">
                        Decisión
                        <Textarea aria-label={`Decisión de ${technique.name}`} value={contribution.decision} onChange={(event) => onEdit(run.techniqueId, "decision", event.target.value)} onBlur={() => onCommit(run)} disabled={editDisabled} maxLength={1200} className="min-h-28 resize-y text-sm font-normal leading-5 text-foreground" />
                      </label>
                      <label className="space-y-1.5 text-xs font-semibold text-muted-foreground">
                        Artefacto visible
                        <Textarea aria-label={`Artefacto de ${technique.name}`} value={contribution.artifact} onChange={(event) => onEdit(run.techniqueId, "artifact", event.target.value)} onBlur={() => onCommit(run)} disabled={editDisabled} maxLength={6000} className="min-h-28 resize-y text-sm font-normal leading-5 text-foreground" />
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
