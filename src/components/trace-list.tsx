"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, BookOpen, GitBranch } from "lucide-react";
import type { listGenerationTraces } from "@/lib/generation-traces";

type TraceListItem = Awaited<ReturnType<typeof listGenerationTraces>>[number];

function statusLabel(status: string) {
  if (status === "completed") return "completado";
  if (status === "failed") return "falló";
  if (status === "prompt-ready") return "prompt listo";
  return "en curso";
}

export function TraceList({ traces }: { traces: TraceListItem[] }) {
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const categories = useMemo(() => [...new Set(traces.map((trace) => trace.category))].sort(), [traces]);
  const filtered = traces.filter((trace) =>
    (status === "all" || trace.status === status) &&
    (category === "all" || trace.category === category) &&
    (!query || `${trace.title} ${trace.category} ${trace.landings.map((landing) => landing.title).join(" ")}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())),
  );

  return (
    <>
      <section aria-label="Filtros de trazabilidad" className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_2fr]">
        <label className="grid gap-1 text-xs text-muted-foreground">Estado
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground">
            <option value="all">Todos</option><option value="active">En curso</option><option value="prompt-ready">Prompt listo</option><option value="failed">Fallidos</option><option value="completed">Completados</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">Tipo
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground">
            <option value="all">Todos los tipos</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">Buscar
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre de proceso o landing" className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground" />
        </label>
      </section>
      {filtered.length === 0 ? <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No hay procesos que coincidan con estos filtros.</p> : (
        <ul className="space-y-3">
          {filtered.map((trace) => (
            <li key={trace.id}>
              <Link href={`/trazabilidad/${trace.id}`} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/25 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{trace.title}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(trace.updatedAt))} · {trace.stepCount} {trace.stepCount === 1 ? "paso" : "pasos"}{trace.landings.length ? ` · ${trace.landings[0].title}` : ""}
                  </span>
                </span>
                <span className="flex shrink-0 flex-wrap items-center gap-2 self-start sm:self-center">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${trace.savedToLibrary ? "border-primary/20 bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}>
                    {trace.savedToLibrary ? <BookOpen size={13} aria-hidden="true" /> : <GitBranch size={13} aria-hidden="true" />}{trace.savedToLibrary ? "En Biblioteca" : trace.stepCount === 0 ? "Sin eventos" : "Solo trazabilidad"}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">{trace.category} · {statusLabel(trace.status)}<ArrowRight size={13} aria-hidden="true" /></span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
