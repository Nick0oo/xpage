"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Archive, ArrowRight, BookOpen, Download, FileText, GitBranch, LayoutTemplate, LoaderCircle, Pencil, Search, Sparkles, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { deleteLanding, listLandings } from "@/lib/landing-storage";
import { buildPreviewDocument, makeDownloadName, openPreviewDocument } from "@/lib/preview-document";
import { techniques } from "@/lib/techniques";
import { savedLandingSchema, type SavedLanding } from "@/lib/schemas";
import type { GenerationDraft } from "@/lib/collection-drafts";

type CollectionTab = "saved" | "drafts";

function PreviewThumbnail({ title, html, css, js }: { title: string; html: string; css: string; js: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.35);
  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / 1100)));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={wrapperRef} aria-label={`Vista previa reducida de ${title}`} className="w-full overflow-hidden border-b border-border bg-white" style={{ height: `${620 * scale}px` }}>
      <iframe title={`Vista previa de ${title}`} srcDoc={buildPreviewDocument({ title, html, css, js })} sandbox="" referrerPolicy="no-referrer" loading="lazy" tabIndex={-1} className="origin-top-left border-0 bg-white" style={{ width: 1100, height: 620, transform: `scale(${scale})`, pointerEvents: "none" }} />
    </div>
  );
}

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  const payload = await response.json().catch(() => null) as T | { error?: string } | null;
  if (!response.ok) {
    throw new Error(payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
      ? payload.error
      : "No se pudo cargar la colección.");
  }
  return payload as T;
}

