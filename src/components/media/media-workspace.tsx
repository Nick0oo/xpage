/* eslint-disable @next/next/no-img-element -- Pexels preview renditions are already small and are not proxied through Next Image. */
"use client";

import { useState } from "react";
import { Film, ImagePlus, LoaderCircle, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Brief } from "@/lib/schemas";
import type { DesignPlan } from "@/lib/design-plan";
import type { ModelChoice } from "@/lib/model-choice";
import type { MediaAssetRecord } from "@/lib/media/types";

type SearchItem = {
  id: number;
  type: "image" | "video";
  previewUrl: string;
  sourceUrl: string;
  mediaUrl?: string;
  creditUrl: string;
  author: string;
  altText: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
};

type Props = {
  brief: Brief;
  modelChoice: ModelChoice;
  modelChoiceConfirmed?: boolean;
  traceId: string;
  savedLandingId: string | null;
  designPlan: DesignPlan | null;
  assets: MediaAssetRecord[];
  onAssetAdded: (asset: MediaAssetRecord, html: string) => void;
};

export function MediaWorkspace({ brief, modelChoice, modelChoiceConfirmed = true, traceId, savedLandingId, designPlan, assets, onAssetAdded }: Props) {
  const [type, setType] = useState<"image" | "video">("image");
  const [query, setQuery] = useState(brief.topic);
  const [searchedQuery, setSearchedQuery] = useState(brief.topic);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectingId, setSelectingId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [sectionId, setSectionId] = useState("");
  const [slotId, setSlotId] = useState("");
  const [altText, setAltText] = useState("");
  const [costAccepted, setCostAccepted] = useState(false);
  const [previewId, setPreviewId] = useState<number | null>(null);

  const availableSlots = designPlan?.mediaSlots ?? [];
  const availableSections = designPlan?.sections.filter((section) => section.mediaSlotIds.some((id) => availableSlots.some((slot) => slot.id === id && slot.type === type))) ?? [];
  const selectedSection = availableSections.find((section) => section.id === sectionId) ?? availableSections[0];
  const slotsForSection = selectedSection ? availableSlots.filter((slot) => slot.type === type && selectedSection.mediaSlotIds.includes(slot.id)) : [];
  const selectedSlot = slotsForSection.find((slot) => slot.id === slotId) ?? slotsForSection[0];
  const slotSearchQueries = selectedSlot && "searchQueries" in selectedSlot
    ? ((selectedSlot as typeof selectedSlot & { searchQueries?: string[] }).searchQueries ?? [])
    : [];
  const selectionCriteria = selectedSlot && "selectionCriteria" in selectedSlot
    ? (selectedSlot as typeof selectedSlot & { selectionCriteria?: string }).selectionCriteria
    : undefined;

  function useSuggestedQuery(value: string) {
    setQuery(value);
    setItems([]);
  }

  async function search() {
    if (query.trim().length < 2) return setError("Escribe al menos dos caracteres para buscar.");
    setLoading(true);
    setError("");
    setItems([]);
    setPage(1);
    setSearchedQuery(query.trim());
    try {
      const response = await fetch(`/api/media/search?q=${encodeURIComponent(query)}&type=${type}&page=1&traceId=${encodeURIComponent(traceId)}`, { cache: "no-store" });
      const payload = await response.json() as { items?: SearchItem[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "No se pudo buscar en Pexels.");
      setItems(payload.items ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo buscar en Pexels.");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    const nextPage = page + 1;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/media/search?q=${encodeURIComponent(searchedQuery)}&type=${type}&page=${nextPage}&traceId=${encodeURIComponent(traceId)}`, { cache: "no-store" });
      const payload = await response.json() as { items?: SearchItem[]; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "No se pudo cargar la página siguiente.");
      setItems((current) => [...current, ...(payload.items ?? [])]);
      setPage(nextPage);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cargar la página siguiente.");
    } finally {
      setLoading(false);
    }
  }

  async function addStock(item: SearchItem) {
    if (!savedLandingId || !selectedSection || !selectedSlot) return;
    setSelectingId(item.id);
    setError("");
    try {
      const response = await fetch("/api/media/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, type, query: searchedQuery, savedLandingId, traceId, sectionId: selectedSection.id, slotId: selectedSlot.id, altText: altText || item.altText }),
      });
      const payload = await response.json() as { asset?: MediaAssetRecord; html?: string; error?: string };
      if (!response.ok || !payload.asset || typeof payload.html !== "string") throw new Error(payload.error ?? "No se pudo colocar el medio.");
      onAssetAdded(payload.asset, payload.html);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo colocar el medio.");
    } finally {
      setSelectingId(null);
    }
  }

  async function generateImage() {
    if (!modelChoiceConfirmed || !savedLandingId || !selectedSection || !selectedSlot || !costAccepted) return;
    setGenerating(true);
    setError("");
    try {
      const response = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, modelChoice, traceId, destination: { savedLandingId, sectionId: selectedSection.id, slotId: selectedSlot.id, altText: altText || selectedSlot.altText } }),
      });
      const payload = await response.json() as { asset?: MediaAssetRecord; html?: string; error?: string };
      if (!response.ok || !payload.asset || typeof payload.html !== "string") throw new Error(payload.error ?? "No se pudo generar la imagen.");
      onAssetAdded(payload.asset, payload.html);
      setCostAccepted(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo generar la imagen.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section aria-labelledby="media-workspace-title" className="max-h-[min(78dvh,50rem)] space-y-4 overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-xl sm:p-5">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Medios locales</p>
        <h2 id="media-workspace-title" className="mt-1 font-display text-xl">Elige una foto o un clip</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">El archivo elegido se descarga a este equipo y se asigna a un espacio del plan. No se genera video.</p>
      </header>

      {!savedLandingId ? (
        <p role="status" className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">Guarda la landing en Biblioteca antes de añadir medios.</p>
      ) : null}
      {designPlan && availableSlots.length === 0 ? <p className="rounded-lg border border-border p-3 text-sm text-muted-foreground">Este plan no define un espacio de {type === "image" ? "imagen" : "video"}; construye otra dirección que lo incluya.</p> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="media-section">Sección</Label>
          <select id="media-section" value={selectedSection?.id ?? ""} onChange={(event) => { setSectionId(event.target.value); setSlotId(""); }} disabled={!savedLandingId || availableSections.length === 0} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {availableSections.map((section) => <option key={section.id} value={section.id}>{section.role} · {section.headline}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="media-slot">Espacio del plan</Label>
          <select id="media-slot" value={selectedSlot?.id ?? ""} onChange={(event) => setSlotId(event.target.value)} disabled={!savedLandingId || slotsForSection.length === 0} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {slotsForSection.map((slot) => <option key={slot.id} value={slot.id}>{slot.purpose} · {slot.subject}</option>)}
          </select>
        </div>
      </div>
      {selectedSlot ? <div className="space-y-1 rounded-lg bg-muted/50 p-3 text-xs leading-5 text-muted-foreground"><p>{selectedSlot.purpose}: {selectedSlot.subject}. {selectedSlot.framing} · {selectedSlot.aspectRatio} · Texto alternativo: {selectedSlot.altText}</p>{selectionCriteria ? <p><strong className="text-foreground">Criterio de selección:</strong> {selectionCriteria}</p> : null}</div> : null}
      <div className="space-y-1.5">
        <Label htmlFor="media-alt">Texto alternativo</Label>
        <Input id="media-alt" value={altText} onChange={(event) => setAltText(event.target.value)} placeholder={selectedSlot?.altText ?? "Describe lo que importa en la imagen"} maxLength={300} />
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Tipo de medio">
        <Button type="button" size="sm" variant={type === "image" ? "secondary" : "outline"} aria-pressed={type === "image"} onClick={() => { setType("image"); setItems([]); setError(""); }}> <ImagePlus aria-hidden="true" /> Fotos</Button>
        <Button type="button" size="sm" variant={type === "video" ? "secondary" : "outline"} aria-pressed={type === "video"} onClick={() => { setType("video"); setItems([]); setError(""); }}> <Film aria-hidden="true" /> Videos de stock</Button>
      </div>

      <div className="flex gap-2">
        <Input aria-label={`Buscar ${type === "image" ? "fotos" : "videos"} en Pexels`} value={query} onChange={(event) => { setQuery(event.target.value); setItems([]); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void search(); } }} maxLength={120} />
        <Button type="button" variant="outline" onClick={() => void search()} disabled={loading || query.trim().length < 2} aria-label="Buscar en Pexels">{loading ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Search aria-hidden="true" />} Buscar</Button>
      </div>
      {slotSearchQueries.length ? <div className="space-y-1"><p className="text-[11px] font-medium text-muted-foreground">Consultas sugeridas para este espacio</p><div className="flex flex-wrap gap-1.5">{slotSearchQueries.map((suggestion) => <button key={suggestion} type="button" onClick={() => useSuggestedQuery(suggestion)} className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-foreground hover:border-primary/40">{suggestion}</button>)}</div></div> : null}
      <a href="https://www.pexels.com" target="_blank" rel="noreferrer" className="inline-flex text-xs font-medium text-primary underline underline-offset-4">Fotos y vídeos de Pexels · ver licencias y autores</a>

      {type === "image" && savedLandingId ? (
        <details className="rounded-xl border border-border p-3">
          <summary className="cursor-pointer text-sm font-medium">Generar una imagen opcional con OpenRouter</summary>
          <div className="mt-3 space-y-3">
            <p className="text-xs leading-5 text-muted-foreground">Usa el modelo de imagen configurado por el proyecto. El costo depende de ese proveedor y modelo; XPage no cobra ni genera nada hasta que confirmes.</p>
            <label className="flex items-start gap-2 text-xs leading-5"><input type="checkbox" checked={costAccepted} onChange={(event) => setCostAccepted(event.target.checked)} className="mt-1 size-4 accent-primary" />Confirmo que esta llamada puede generar un cargo según la configuración de OpenRouter.</label>
            {!modelChoiceConfirmed ? <p role="status" className="text-xs leading-5 text-amber-800">Confirma el modelo en los datos del borrador antes de generar una imagen.</p> : null}
            <Button type="button" size="sm" onClick={() => void generateImage()} disabled={!modelChoiceConfirmed || !costAccepted || generating || !selectedSlot}>
              {generating ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}{generating ? "Generando imagen…" : "Generar y colocar imagen"}
            </Button>
          </div>
        </details>
      ) : null}

      {error ? <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p> : null}
      {items.length ? <ul className="grid gap-3 sm:grid-cols-2">{items.map((item) => {
        const alreadyUsed = assets.some((asset) => asset.providerAssetId === String(item.id) && asset.provider === "pexels");
        return <li key={`${item.type}-${item.id}`} className="overflow-hidden rounded-xl border border-border">
          {item.type === "video" && previewId === item.id && item.mediaUrl ? <video controls autoPlay muted playsInline poster={item.previewUrl} className="aspect-video w-full bg-muted object-cover"><source src={item.mediaUrl} type="video/mp4" /></video> : <img src={item.previewUrl} alt={item.altText} loading="lazy" className="aspect-video w-full bg-muted object-cover" />}
          <div className="space-y-2 p-3">
            <p className="truncate text-sm font-medium">{item.type === "image" ? "Foto" : `Video · ${item.durationSeconds ?? 0}s`} por <a href={item.creditUrl} target="_blank" rel="noreferrer" className="text-primary underline">{item.author}</a></p>
            <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground underline">Ver en Pexels</a>
            {item.type === "video" && item.mediaUrl ? <Button type="button" size="sm" variant="ghost" className="w-full" onClick={() => setPreviewId((current) => current === item.id ? null : item.id)}>{previewId === item.id ? "Cerrar vista del video" : "Previsualizar video"}</Button> : null}
            <Button type="button" size="sm" variant="outline" className="w-full" disabled={!savedLandingId || !selectedSlot || selectingId !== null || loading || alreadyUsed} onClick={() => void addStock(item)}>
              {selectingId === item.id ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}{alreadyUsed ? "Ya está en esta landing" : selectingId === item.id ? "Descargando…" : `Usar en ${selectedSection?.role ?? "sección"}`}
            </Button>
          </div>
        </li>;
      })}</ul> : null}
      {items.length === 0 && !loading ? <p className="text-xs text-muted-foreground">Busca un término para ver resultados. La API de Pexels requiere una clave de servidor.</p> : null}
      {items.length >= 12 ? <Button type="button" variant="ghost" onClick={() => void loadMore()} disabled={loading} className="w-full">{loading ? "Cargando…" : "Más resultados"}</Button> : null}
      {assets.length ? <p className="text-xs text-muted-foreground">{assets.length} medio{assets.length === 1 ? "" : "s"} colocado{assets.length === 1 ? "" : "s"} · se incluirán en Biblioteca, traza y paquete de exportación.</p> : null}
    </section>
  );
}
