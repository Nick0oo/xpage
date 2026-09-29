import Link from "next/link";
import { BookOpen, Code2, GitBranch, Sparkles, WandSparkles } from "lucide-react";

type AppShellProps = {
  children: React.ReactNode;
  currentPage: "create" | "library" | "traces" | "eve";
};

export function AppShell({ children, currentPage }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border/80 bg-background/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Code2 size={20} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-lg font-semibold leading-tight tracking-tight">XPage</span>
              <span className="hidden text-xs text-muted-foreground sm:block">Estudio de landing pages</span>
            </span>
          </Link>

          <nav aria-label="Navegación principal" className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
            <Link
              href="/"
              aria-current={currentPage === "create" ? "page" : undefined}
              className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                currentPage === "create"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <WandSparkles size={15} strokeWidth={1.8} aria-hidden="true" />
              Crear
            </Link>
            <Link
              href="/library"
              aria-current={currentPage === "library" ? "page" : undefined}
              className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                currentPage === "library"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <BookOpen size={15} strokeWidth={1.8} aria-hidden="true" />
              Biblioteca
            </Link>
            <Link
              href="/trazabilidad"
              aria-current={currentPage === "traces" ? "page" : undefined}
              className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                currentPage === "traces"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <GitBranch size={15} strokeWidth={1.8} aria-hidden="true" />
              Trazabilidad
            </Link>
            <Link
              href="/eve-prueba"
              aria-current={currentPage === "eve" ? "page" : undefined}
              className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                currentPage === "eve"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Sparkles size={15} strokeWidth={1.8} aria-hidden="true" />
              Eve
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {children}
      </main>

      <footer className="mx-auto flex max-w-7xl flex-col gap-1 border-t border-border/70 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <span>XPage · prompts y landings en un solo espacio</span>
        <span>Tu Biblioteca se guarda en la base local de XPage</span>
      </footer>
    </div>
  );
}
