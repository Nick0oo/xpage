"use client";

import { Check, CircleAlert, CircleDashed, Clapperboard, Image, LoaderCircle, Merge, MessageCircle, Palette, Route, RotateCw, ScanSearch, Scissors, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
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
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const latestRuns = useRef(runs);
  const pendingEdits = useRef(new Map<string, { decision?: string; artifact?: string }>());
  latestRuns.current = runs;
  const ready = runs.length > 0 && runs.every((run) => run.status === "ready" && run.contribution?.decision.trim() && run.contribution.artifact.trim());
  const doneCount = runs.filter((run) => run.status === "ready").length;
  const selectedRun = runs.find((run) => run.id === selectedRunId) ?? null;

  function editField(run: TechniqueRun, field: "decision" | "artifact", value: string) {
    pendingEdits.current.set(run.id, { ...pendingEdits.current.get(run.id), [field]: value });
    onEdit(run.techniqueId, field, value);
  }

  function commitLatestRun(runId: string | null) {
    if (!runId) return;
    const edits = pendingEdits.current.get(runId);
    if (!edits) return;
    const current = latestRuns.current.find((run) => run.id === runId);
    if (current?.contribution) onCommit({ ...current, contribution: { ...current.contribution, ...edits } });
    pendingEdits.current.delete(runId);
  }

  return (
    <section aria-labelledby="method-workspace-title" className="space-y-5">
      <Dialog.Root open={selectedRunId !== null} onOpenChange={(open) => {
        if (!open) {
          commitLatestRun(selectedRunId);
          setSelectedRunId(null);
        }
      }}>
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 sm:p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Aportes de Eve · {doneCount}/{runs.length} listos</p>
            <h3 id="method-workspace-title" className="mt-1 font-display text-xl sm:text-2xl">Revisa y combina</h3>
            <p className="mt-1 text-sm text-muted-foreground">Abre un método para ver o editar su aporte.</p>
          </div>
          <Button type="button" onClick={onCombine} disabled={!ready || combining || disabled} className="w-full sm:w-auto">
            {combining ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Merge aria-hidden="true" />}
            {combining ? "Combinando…" : "Combinar aportes"}
          </Button>
        </header>

        <ol aria-label="Aportes por método" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {runs.map((run) => {
            const technique = getTechnique(run.techniqueId);
            const visual = methodVisuals[run.techniqueId];
            const StatusIcon = run.status === "ready" ? Check : run.status === "error" ? CircleAlert : run.status === "loading" ? LoaderCircle : CircleDashed;
            const statusLabel = run.status === "ready" ? "Listo" : run.status === "error" ? "Error" : run.status === "loading" ? "En curso" : "En cola";
            const summary = run.contribution?.decision.trim() || (run.status === "error" ? run.error : technique.purpose) || "Esperando a que inicie.";
            return (
              <li key={run.id} className="min-w-0">
                <Dialog.Trigger onClick={() => setSelectedRunId(run.id)} className="group flex h-full w-full flex-col rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:border-primary/40 hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="flex w-full items-center gap-2.5">
                    <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${visual.color}`}><visual.Icon size={17} aria-hidden="true" /></span>
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{technique.name}</span>
                    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-medium ${run.status === "error" ? "border-destructive/30 text-destructive" : run.status === "ready" ? "border-primary/25 text-primary" : "border-border text-muted-foreground"}`}>
                      <StatusIcon size={12} className={run.status === "loading" ? "animate-spin" : ""} aria-hidden="true" />{statusLabel}
                    </span>
                  </span>
                  <span className="mt-2 line-clamp-3 min-h-12 text-xs leading-4 text-muted-foreground">{summary}</span>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary">Ver y editar <span aria-hidden="true">→</span></span>
                </Dialog.Trigger>
              </li>
            );
          })}
        </ol>

        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity" />
          {selectedRun ? (() => {
            const technique = getTechnique(selectedRun.techniqueId);
            const contribution = selectedRun.contribution;
            const visual = methodVisuals[selectedRun.techniqueId];
            const StatusIcon = selectedRun.status === "ready" ? Check : selectedRun.status === "error" ? CircleAlert : selectedRun.status === "loading" ? LoaderCircle : CircleDashed;
            return (
              <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[85dvh] w-[min(820px,calc(100vw-1.25rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl outline-none data-[starting-style]:scale-[0.98] data-[ending-style]:scale-[0.98] data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-[transform,opacity]">
                <header className="flex shrink-0 items-start gap-3 border-b border-border bg-card px-4 py-3.5 sm:px-6">
                  <span className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg ${visual.color}`}><visual.Icon size={18} aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1">
                    <Dialog.Title className="font-display text-lg font-semibold leading-6">{technique.name}</Dialog.Title>
                    <Dialog.Description className="mt-0.5 text-sm leading-5 text-muted-foreground">{technique.purpose}</Dialog.Description>
                  </div>
                  <span role="status" className={`mt-1 inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${selectedRun.status === "error" ? "border-destructive/30 text-destructive" : selectedRun.status === "ready" ? "border-primary/25 text-primary" : "border-border text-muted-foreground"}`}>
                    <StatusIcon size={13} className={selectedRun.status === "loading" ? "animate-spin" : ""} aria-hidden="true" />
                    <span className="hidden sm:inline">{stateCopy[selectedRun.status]}</span>
                    <span className="sm:hidden">{selectedRun.status === "ready" ? "Listo" : selectedRun.status === "error" ? "Error" : selectedRun.status === "loading" ? "En curso" : "En cola"}</span>
                  </span>
                  <Dialog.Close aria-label="Cerrar detalle del método" className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span aria-hidden="true" className="text-xl leading-none">×</span></Dialog.Close>
                </header>

                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
                  {selectedRun.status === "error" ? <div className="rounded-xl border border-destructive/30 bg-destructive/[0.04] p-3.5" role="alert">
                    <p className="text-sm leading-5 text-destructive">{selectedRun.error || "Este método no pudo completarse."}</p>
                    <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => onRetry(selectedRun)} disabled={disabled}><RotateCw size={15} aria-hidden="true" /> Reintentar solo este método</Button>
                  </div> : null}
                  {selectedRun.status === "loading" ? <div className="flex items-center gap-3 rounded-xl bg-primary/[0.04] px-3.5 py-3 text-sm text-muted-foreground" role="status"><LoaderCircle size={17} className="animate-spin text-primary" aria-hidden="true" />Eve está preparando el aporte de {technique.name.toLowerCase()}.</div> : null}
                  {selectedRun.status === "queued" ? <p className="rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">Esperando a que inicie esta ejecución.</p> : null}

                  {contribution ? <>
                    <label className="block space-y-1.5 text-xs font-semibold text-muted-foreground">
                      Decisión y resumen
                      <Textarea aria-label={`Decisión de ${technique.name}`} value={contribution.decision} onChange={(event) => editField(selectedRun, "decision", event.target.value)} onBlur={() => commitLatestRun(selectedRun.id)} disabled={editDisabled} maxLength={1200} className="field-sizing-fixed min-h-24 max-h-[32dvh] resize-y overflow-y-auto text-sm font-normal leading-5 text-foreground" />
                      <span className="block text-right text-[10px] font-normal">{contribution.decision.length}/1200</span>
                    </label>
                    <label className="block space-y-1.5 text-xs font-semibold text-muted-foreground">
                      Artefacto editable
                      <Textarea aria-label={`Artefacto de ${technique.name}`} value={contribution.artifact} onChange={(event) => editField(selectedRun, "artifact", event.target.value)} onBlur={() => commitLatestRun(selectedRun.id)} disabled={editDisabled} maxLength={6000} className="field-sizing-fixed min-h-64 max-h-[50dvh] resize-y overflow-y-auto text-sm font-normal leading-5 text-foreground" />
                      <span className="block text-right text-[10px] font-normal">{contribution.artifact.length}/6000</span>
                    </label>
                    {selectedRun.techniqueId === "image-assets" || selectedRun.techniqueId === "video-assets" ? <MethodMediaCandidates run={selectedRun} onChoose={(text) => {
                      const nextArtifact = `${contribution.artifact.trim()}\n\n${text}`;
                      if (nextArtifact.length > 6000) return false;
                      const nextContribution = { ...contribution, artifact: nextArtifact };
                      editField(selectedRun, "artifact", nextArtifact);
                      onCommit({ ...selectedRun, contribution: nextContribution });
                      pendingEdits.current.delete(selectedRun.id);
                      return true;
                    }} /> : null}
                  </> : null}

                  <section className="rounded-xl border border-border bg-muted/20 p-3.5" aria-label="Contexto y trazabilidad del método">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contexto del método</h4>
                    <p className="mt-1.5 text-sm leading-5">{technique.inputs}</p>
                    {contribution && (contribution.tensions.length > 0 || contribution.resolution) ? <div className="mt-3 border-t border-border pt-3">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Tensiones y resolución</p>
                      {contribution.tensions.length > 0 ? <p className="mt-1 text-sm leading-5 text-muted-foreground">{contribution.tensions.join(" · ")}</p> : null}
                      {contribution.resolution ? <p className="mt-1 text-sm leading-5 text-muted-foreground">{contribution.resolution}</p> : null}
                    </div> : null}
                    {contribution ? <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">Estado del aporte: {contribution.status} · versión de skill {contribution.skillVersion}</p> : null}
                    <Link className="mt-2 inline-flex text-xs font-medium text-primary underline-offset-4 hover:underline" href={`/trazabilidad/${selectedRun.traceId}`}>Abrir traza completa <span aria-hidden="true" className="ml-1">↗</span></Link>
                  </section>
                </div>

                <footer className="flex shrink-0 justify-end border-t border-border bg-card px-4 py-3 sm:px-6">
                  <Dialog.Close className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Listo</Dialog.Close>
                </footer>
              </Dialog.Popup>
            );
          })() : null}
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
