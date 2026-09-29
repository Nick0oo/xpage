import { APICallError, generateText, NoObjectGeneratedError, Output } from "ai";
import { NextResponse } from "next/server";
import {
  generateTextWithFallback,
  getGeminiModel,
  getOpenRouterTextFallbackModel,
  getOpenRouterTextModel,
  isTextProviderConfigured,
  DEFAULT_GEMINI_MODEL,
  DEFAULT_OPENROUTER_TEXT_MODEL,
  DEFAULT_OPENROUTER_TEXT_FALLBACK_MODEL,
} from "@/lib/ai/providers";
import { getProviderFailure } from "@/lib/ai/errors";
import { getTechnique } from "@/lib/techniques";
import { generatedPromptSchema, promptRequestSchema } from "@/lib/schemas";
import { Client } from "eve/client";
import { designPlanSchema, validateTechniqueCoverage } from "@/lib/design-plan";
import {
  recordProviderAttempts,
  recordTraceStep,
  setGenerationTraceStatus,
  type ProviderAttemptTrace,
} from "@/lib/generation-traces";

export const runtime = "nodejs";

const promptSystem = `Eres director creativo y estratega de UX, conversión y contenido. Transformas un brief y unas técnicas explícitas en un prompt de dirección web específico, visualmente distintivo y listo para que otro modelo construya una landing completa.

Usa el brief como fuente de verdad: no conviertas hipótesis en hechos ni inventes precios, cifras, clientes, testimonios, premios, funciones o garantías. Si faltan datos, diseña sin ellos. Trabaja con la motivación y las dudas plausibles del público, pero no afirmes conocer datos de investigación que no se hayan proporcionado.

No repitas una plantilla genérica de SaaS. Deriva una dirección de arte reconocible de la oferta y el público: un concepto visual breve, paleta con roles, tipografía disponible sin fuentes remotas, composición y un motivo visual que tenga sentido para la marca. Define un recorrido narrativo breve que explique la oferta, responda dudas reales y conduzca a una acción principal. Las secciones se eligen por necesidad, no para llenar una plantilla.

Aplica cada técnica seleccionada de forma concreta y compatible con las demás. Si hay tensión, conserva la identidad visual y prioriza claridad, accesibilidad y conversión. Si se solicita creador-crítico, revisa internamente la primera dirección y corrige problemas de jerarquía, fricción, consistencia y afirmaciones no respaldadas; entrega solo la versión revisada. No muestres razonamiento privado.

Devuelve únicamente un prompt autónomo en español para generar una landing terminada con HTML semántico, CSS y JavaScript vanilla separados. El prompt debe incluir decisiones de diseño accionables, comportamiento de los controles, criterios responsive y accesibilidad; no debe pedir al siguiente modelo que revele su cadena de pensamiento ni que genere llamadas, agentes o archivos externos.`;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = promptRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Revisa el brief y la selección de técnicas.", code: "invalid_input" },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const techniqueIds =
    input.mode === "technique" ? [input.techniqueId] : input.techniqueIds;
  const selectedTechniques = techniqueIds.map(getTechnique);
  const briefText = [
    `Tema o industria: ${input.brief.topic}`,
    `Producto y beneficio: ${input.brief.offer}`,
    `Público: ${input.brief.audience}`,
    `Tono o dirección visual: ${input.brief.tone}`,
    input.brief.cta ? `CTA principal: ${input.brief.cta}` : "CTA principal: proponer uno coherente.",
  ].join("\n");

  // Eve is the primary structured planner. Failure is recoverable: existing
  // prompt generation remains available while local ChatGPT authentication is pending.
  const eveOrigin = process.env.EVE_ORIGIN?.trim() || "http://127.0.0.1:3000";
  const eveStartedAt = Date.now();
  const evePhase = input.mode === "combine" ? "combined-design-plan" : "technique-design-plan";
  try {
    const client = new Client({ host: `${eveOrigin.replace(/\/$/, "")}/eve/v1` });
    const task = input.mode === "combine"
      ? `Combina estas técnicas: ${selectedTechniques.map(({ id, name }) => `${id} (${name})`).join(", ")}. Carga y aplica su skill versionada y la skill combine.`
      : `Aplica la técnica ${selectedTechniques[0].id} (${selectedTechniques[0].name}). Carga y aplica su skill versionada.`;
    const prompt = `${task}\n\nEntrega un DesignPlan completo para XPage con los campos del esquema. Cada contribución debe resumir decisiones observables, nunca razonamiento privado.\n\nBrief (fuente de hechos):\n${briefText}\n\nIDs seleccionados: ${techniqueIds.join(", ")}. Marca motivaciones y objeciones como hipótesis. Claims respaldados deben señalar el dato exacto del brief. El campo prompt debe ser un prompt editable para construir la landing. Incluye atributos data-xpage-section y data-xpage-slot en ese prompt.`;
    const { response } = await client.sessions.create({ message: prompt, outputSchema: designPlanSchema });
    const result = await response.result();
    const plan = designPlanSchema.safeParse(result.data);
    if (plan.success && validateTechniqueCoverage(plan.data, techniqueIds)) {
      await recordEveTraceStep(input.traceId, {
        phase: evePhase,
        title: "Plan estructurado · Eve",
        techniqueIds,
        provider: "eve-local",
        model: "eve-configured-model",
        userPrompt: prompt,
        outputText: plan.data.prompt,
        output: plan.data,
        durationMs: Date.now() - eveStartedAt,
      });
      await updateTraceStatus(input.traceId, "prompt-ready");
      return NextResponse.json({
        prompt: plan.data.prompt,
        techniqueIds,
        traceId: input.traceId,
        designPlan: plan.data,
        generationMode: "eve-design-plan",
      });
    }
    await recordEveTraceStep(input.traceId, {
      phase: evePhase,
      title: "Plan estructurado · Eve",
      techniqueIds,
      provider: "eve-local",
      model: "eve-configured-model",
      userPrompt: briefText,
      status: "failed",
      errorMessage: "La salida no cumple el contrato DesignPlan o no cubre las técnicas seleccionadas.",
      durationMs: Date.now() - eveStartedAt,
    });
    console.warn("Eve returned an incomplete XPage design plan; using the legacy prompt path.");
  } catch (error) {
    await recordEveTraceStep(input.traceId, {
      phase: evePhase,
      title: "Plan estructurado · Eve",
      techniqueIds,
      provider: "eve-local",
      model: "eve-configured-model",
      userPrompt: briefText,
      status: "failed",
      errorMessage: error instanceof Error ? error.message.slice(0, 500) : "unknown error",
      durationMs: Date.now() - eveStartedAt,
    });
    console.warn("Eve structured planning is unavailable; using the legacy prompt path.", error instanceof Error ? error.message : "unknown error");
  }

  if (!isTextProviderConfigured()) {
    await updateTraceStatus(input.traceId, "failed");
    return NextResponse.json(
      {
        error: "Eve no entregó un plan válido y no hay un proveedor alternativo configurado. Completa el acceso local a ChatGPT o configura Gemini/OpenRouter.",
        code: "structured_planner_unavailable",
      },
      { status: 503 },
    );
  }

  const techniqueText = selectedTechniques
    .map((technique) => `### ${technique.name}\n${technique.instruction}`)
    .join("\n\n");

  const task =
    input.mode === "technique"
      ? `Redacta un solo prompt aplicando la técnica «${selectedTechniques[0].name}».`
      : "Redacta un único prompt que combine todas las técnicas seleccionadas como un sistema de diseño coherente, sin duplicaciones ni instrucciones que compitan.";

  const userPrompt = `${task}

BRIEF — fuente de verdad
${briefText}

TÉCNICAS — instrucciones que debes aplicar
${techniqueText}

CONSTRUYE EL PROMPT FINAL CON ESTAS DECISIONES
1. Estrategia: concreta qué intenta resolver o conseguir el público, qué duda podría frenarlo y qué mensaje le ayuda a avanzar. Preséntalo como dirección, no como dato investigado.
2. Dirección de arte: inventa un concepto visual específico y coherente con esta oferta; define una paleta breve con roles, carácter tipográfico, composición y un motivo visual memorable. Evita recetas genéricas de SaaS y no impongas estilos que contradigan el brief.
3. Recorrido: plantea solo las secciones necesarias para explicar la oferta y llegar al CTA. Elige una composición de hero deliberada; no asumas hero centrado, dos columnas, Bento ni tres tarjetas iguales. Da a cada sección un propósito y una transición clara.
4. Copy y confianza: escribe en español natural, con beneficios comprensibles, micro-copy útil y argumentos que el brief pueda respaldar. Si no hay pruebas, precios o métricas, no los simules.
5. Activos: si se seleccionaron técnicas de imagen o vídeo, especifica sujeto, encuadre, luz, proporción o movimiento y cómo el activo apoya el mensaje. La vista previa debe poder representarlo sin recursos remotos.
6. Entrega: pide una landing funcional, adaptable desde móvil, accesible por teclado y con HTML semántico, CSS separado con variables y JavaScript vanilla solo para interacciones reales.
7. Revisión: antes de responder, corrige inconsistencias de marca, jerarquía, fricción, exceso de elementos, accesibilidad y cualquier afirmación inventada. No incluyas la cadena de pensamiento.

Entrega un único prompt autónomo, concreto y fácil de editar. Devuelve solo sus instrucciones para construir la landing; no escribas la landing ni añadas comentarios sobre tu proceso.`;
  const attempts: ProviderAttemptTrace[] = [];
  const traceTitle = input.mode === "combine"
    ? `Combinar ${selectedTechniques.length} técnicas`
    : `Prompt · ${selectedTechniques[0].name}`;

  function modelName(provider: "gemini" | "openrouter" | "openrouter-fallback") {
    if (provider === "gemini") return process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
    if (provider === "openrouter") return process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_TEXT_MODEL;
    return process.env.OPENROUTER_FALLBACK_MODEL?.trim() || DEFAULT_OPENROUTER_TEXT_FALLBACK_MODEL;
  }

  async function run(provider: "gemini" | "openrouter" | "openrouter-fallback") {
    const startedAt = Date.now();
    const model = modelName(provider);
    try {
      const result = await generateText({
        model:
          provider === "gemini"
            ? getGeminiModel()
            : provider === "openrouter"
              ? getOpenRouterTextModel()
              : getOpenRouterTextFallbackModel(),
        instructions: promptSystem,
        output: Output.object({ schema: generatedPromptSchema }),
        maxRetries: 0,
        maxOutputTokens: provider === "gemini" ? 6_000 : 3_500,
        providerOptions:
          provider === "gemini"
            ? { google: { thinkingConfig: { thinkingLevel: "low" } } }
            : undefined,
        prompt: userPrompt,
      });
      attempts.push({
        provider,
        model,
        status: "completed",
        durationMs: Date.now() - startedAt,
        outputText: result.output?.prompt,
      });
      return result;
    } catch (error) {
      const errorName = error instanceof Error ? error.name : "UnknownError";
      const status = APICallError.isInstance(error) ? error.statusCode : undefined;
      const finishReason = NoObjectGeneratedError.isInstance(error) ? error.finishReason : undefined;
      attempts.push({
        provider,
        model,
        status: "failed",
        durationMs: Date.now() - startedAt,
        errorMessage: [errorName, status ? `HTTP ${status}` : "", finishReason ? `finishReason ${finishReason}` : ""]
          .filter(Boolean)
          .join(" · "),
      });
      throw error;
    }
  }

  try {
    const { output } = await generateTextWithFallback(run);

    if (!output) {
      await recordProviderAttempts({
        traceId: input.traceId,
        phase: input.mode === "combine" ? "combined-prompt" : "technique-prompt",
        title: traceTitle,
        techniqueIds,
        systemPrompt: promptSystem,
        userPrompt,
        attempts,
      });
      await updateTraceStatus(input.traceId, "failed");
      return NextResponse.json(
        { error: "El proveedor no devolvió un prompt válido.", code: "invalid_output" },
        { status: 502 },
      );
    }

    await recordProviderAttempts({
      traceId: input.traceId,
      phase: input.mode === "combine" ? "combined-prompt" : "technique-prompt",
      title: traceTitle,
      techniqueIds,
      systemPrompt: promptSystem,
      userPrompt,
      attempts,
    });
    await updateTraceStatus(input.traceId, "prompt-ready");
    return NextResponse.json({
      prompt: output.prompt,
      techniqueIds,
      traceId: input.traceId,
      designPlan: null,
      generationMode: "legacy-prompt",
    });
  } catch (error) {
    await recordProviderAttempts({
      traceId: input.traceId,
      phase: input.mode === "combine" ? "combined-prompt" : "technique-prompt",
      title: traceTitle,
      techniqueIds,
      systemPrompt: promptSystem,
      userPrompt,
      attempts,
    });
    await updateTraceStatus(input.traceId, "failed");
    const failure = getProviderFailure(error, "XPage prompt generation failed");
    return NextResponse.json(failure.body, { status: failure.status });
  }
}

async function updateTraceStatus(traceId: string | undefined, status: string) {
  if (!traceId) return;
  try {
    await setGenerationTraceStatus(traceId, status);
  } catch {
    console.error("XPage prompt trace status update failed", { traceId, status });
  }
}

async function recordEveTraceStep(
  traceId: string | undefined,
  step: Parameters<typeof recordTraceStep>[1],
) {
  try {
    await recordTraceStep(traceId, step);
  } catch {
    console.error("XPage Eve trace persistence failed", { traceId, phase: step.phase });
  }
}
