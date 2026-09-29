import { NextResponse } from "next/server";
import { getTechnique } from "@/lib/techniques";
import { promptRequestSchema, type PromptRequest } from "@/lib/schemas";
import { designPlanSchema, validateTechniqueCoverage } from "@/lib/design-plan";
import { runEveStructured } from "@/lib/eve-runtime";
import { creativeDirectionsResponseSchema } from "@/lib/creative-directions";
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
  if (input.mode === "directions") return generateCreativeDirections(input);

  const techniqueIds = input.mode === "technique" ? [input.techniqueId] : input.techniqueIds;
  const techniques = techniqueIds.map(getTechnique);
  const briefText = [
    `Tema o industria: ${input.brief.topic}`,
    `Producto y beneficio: ${input.brief.offer}`,
    `Público: ${input.brief.audience}`,
    `Tono o dirección visual: ${input.brief.tone}`,
    input.brief.cta ? `CTA principal: ${input.brief.cta}` : "CTA principal: proponer uno coherente.",
  ].join("\n");
  const skillNames: string[] = techniques.map(({ id }) => id);
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

async function generateCreativeDirections(input: Extract<PromptRequest, { mode: "directions" }>) {
  const selected = input.techniqueIds.map(getTechnique);
  const skillNames: string[] = selected.map(({ id }) => id);
  if (selected.length > 1) skillNames.push("combine");
  const briefText = [
    `Tema: ${input.brief.topic}`,
    `Oferta: ${input.brief.offer}`,
    `Público: ${input.brief.audience}`,
    `Tono: ${input.brief.tone}`,
    `CTA: ${input.brief.cta || "proponer una acción coherente"}`,
    `Marca o logo descrito: ${input.brief.brand || "no proporcionado"}`,
    `Paleta preferida: ${input.brief.palette || "sin preferencia; proponer con roles y valores"}`,
    `Referencias aportadas por el usuario (no verificadas): ${input.brief.references || "ninguna"}`,
    `Evitar: ${input.brief.avoid || "sin exclusiones adicionales"}`,
    `Objetivo: ${input.brief.objective || "entender la oferta y facilitar la acción indicada"}`,
    `Variedad: ${input.brief.variety}; movimiento: ${input.brief.movement}; densidad: ${input.brief.density}.`,
  ].join("\n");
  const message = `Antes de escribir código, genera 2 o 3 direcciones creativas realmente distintas para el mismo brief y métodos seleccionados. Haz una sola respuesta estructurada con una dirección y un DesignPlan completo por alternativa. No hagas una secuencia de llamadas ni copies la misma composición cambiando solo colores.

Carga y aplica estas skills de Eve: ${skillNames.join(", ")}. Cada DesignPlan debe cubrir exactamente todos los métodos elegidos; los aportes deben estar presentes también en cada alternativa.

Para cada dirección define primera pantalla/hero, narrativa y ritmo de secciones, paleta por roles, tipografía disponible, motivo visual, uso de imagen/video (solo especificación), razón breve ligada al brief y al menos dos diferencias estructurales observables respecto de otra opción. Usa opciones contrastantes: por ejemplo, editorial asimétrica frente a demostración modular o narrativa de caso frente a recorrido de producto, solo si encaja con este brief. La elección de variedad controla cuánto divergen; no conviertas movimiento en animación automática. Respeta movimiento reducido y densidad elegida.

Cada campo designPlan.prompt debe ser un prompt final, específico y ejecutable derivado de esa misma dirección, método, DesignDNA, secciones, copy, recursos y restricciones. Incluye data-xpage-section y data-xpage-slot. No uses texto de relleno ni alargues para aparentar calidad. Incluye creativeSettings y creativeDirection dentro de cada plan, con id coincidente con la dirección.

Brief:
${briefText}

Decisiones de métodos seleccionados: ${selected.map(({ id, name, instruction }) => `${id} (${name}): ${instruction}`).join("\n")}

No inventes hechos, datos, claims, garantías, testimonios, logos ni contenido de las referencias. Las URLs/descripciones son material de referencia proporcionado por el usuario, no evidencia verificada. Si no hay identidad de marca, declara cada dirección como propuesta creativa. Devuelve solo el objeto del esquema.`;
  const startedAt = Date.now();
  try {
    const { data } = await runEveStructured({
      modelChoice: input.modelChoice,
      message,
      outputSchema: creativeDirectionsResponseSchema,
    });
    const parsed = creativeDirectionsResponseSchema.safeParse(data);
    const ids = parsed.success ? new Set(parsed.data.directions.map(({ id }) => id)) : new Set<string>();
    const titles = parsed.success ? new Set(parsed.data.directions.map(({ title }) => title.trim().toLocaleLowerCase())) : new Set<string>();
    const firstScreens = parsed.success ? new Set(parsed.data.directions.map(({ firstScreen }) => firstScreen.trim().toLocaleLowerCase())) : new Set<string>();
    if (!parsed.success || ids.size !== parsed.data.directions.length || titles.size !== parsed.data.directions.length || firstScreens.size !== parsed.data.directions.length || parsed.data.directions.some((direction) =>
      direction.designPlan.creativeDirection?.id !== direction.id ||
      !direction.designPlan.creativeSettings ||
      direction.designPlan.creativeSettings.objective !== input.brief.objective ||
      direction.designPlan.creativeSettings.variety !== input.brief.variety ||
      direction.designPlan.creativeSettings.movement !== input.brief.movement ||
      direction.designPlan.creativeSettings.density !== input.brief.density ||
      !validateTechniqueCoverage(direction.designPlan, input.techniqueIds)
    )) {
      throw new Error("Eve devolvió direcciones duplicadas o planes incompletos.");
    }

    const directions = parsed.data.directions;
    await recordTraceStep(input.traceId, {
      eventType: "decision",
      phase: "creative-direction-options",
      title: "Direcciones creativas · Eve",
      techniqueIds: input.techniqueIds,
      provider: "eve-local",
      model: input.modelChoice,
      userPrompt: message,
      outputText: directions.map(({ title, rationale, structuralDifference }) => `${title}: ${rationale} · ${structuralDifference.join("; ")}`).join("\n"),
      output: { directions },
      decisionSummary: `Propuestas: ${directions.map(({ title }) => title).join(" · ")}`,
      references: [{ kind: "source", id: "brief", label: "Brief creativo", sourceType: "brief" }],
      durationMs: Date.now() - startedAt,
    });
    await updateTraceStatus(input.traceId, "direction-selection-pending");
    return NextResponse.json({ directions, traceId: input.traceId, techniqueIds: input.techniqueIds, modelChoice: input.modelChoice });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eve no pudo proponer direcciones.";
    await recordTraceStep(input.traceId, {
      phase: "creative-direction-options",
      title: "Direcciones creativas · Eve",
      techniqueIds: input.techniqueIds,
      provider: "eve-local",
      model: input.modelChoice,
      userPrompt: message,
      status: "failed",
      errorMessage: message.slice(0, 500),
      durationMs: Date.now() - startedAt,
    }).catch(() => undefined);
    await updateTraceStatus(input.traceId, "failed");
    return NextResponse.json({
      error: `Eve no pudo proponer direcciones con ${input.modelChoice}. Revisa el estado local e inténtalo de nuevo.`,
      code: "eve_directions_unavailable",
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
