import Link from "next/link";
import { ArrowRight, BookOpen, GitBranch } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { listGenerationTraces } from "@/lib/generation-traces";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function TracesPage() {
  const traces = await listGenerationTraces();

  return (
    <AppShell currentPage="traces">
      <div className="mx-auto max-w-4xl space-y-7">
        <header className="border-b border-border pb-5">
          <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-primary">
            <GitBranch size={14} aria-hidden="true" /> Registro de actividad
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">Trazabilidad</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Cada landing aparece aquí al construirse, se guarde o no en la Biblioteca. Revisa sus técnicas,
            prompts, proveedores y activos generados.
          </p>
        </header>

        {traces.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
            <p className="font-display text-2xl">Todavía no hay procesos registrados</p>
            <p className="mt-2 text-sm text-muted-foreground">Construye una landing para ver aquí su proceso y sus prompts.</p>
            <Link href="/" className="mt-4 inline-flex min-h-9 items-center rounded-md px-3 text-sm font-medium text-primary hover:bg-accent">
              Ir al Estudio <ArrowRight size={14} className="ml-2" aria-hidden="true" />
            </Link>
          </section>
        ) : (
          <ul className="space-y-3">
            {traces.map((trace) => (
              <li key={trace.id}>
                <Link
                  href={`/trazabilidad/${trace.id}`}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent/25 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{trace.title}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {formatDate(trace.updatedAt)} · {trace.stepCount} {trace.stepCount === 1 ? "paso" : "pasos"}
                      {trace.landings.length ? ` · ${trace.landings[0].title}` : ""}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-wrap items-center gap-2 self-start sm:self-center">
                    <span
                      aria-label={trace.savedToLibrary ? "Guardada en Biblioteca" : "No guardada en Biblioteca"}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${trace.savedToLibrary ? "border-primary/20 bg-primary/5 text-primary" : "border-border text-muted-foreground"}`}
                    >
                      {trace.savedToLibrary ? <BookOpen size={13} aria-hidden="true" /> : <GitBranch size={13} aria-hidden="true" />}
                      {trace.savedToLibrary ? "En Biblioteca" : "Solo trazabilidad"}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                      {trace.category} · {trace.status === "completed" ? "completado" : trace.status === "failed" ? "falló" : "en curso"}
                      <ArrowRight size={13} aria-hidden="true" />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
