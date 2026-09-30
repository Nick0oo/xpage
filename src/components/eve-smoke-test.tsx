"use client";

import { useEffect, useState } from "react";
import { useEveAgent } from "eve/react";
import { z } from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EveModelSelector } from "@/components/studio/eve-model-selector";
import { DEFAULT_MODEL_CHOICE, type ModelChoice } from "@/lib/model-choice";

type SkillInfo = { id: string; name: string; heading: string; version: string; description: string; purpose: string; inputs: string; artifact: string; executable: boolean; content?: string };
type DesignSystemInfo = { id: string; name: string; bestFor: string; visualGrammar: string; type: string; colorLogic: string; material: string; motion: string; avoid: string[] };
type ReferenceInfo = { id: string; title: string; sourcePath: string; use: string; sourceUrl: string; license: string; sourceKind: string };
type ToolInfo = { id: string; title: string; kind: string; status: string; summary: string };

const modelLabels: Record<ModelChoice, string> = {
  "gpt-5.6-luna": "GPT-5.6 Luna",
  "gpt-6-luna": "GPT-6 Luna",
  gemini: "Gemini",
  qwen: "Qwen",
};

const outputSchema = z.object({ estado: z.literal("ok"), resumen: z.string().min(1) });
type Tab = "skills" | "systems" | "references" | "tools";

