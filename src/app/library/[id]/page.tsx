"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { LandingPreview } from "@/components/preview/landing-preview";
import { Button, buttonVariants } from "@/components/ui/button";
import { getLanding } from "@/lib/landing-storage";
import { buildPreviewDocument, makeDownloadName, openPreviewDocument } from "@/lib/preview-document";
import type { SavedLanding } from "@/lib/schemas";

export default function SavedLandingPage() {
  const params = useParams<{ id: string }>();
  const [loadResult, setLoadResult] = useState<{
    id: string;
    landing: SavedLanding | null;
    error: string | null;
  } | null>(null);
  const [downloadError, setDownloadError] = useState("");
  const currentResult = loadResult?.id === params.id ? loadResult : null;
  const loaded = currentResult !== null;
  const landing = currentResult?.landing ?? null;
  const loadError = currentResult?.error ?? null;

  useEffect(() => {
    let current = true;

    getLanding(params.id)
      .then((saved) => {
        if (current) setLoadResult({ id: params.id, landing: saved, error: null });
      })
      .catch((error: unknown) => {
        if (current) {
          setLoadResult({
            id: params.id,
            landing: null,
            error: error instanceof Error ? error.message : "No se pudo abrir la landing guardada.",
          });
        }
      });

    return () => {
      current = false;
    };
  }, [params.id]);

  async function download() {
    if (!landing) return;
    setDownloadError("");
    if (landing.mediaAssets?.length) {
      try {
        const response = await fetch(`/api/media/export?id=${encodeURIComponent(landing.id)}`);
        if (!response.ok) {
          const payload = await response.json().catch(() => null) as { error?: unknown } | null;
          throw new Error(typeof payload?.error === "string" ? payload.error : "No se pudo crear el paquete de medios.");
        }
        const url = URL.createObjectURL(await response.blob());
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = makeDownloadName(landing.title).replace(/\.html$/, "-medios.zip");
        anchor.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (error) {
        setDownloadError(error instanceof Error ? error.message : "No se pudo crear el paquete de medios.");
      }
      return;
    }
    const { title, html, css, js } = landing;
    const blob = new Blob(
      [buildPreviewDocument({ title, html, css, js })],
      { type: "text/html;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = makeDownloadName(title);
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function openFullPage() {
    if (!landing) return;
    openPreviewDocument({ title: landing.title, html: landing.html, css: landing.css, js: landing.js });
  }

  return (
    <AppShell currentPage="library">
      {!loaded ? (
        <p role="status" className="py-12 text-center text-sm text-muted-foreground">Abriendo la landing…</p>
      ) : loadError ? (
        <div className="mx-auto max-w-xl rounded-2xl border border-destructive/30 bg-card px-6 py-10 text-center">
          <p role="alert" className="text-sm text-destructive">{loadError}</p>
          <Link href="/library" className={buttonVariants({ className: "mt-5" })}>
            <ArrowLeft size={14} aria-hidden="true" /> Volver a Biblioteca
          </Link>
        </div>
      ) : !landing ? (
        <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card px-6 py-10 text-center">
          <h1 className="font-display text-3xl">No encontramos esta landing</h1>
          <p className="mt-2 text-sm text-muted-foreground">Puede haberse eliminado de la Biblioteca local.</p>
          <Link href="/library" className={buttonVariants({ className: "mt-5" })}>
            <ArrowLeft size={14} aria-hidden="true" /> Volver a Biblioteca
          </Link>
        </div>
      ) : (
        <div className="space-y-7">
          <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Link href="/library" className={buttonVariants({ variant: "ghost", className: "-ml-2 mb-3" })}>
                <ArrowLeft size={15} aria-hidden="true" /> Biblioteca
              </Link>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Página guardada</p>
              <h1 className="mt-1 font-display text-3xl leading-tight sm:text-4xl">{landing.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{landing.brief.topic} · Guardada el {new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(new Date(landing.createdAt))} · Versión {landing.sectionRevision ?? 0}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={openFullPage}>
                <ExternalLink size={15} aria-hidden="true" /> Abrir página completa
              </Button>
              <Button type="button" variant="outline" onClick={download}>
                <Download size={15} aria-hidden="true" /> {landing.mediaAssets?.length ? "Descargar paquete ZIP" : "Descargar HTML"}
              </Button>
              {downloadError ? <p role="alert" className="text-xs text-destructive sm:self-center">{downloadError}</p> : null}
            </div>
          </div>

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <LandingPreview code={landing} />
            <div className="space-y-5">
              <section className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Proceso</p>
                {landing.traceId ? (
                  <>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Consulta las técnicas, prompts, respuestas y proveedores usados para crear esta página.
                    </p>
                    <Link
                      href={`/trazabilidad/${landing.traceId}`}
                      className="mt-3 inline-flex min-h-9 items-center rounded-md px-3 text-sm font-medium text-primary hover:bg-accent"
                    >
                      Ver trazabilidad completa
                    </Link>
                  </>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Esta landing se guardó antes de activar la trazabilidad; su prompt final sigue disponible abajo.
                  </p>
                )}
              </section>
              {landing.creativeDirection ? (
                <section aria-labelledby="saved-direction-heading" className="rounded-xl border border-primary/20 bg-card p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.15em] text-primary">Dirección elegida</p>
                  <h2 id="saved-direction-heading" className="mt-1 font-display text-xl">{landing.creativeDirection.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{landing.creativeDirection.concept}</p>
                  <dl className="mt-3 grid gap-2 text-xs leading-5 sm:grid-cols-2">
                    <div><dt className="font-semibold">Narrativa</dt><dd className="text-muted-foreground">{landing.creativeDirection.narrative}</dd></div>
                    <div><dt className="font-semibold">Paleta y tipografía</dt><dd className="text-muted-foreground">{landing.creativeDirection.palette} · {landing.creativeDirection.typography}</dd></div>
                    <div><dt className="font-semibold">Motivo visual</dt><dd className="text-muted-foreground">{landing.creativeDirection.motif}</dd></div>
                    <div><dt className="font-semibold">Primer pantallazo</dt><dd className="text-muted-foreground">{landing.creativeDirection.firstScreen}</dd></div>
                  </dl>
                </section>
              ) : null}
              {landing.mediaAssets?.length ? (
                <section aria-labelledby="saved-media-heading" className="space-y-3 rounded-xl border border-border bg-card p-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">Medios colocados</p>
                    <h2 id="saved-media-heading" className="mt-1 font-display text-xl">Fotos, clips y créditos</h2>
                  </div>
                  <ul className="space-y-3">{landing.mediaAssets.map((asset) => (
                    <li key={asset.id} className="flex gap-3 rounded-lg border border-border p-2.5">
                      {asset.type === "video" ? (
                        <video src={`/api/media/assets/${asset.id}`} poster={`/api/media/assets/${asset.id}?poster=1`} controls playsInline preload="metadata" className="aspect-video w-32 shrink-0 rounded-md bg-muted object-cover" />
                      ) : (
                        <Image src={`/api/media/assets/${asset.id}`} alt={asset.altText} width={320} height={180} unoptimized loading="lazy" className="aspect-video w-32 shrink-0 rounded-md bg-muted object-cover" />
                      )}
                      <div className="min-w-0 text-xs leading-5">
                        <p className="font-medium">{asset.type === "image" ? "Foto" : "Video"} · {asset.provider}</p>
                        <p className="truncate text-muted-foreground">{asset.sectionId} · {asset.slotId}</p>
                        <a href={asset.sourceUrl} target="_blank" rel="noreferrer" className="text-primary underline">{asset.author} · fuente/licencia</a>
                      </div>
                    </li>
                  ))}</ul>
                  <p className="text-xs leading-5 text-muted-foreground">Los archivos viven en `data/assets`; el paquete ZIP incluye HTML, medios y CREDITOS.txt.</p>
                </section>
              ) : null}
              <details className="rounded-xl border border-border bg-card p-4">
                <summary className="cursor-pointer text-sm font-medium">Ver el prompt final</summary>
                <pre className="mt-3 max-h-[320px] overflow-auto whitespace-pre-wrap font-mono text-xs leading-6 text-muted-foreground">{landing.prompt}</pre>
              </details>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