function downloadLanding(title: string, html: string, css: string, js: string) {
  const blob = new Blob([buildPreviewDocument({ title, html, css, js })], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = makeDownloadName(title);
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function draftAsLanding(draft: GenerationDraft) {
  return savedLandingSchema.safeParse({
    id: draft.id,
    title: draft.title,
    brief: draft.brief,
    techniqueIds: draft.techniqueIds,
    prompt: draft.prompt,
    creativeDirection: null,
    sectionRevision: 0,
    modelChoice: draft.modelChoice,
    html: draft.html,
    css: draft.css,
    js: draft.js,
    traceId: draft.id,
    mediaAssets: [],
    createdAt: draft.createdAt,
  });
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(date));
}

export function LandingList() {
  const [items, setItems] = useState<SavedLanding[]>([]);
  const [drafts, setDrafts] = useState<GenerationDraft[]>([]);
  const [tab, setTab] = useState<CollectionTab>("saved");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [promptItem, setPromptItem] = useState<{ title: string; prompt: string | null } | null>(null);

  useEffect(() => {
    let current = true;
    setLoaded(false);
    Promise.all([listLandings(), readJson<GenerationDraft[]>("/api/drafts")])
      .then(([landings, generations]) => {
        if (!current) return;
        setItems(landings);
        setDrafts(generations);
        setLoadError("");
      })
      .catch((error: unknown) => {
        if (current) setLoadError(error instanceof Error ? error.message : "No se pudo cargar la Biblioteca local.");
      })
      .finally(() => { if (current) setLoaded(true); });
    return () => { current = false; };
  }, [retryCount]);

  const categories = useMemo(() => [...new Set(items.map((item) => item.brief.topic).filter(Boolean))].sort(), [items]);
  const filteredItems = items.filter((item) =>
    (category === "all" || item.brief.topic === category) &&
    (!query || `${item.title} ${item.brief.topic} ${item.brief.audience}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())),
  );
  const filteredDrafts = drafts.filter((draft) =>
    !query || `${draft.title} ${draft.brief?.topic ?? ""} ${draft.brief?.audience ?? ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );

  async function removeLanding(item: SavedLanding) {
    if (!window.confirm(`¿Eliminar “${item.title}” de la Biblioteca?`)) return;
    setBusyId(item.id);
    setActionError("");
    try {
      await deleteLanding(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo eliminar la landing.");
    } finally { setBusyId(null); }
  }

  async function saveDraft(draft: GenerationDraft) {
    const parsed = draftAsLanding(draft);
    if (!parsed.success) {
      setActionError("Faltan datos obligatorios para guardar. Completa el brief, las técnicas y el prompt en el proceso original.");
      return;
    }
    setBusyId(draft.id);
    setActionError("");
    try {
      const response = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result = await response.json().catch(() => null) as SavedLanding | { error?: string } | null;
      if (!response.ok || !result || !("html" in result)) {
        throw new Error(result && "error" in result && typeof result.error === "string" ? result.error : "No se pudo guardar la generación.");
      }
      setItems((current) => [result, ...current.filter((item) => item.id !== result.id)]);
      setDrafts((current) => current.filter((item) => item.id !== draft.id));
      setTab("saved");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo guardar la generación.");
    } finally { setBusyId(null); }
  }

  if (!loaded) return <div aria-label="Cargando Biblioteca" className="grid min-h-44 place-items-center rounded-2xl border border-border bg-card text-sm text-muted-foreground"><LoaderCircle className="mr-2 animate-spin" size={16} aria-hidden="true" />Cargando páginas y generaciones…</div>;
  if (loadError) return <div className="space-y-4 rounded-2xl border border-destructive/30 bg-card px-6 py-8 text-center"><p role="alert" className="text-sm text-destructive">{loadError}</p><Button type="button" variant="outline" onClick={() => setRetryCount((count) => count + 1)}>Reintentar</Button></div>;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[1fr_auto] sm:items-end sm:p-5">
        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
          Buscar en la colección
          <span className="relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, tema o audiencia" className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" /></span>
        </label>
        <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Tema
          <select value={category} onChange={(event) => setCategory(event.target.value)} disabled={tab === "drafts"} className="h-10 min-w-48 rounded-lg border border-input bg-background px-3 text-sm text-foreground disabled:opacity-50">
            <option value="all">Todos los temas</option>{categories.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
      </div>

      <div role="tablist" aria-label="Contenido de Biblioteca" className="flex w-fit gap-1 rounded-xl border border-border bg-muted/55 p-1">
        <button type="button" role="tab" aria-selected={tab === "saved"} onClick={() => setTab("saved")} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors ${tab === "saved" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><BookOpen size={15} aria-hidden="true" />Guardadas <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{items.length}</span></button>
        <button type="button" role="tab" aria-selected={tab === "drafts"} onClick={() => setTab("drafts")} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors ${tab === "drafts" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><Archive size={15} aria-hidden="true" />Sin guardar <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{drafts.length}</span></button>
      </div>

      {actionError ? <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-sm text-destructive">{actionError}</p> : null}

      {tab === "saved" ? filteredItems.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border bg-card/70 px-6 py-12 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><LayoutTemplate size={21} aria-hidden="true" /></div>
          <h2 className="mt-4 font-display text-2xl">{items.length ? "No hay páginas con esta búsqueda" : "Tu Biblioteca empieza aquí"}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{items.length ? "Prueba otra palabra o cambia el tema para encontrar tus páginas." : "Las generaciones aparecen en Sin guardar. Guarda explícitamente las que quieras conservar en esta colección."}</p>
          {!items.length ? <Link href="/" className={`${buttonVariants()} mt-5`}><Sparkles size={15} aria-hidden="true" /> Crear una página</Link> : null}
        </section>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {filteredItems.map((item) => {
            const names = item.techniqueIds.map((id) => techniques.find((technique) => technique.id === id)?.name).filter((name): name is string => Boolean(name));
            return <li key={item.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
              <PreviewThumbnail title={item.title} html={item.html} css={item.css} js={item.js} />
              <div className="space-y-4 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-primary">{item.brief.topic}</p><h2 className="mt-1 truncate font-display text-2xl">{item.title}</h2><p className="mt-1 text-sm text-muted-foreground">{item.brief.audience}</p></div><span className="shrink-0 rounded-lg bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">{dateLabel(item.createdAt)}</span></div>
                <div className="flex min-h-6 flex-wrap gap-1.5">{names.slice(0, 3).map((name) => <span key={name} className="rounded-md bg-secondary/70 px-2 py-1 text-xs text-secondary-foreground">{name}</span>)}{names.length > 3 ? <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">+{names.length - 3}</span> : null}</div>
                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  <Link href={`/library/${item.id}`} className={buttonVariants({ size: "sm" })}>Detalles <ArrowRight size={14} aria-hidden="true" /></Link>
                  <Button type="button" variant="outline" size="sm" onClick={() => openPreviewDocument(item)}>Ver página</Button>
                  <Link href={`/?landingId=${encodeURIComponent(item.id)}`} className={buttonVariants({ variant: "outline", size: "sm" })}><Pencil size={14} aria-hidden="true" /> Studio</Link>
                  {item.traceId ? <Link href={`/trazabilidad/${item.traceId}`} className={buttonVariants({ variant: "outline", size: "sm" })}><GitBranch size={14} aria-hidden="true" /> Proceso</Link> : null}
                  <Button type="button" variant="ghost" size="sm" className="ml-auto text-muted-foreground hover:text-destructive" onClick={() => void removeLanding(item)} disabled={busyId === item.id}><Trash2 size={14} aria-hidden="true" />Eliminar</Button>
                </div>
              </div>
            </li>;
          })}
        </ul>
      ) : filteredDrafts.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border bg-card/70 px-6 py-12 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><Archive size={20} aria-hidden="true" /></div><h2 className="mt-4 font-display text-2xl">{drafts.length ? "No hay generaciones con esta búsqueda" : "No hay generaciones pendientes"}</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Las salidas completas de los procesos aparecen aquí hasta que decidas guardarlas.</p><Link href="/" className={`${buttonVariants({ variant: "outline" })} mt-5`}>Ir al Studio</Link></section>
      ) : (
        <ul className="grid gap-4 xl:grid-cols-2">
          {filteredDrafts.map((draft) => {
            const canSave = draftAsLanding(draft).success;
            return <li key={draft.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <PreviewThumbnail title={draft.title} html={draft.html} css={draft.css} js={draft.js} />
              <div className="space-y-4 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Generación sin guardar</p><h2 className="mt-1 truncate font-display text-2xl">{draft.title}</h2><p className="mt-1 text-sm text-muted-foreground">{draft.brief ? `${draft.brief.topic} · ${draft.brief.audience}` : "Brief no disponible en esta traza"}</p></div><span className="shrink-0 rounded-lg bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">{dateLabel(draft.createdAt)}</span></div>
                <div className="flex flex-wrap gap-1.5">{draft.techniqueIds.length ? draft.techniqueIds.map((id) => <span key={id} className="rounded-md bg-secondary/70 px-2 py-1 text-xs text-secondary-foreground">{techniques.find((technique) => technique.id === id)?.name ?? id}</span>) : <span className="rounded-md border border-dashed border-border px-2 py-1 text-xs text-muted-foreground">Técnicas sin registrar</span>}</div>
                <p className="text-xs text-muted-foreground">Modelo en la traza: <span className="font-mono">{draft.originalModel ?? "sin registro"}</span>{draft.modelChoice ? ` · Para continuar/guardar: ${draft.modelChoice}` : " · Elige un modelo antes de continuar o guardar"}</p>
                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  <Link href={`/?draft=${encodeURIComponent(draft.id)}`} className={buttonVariants({ size: "sm" })}><Pencil size={14} aria-hidden="true" /> Abrir en Studio</Link>
                  <Button type="button" variant="outline" size="sm" onClick={() => openPreviewDocument(draft)}>Ver página</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => downloadLanding(draft.title, draft.html, draft.css, draft.js)}><Download size={14} aria-hidden="true" /> Descargar</Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setPromptItem({ title: draft.title, prompt: draft.prompt })}><FileText size={14} aria-hidden="true" /> Prompt</Button>
                  <Link href={`/trazabilidad/${draft.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}><GitBranch size={14} aria-hidden="true" /> Trazabilidad</Link>
                  <Button type="button" size="sm" className="ml-auto" onClick={() => void saveDraft(draft)} disabled={!canSave || busyId === draft.id} title={!canSave ? "Falta información requerida para guardar esta generación." : undefined}>{busyId === draft.id ? "Guardando…" : "Guardar"}</Button>
                </div>
                {!draft.completeness.hasBrief || !draft.completeness.hasTechniques || !draft.completeness.hasPrompt || !draft.completeness.hasModel ? <p className="text-xs leading-5 text-muted-foreground">La traza conserva una salida completa, pero no tiene todos los metadatos requeridos por Biblioteca. No se completan datos por suposición.</p> : null}
              </div>
            </li>;
          })}
        </ul>
      )}

      {promptItem ? <div role="presentation" className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4" onClick={(event) => { if (event.target === event.currentTarget) setPromptItem(null); }}><section role="dialog" aria-modal="true" aria-labelledby="collection-prompt-title" className="max-h-[80dvh] w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"><header className="border-b border-border px-5 py-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Prompt de origen</p><h2 id="collection-prompt-title" className="mt-1 font-display text-xl">{promptItem.title}</h2></header><div className="max-h-[60dvh] overflow-auto p-5">{promptItem.prompt ? <pre className="whitespace-pre-wrap break-words rounded-xl bg-muted/50 p-4 font-mono text-xs leading-5">{promptItem.prompt}</pre> : <p className="text-sm text-muted-foreground">Esta traza no conserva el prompt.</p>}</div><footer className="flex justify-end border-t border-border p-3"><Button type="button" variant="outline" onClick={() => setPromptItem(null)}>Cerrar</Button></footer></section></div> : null}
    </div>
  );
}
