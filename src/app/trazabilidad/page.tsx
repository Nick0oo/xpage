import Link from "next/link";
import { ArrowRight, GitBranch } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { TraceList } from "@/components/trace-list";
import { listGenerationTraces } from "@/lib/generation-traces";

export const dynamic = "force-dynamic";

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
        ) : <TraceList traces={traces} />}
      </div>
    </AppShell>
  );
}
