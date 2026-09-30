"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, CircleAlert, Clock3, GitBranch, Layers3, Search } from "lucide-react";
import type { listGenerationTraces } from "@/lib/generation-traces";

type TraceListItem = Awaited<ReturnType<typeof listGenerationTraces>>[number];
type TraceProcess = { rootId: string; title: string; traces: TraceListItem[]; updatedAt: string; status: string; stepCount: number; savedCount: number; errorCount: number };

function statusLabel(status: string) {
  if (status === "completed") return "Completado";
  if (status === "failed") return "Falló";
  if (status === "prompt-ready") return "Prompt listo";
  return "En curso";
}

function processStatus(traces: TraceListItem[]) {
  if (traces.some((trace) => trace.status === "failed" || trace.failedStepCount > 0)) return "failed";
  if (traces.every((trace) => trace.status === "completed")) return "completed";
  if (traces.some((trace) => trace.status === "prompt-ready")) return "prompt-ready";
  return "active";
}

function groupProcesses(traces: TraceListItem[]): TraceProcess[] {
  const groups = new Map<string, TraceListItem[]>();
  for (const trace of traces) {
    const rootId = trace.rootTraceId || trace.id;
    groups.set(rootId, [...(groups.get(rootId) ?? []), trace]);
  }
  return [...groups.entries()].map(([rootId, entries]) => {
    const ordered = [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const root = ordered.find((trace) => trace.id === rootId) ?? ordered[0];
    return {
      rootId,
      title: root.title,
      traces: ordered,
      updatedAt: ordered.reduce((latest, trace) => trace.updatedAt > latest ? trace.updatedAt : latest, ordered[0].updatedAt),
      status: processStatus(ordered),
      stepCount: ordered.reduce((count, trace) => count + trace.stepCount, 0),
      savedCount: new Set(ordered.flatMap((trace) => trace.landings.map((landing) => landing.id))).size,
      errorCount: ordered.reduce((count, trace) => count + trace.failedStepCount, 0),
    };
  }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function TraceList({ traces }: { traces: TraceListItem[] }) {
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const categories = useMemo(() => [...new Set(traces.map((trace) => trace.category))].sort(), [traces]);
  const processes = useMemo(() => groupProcesses(traces), [traces]);
  const filtered = processes.filter((process) =>
    (status === "all" || process.status === status) &&
    (category === "all" || process.traces.some((trace) => trace.category === category)) &&
    (!query || `${process.title} ${process.traces.map((trace) => `${trace.title} ${trace.category} ${trace.landings.map((landing) => landing.title).join(" ")}`).join(" ")}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())),
  );

  return (
    <>
      <section aria-label="Filtros de trazabilidad" className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_2fr]">
        <label className="grid gap-1 text-xs text-muted-foreground">Estado
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground">
            <option value="all">Todos</option><option value="active">En curso</option><option value="prompt-ready">Prompt listo</option><option value="failed">Con errores</option><option value="completed">Completados</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">Tipo de ejecución
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground">
            <option value="all">Todos los tipos</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">Buscar proceso, ejecución o página
          <span className="relative"><Search size={14} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre del proceso o landing" className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground" /></span>
        </label>
      </section>

      {filtered.length === 0 ? <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No hay procesos que coincidan con estos filtros.</p> : (
        <ul className="space-y-4">
          {filtered.map((process) => (
            <li key={process.rootId}>
              <details className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm open:border-primary/25">
                <summary className="flex cursor-pointer list-none flex-col gap-4 p-4 marker:hidden sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <span className="flex min-w-0 items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Layers3 size={18} aria-hidden="true" /></span>
                    <span className="min-w-0"><span className="block truncate font-display text-xl">{process.title}</span><span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Clock3 size={12} aria-hidden="true" />{formatDate(process.updatedAt)}</span><span>{process.traces.length} {process.traces.length === 1 ? "ejecución" : "ejecuciones"}</span><span>{process.stepCount} {process.stepCount === 1 ? "evento" : "eventos"}</span></span></span>
                  </span>
                  <span className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className={`rounded-full border px-3 py-1 text-xs ${process.status === "failed" ? "border-destructive/30 bg-destructive/5 text-destructive" : process.status === "completed" ? "border-primary/25 bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}>{statusLabel(process.status)}</span>
                    {process.errorCount ? <span className="inline-flex items-center gap-1 rounded-full bg-destructive/5 px-2.5 py-1 text-xs text-destructive"><CircleAlert size={13} aria-hidden="true" />{process.errorCount} {process.errorCount === 1 ? "error" : "errores"}</span> : null}
                    {process.savedCount ? <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"><BookOpen size={13} aria-hidden="true" />{process.savedCount} {process.savedCount === 1 ? "página" : "páginas"}</span> : null}
                    <span aria-hidden="true" className="ml-1 text-muted-foreground transition-transform group-open:rotate-90"><ArrowRight size={16} /></span>
                  </span>
                </summary>

                <div className="border-t border-border bg-muted/20 p-3 sm:p-4">
                  <ol className="relative space-y-2 before:absolute before:bottom-4 before:left-[1.125rem] before:top-4 before:w-px before:bg-border">
                    {process.traces.map((trace, index) => (
                      <li key={trace.id} className="relative pl-11">
                        <span className={`absolute left-2 top-4 z-10 grid size-6 place-items-center rounded-full border bg-card text-[0.65rem] font-semibold ${trace.status === "failed" || trace.failedStepCount ? "border-destructive/35 text-destructive" : "border-primary/25 text-primary"}`}>{index + 1}</span>
                        <article className="rounded-xl border border-border bg-card p-3.5 sm:p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0"><p className="text-[0.68rem] uppercase tracking-[0.13em] text-muted-foreground">{trace.category} · {statusLabel(trace.status)}</p><h3 className="mt-1 truncate font-medium">{trace.title}</h3><p className="mt-1 text-xs text-muted-foreground">{formatDate(trace.createdAt)} · {trace.stepCount} {trace.stepCount === 1 ? "evento" : "eventos"} · ejecución {trace.executionId.slice(0, 8)}</p>
                              {trace.parentTraceId ? <p className="mt-1 text-xs text-muted-foreground">Deriva de <Link href={`/trazabilidad/${trace.parentTraceId}`} className="underline underline-offset-2">{trace.parentTraceId.slice(0, 8)}</Link>{trace.sourceTraceId && trace.sourceTraceId !== trace.parentTraceId ? <> · insumos desde <Link href={`/trazabilidad/${trace.sourceTraceId}`} className="underline underline-offset-2">{trace.sourceTraceId.slice(0, 8)}</Link></> : null}</p> : trace.sourceTraceId ? <p className="mt-1 text-xs text-muted-foreground">Origen <Link href={`/trazabilidad/${trace.sourceTraceId}`} className="underline underline-offset-2">{trace.sourceTraceId.slice(0, 8)}</Link></p> : null}
                            </div>
                            <Link href={`/trazabilidad/${trace.id}`} className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-accent"><GitBranch size={14} aria-hidden="true" />Abrir ejecución</Link>
                          </div>
                          {trace.errors.length ? <ul className="mt-3 space-y-1 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs leading-5 text-destructive">{trace.errors.map((error, errorIndex) => <li key={`${errorIndex}-${error}`}>{error}</li>)}</ul> : null}
                          {trace.landings.length ? <div className="mt-3 flex flex-wrap gap-2">{trace.landings.map((landing) => <Link key={landing.id} href={`/library/${landing.id}`} className="inline-flex items-center gap-1.5 rounded-lg bg-primary/5 px-2.5 py-1.5 text-xs text-primary hover:bg-primary/10"><BookOpen size={12} aria-hidden="true" />{landing.title}<ArrowRight size={11} aria-hidden="true" /></Link>)}</div> : null}
                        </article>
                      </li>
                    ))}
                  </ol>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs leading-5 text-muted-foreground">Las carpetas siguen los identificadores rootTraceId guardados en el registro. Cada ejecución mantiene su estado, errores y enlace al detalle original.</p>
    </>
  );
}
