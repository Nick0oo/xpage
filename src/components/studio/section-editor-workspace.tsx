"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowDown, ArrowDownLeft, ArrowUp, Check, Clock3, Code2, FileCode2, Image as ImageIcon, LoaderCircle, Monitor, MousePointer2, RotateCcw, Smartphone, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildPreviewDocument } from "@/lib/preview-document";
import type { Brief, LandingCode } from "@/lib/schemas";
import type { ModelChoice } from "@/lib/model-choice";
import { techniques, type TechniqueId } from "@/lib/techniques";
import type { SectionPatch } from "@/lib/section-edits/schemas";

type SectionInfo = { id: string; title: string; editable: boolean; reason?: string };
type RevisionInfo = { id: string; revision: number; parentRevisionId: string | null; sectionId: string | null; summary: string; createdAt: string };
type EditorState = { revision: number; sections: SectionInfo[]; undoRevisionId: string | null; undoUnavailable: boolean; currentSummary: string | null; revisions: RevisionInfo[] };
type Proposal = {
  proposalId: string;
  baseRevision: number;
  beforeHtml: string;
  afterHtml: string;
  fullHtml?: string;
  css: string;
  nextCss: string;
  patch: SectionPatch;
};
type CodeProposal = { proposalId: string; baseRevision: number; beforeCode: LandingCode; afterCode: LandingCode; summary: string };

type Props = {
  landingId: string | null;
  traceId: string;
  code: LandingCode;
  brief: Brief;
  modelChoice: ModelChoice;
  modelChoiceConfirmed?: boolean;
  onApplied: (code: LandingCode, revision: number) => void;
  onOpenMedia: () => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readableText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (node instanceof Element && node.tagName.toLowerCase() === "br") return " ";
  return [...node.childNodes].map(readableText).join(" ");
}

