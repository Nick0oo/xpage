"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  FileText,
  GitBranch,
  LayoutTemplate,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deleteLanding, listLandings } from "@/lib/landing-storage";
import { openPreviewDocument } from "@/lib/preview-document";
import { techniques } from "@/lib/techniques";
import type { SavedLanding } from "@/lib/schemas";

export function LandingList() {
  const [items, setItems] = useState<SavedLanding[]>([]);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [completedAttempt, setCompletedAttempt] = useState(-1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [promptLanding, setPromptLanding] = useState<SavedLanding | null>(null);
  const promptDialogRef = useRef<HTMLDialogElement>(null);
  const loaded = completedAttempt === retryCount;

  useEffect(() => {
    let current = true;

    listLandings()
      .then((landings) => {
        if (current) {
          setItems(landings);
          setLoadError("");
        }
      })
      .catch((error: unknown) => {
        if (current) {
          setLoadError(error instanceof Error ? error.message : "No se pudo cargar la Biblioteca local.");
        }
      })
      .finally(() => {
        if (current) setCompletedAttempt(retryCount);
      });

    return () => {
      current = false;
    };
  }, [retryCount]);

  useEffect(() => {
    const dialog = promptDialogRef.current;
    if (!dialog) return;

    if (promptLanding && !dialog.open) dialog.showModal();
    if (!promptLanding && dialog.open) dialog.close();
  }, [promptLanding]);

  async function removeLanding(item: SavedLanding) {
    if (!window.confirm(`¿Eliminar “${item.title}” de la Biblioteca?`)) return;
    setDeletingId(item.id);
    setActionError("");

    try {
      await deleteLanding(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo eliminar la landing.");
    } finally {
      setDeletingId(null);
    }
  }

  if (!loaded) {
    return (
      <div aria-label="Cargando Biblioteca" className="grid min-h-36 place-items-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
        Cargando tus páginas guardadas…
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-4 rounded-2xl border border-destructive/30 bg-card px-6 py-8 text-center">
        <p role="alert" className="text-sm text-destructive">{loadError}</p>
        <Button type="button" variant="outline" onClick={() => setRetryCount((count) => count + 1)}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
        <div className="mx-auto grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
          <LayoutTemplate size={20} aria-hidden="true" />
        </div>
        <h2 className="mt-4 font-display text-2xl">Tu Biblioteca empieza aquí</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Guarda las landings que te gusten para volver a verlas, consultar su prompt y revisar cómo se generaron.
        </p>
        <Link href="/" className={`${buttonVariants()} mt-5`}>
          Crear una landing
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {actionError ? <p role="alert" className="text-sm text-destructive">{actionError}</p> : null}
      <ul className="space-y-2.5">
        {items.map((item) => {
          const names = item.techniqueIds
            .map((id) => techniques.find((technique) => technique.id === id)?.name)
            .filter((name): name is string => Boolean(name));
          const formattedDate = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(item.createdAt));
          const previewCode = { title: item.title, html: item.html, css: item.css, js: item.js };

          return (
            <li key={item.id}>
              <Card className="group gap-0 overflow-hidden border-border/80 bg-card py-0 shadow-none transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-primary/30 hover:shadow-[0_10px_28px_-24px_var(--foreground)]">
                <CardContent className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-3">
                  <div className="flex min-w-0 items-start gap-3 sm:flex-1 sm:items-center">
                    <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-primary/10 bg-primary/5 text-primary transition-colors group-hover:bg-primary/10 sm:mt-0">
                      <LayoutTemplate size={17} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-display text-base leading-snug sm:text-lg">{item.title}</h2>
                      <div className="mt-1 flex min-w-0 items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground" title={`${item.brief.topic} · ${item.brief.audience}`}>
                          {item.brief.topic} <span aria-hidden="true">·</span> {item.brief.audience}
                        </p>
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays size={13} aria-hidden="true" />
                          <time dateTime={item.createdAt}>{formattedDate}</time>
                        </span>
                      </div>
                      <div className="mt-2 flex min-h-6 flex-wrap items-center gap-1.5" aria-label="Técnicas aplicadas">
                        {names.slice(0, 2).map((name) => (
                          <span key={name} className="inline-flex items-center gap-1 rounded-md bg-secondary/70 px-2 py-1 text-[0.7rem] leading-none text-secondary-foreground">
                            <Sparkles size={11} aria-hidden="true" />
                            {name}
                          </span>
                        ))}
                        {names.length > 2 ? (
                          <span className="rounded-md bg-muted px-2 py-1 text-[0.7rem] leading-none text-muted-foreground">+{names.length - 2}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 border-t border-border/70 pt-3 sm:shrink-0 sm:flex-nowrap sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                    <Button type="button" size="sm" onClick={() => openPreviewDocument(previewCode)}>
                      Ver página
                      <ArrowUpRight aria-hidden="true" />
                    </Button>
                    {item.traceId ? (
                      <Link href={`/trazabilidad/${item.traceId}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                        <GitBranch aria-hidden="true" />
                        Ver trazabilidad
                      </Link>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled
                        title="Esta landing se guardó antes de habilitar la trazabilidad."
                      >
                        <GitBranch aria-hidden="true" />
                        Ver trazabilidad
                      </Button>
                    )}
                    <Button type="button" variant="outline" size="sm" onClick={() => setPromptLanding(item)}>
                      <FileText aria-hidden="true" />
                      Ver prompt
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-auto text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:ml-0"
                      onClick={() => void removeLanding(item)}
                      disabled={deletingId === item.id}
                      aria-label={`Borrar ${item.title}`}
                    >
                      <Trash2 aria-hidden="true" />
                      {deletingId === item.id ? "Borrando…" : "Borrar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>

      <dialog
        ref={promptDialogRef}
        aria-labelledby="landing-prompt-title"
        onClose={() => setPromptLanding(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setPromptLanding(null);
        }}
        className="m-auto max-h-[min(82dvh,48rem)] w-[min(42rem,calc(100%-2rem))] max-w-none overflow-hidden rounded-2xl border border-border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-foreground/35 backdrop:backdrop-blur-[2px] open:animate-in open:fade-in-0 open:zoom-in-95 open:duration-150"
      >
        {promptLanding ? (
          <div className="flex max-h-[min(82dvh,48rem)] flex-col">
            <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-primary">Prompt utilizado</p>
                <h2 id="landing-prompt-title" className="mt-1 truncate font-display text-xl sm:text-2xl">{promptLanding.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">Texto exacto enviado para construir esta landing.</p>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Cerrar prompt" onClick={() => setPromptLanding(null)}>
                <X aria-hidden="true" />
              </Button>
            </header>
            <div className="overflow-y-auto px-5 py-5 sm:px-6">
              <pre className="whitespace-pre-wrap break-words rounded-xl border border-border/80 bg-muted/45 p-4 font-mono text-xs leading-6 text-foreground sm:text-[0.82rem]">{promptLanding.prompt}</pre>
            </div>
            <footer className="flex justify-end border-t border-border px-5 py-3 sm:px-6">
              <Button type="button" variant="outline" onClick={() => setPromptLanding(null)}>Cerrar</Button>
            </footer>
          </div>
        ) : null}
      </dialog>
    </div>
  );
}
