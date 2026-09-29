import { NextResponse } from "next/server";
import { getTechnique } from "@/lib/techniques";
import { promptRequestSchema, type PromptRequest } from "@/lib/schemas";
import { designPlanSchema, techniqueContributionSchema, validateTechniqueCoverage } from "@/lib/design-plan";
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
    return NextResponse.json({ error: "Revisa el brief y la selecci\u00f3n de t\u00e9cnicas.", code: "invalid_input" }, { status: 400 });
  }

  const input = parsed.data;
  if (input.mode === "directions") return generateCreativeDirections(input);
  if (input.mode === "technique") return generateTechniqueContribution(input);

  const techniqueIds = input.techniqueIds;
  const contributionIds = input.methodContributions.map(({ techniqueId }) => techniqueId);
  if (new Set(contributionIds).size !== contributionIds.length || contributionIds.length !== techniqueIds.length || techniqueIds.some((id) => !contributionIds.includes(id))) {
    return NextResponse.json({ error: "Los aportes recibidos no corresponden exactamente a los m\u00e9todos seleccionados.", code: "invalid_contributions" }, { status: 400 });
  }
  const techniques = techniqueIds.map(getTechnique);
  const briefText = [
    `Tema o industria: ${input.brief.topic}`,
    `Producto y beneficio: ${input.brief.offer}`,
    `P\u00fablico: ${input.brief.audience}`,
    `Tono o direcci\u00f3n visual: ${input.brief.tone}`,
    input.brief.cta ? `CTA principal: ${input.brief.cta}` : "CTA principal: proponer uno coherente.",
  ].join("\n");
  const skillNames = [...techniques.map(({ id }) => id), "combine"];
  const message = `Combina con criterio estos m\u00e9todos: ${techniques.map(({ id, name }) => `${id} (${name})`).join(", ")}.

Carga y sigue estas skills de Eve: ${skillNames.join(", ")}. Trata sus instrucciones como procedimientos que debes ejecutar, no como etiquetas.

APORTES REVISADOS POR EL USUARIO. Integra todos; no los descartes silenciosamente. Conserva como aportes propios las decisiones marcadas como applied o modified. Si hay tensi\u00f3n, resu\u00e9lvela seg\u00fan hechos del brief, accesibilidad, restricciones, objetivo y evidencia; explica la decisi\u00f3n en contributions. Los textos decision y artifact pueden haber sido editados por la persona: esos son los datos autoritativos.
${JSON.stringify(input.methodContributions, null, 2)}

Devuelve un DesignPlan completo seg\u00fan el esquema. Trabaja primero una propuesta completa, eval\u00fala y revisa el resultado antes de responder. Si el m\u00e9todo creator-critic est\u00e1 seleccionado, rellena su propuesta, hallazgos y revisi\u00f3n expl\u00edcitos. Describe decisiones observables, nunca razonamiento privado.

En explicitContentRequirements, registra cada entregable de contenido que el usuario pidió de forma medible o enumerable. Un pedido de 5 ejercicios requiere 5 ejercicios concretos, no solo la frase «hasta cinco»; si el brief establece un máximo, nunca lo excedas. Redacta contenido creativo original cuando sea parte del entregable; la prohibición de inventar hechos no prohíbe crear ejemplos, juegos o ejercicios solicitados. Asigna una sección y enumera allí los textos exactos que luego deben aparecer en HTML. Haz que section.copy y el prompt editable incluyan esos mismos textos; luego verifica que cada uno está representado. Deja la lista vacía si no hay un entregable explícito.

No reduzcas la landing a tres bloques por defecto. Diseña un recorrido completo acorde a la información disponible: con material suficiente, suele tener 5–7 secciones sustantivas (oferta, detalle, ejemplos o entrega, cómo funciona, dudas relevantes y cierre), cada una con objetivo, copy desarrollado y aporte distinto. Evita secciones de relleno y testimonios o pruebas que no estén en el brief. Si la información es limitada, usa menos y explica con claridad, no inventes profundidad.

CTA: usa el destino externo si el brief lo proporciona. Si no, elige un enlace interno que conduzca a una sección o contenido real de esta landing; nunca propongas un botón deshabilitado ni una acción ficticia. Refleja ese destino en la sección final y en el prompt.

Brief (fuente de hechos):
${briefText}
Brief completo y controles elegidos:
${JSON.stringify(input.brief)}

IDs seleccionados: ${techniqueIds.join(", ")}. Cada contribuci\u00f3n debe identificar la t\u00e9cnica, versi\u00f3n de skill, decisi\u00f3n concreta, artefacto visible y estado. Registra tensiones reales y su resoluci\u00f3n. La cobertura de contribuciones debe coincidir exactamente con los m\u00e9todos seleccionados.

REQUISITOS EXPL\u00cdCITOS DE CONTENIDO: detecta entregables comprobables del brief (por ejemplo, una cantidad de ejercicios, preguntas, pasos, recetas o elementos). Para cada uno completa explicitContentRequirements con el requisito, la secci\u00f3n destino, targetCount si el usuario pide una cantidad concreta y requiredItems con textos espec\u00edficos que deben aparecer. Si se piden cinco ejercicios o la oferta propone hasta cinco ejercicios para practicar, produce cinco ejercicios originales y útiles; no basta con mencionar la cifra en un titular. Respeta límites y nunca excedas el máximo. No conviertas supuestos en requisitos ni inventes hechos sobre el producto; crear ejercicios, ejemplos o recetas originales que el usuario pidió no es inventar un claim. Incluye cada requiredItem en el copy y prompt final de su secci\u00f3n. Si no hay entregable cuantificable/enumerable, devuelve una lista vacía.

No inventes precios, cifras, clientes, testimonios, premios, funciones o garant\u00edas. Distingue hechos respaldados del brief, hip\u00f3tesis y afirmaciones descartadas. El campo prompt es un prompt editable y completo en espa\u00f1ol para construir la landing. Incluye decisiones de estrategia, voz, recorrido, direcci\u00f3n visual, detalle de secciones, comportamiento accesible y atributos data-xpage-section/data-xpage-slot que conecten HTML y plan.`;
  const startedAt = Date.now();
  const phase = "combined-design-plan";

  try {
    const { data } = await runEveStructured({
      modelChoice: input.modelChoice,
      message,
      outputSchema: designPlanSchema,
    });
    const plan = designPlanSchema.safeParse(data);
    if (!plan.success || !validateTechniqueCoverage(plan.data, techniqueIds)) {
      throw new Error("Eve devolvi\u00f3 un DesignPlan incompleto o no cubre los m\u00e9todos seleccionados.");
    }

    await recordTraceStep(input.traceId, {
      eventType: "decision",
      phase,
      title: "Integraci\u00f3n de aportes \u00b7 Eve",
      techniqueIds,
      provider: "eve-local",
      model: input.modelChoice,
      userPrompt: message,
      outputText: plan.data.prompt,
      output: plan.data,
      skillVersions: Object.fromEntries(plan.data.contributions.map(({ techniqueId, skillVersion }) => [techniqueId, skillVersion])),
      decisionSummary: plan.data.contributions.map(({ techniqueId, decision, status, resolution }) => `${techniqueId} (${status}): ${decision}${resolution ? ` \u00b7 Resoluci\u00f3n: ${resolution}` : ""}`).join("\n"),
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
    const failureReason = safeFailureMessage(error);
    await recordTraceStep(input.traceId, {
      phase,
      title: "Integraci\u00f3n de aportes \u00b7 Eve",
      techniqueIds,
      provider: "eve-local",
      model: input.modelChoice,
      userPrompt: message,
      status: "failed",
      errorMessage: failureReason.slice(0, 500),
      durationMs: Date.now() - startedAt,
    }).catch(() => undefined);
    await updateTraceStatus(input.traceId, "failed");
    return NextResponse.json({
      error: `Eve no pudo combinar los aportes con ${input.modelChoice}. ${failureReason}`,
      code: "eve_model_unavailable",
    }, { status: 503 });
  }
}

async function generateTechniqueContribution(input: Extract<PromptRequest, { mode: "technique" }>) {
  const technique = getTechnique(input.techniqueId);
  const message = `Aplica solo el m\u00e9todo ${technique.id} (${technique.name}) y sigue su skill de Eve. Devuelve un aporte peque\u00f1o, estructurado y revisable por una persona. No construyas DesignPlan, secciones, HTML ni prompt final; eso corresponde a la combinaci\u00f3n posterior.

Prop\u00f3sito: ${technique.purpose}
Entradas del m\u00e9todo: ${technique.inputs}
Artefacto esperado: ${technique.artifact}
Instrucci\u00f3n espec\u00edfica: ${technique.instruction}

Brief completo:
${JSON.stringify(input.brief)}

Devuelve solo los campos del esquema TechniqueContribution. Usa techniqueId=${technique.id}, la versi\u00f3n real de la skill, estado applied/modified/omitted, una decisi\u00f3n concreta, artefacto visible, tensiones y resoluci\u00f3n breve. Si se omite, incluye el motivo. No inventes hechos ni muestres razonamiento privado.`;
  const startedAt = Date.now();
  const phase = "technique-contribution";
  try {
    const { data } = await runEveStructured({ modelChoice: input.modelChoice, message, outputSchema: techniqueContributionSchema });
    const parsed = techniqueContributionSchema.safeParse(data);
    if (!parsed.success || parsed.data.techniqueId !== input.techniqueId) {
      throw new Error("Eve devolvi\u00f3 un aporte que no corresponde al m\u00e9todo seleccionado.");
    }
    await recordTraceStep(input.traceId, {
      eventType: "decision",
      phase,
      title: `Aporte \u00b7 ${technique.name} \u00b7 Eve`,
      techniqueIds: [technique.id],
      provider: "eve-local",
      model: input.modelChoice,
      userPrompt: message,
      outputText: `${parsed.data.decision}\n${parsed.data.artifact}`,
      output: parsed.data,
      skillVersions: { [technique.id]: parsed.data.skillVersion },
      decisionSummary: `${parsed.data.status}: ${parsed.data.decision}${parsed.data.resolution ? ` \u00b7 Resoluci\u00f3n: ${parsed.data.resolution}` : ""}`,
      references: [{ kind: "source", id: `technique:${technique.id}`, label: technique.name }],
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({ contribution: parsed.data, traceId: input.traceId, modelChoice: input.modelChoice });
  } catch (error) {
    const failureReason = safeFailureMessage(error);
    await recordTraceStep(input.traceId, {
      phase,
      title: `Aporte \u00b7 ${technique.name} \u00b7 Eve`,
      techniqueIds: [technique.id],
      provider: "eve-local",
      model: input.modelChoice,
      userPrompt: message,
      status: "failed",
      errorMessage: failureReason.slice(0, 500),
      durationMs: Date.now() - startedAt,
    }).catch(() => undefined);
    return NextResponse.json({
      error: `Eve no pudo completar el aporte de ${technique.name} con ${input.modelChoice}. ${failureReason}`,
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
    if (!parsed.success) {
      const issues = parsed.error.issues.slice(0, 6).map(({ path, message: issueMessage }) => `${path.join(".") || "directions"}: ${issueMessage}`).join("; ");
      throw new Error(`La salida no cumple el esquema (${issues}).`);
    }
    if (ids.size !== parsed.data.directions.length || titles.size !== parsed.data.directions.length || firstScreens.size !== parsed.data.directions.length || parsed.data.directions.some((direction) =>
      direction.designPlan.creativeDirection?.id !== direction.id ||
      !direction.designPlan.creativeSettings ||
      direction.designPlan.creativeSettings.objective !== input.brief.objective ||
      direction.designPlan.creativeSettings.variety !== input.brief.variety ||
      direction.designPlan.creativeSettings.movement !== input.brief.movement ||
      direction.designPlan.creativeSettings.density !== input.brief.density ||
      !validateTechniqueCoverage(direction.designPlan, input.techniqueIds)
    )) {
      throw new Error("La validación rechazó las alternativas: repiten id, título o hero, omiten DesignPlan/creativeSettings, no reflejan los controles del brief o no cubren los métodos.");
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
    const failureReason = safeFailureMessage(error);
    await recordTraceStep(input.traceId, {
      phase: "creative-direction-options",
      title: "Direcciones creativas · Eve",
      techniqueIds: input.techniqueIds,
      provider: "eve-local",
      model: input.modelChoice,
      userPrompt: message,
      status: "failed",
      errorMessage: failureReason.slice(0, 500),
      durationMs: Date.now() - startedAt,
    }).catch(() => undefined);
    await updateTraceStatus(input.traceId, "failed");
    return NextResponse.json({
      error: `Eve no pudo validar las direcciones con ${input.modelChoice}. ${failureReason}`,
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

function safeFailureMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Error desconocido de Eve.";
  if (/api[_ -]?key|token|secret|authorization|bearer/i.test(message)) {
    return "El proveedor rechazó la solicitud. Revisa el acceso o la sesión configurada en Eve.";
  }
  return message
    .replace(/Bearer\s+\S+/gi, "Bearer [redactado]")
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, "[credencial redactada]")
    .slice(0, 300);
}