function getEditableSections(html: string): SectionInfo[] {
  const document = new DOMParser().parseFromString(html, "text/html");
  const elements = [...document.querySelectorAll("[data-xpage-section]")];
  const ids = elements.map((element) => element.getAttribute("data-xpage-section") ?? "");
  return elements.map((element, index) => {
    const id = ids[index];
    const duplicate = ids.indexOf(id) !== index || ids.lastIndexOf(id) !== index;
    const heading = element.querySelector("h1,h2,h3,h4,h5,h6");
    const title = heading ? readableText(heading).replace(/\s+([,.;:!?])/g, "$1").replace(/\s+/g, " ").trim() : "";
    const validId = /^[a-z0-9-]{1,80}$/.test(id);
    return {
      id,
      title: title?.slice(0, 140) || id.replaceAll("-", " "),
      editable: element.tagName.toLowerCase() === "section" && !duplicate && validId,
      reason: element.tagName.toLowerCase() !== "section" ? "El marcador no está en un elemento <section>." : duplicate ? "Este ID aparece más de una vez." : !validId ? "El ID de esta sección no es válido." : undefined,
    };
  });
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
  window.addEventListener("message", (event) => {
    if (event.source !== parent || !event.data || event.data.type !== "xpage:section-focus" || event.data.nonce !== nonce) return;
    const section = [...document.querySelectorAll("[data-xpage-section]")].find((item) => item.getAttribute("data-xpage-section") === event.data.sectionId);
    if (section) choose(section, new Event("xpage:focus", { cancelable: true }));
  });
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

export function SectionEditorWorkspace({ landingId, traceId, code, brief, modelChoice, modelChoiceConfirmed = true, onApplied, onOpenMedia }: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const nonce = useId();
  const [state, setState] = useState<EditorState | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedTechniqueIds, setSelectedTechniqueIds] = useState<TechniqueId[]>(["human-copy"]);
  const [instruction, setInstruction] = useState("");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);
  const [codeEditorOpen, setCodeEditorOpen] = useState(false);
  const [codeDraft, setCodeDraft] = useState<LandingCode>(code);
  const [codeSummary, setCodeSummary] = useState("Editar HTML, CSS o JavaScript");
  const [codeProposal, setCodeProposal] = useState<CodeProposal | null>(null);
  const [newSectionInstruction, setNewSectionInstruction] = useState("Añade una sección breve que haga más claro qué incluye la oferta.");

  const refreshState = useCallback(async () => {
    if (!landingId) {
      setState({ revision: 0, sections: getEditableSections(code.html), undoRevisionId: null, undoUnavailable: false, currentSummary: null, revisions: [] });
      return;
    }
    try {
      const result = await requestJson<EditorState>(`/api/section-edits?landingId=${encodeURIComponent(landingId)}`);
      setState(result);
      setSelectedSectionId((current) => current && !result.sections.some((item) => item.id === current && item.editable) ? null : current);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudo preparar el editor.");
    }
  }, [landingId, code.html]);

  useEffect(() => {
    if (!landingId) {
      setState({ revision: 0, sections: getEditableSections(code.html), undoRevisionId: null, undoUnavailable: false, currentSummary: null, revisions: [] });
      setSelectedSectionId(null);
      return;
    }
    let cancelled = false;
    void requestJson<EditorState>(`/api/section-edits?landingId=${encodeURIComponent(landingId)}`)
      .then((result) => {
        if (cancelled) return;
        setState(result);
        setSelectedSectionId((current) => current && !result.sections.some((item) => item.id === current && item.editable) ? null : current);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "No se pudo preparar el editor.");
      });
    return () => { cancelled = true; };
  }, [landingId, code.html, code.css, code.js]);

  useEffect(() => setCodeDraft(code), [code]);

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
  const canEdit = Boolean(selectedSection?.editable && state && !busy && !codeProposal && !codeEditorOpen);

  function selectSection(section: SectionInfo) {
    if (!section.editable) {
      setSelectedSectionId(section.id);
      setProposal(null);
      setNotice(section.reason ?? "Esta sección está protegida.");
      return;
    }
    setSelectedSectionId(section.id);
    setProposal(null);
    setError("");
    setNotice("Sección seleccionada. Describe el cambio y revisa la propuesta antes de aplicarla.");
    frame.current?.contentWindow?.postMessage({ type: "xpage:section-focus", nonce, sectionId: section.id }, "*");
  }

  function toggleTechnique(id: TechniqueId) {
    setSelectedTechniqueIds((current) => current.includes(id)
      ? current.length > 1 ? current.filter((item) => item !== id) : current
      : [...current, id]);
  }

  async function propose() {
    if (!modelChoiceConfirmed || !selectedSection?.editable || !state || codeProposal || codeEditorOpen) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await requestJson<Proposal>(landingId ? "/api/section-edits/proposals" : "/api/section-edits/preview-proposals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(landingId
          ? { savedLandingId: landingId, sectionId: selectedSection.id, baseRevision: state.revision, instruction, techniqueIds: selectedTechniqueIds, modelChoice }
          : { code, brief, sectionId: selectedSection.id, instruction, techniqueIds: selectedTechniqueIds, modelChoice }),
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
    if (!landingId) {
      if (!proposal.fullHtml) {
        setError("La propuesta temporal no incluyó el documento completo. Vuelve a generarla.");
        return;
      }
      onApplied({ ...code, html: proposal.fullHtml, css: proposal.nextCss }, 0);
      setProposal(null);
      setInstruction("");
      setNotice("Cambio aplicado a esta sesión. Guárdala en Biblioteca si quieres conservarlo al salir.");
      return;
    }
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
    if (!landingId) {
      setProposal(null);
      setError("");
      setNotice("Propuesta descartada. La landing conserva su versión actual.");
      return;
    }
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

  async function restoreRevision(targetRevisionId: string) {
    if (!landingId || !state) return;
    setBusy(true);
    setError("");
    try {
      const result = await requestJson<{ revision: number; html: string; css: string; js: string; summary: string }>("/api/section-edits/undo", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ savedLandingId: landingId, baseRevision: state.revision, targetRevisionId }),
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

  async function undo() {
    if (state?.undoRevisionId) await restoreRevision(state.undoRevisionId);
  }

  async function prepareCodeApply() {
    if (busy || proposal || codeProposal || !codeDraft.html.trim()) return;
    if (!landingId) {
      onApplied(codeDraft, 0);
      setCodeEditorOpen(false);
      setNotice("Código aplicado a este borrador y visible en el canvas. Sigue sin guardarse en Biblioteca.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await requestJson<CodeProposal>("/api/section-edits/code-proposals", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ savedLandingId: landingId, baseRevision: state?.revision ?? 0, html: codeDraft.html, css: codeDraft.css, js: codeDraft.js, summary: codeSummary }),
      });
      setCodeProposal(result);
      setCodeEditorOpen(false);
      setNotice("El código está en vista previa y pendiente de revisión; la página guardada todavía no cambió.");
    } catch (proposalError) {
      setError(proposalError instanceof Error ? proposalError.message : "No se pudo preparar el código para revisión.");
    } finally {
      setBusy(false);
    }
  }

  async function applyCodeProposal() {
    if (!codeProposal) return;
    if (!landingId) {
      onApplied(codeProposal.afterCode, 0);
      setCodeProposal(null);
      setNotice("Cambios aplicados a este borrador y mostrados en el canvas. Sigue sin guardarse en Biblioteca.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await requestJson<{ revision: number; html: string; css: string; js: string; summary: string }>(`/api/section-edits/proposals/${codeProposal.proposalId}/apply`, { method: "POST" });
      onApplied({ ...code, html: result.html, css: result.css, js: result.js }, result.revision);
      setCodeProposal(null);
      setNotice(`Revisión ${result.revision} aplicada: ${result.summary}`);
      await refreshState();
    } catch (applyError) {
      const message = applyError instanceof Error ? applyError.message : "No se pudo aplicar la propuesta de código.";
      setError(message);
      if (/cambi[oó]|actualiza|revisi[oó]n/i.test(message)) setCodeProposal(null);
      await refreshState();
    } finally {
      setBusy(false);
    }
  }

  async function createSectionWithEve() {
    if (!modelChoiceConfirmed || busy || proposal || codeProposal || selectedTechniqueIds.length === 0 || newSectionInstruction.trim().length < 4) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const generated = await requestJson<{ code: LandingCode; summary: string; warnings: string[] }>("/api/section-edits/new-section", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, brief, afterSectionId: selectedSection?.editable ? selectedSection.id : undefined, instruction: newSectionInstruction, techniqueIds: selectedTechniqueIds, modelChoice, traceId }),
      });
      if (landingId) {
        const review = await requestJson<CodeProposal>("/api/section-edits/code-proposals", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ savedLandingId: landingId, baseRevision: state?.revision ?? 0, html: generated.code.html, css: generated.code.css, js: generated.code.js, summary: generated.summary, modelChoice, techniqueIds: selectedTechniqueIds }),
        });
        setCodeProposal(review);
        setNotice(generated.warnings.length ? `Nueva sección lista. Revisa sus límites: ${generated.warnings.join(" · ")}` : "Nueva sección lista. Revisa el documento completo antes de aplicarlo.");
      } else {
        setCodeProposal({ proposalId: "preview-only", baseRevision: 0, beforeCode: code, afterCode: generated.code, summary: generated.summary });
        setNotice(generated.warnings.length ? `Nueva sección lista. Revisa sus límites: ${generated.warnings.join(" · ")}` : "Nueva sección lista. Revisa el documento completo antes de aplicarlo.");
      }
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "No se pudo crear la sección con Eve.");
    } finally {
      setBusy(false);
    }
  }

  async function discardCodeProposal() {
    if (!codeProposal) return;
    if (!landingId) {
      setCodeProposal(null);
      setNotice("Propuesta descartada. El borrador conserva su versión actual.");
      return;
    }
    setBusy(true);
    try {
      await requestJson(`/api/section-edits/proposals/${codeProposal.proposalId}`, { method: "DELETE" });
      setCodeProposal(null);
      setNotice("Propuesta de código descartada. La página conserva su versión actual.");
    } catch (discardError) {
      setError(discardError instanceof Error ? discardError.message : "No se pudo descartar el código.");
    } finally {
      setBusy(false);
    }
  }

  async function reorderSection(sectionId: string, targetIndex: number) {
    if (!state || busy || proposal || codeProposal || codeEditorOpen) return;
    const currentIndex = state.sections.findIndex((section) => section.id === sectionId);
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= state.sections.length || currentIndex === targetIndex) return;
    const orderedIds = state.sections.map((section) => section.id);
    orderedIds.splice(currentIndex, 1);
    orderedIds.splice(targetIndex, 0, sectionId);
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (!landingId) {
        const document = new DOMParser().parseFromString(code.html, "text/html");
        const sections = [...document.querySelectorAll("[data-xpage-section]")];
        const parent = sections[0]?.parentElement;
        if (!parent || sections.length !== orderedIds.length || sections.some((section) => section.parentElement !== parent) || orderedIds.some((id) => !sections.some((section) => section.getAttribute("data-xpage-section") === id))) {
          throw new Error("Estas secciones están anidadas o cambiaron. Reordena solo secciones del mismo nivel.");
        }
        const byId = new Map(sections.map((section) => [section.getAttribute("data-xpage-section")!, section]));
        const placeholders = sections.map((section) => {
          const placeholder = document.createComment("xpage-section-position");
          parent.replaceChild(placeholder, section);
          return placeholder;
        });
        placeholders.forEach((placeholder, index) => parent.replaceChild(byId.get(orderedIds[index])!, placeholder));
        onApplied({ ...code, html: document.body.innerHTML }, 0);
        setNotice("Orden actualizado en este borrador. Revísalo en el canvas; sigue sin guardarse en Biblioteca.");
      } else {
        const result = await requestJson<{ revision: number; html: string; css: string; js: string }>("/api/section-edits/reorder", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ savedLandingId: landingId, baseRevision: state.revision, orderedIds }),
        });
        onApplied({ ...code, html: result.html, css: result.css, js: result.js }, result.revision);
        setNotice(`Orden actualizado en la revisión ${result.revision}.`);
        await refreshState();
      }
      setSelectedSectionId(sectionId);
    } catch (reorderError) {
      setError(reorderError instanceof Error ? reorderError.message : "No se pudo cambiar el orden.");
      if (landingId) await refreshState();
    } finally {
      setBusy(false);
    }
  }

  const beforeDocument = proposal ? buildPreviewDocument({ ...code, html: proposal.beforeHtml, js: "" }) : "";
  const afterDocument = proposal ? buildPreviewDocument({ ...code, html: proposal.afterHtml, css: proposal.nextCss, js: "" }) : "";
  const codeDraftPreview = buildPreviewDocument(codeDraft);
  const codeBeforePreview = codeProposal ? buildPreviewDocument(codeProposal.beforeCode) : "";
  const codeProposalPreview = codeProposal ? buildPreviewDocument(codeProposal.afterCode) : "";

  return (
    <main className="grid min-h-0 flex-1 grid-cols-1 grid-rows-none overflow-y-auto bg-[#f3f4f7] xl:grid-cols-[248px_minmax(0,1fr)_400px] xl:grid-rows-1 xl:overflow-hidden">
      <aside aria-label="Navegación del proyecto" className="min-h-0 border-b border-slate-200 bg-white xl:overflow-y-auto xl:border-b-0 xl:border-r">
        <div className="space-y-5 p-4">
          <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-violet-50 text-violet-700"><ImageIcon size={15} aria-hidden="true" /></span><div className="min-w-0"><p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Proyecto</p><p className="truncate text-xs font-semibold text-slate-800">{code.title}</p></div></div>
          <section aria-labelledby="section-nav-heading">
            <div className="mb-2 flex items-center justify-between"><h2 id="section-nav-heading" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Secciones</h2><span className="text-[10px] tabular-nums text-slate-400">{state?.sections.length ?? 0}</span></div>
            {state?.sections.length ? <nav aria-label="Secciones; arrastra para reordenar" className="space-y-1">{state.sections.map((section, index) => <div key={section.id} draggable={!busy && !proposal && !codeProposal} onDragStart={(event) => { setDraggingSectionId(section.id); event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", section.id); }} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const moving = event.dataTransfer.getData("text/plain") || draggingSectionId; if (moving) void reorderSection(moving, index); setDraggingSectionId(null); }} onDragEnd={() => setDraggingSectionId(null)} className={`flex items-center gap-1 rounded-lg border border-transparent pr-1 ${draggingSectionId === section.id ? "opacity-40" : ""}`}><button type="button" onClick={() => selectSection(section)} disabled={busy || Boolean(proposal || codeProposal)} aria-current={selectedSectionId === section.id ? "true" : undefined} className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-[11px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-50 ${selectedSectionId === section.id ? "bg-violet-50 font-medium text-violet-950" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}><span className={`grid size-5 shrink-0 place-items-center rounded-md text-[9px] font-semibold ${selectedSectionId === section.id ? "bg-violet-700 text-white" : "bg-slate-100 text-slate-500"}`}>{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1 truncate">{section.title}</span>{selectedSectionId === section.id ? <span className="size-1.5 shrink-0 rounded-full bg-violet-600" /> : null}</button><button type="button" aria-label={`Subir ${section.title}`} title="Subir" disabled={busy || Boolean(proposal || codeProposal) || index === 0} onClick={() => void reorderSection(section.id, index - 1)} className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowUp size={12} aria-hidden="true" /></button><button type="button" aria-label={`Bajar ${section.title}`} title="Bajar" disabled={busy || Boolean(proposal || codeProposal) || index === state.sections.length - 1} onClick={() => void reorderSection(section.id, index + 1)} className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30"><ArrowDown size={12} aria-hidden="true" /></button></div>)}</nav> : <p className="rounded-lg bg-slate-50 p-2.5 text-[10px] leading-4 text-slate-500">{landingId ? "Leyendo secciones…" : "Esta landing no tiene marcadores de sección editables."}</p>}
          </section>

          <section aria-labelledby="revision-history-heading" className="border-t border-slate-100 pt-4">
            <div className="mb-2 flex items-center justify-between"><h2 id="revision-history-heading" className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500"><Clock3 size={12} aria-hidden="true"/>Actividad</h2><span className="text-[10px] text-slate-400">v{state?.revision ?? "…"}</span></div>
            {state?.revisions.length ? <ol className="space-y-1">{state.revisions.map((revision) => <li key={revision.id} className={`rounded-lg border px-2.5 py-2 ${revision.revision === state.revision ? "border-violet-100 bg-violet-50/60" : "border-transparent bg-slate-50"}`}><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-semibold text-slate-700">v{revision.revision}{revision.revision === state.revision ? " · Actual" : ""}</span>{revision.revision !== state.revision ? <button type="button" onClick={() => void restoreRevision(revision.id)} disabled={busy || Boolean(proposal)} className="text-[10px] font-medium text-violet-700 hover:underline disabled:opacity-40">Restaurar</button> : null}</div><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-600">{revision.summary}</p><p className="mt-1 truncate text-[9px] text-slate-400">{revision.sectionId ?? "Landing completa"} · {new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "short" }).format(new Date(revision.createdAt))}</p></li>)}</ol> : <p className="rounded-lg bg-slate-50 p-2.5 text-[10px] leading-4 text-slate-500">{state ? "La versión inicial está activa. Las ediciones aprobadas aparecerán aquí." : "El historial estará disponible al cargar la landing."}</p>}
          </section>

          <section aria-labelledby="project-files-heading" className="border-t border-slate-100 pt-4">
            <h2 id="project-files-heading" className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500"><FileCode2 size={12} aria-hidden="true"/>Archivos</h2>
            {[{ name: "index.html", icon: "HTML", content: code.html }, { name: "styles.css", icon: "CSS", content: code.css }, { name: "script.js", icon: "JS", content: code.js }].map((file) => <details key={file.name} className="group border-b border-slate-100 last:border-0"><summary className="flex cursor-pointer list-none items-center gap-2 py-2 text-[10px] text-slate-600 hover:text-slate-900 [&::-webkit-details-marker]:hidden"><Code2 size={12} className="text-slate-400" aria-hidden="true"/><span className="flex-1">{file.name}</span><span className="rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-semibold text-slate-400">{file.icon}</span></summary><pre className="max-h-48 overflow-auto rounded-lg bg-slate-950 p-2.5 font-mono text-[9px] leading-4 text-slate-200"><code>{file.content || "(vacío)"}</code></pre></details>)}
          </section>
        </div>
      </aside>

      <section aria-label="Lienzo de vista previa" className="flex min-h-[440px] min-w-0 flex-col p-3 sm:p-5 lg:p-7">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-black/[0.06] bg-white px-3 py-2 shadow-sm sm:px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-700"><ImageIcon size={15} aria-hidden="true" /></span>
            <div className="min-w-0"><p className="truncate text-xs font-semibold text-slate-800">{code.title}</p><p className="text-[10px] text-slate-500">Vista interactiva <span className="px-1">·</span> {selectedSection ? `Editando ${selectedSection.title}` : "Selecciona una sección"}</p></div>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1" aria-label="Tamaño de vista previa">
            <button type="button" onClick={() => setViewport("desktop")} aria-pressed={viewport === "desktop"} className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium transition ${viewport === "desktop" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}><Monitor size={13} aria-hidden="true" /> Escritorio</button>
            <button type="button" onClick={() => setViewport("mobile")} aria-pressed={viewport === "mobile"} className={`inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium transition ${viewport === "mobile" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}><Smartphone size={13} aria-hidden="true" /> Móvil</button>
            <button type="button" onClick={onOpenMedia} className="ml-1 inline-flex h-7 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-600 transition hover:border-violet-200 hover:text-violet-800"><ImageIcon size={13} aria-hidden="true"/>Medios</button>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 items-start justify-center overflow-auto rounded-xl border border-black/[0.07] bg-[radial-gradient(#d6d9e0_0.7px,transparent_0.7px)] [background-size:14px_14px] p-3 sm:p-5">
          <div className={`relative min-h-0 overflow-hidden bg-white shadow-[0_12px_48px_-20px_rgba(15,23,42,.35)] ring-1 ring-black/10 transition-[width,border-radius] duration-300 ${viewport === "mobile" ? "h-[640px] w-[min(390px,100%)] rounded-[28px] border-[5px] border-slate-900" : "h-full w-full rounded-lg"}`}>
            {viewport === "mobile" ? <div className="absolute left-1/2 top-0 z-10 h-3 w-24 -translate-x-1/2 rounded-b-xl bg-slate-900" aria-hidden="true" /> : null}
            <iframe ref={frame} title={`Página completa: ${code.title}. Haz clic en una sección para editarla.`} srcDoc={srcDoc} sandbox="allow-scripts" referrerPolicy="no-referrer" className="size-full border-0 bg-white" />
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-slate-500"><span>Haz clic en cualquier bloque para seleccionarlo</span><span>{viewport === "mobile" ? "390 px" : "Vista adaptable"}</span></div>
      </section>

      <aside aria-label="Editor de secciones" className="min-h-0 border-t border-slate-200 bg-white xl:overflow-y-auto xl:border-l xl:border-t-0">
        <div className="space-y-4 p-4 sm:p-5">
          <header className="flex items-start justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-violet-700"><span className="size-1.5 rounded-full bg-emerald-500" /> Estudio de landing</p>
              <h2 className="mt-1 font-display text-xl tracking-tight text-slate-900">Refina tu página</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">Selecciona una sección, cuéntale a Eve qué quieres mejorar y revisa el resultado.</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-600"><Sparkles size={11} aria-hidden="true" /> {modelChoice}</span>
          </header>

          {landingId ? (
            <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-xs">
              <span className="text-muted-foreground">Revisión actual</span>
              <span className="font-semibold tabular-nums">v{state?.revision ?? "…"}</span>
            </div>
          ) : (
            <div role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs leading-5 text-foreground">
              Estás editando una vista temporal. Los cambios se aplican a esta sesión; guárdala en Biblioteca si quieres conservarlos y llevar un historial de revisiones.
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

          <section aria-labelledby="selected-section-heading" className="flex items-center gap-2 rounded-lg border border-violet-100 bg-violet-50/70 px-3 py-2.5"><MousePointer2 size={13} className="shrink-0 text-violet-700" aria-hidden="true"/><div className="min-w-0"><p id="selected-section-heading" className="truncate text-[11px] font-semibold text-slate-800">{selectedSection?.title ?? "Selecciona una sección"}</p><p className="truncate text-[10px] text-slate-500">{selectedSection ? (selectedSection.editable ? "Lista para editar" : selectedSection.reason) : "Elige desde el canvas o la navegación"}</p></div></section>

          <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="flex items-start justify-between gap-3"><div><h3 className="text-xs font-semibold text-slate-800">Código de la landing</h3><p className="mt-1 text-[10px] leading-4 text-slate-500">Edita HTML, CSS o JavaScript y previsualiza el resultado antes de aplicarlo.</p></div><Button type="button" size="sm" variant="outline" disabled={busy || Boolean(proposal || codeProposal)} onClick={() => { setCodeDraft(code); setCodeEditorOpen((open) => !open); setError(""); }}>{codeEditorOpen ? "Cerrar" : "Editar archivos"}</Button></div>
            {codeEditorOpen ? <div className="space-y-3">
              <label className="block text-[11px] font-medium" htmlFor="studio-code-summary">Resumen del cambio<input id="studio-code-summary" value={codeSummary} onChange={(event) => setCodeSummary(event.target.value)} maxLength={600} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs" /></label>
              {[{ key: "html", label: "index.html", rows: 10 }, { key: "css", label: "styles.css", rows: 7 }, { key: "js", label: "script.js", rows: 6 }].map((file) => <label key={file.key} className="block text-[11px] font-medium" htmlFor={`studio-code-${file.key}`}>{file.label}<textarea id={`studio-code-${file.key}`} value={codeDraft[file.key as keyof LandingCode]} onChange={(event) => setCodeDraft((current) => ({ ...current, [file.key]: event.target.value }))} rows={file.rows} spellCheck={false} className="mt-1 w-full resize-y rounded-lg border border-slate-200 bg-white p-2 font-mono text-[10px] leading-4 text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400" /></label>)}
              <div className="overflow-hidden rounded-lg border border-slate-200"><p className="border-b border-slate-200 bg-white px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-600">Vista previa del código</p><iframe title="Vista previa temporal del código editado" srcDoc={codeDraftPreview} sandbox="" referrerPolicy="no-referrer" className="h-64 w-full bg-white" /></div>
              <div className="flex flex-wrap gap-2"><Button type="button" size="sm" onClick={() => void prepareCodeApply()} disabled={busy || Boolean(proposal || codeProposal) || codeSummary.trim().length < 4}>{busy ? <LoaderCircle size={14} className="animate-spin" aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}{landingId ? "Proponer y revisar" : "Aplicar a este borrador"}</Button><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => { setCodeDraft(code); setCodeEditorOpen(false); }}>Descartar edición</Button></div>
            </div> : null}
          </section>
          {codeProposal ? <section aria-labelledby="code-proposal-heading" className="space-y-3 rounded-xl border border-primary/25 bg-background p-3">
            <header><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">Propuesta de código · v{codeProposal.baseRevision}</p><h3 id="code-proposal-heading" className="mt-1 text-sm font-semibold">{codeProposal.summary}</h3><p className="mt-1 text-[11px] leading-5 text-muted-foreground">Revisa el documento completo en aislamiento. Al aplicar se registra como revisión y se comprueba que la base siga intacta.</p></header>
            <div className="grid gap-2 lg:grid-cols-2">{[{ label: "Antes", document: codeBeforePreview }, { label: "Propuesta", document: codeProposalPreview }].map((view) => <div key={view.label} className="overflow-hidden rounded-lg border border-slate-200"><p className="border-b border-slate-200 bg-slate-50 px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-600">{view.label}</p><iframe title={`Vista ${view.label.toLocaleLowerCase()} del documento de código`} srcDoc={view.document} sandbox="" referrerPolicy="no-referrer" className="h-72 w-full bg-white" /></div>)}</div>
            <div className="flex flex-wrap gap-2"><Button type="button" size="sm" onClick={() => void applyCodeProposal()} disabled={busy}>{busy ? <LoaderCircle size={14} className="animate-spin" aria-hidden="true" /> : <Check size={14} aria-hidden="true" />}Aplicar revisión</Button><Button type="button" size="sm" variant="outline" onClick={() => void discardCodeProposal()} disabled={busy}>Descartar</Button></div>
          </section> : null}

          <section className="space-y-2 rounded-xl border border-violet-100 bg-violet-50/40 p-3">
            <div><h3 className="text-xs font-semibold text-slate-800">Crear una sección con Eve</h3><p className="mt-1 text-[10px] leading-4 text-slate-500">Eve añade una sección al documento y conserva las secciones y medios actuales. Revisa el preview antes de aplicar.</p></div>
            <label className="block text-[11px] font-medium text-slate-700" htmlFor="new-section-instruction">Qué debe aportar<textarea id="new-section-instruction" value={newSectionInstruction} onChange={(event) => setNewSectionInstruction(event.target.value)} maxLength={1200} rows={2} disabled={busy || Boolean(proposal || codeProposal)} className="mt-1 min-h-16 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-50" /></label>
            {!modelChoiceConfirmed ? <p role="status" className="text-[10px] leading-4 text-amber-800">Confirma un modelo en los datos del borrador antes de pedir cambios a Eve.</p> : null}
            <Button type="button" size="sm" variant="outline" onClick={() => void createSectionWithEve()} disabled={!modelChoiceConfirmed || busy || Boolean(proposal || codeProposal) || selectedTechniqueIds.length === 0 || newSectionInstruction.trim().length < 4} className="border-violet-200 text-violet-800 hover:bg-violet-50">{busy ? <LoaderCircle size={14} className="animate-spin" aria-hidden="true" /> : <Sparkles size={14} aria-hidden="true" />}Crear y previsualizar sección</Button>
          </section>

          <fieldset disabled={!selectedSection?.editable || busy || Boolean(proposal || codeProposal)}>
            <legend className="mb-2 text-[11px] font-semibold text-slate-800">Guía de edición <span className="ml-1 font-normal text-slate-400">· opcional</span></legend>
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

          <label className="block text-[11px] font-semibold text-slate-800" htmlFor="section-edit-instruction">
            Instrucciones para Eve
            <textarea id="section-edit-instruction" value={instruction} onChange={(event) => setInstruction(event.target.value)} maxLength={1200} rows={3}
              placeholder="Ej.: destaca el beneficio principal con una frase breve y haz el CTA más directo."
              disabled={!selectedSection?.editable || busy || Boolean(proposal)}
              className="mt-2 min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-normal leading-5 text-slate-800 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-50" />
          </label>
          {!proposal && selectedSection?.editable ? <div className="flex flex-wrap gap-1.5">{["Hazlo más claro", "Mejora el CTA", "Refuerza el beneficio"].map((suggestion) => <button key={suggestion} type="button" disabled={busy} onClick={() => setInstruction((current) => current ? `${current}${current.endsWith(".") ? "" : "."} ${suggestion}.` : `${suggestion} para esta sección.`)} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800 disabled:opacity-50">{suggestion}</button>)}</div> : null}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400">Solo se modifica esta sección</span>
            <Button type="button" size="sm" onClick={() => void propose()} disabled={!modelChoiceConfirmed || !canEdit || instruction.trim().length < 4 || selectedTechniqueIds.length === 0} className="bg-violet-700 text-white hover:bg-violet-800">
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
              <div className="space-y-2">
                {[{ title: "Antes", document: beforeDocument }, { title: "Propuesta", document: afterDocument }].map((view) => (
                  <div key={view.title} className="min-w-0 overflow-hidden rounded-lg border border-slate-200">
                    <p className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-600">{view.title}<span className="normal-case tracking-normal text-slate-400">{selectedSection?.title}</span></p>
                    <iframe title={`${view.title} de ${selectedSection?.title ?? "la sección"}`} srcDoc={view.document} sandbox="" referrerPolicy="no-referrer" className="h-56 w-full bg-white" />
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
              <Button type="button" variant="outline" size="sm" className="w-full justify-center border-slate-200" onClick={() => void undo()} disabled={busy || Boolean(proposal || codeProposal || codeEditorOpen)}>
              <RotateCcw size={14} aria-hidden="true" /> Deshacer última edición
            </Button>
          ) : null}
          {state?.undoUnavailable ? <p role="status" className="rounded-lg border border-border bg-background p-2.5 text-xs leading-5 text-muted-foreground">El contenido o sus medios cambiaron después de esta revisión. El deshacer queda bloqueado para conservar esos cambios.</p> : null}

          {notice ? <p role="status" className="rounded-lg border border-emerald-600/20 bg-emerald-600/5 p-2.5 text-xs leading-5 text-foreground">{notice}</p> : null}
          {error ? <p role="alert" className="flex gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-2.5 text-xs leading-5 text-destructive"><AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />{error}</p> : null}

          <p className="flex items-start gap-2 border-t border-border pt-3 text-[10px] leading-4 text-muted-foreground">
            <ArrowDownLeft size={12} className="mt-0.5 shrink-0" aria-hidden="true" /> La vista está aislada en un iframe opaco. Revisa cada propuesta antes de aplicarla; guarda la landing en Biblioteca para conservar cambios e historial.
          </p>
        </div>
      </aside>
    </main>
  );
}
