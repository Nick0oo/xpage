import { NextResponse } from "next/server";
import { getTechnique } from "@/lib/techniques";
import { promptRequestSchema } from "@/lib/schemas";
import { designPlanSchema, validateTechniqueCoverage } from "@/lib/design-plan";
import { runEveStructured } from "@/lib/eve-runtime";
import {
  recordTraceStep,
  setGenerationTraceStatus,
} from "@/lib/generation-traces";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = promptRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Revisa el brief y la selección de técnicas.", code: "invalid_input" }, { status: 400 });
  }

  const input = parsed.data;
  const techniqueIds = input.mode === "technique" ? [input.techniqueId] : input.techniqueIds;
  const techniques = techniqueIds.map(getTechnique);
  const briefText = [
    `Tema o industria: ${input.brief.topic}`,
    `Producto y beneficio: ${input.brief.offer}`,
    `Público: ${input.brief.audience}`,
    `Tono o dirección visual: ${input.brief.tone}`,
    input.brief.cta ? `CTA principal: ${input.brief.cta}` : "CTA principal: proponer uno coherente.",
  ].join("\n");
  const skillNames = techniques.map(({ id }) => id);
  if (input.mode === "combine") skillNames.push("combine");
  const task = input.mode === "combine"
    ? `Combina con criterio estos métodos: ${techniques.map(({ id, name }) => `${id} (${name})`).join(", ")}.`
    : `Aplica el método ${techniques[0].id} (${techniques[0].name}) con profundidad.`;
  const message = `${task}

Carga y sigue estas skills de Eve: ${skillNames.join(", ")}. Trata sus instrucciones como procedimientos que debes ejecutar, no como etiquetas.

Devuelve un DesignPlan completo según el esquema. Trabaja primero una propuesta completa, evalúala y revisa el resultado antes de responder. Si el método creator-critic está seleccionado, rellena su propuesta, hallazgos y revisión explícitos. Describe decisiones observables, nunca razonamiento privado.

Brief (fuente de hechos):
${briefText}

IDs seleccionados: ${techniqueIds.join(", ")}. Cada contribución debe identificar la técnica, versión de skill, decisión concreta, artefacto visible y estado. Registra tensiones reales y su resolución. La cobertura de contribuciones debe coincidir exactamente con los métodos seleccionados.

No inventes precios, cifras, clientes, testimonios, premios, funciones o garantías. Distingue hechos respaldados del brief, hipótesis y afirmaciones descartadas. El campo prompt es un prompt editable y completo en español para construir la landing. Incluye decisiones de estrategia, voz, recorrido, dirección visual, detalle de secciones, comportamiento accesible y atributos data-xpage-section/data-xpage-slot que conecten HTML y plan.`;
  const startedAt = Date.now();
  const phase = input.mode === "combine" ? "combined-design-plan" : "technique-design-plan";

  try {
    const { data } = await runEveStructured({
      modelChoice: input.modelChoice,
      message,
      outputSchema: designPlanSchema,
    });
    const plan = designPlanSchema.safeParse(data);
    if (!plan.success || !validateTechniqueCoverage(plan.data, techniqueIds)) {
      throw new Error("Eve devolvió un DesignPlan incompleto o no cubre los métodos seleccionados.");
    }

    await recordTraceStep(input.traceId, {
      eventType: "decision",
      phase,
      title: input.mode === "combine" ? "Plan combinado · Eve" : "Plan del método · Eve",
      techniqueIds,
      provider: "eve-local",
      model: input.modelChoice,
      userPrompt: message,
      outputText: plan.data.prompt,
      output: plan.data,
      skillVersions: Object.fromEntries(plan.data.contributions.map(({ techniqueId, skillVersion }) => [techniqueId, skillVersion])),
      decisionSummary: plan.data.contributions.map(({ techniqueId, decision, status, resolution }) => `${techniqueId} (${status}): ${decision}${resolution ? ` · Resolución: ${resolution}` : ""}`).join("\n"),
      references: [{ kind: "source", id: "brief", label: "Brief aportado", sourceType: "brief" }],
      durationMs: Date.now() - startedAt,
    });
    await updateTraceStatus(input.traceId, "prompt-ready");
    return NextResponse.json({
      prompt: plan.data.prompt,
      techniqueIds,
      traceId: input.traceId,
      designPlan: plan.data,
      generationMode: "eve-design-plan",
      modelChoice: input.modelChoice,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eve no pudo completar el plan.";
    await recordTraceStep(input.traceId, {
      phase,
      title: "Plan de diseño · Eve",
      techniqueIds,
      provider: "eve-local",
      model: input.modelChoice,
      userPrompt: briefText,
      status: "failed",
      errorMessage: message.slice(0, 500),
      durationMs: Date.now() - startedAt,
    }).catch(() => undefined);
    await updateTraceStatus(input.traceId, "failed");
    return NextResponse.json({
      error: `Eve no pudo generar el plan con ${input.modelChoice}. Revisa su estado local y credenciales, o selecciona un proveedor configurado.`,
      code: "eve_model_unavailable",
    }, { status: 503 });
  }
}

async function updateTraceStatus(traceId: string | undefined, status: string) {
  if (!traceId) return;
  try {
    await setGenerationTraceStatus(traceId, status);
  } catch {
    console.error("XPage generation trace status update failed", { traceId, status });
  }
}
