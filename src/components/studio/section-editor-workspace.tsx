"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowDownLeft, Check, LoaderCircle, MousePointer2, RotateCcw, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildPreviewDocument } from "@/lib/preview-document";
import type { LandingCode } from "@/lib/schemas";
import type { ModelChoice } from "@/lib/model-choice";
import { techniques, type TechniqueId } from "@/lib/techniques";
import type { SectionPatch } from "@/lib/section-edits/schemas";

type SectionInfo = { id: string; title: string; editable: boolean; reason?: string };
type EditorState = { revision: number; sections: SectionInfo[]; undoRevisionId: string | null; undoUnavailable: boolean; currentSummary: string | null };
type Proposal = {
  proposalId: string;
  baseRevision: number;
  beforeHtml: string;
  afterHtml: string;
  css: string;
  nextCss: string;
  patch: SectionPatch;
};

type Props = {
  landingId: string | null;
  code: LandingCode;
  modelChoice: ModelChoice;
  onApplied: (code: LandingCode, revision: number) => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function selectableDocument(code: LandingCode, nonce: string) {
  const boot = `
(() => {
  const nonce = ${JSON.stringify(nonce)};
  let selected = null;
  const sections = document.querySelectorAll("[data-xpage-section]");
  sections.forEach((section) => {
    if (!section.hasAttribute("tabindex")) section.setAttribute("tabindex", "0");
    if (!section.hasAttribute("aria-label") && !section.hasAttribute("aria-labelledby")) {
      const heading = section.querySelector("h1,h2,h3,h4,h5,h6");
      if (heading && heading.textContent) section.setAttribute("aria-label", heading.textContent.trim().slice(0, 120));
    }
  });
  const choose = (section, event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (selected) selected.removeAttribute("data-xpage-editor-selected");
    selected = section;
    section.setAttribute("data-xpage-editor-selected", "true");
    parent.postMessage({ type: "xpage:section-select", nonce, sectionId: section.getAttribute("data-xpage-section") }, "*");
  };
  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const section = target?.closest("[data-xpage-section]");
    if (section) choose(section, event);
  }, true);
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const target = event.target instanceof Element ? event.target : null;
    const section = target?.closest("[data-xpage-section]");
    if (section) choose(section, event);
  }, true);
})();`;
  const source = buildPreviewDocument(code);
  const styles = '<style>[data-xpage-editor-selected]{outline:3px solid #6d5dfc!important;outline-offset:3px!important}</style>';
  return source.replace("</body>", `${styles}<script>${boot}</script></body>`);
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store", ...init });
  } catch {
    throw new Error("No se pudo conectar con XPage. Revisa que el servidor esté activo.");
  }
  const body = await response.json().catch(() => null) as { error?: unknown } | null;
  if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "No se pudo completar la acción.");
  return body as T;
}

