import { AppShell } from "@/components/app-shell";
import { LandingList } from "@/components/library/landing-list";

export default function LibraryPage() {
  return (
    <AppShell currentPage="library">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="border-b border-border pb-5">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Colección local</p>
          <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">Biblioteca</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Explora tus páginas guardadas y recupera generaciones completas que todavía no has guardado.
          </p>
        </header>
        <LandingList />
      </div>
    </AppShell>
  );
}