export function EveSmokeTest() {
  const agent = useEveAgent();
  const [modelChoice, setModelChoice] = useState<ModelChoice>(DEFAULT_MODEL_CHOICE);
  const [testPrompt, setTestPrompt] = useState("Comprueba la conexión local de Eve para XPage y resume en una frase qué puede hacer este agente.");
  const [error, setError] = useState("");
  const [testedModel, setTestedModel] = useState<ModelChoice | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("skills");
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [systems, setSystems] = useState<DesignSystemInfo[]>([]);
  const [references, setReferences] = useState<ReferenceInfo[]>([]);
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState("");
  const [openSkill, setOpenSkill] = useState<SkillInfo | null>(null);
  const [openReference, setOpenReference] = useState<{ reference: ReferenceInfo; content: string } | null>(null);
  const [catalogError, setCatalogError] = useState("");
  const [imageConfigured, setImageConfigured] = useState(false);
  const busy = agent.status === "submitted" || agent.status === "streaming" || agent.status === "resuming";
  const completion = [...agent.events].reverse().find((event) => event.type === "result.completed");
  const parsedResult = completion?.type === "result.completed" ? outputSchema.safeParse(completion.data.result) : null;
  const result = parsedResult?.success ? parsedResult.data : null;

  useEffect(() => {
    const savedModel = window.localStorage.getItem("xpage.model-choice") as ModelChoice | null;
    if (savedModel && savedModel in modelLabels) setModelChoice(savedModel);
    setSelectedSystemId(window.localStorage.getItem("xpage.design-system-id") ?? "");

    void fetch("/api/eve/capabilities")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "No se pudo cargar el catálogo de Eve.");
        setSkills(payload.skills ?? []);
        setReferences(payload.references ?? []);
        setTools(payload.tools ?? []);
      })
      .catch((cause) => setCatalogError(cause instanceof Error ? cause.message : "No se pudo cargar el catálogo de Eve."));
    void fetch("/api/design-systems")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "No se pudo cargar el catálogo de diseño.");
        setSystems(payload.designSystems ?? []);
      })
      .catch(() => setCatalogError("No se pudo cargar el catálogo de capacidades locales."));
    void fetch("/api/eve-model")
      .then((response) => response.json())
      .then((payload) => setImageConfigured(payload.imageConfigured === true))
      .catch(() => undefined);
  }, []);

  async function runCheck() {
    setError("");
    setTestedModel(modelChoice);
    try {
      await agent.send(`XPage model selection: ${modelChoice}\n\n${testPrompt.trim()}`, { outputSchema });
    } catch {
      setError("No se pudo iniciar la solicitud. Comprueba que Eve esté activa y revisa la conexión del selector.");
    }
  }

  async function inspectSkill(id: string) {
    setOpenReference(null);
    const response = await fetch(`/api/eve/capabilities?skillId=${encodeURIComponent(id)}`);
    const payload = await response.json();
    if (!response.ok) return setCatalogError(payload.error ?? "No se pudo leer la skill.");
    setCatalogError("");
    setOpenSkill(payload.skill);
  }

  async function inspectReference(reference: ReferenceInfo) {
    setOpenSkill(null);
    setOpenReference(null);
    const response = await fetch(`/api/eve/capabilities?referenceId=${encodeURIComponent(reference.id)}`);
    const payload = await response.json();
    if (!response.ok) return setCatalogError(payload.error ?? "No se pudo leer la referencia.");
    setCatalogError("");
    setOpenReference(payload);
  }

  function chooseSystem(id: string) {
    setSelectedSystemId(id);
    if (id) window.localStorage.setItem("xpage.design-system-id", id);
    else window.localStorage.removeItem("xpage.design-system-id");
  }

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "skills", label: "Skills" }, { id: "systems", label: "Sistemas de diseño" },
    { id: "references", label: "Referencias" }, { id: "tools", label: "Tools" },
  ];

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Conexión local</p>
        <h1 className="mt-2 font-display text-4xl">Espacio de Eve</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Comprueba el agente con el modelo elegido, revisa las skills y herramientas cargadas en XPage, y fija un sistema compositivo para la próxima creación.
        </p>
      </header>

      <EveModelSelector value={modelChoice} onChange={setModelChoice} />

      <section className="rounded-2xl border border-border bg-card p-5" aria-labelledby="eve-check-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="eve-check-heading" className="text-lg font-semibold">Prueba actual</h2>
            <p className="mt-1 text-sm text-muted-foreground">Estado de Eve: <span className="font-medium text-foreground">{agent.status}</span>. Modelo seleccionado: {modelLabels[modelChoice]}.</p>
          </div>
          {testedModel ? <p className="text-xs text-muted-foreground">Última solicitud: {modelLabels[testedModel]}</p> : null}
        </div>
        <label className="mt-4 block space-y-1.5 text-sm font-medium">
          Mensaje de prueba
          <Textarea value={testPrompt} onChange={(event) => setTestPrompt(event.target.value)} maxLength={1200} className="min-h-24 resize-y font-normal" />
        </label>
        <Button className="mt-3" disabled={busy || !testPrompt.trim()} onClick={() => void runCheck()}>
          {busy ? "Esperando a Eve…" : "Enviar prueba estructurada"}
        </Button>
        {result ? <pre className="mt-4 overflow-auto rounded-lg bg-muted p-4 text-sm" role="status">{JSON.stringify(result, null, 2)}</pre> : null}
        {error || agent.error || (parsedResult && !parsedResult.success) ? (
          <div className="mt-4 space-y-2 text-sm text-destructive" role="alert">
            {error || (parsedResult && !parsedResult.success ? "Eve respondió, pero el resultado no coincide con el esquema esperado." : "No hay una sesión disponible o Eve no pudo usarla.")}
            <p><Link href="/" className="font-medium text-primary underline underline-offset-2">Ve al selector para conectar ChatGPT Subscription</Link></p>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5" aria-labelledby="eve-catalog-heading">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Capacidades cargadas</p>
          <h2 id="eve-catalog-heading" className="mt-1 text-xl font-semibold">Explorador de Eve</h2>
          <p className="mt-1 text-sm text-muted-foreground">El catálogo enumera skills, sistemas y referencias locales junto con las tools ejecutables disponibles.</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 border-b border-border" role="group" aria-label="Secciones del catálogo de Eve">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" aria-pressed={activeTab === tab.id} onClick={() => { setActiveTab(tab.id); setOpenSkill(null); setOpenReference(null); }} className={`min-h-10 border-b-2 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${activeTab === tab.id ? "border-primary font-semibold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {catalogError ? <p className="mt-3 text-sm text-destructive" role="alert">{catalogError}</p> : null}

        {activeTab === "skills" ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {skills.map((skill) => (
              <article key={skill.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{skill.name}</h3><p className="mt-1 text-xs text-muted-foreground">{skill.id} · {skill.version}</p></div><span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] text-primary">Eve skill</span></div>
                <p className="mt-3 text-sm leading-5">{skill.description}</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">Entrega: {skill.artifact}</p>
                <Button type="button" size="sm" variant="outline" className="mt-3" onClick={() => void inspectSkill(skill.id)}>Leer procedimiento</Button>
              </article>
            ))}
            {openSkill ? <article className="md:col-span-2 rounded-xl border border-primary/30 bg-muted/20 p-4"><h3 className="font-semibold">{openSkill.heading}</h3><pre className="mt-3 max-h-[32rem] overflow-auto whitespace-pre-wrap text-xs leading-5">{openSkill.content}</pre></article> : null}
          </div>
        ) : null}

        {activeTab === "systems" ? (
          <div className="mt-4 space-y-4">
            <label className="block max-w-xl text-sm font-medium">Sistema para la próxima creación
              <select value={selectedSystemId} onChange={(event) => chooseSystem(event.currentTarget.value)} className="mt-2 min-h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
                <option value="">Automático según el brief</option>
                {systems.map((system) => <option key={system.id} value={system.id}>{system.name}</option>)}
              </select>
            </label>
            <p className="text-xs text-muted-foreground">Se guarda localmente para que Home lo envíe como `brief.designSystemId`. Eve conserva la elección salvo que choque con un hecho o requisito de accesibilidad.</p>
            <div className="grid gap-3 md:grid-cols-2">
              {systems.map((system) => <article key={system.id} className={`rounded-xl border p-4 ${selectedSystemId === system.id ? "border-primary bg-primary/[0.03]" : "border-border"}`}>
                <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{system.name}</h3><code className="text-[11px] text-muted-foreground">{system.id}</code></div><Button type="button" size="sm" variant={selectedSystemId === system.id ? "secondary" : "outline"} onClick={() => chooseSystem(selectedSystemId === system.id ? "" : system.id)}>{selectedSystemId === system.id ? "Elegido" : "Usar"}</Button></div>
                <p className="mt-3 text-xs leading-5"><strong>Encaja:</strong> {system.bestFor}</p><p className="mt-2 text-sm leading-5">{system.visualGrammar}</p>
                <dl className="mt-3 grid gap-2 text-xs leading-5"><div><dt className="font-semibold">Tipografía</dt><dd className="text-muted-foreground">{system.type}</dd></div><div><dt className="font-semibold">Color</dt><dd className="text-muted-foreground">{system.colorLogic}</dd></div><div><dt className="font-semibold">Material y movimiento</dt><dd className="text-muted-foreground">{system.material} {system.motion}</dd></div><div><dt className="font-semibold">Evitar</dt><dd className="text-muted-foreground">{system.avoid.join(" · ")}</dd></div></dl>
              </article>)}
            </div>
          </div>
        ) : null}

        {activeTab === "references" ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {references.map((reference) => <article key={reference.id} className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{reference.title}</h3><code className="text-[11px] text-muted-foreground">{reference.id}</code></div><span className="rounded-full bg-muted px-2 py-1 text-[10px]">Referencia</span></div>
              <p className="mt-2 text-sm leading-5">{reference.use}</p><p className="mt-2 text-xs text-muted-foreground">Fuente: {reference.sourcePath} · {reference.license}</p>
              <div className="mt-3 flex flex-wrap gap-3"><Button type="button" size="sm" variant="outline" onClick={() => void inspectReference(reference)}>Leer material</Button>{reference.sourceUrl ? <a className="self-center text-xs font-medium text-primary underline underline-offset-2" href={reference.sourceUrl} target="_blank" rel="noreferrer">Abrir fuente atribuida</a> : null}</div>
            </article>)}
            <p className="md:col-span-2 rounded-lg bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">Las referencias son documentos de consulta. No son plugins, herramientas ejecutables ni un runtime de OpenDesign. Licencias y atribución se muestran junto a la fuente.</p>
            {openReference ? <article className="md:col-span-2 rounded-xl border border-primary/30 bg-muted/20 p-4"><h3 className="font-semibold">{openReference.reference.title}</h3><pre className="mt-3 max-h-[32rem] overflow-auto whitespace-pre-wrap text-xs leading-5">{openReference.content}</pre></article> : null}
          </div>
        ) : null}

        {activeTab === "tools" ? (
          <div className="mt-4 space-y-3">
            {[{ id: "load_skill", title: "Cargar skill", kind: "Eve built-in", status: "Disponible", summary: "Lee procedimientos locales seleccionados desde agent/skills para aplicarlos a la tarea." }, ...tools.map((tool) => ({ ...tool, status: tool.id === "generate_image" ? (imageConfigured ? "Proveedor configurado" : "Requiere proveedor de imagen") : "Disponible" }))].map((tool) => <article key={tool.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{tool.title} <code className="ml-1 text-xs text-muted-foreground">{tool.id}</code></h3><span className="rounded-full bg-muted px-2 py-1 text-[10px]">{tool.kind} · {tool.status}</span></div><p className="mt-2 text-sm leading-5 text-muted-foreground">{tool.summary}</p>
            </article>)}
            <p className="text-xs leading-5 text-muted-foreground">Búsqueda y selección de imagen/vídeo se hacen desde los flujos de medios existentes. Vídeo usa resultados reales del banco gratuito configurado; no hay herramienta de generación de video.</p>
          </div>
        ) : null}
      </section>
    </section>
  );
}