export function SectionEditorWorkspace({ landingId, code, modelChoice, onApplied }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [nonce, setNonce] = useState("");
  const [state, setState] = useState<EditorState | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedTechniqueIds, setSelectedTechniqueIds] = useState<TechniqueId[]>(["human-copy"]);
  const [instruction, setInstruction] = useState("");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refreshState = useCallback(async () => {
    if (!landingId) {
      setState(null);
      return;
    }
    try {
      const result = await requestJson<EditorState>(`/api/section-edits?landingId=${encodeURIComponent(landingId)}`);
      setState(result);
      setSelectedSectionId((current) => current && !result.sections.some((item) => item.id === current && item.editable) ? null : current);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo preparar el editor.");
    }
  }, [landingId]);

  useEffect(() => {
    setNonce(crypto.randomUUID());
  }, []);

  useEffect(() => {
    void refreshState();
  }, [refreshState, code.html, code.css, code.js]);

  useEffect(() => {
    if (!nonce) return;
    const onMessage = (event: MessageEvent<unknown>) => {
      if (event.source !== frame.current?.contentWindow || event.origin !== "null" || !isRecord(event.data)) return;
      if (event.data.type !== "xpage:section-select" || event.data.nonce !== nonce || typeof event.data.sectionId !== "string") return;
      const sectionId = event.data.sectionId;
      if (!/^[a-z0-9-]{1,80}$/.test(sectionId)) return;
      const matches = state?.sections.filter((item) => item.id === sectionId) ?? [];
      if (matches.length !== 1) return;
      const section = matches[0];
      setSelectedSectionId(sectionId);
      setProposal(null);
      setError("");
      setNotice(section.editable ? "Sección seleccionada desde la vista previa." : section.reason ?? "Esta sección no se puede editar con seguridad.");
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [nonce, state?.sections]);

  const srcDoc = useMemo(() => nonce ? selectableDocument(code, nonce) : buildPreviewDocument(code), [code, nonce]);
  const selectedSection = state?.sections.find((item) => item.id === selectedSectionId) ?? null;
  const canEdit = Boolean(landingId && selectedSection?.editable && state && !busy);

  function toggleTechnique(id: TechniqueId) {
    setSelectedTechniqueIds((current) => current.includes(id)
      ? current.length > 1 ? current.filter((item) => item !== id) : current
      : [...current, id]);
  }

  async function propose() {
    if (!landingId || !selectedSection?.editable || !state) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await requestJson<Proposal>("/api/section-edits/proposals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ savedLandingId: landingId, sectionId: selectedSection.id, baseRevision: state.revision, instruction, techniqueIds: selectedTechniqueIds, modelChoice }),
      });
      setProposal(result);
      setNotice("Propuesta lista. Compara antes y después; nada cambia hasta que la apliques.");
    } catch (proposalError) {
      setError(proposalError instanceof Error ? proposalError.message : "No se pudo preparar la propuesta.");
    } finally {
      setBusy(false);
    }
  }

  async function apply() {
    if (!proposal) return;
    setBusy(true);
    setError("");
    try {
      const result = await requestJson<{ revision: number; html: string; css: string; js: string; summary: string }>(`/api/section-edits/proposals/${proposal.proposalId}/apply`, { method: "POST" });
      onApplied({ ...code, html: result.html, css: result.css, js: result.js }, result.revision);
      setProposal(null);
      setInstruction("");
      setNotice(`Revisión ${result.revision} aplicada: ${result.summary}`);
      await refreshState();
    } catch (applyError) {
      const message = applyError instanceof Error ? applyError.message : "No se pudo aplicar la propuesta.";
      setError(message);
      if (/cambió|pendiente|actualiza/i.test(message)) setProposal(null);
      await refreshState();
    } finally {
      setBusy(false);
    }
  }

  async function discard() {
    if (!proposal) return;
    setBusy(true);
    setError("");
    try {
      await requestJson(`/api/section-edits/proposals/${proposal.proposalId}`, { method: "DELETE" });
      setProposal(null);
      setNotice("Propuesta descartada. La landing conserva su versión actual.");
    } catch (discardError) {
      setError(discardError instanceof Error ? discardError.message : "No se pudo descartar la propuesta.");
    } finally {
      setBusy(false);
    }
  }

  async function undo() {
    if (!landingId || !state?.undoRevisionId) return;
    setBusy(true);
    setError("");
    try {
      const result = await requestJson<{ revision: number; html: string; css: string; js: string; summary: string }>("/api/section-edits/undo", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ savedLandingId: landingId, baseRevision: state.revision, targetRevisionId: state.undoRevisionId }),
      });
      onApplied({ ...code, html: result.html, css: result.css, js: result.js }, result.revision);
      setProposal(null);
      setNotice(`${result.summary}.`);
      await refreshState();
    } catch (undoError) {
      setError(undoError instanceof Error ? undoError.message : "No se pudo deshacer la revisión.");
      await refreshState();
    } finally {
      setBusy(false);
    }
  }

  const beforeDocument = proposal ? buildPreviewDocument({ ...code, html: proposal.beforeHtml, js: "" }) : "";
  const afterDocument = proposal ? buildPreviewDocument({ ...code, html: proposal.afterHtml, css: proposal.nextCss, js: "" }) : "";

  return (
    <main className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(160px,1fr)_minmax(210px,42vh)] bg-background lg:grid-cols-[minmax(0,1fr)_390px] lg:grid-rows-1">
      <div className="min-h-0 bg-white">
        <iframe
          ref={frame}
          title={`Página completa: ${code.title}. Haz clic en una sección para editarla.`}
          srcDoc={srcDoc}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          className="size-full border-0 bg-white"
        />
      </div>

      <aside aria-label="Editor de secciones" className="min-h-0 overflow-y-auto border-t border-border bg-card lg:border-l lg:border-t-0">
        <div className="space-y-4 p-4 sm:p-5">
          <header className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Edición puntual · Eve</p>
              <h2 className="mt-1 font-display text-xl">Editar una sección</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Selecciona un bloque en la vista previa. Eve propondrá un cambio aislado; tú decides si aplicarlo.</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-background px-2 py-1 text-[10px] text-muted-foreground">
              <Sparkles size={11} aria-hidden="true" /> {modelChoice}
            </span>
          </header>

          {landingId ? (
            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-xs">
              <span className="text-muted-foreground">Revisión actual</span>
              <span className="font-semibold tabular-nums">v{state?.revision ?? "…"}</span>
            </div>
          ) : (
            <div role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs leading-5 text-foreground">
              Guarda la landing en Biblioteca para iniciar revisiones y conservar cada cambio.
            </div>
          )}

          {state?.sections.length === 0 && landingId ? (
            <div role="status" className="rounded-lg border border-border bg-background p-3 text-xs leading-5 text-muted-foreground">
              Esta landing histórica no tiene marcadores de sección. Se puede seguir viendo y descargar, pero la edición puntual queda desactivada para evitar cambios ambiguos.
            </div>
          ) : null}

          {state?.sections.some((section) => !section.editable) ? (
            <ul className="space-y-1 rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
              {state.sections.filter((section) => !section.editable).map((section) => <li key={`${section.id}-${section.reason}`}>{section.title}: {section.reason}</li>)}
            </ul>
          ) : null}

          <section aria-labelledby="selected-section-heading" className="rounded-xl border border-primary/20 bg-primary/[0.035] p-3">
            <div className="flex items-center gap-2 text-xs font-medium">
              <MousePointer2 size={14} aria-hidden="true" className="text-primary" />
              <h3 id="selected-section-heading">{selectedSection ? selectedSection.title : "Ninguna sección seleccionada"}</h3>
            </div>
            {selectedSection ? <p className="mt-1 pl-6 font-mono text-[10px] text-muted-foreground">{selectedSection.id}</p> : <p className="mt-1 pl-6 text-xs text-muted-foreground">Haz clic en un bloque de la página para elegirlo.</p>}
          </section>

          <fieldset disabled={!landingId || !selectedSection?.editable || busy || Boolean(proposal)}>
            <legend className="mb-2 text-xs font-semibold">Técnica/s para este cambio</legend>
            <div className="grid grid-cols-2 gap-1.5">
              {techniques.map((technique) => {
                const checked = selectedTechniqueIds.includes(technique.id);
                return (
                  <button key={technique.id} type="button" aria-pressed={checked} onClick={() => toggleTechnique(technique.id)} title={technique.purpose}
                    className={`min-h-9 rounded-lg border px-2 text-left text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45 ${checked ? "border-primary/40 bg-primary/10 text-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted"}`}>
                    {checked ? <Check size={11} className="mr-1 inline text-primary" aria-hidden="true" /> : null}{technique.name}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="block text-xs font-semibold" htmlFor="section-edit-instruction">
            ¿Qué quieres cambiar?
            <textarea id="section-edit-instruction" value={instruction} onChange={(event) => setInstruction(event.target.value)} maxLength={1200} rows={3}
              placeholder="Ej.: aclara el beneficio del hero y haz el CTA más directo, sin prometer resultados no incluidos en el brief."
              disabled={!landingId || !selectedSection?.editable || busy || Boolean(proposal)}
              className="mt-2 min-h-20 w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-normal leading-5 outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50" />
          </label>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-muted-foreground">Se conservarán JavaScript, otras secciones y medios.</span>
            <Button type="button" size="sm" onClick={() => void propose()} disabled={!canEdit || instruction.trim().length < 4 || selectedTechniqueIds.length === 0}>
              {busy ? <LoaderCircle size={14} className="animate-spin" aria-hidden="true" /> : <Sparkles size={14} aria-hidden="true" />}
              Proponer
            </Button>
          </div>

          {proposal ? (
            <section aria-labelledby="proposal-heading" className="space-y-3 rounded-xl border border-primary/25 bg-background p-3">
              <header className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Propuesta · v{proposal.baseRevision}</p>
                  <h3 id="proposal-heading" className="mt-1 text-sm font-semibold leading-5">{proposal.patch.summary}</h3>
                </div>
                <button type="button" onClick={() => void discard()} disabled={busy} aria-label="Descartar propuesta" title="Descartar propuesta" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"><X size={15} aria-hidden="true" /></button>
              </header>
              {proposal.patch.warnings.length ? <ul className="space-y-1 rounded-lg bg-amber-500/10 p-2.5 text-xs text-foreground">{proposal.patch.warnings.map((warning, index) => <li key={`${warning}-${index}`}>• {warning}</li>)}</ul> : null}
              <div className="grid grid-cols-2 gap-2">
                {[{ title: "Antes", document: beforeDocument }, { title: "Propuesta", document: afterDocument }].map((view) => (
                  <div key={view.title} className="min-w-0 overflow-hidden rounded-lg border border-border">
                    <p className="border-b border-border bg-muted px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide">{view.title}</p>
                    <iframe title={`${view.title} de ${selectedSection?.title ?? "la sección"}`} srcDoc={view.document} sandbox="" referrerPolicy="no-referrer" className="h-44 w-full bg-white" />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" onClick={() => void apply()} disabled={busy}>
                  {busy ? <LoaderCircle size={14} className="animate-spin" aria-hidden="true" /> : <Check size={14} aria-hidden="true" />} Aplicar cambio
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => void discard()} disabled={busy}><X size={14} aria-hidden="true" /> Descartar</Button>
              </div>
            </section>
          ) : null}

          {landingId && state?.undoRevisionId ? (
            <Button type="button" variant="outline" size="sm" className="w-full justify-center" onClick={() => void undo()} disabled={busy || Boolean(proposal)}>
              <RotateCcw size={14} aria-hidden="true" /> Deshacer última edición
            </Button>
          ) : null}
          {state?.undoUnavailable ? <p role="status" className="rounded-lg border border-border bg-background p-2.5 text-xs leading-5 text-muted-foreground">El contenido o sus medios cambiaron después de esta revisión. El deshacer queda bloqueado para conservar esos cambios.</p> : null}

          {notice ? <p role="status" className="rounded-lg border border-emerald-600/20 bg-emerald-600/5 p-2.5 text-xs leading-5 text-foreground">{notice}</p> : null}
          {error ? <p role="alert" className="flex gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2.5 text-xs leading-5 text-destructive"><AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />{error}</p> : null}

          <p className="flex items-start gap-2 border-t border-border pt-3 text-[10px] leading-4 text-muted-foreground">
            <ArrowDownLeft size={12} className="mt-0.5 shrink-0" aria-hidden="true" /> La vista está aislada en un iframe opaco. Revisa cada propuesta antes de guardarla; las revisiones anteriores siguen disponibles en la traza.
          </p>
        </div>
      </aside>
    </main>
  );
}
