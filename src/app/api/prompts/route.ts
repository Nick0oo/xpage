import { NextResponse } from "next/server";
import { getTechnique } from "@/lib/techniques";
import { promptRequestSchema, type PromptRequest } from "@/lib/schemas";
import { designPlanSchema, techniqueContributionSchema, validateTechniqueCoverage, enumerableContentFindings, requestedEnumerableContent } from "@/lib/design-plan";
import { runEveStructured } from "@/lib/eve-runtime";
import { creativeDirectionsResponseSchema } from "@/lib/creative-directions";
import { selectDesignSystem, designSystems } from "@/lib/design-systems/catalog";
import { selectCompositionOptions, formatCompositionOptions } from "@/lib/design-templates/compositions";
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
  const enumerableRequest = requestedEnumerableContent(input.brief.offer);
  const selectedSystem = selectDesignSystem(input.brief);
  const compositionOptions = selectCompositionOptions(input.brief, 5);
  const briefText = [
    `Tema o industria: ${input.brief.topic}`,
    `Producto y beneficio: ${input.brief.offer}`,
    `P\u00fablico: ${input.brief.audience}`,
    `Tono o direcci\u00f3n visual: ${input.brief.tone}`,
    input.brief.cta ? `CTA principal: ${input.brief.cta}` : "CTA principal: proponer uno coherente.",
  ].join("\n");
  const skillNames = [...techniques.map(({ id }) => id), "frontend-design", "combine"];
  const designSystemContext = `SISTEMA VISUAL XPage DERIVADO DEL BRIEF: ${selectedSystem.recipe.id} · ${selectedSystem.recipe.name}. ${selectedSystem.reason}
Mejor para: ${selectedSystem.recipe.bestFor}
Gramática: ${selectedSystem.recipe.visualGrammar}
Tipografía: ${selectedSystem.recipe.type}
Lógica de color: ${selectedSystem.recipe.colorLogic}
Material: ${selectedSystem.recipe.material}
Movimiento: ${selectedSystem.recipe.motion}
Evitar: ${selectedSystem.recipe.avoid.join("; ")}
Opciones compositivas (elige 2–4 y adáptalas, no repitas un esqueleto):
${formatCompositionOptions(8)}
La paleta y el motivo finales se derivan de DesignDNA y el brief; el sistema propone gramática, no una piel rígida.`;
  const message = `Combina con criterio estos m\u00e9todos: ${techniques.map(({ id, name }) => `${id} (${name})`).join(", ")}.

Carga cada skill nombrada con load_skill y ejecuta sus procedimientos completos: ${skillNames.join(", ")}. Para frontend-design y combine, lee todas sus secciones y referencias aplicables; trata las skills de método como pasos que debes ejecutar, no como etiquetas.

APORTES REVISADOS POR EL USUARIO. Integra todos; no los descartes silenciosamente. Conserva como aportes propios las decisiones marcadas como applied o modified. Si hay tensi\u00f3n, resu\u00e9lvela seg\u00fan hechos del brief, accesibilidad, restricciones, objetivo y evidencia; explica la decisi\u00f3n en contributions. Los textos decision y artifact pueden haber sido editados por la persona: esos son los datos autoritativos.
${JSON.stringify(input.methodContributions, null, 2)}

${designSystemContext}

Devuelve un DesignPlan completo seg\u00fan el esquema. Trabaja primero una propuesta completa, eval\u00fala y revisa el resultado antes de responder. Si el m\u00e9todo creator-critic est\u00e1 seleccionado, rellena su propuesta, hallazgos y revisi\u00f3n expl\u00edcitos. Describe decisiones observables, nunca razonamiento privado.

En explicitContentRequirements, registra cada entregable de contenido que el usuario pidió de forma medible o enumerable. Un pedido de 5 ejercicios requiere 5 ejercicios concretos, no solo la frase «hasta cinco»; si el brief establece un máximo, nunca lo excedas. Redacta contenido creativo original cuando sea parte del entregable; la prohibición de inventar hechos no prohíbe crear ejemplos, juegos o ejercicios solicitados. Asigna una sección y enumera allí los textos exactos que luego deben aparecer en HTML. Haz que section.copy y el prompt editable incluyan esos mismos textos; luego verifica que cada uno está representado. Deja la lista vacía si no hay un entregable explícito.

No reduzcas la landing a tres bloques por defecto. Diseña un recorrido completo acorde a la información disponible: con material suficiente, suele tener 5–7 secciones sustantivas (oferta, detalle, ejemplos o entrega, cómo funciona, dudas relevantes y cierre), cada una con objetivo, copy desarrollado y aporte distinto. Evita secciones de relleno y testimonios o pruebas que no estén en el brief. Si la información es limitada, usa menos y explica con claridad, no inventes profundidad.

CTA: usa el destino externo si el brief lo proporciona. Si no, elige un enlace interno que conduzca a una sección o contenido real de esta landing; nunca propongas un botón deshabilitado ni una acción ficticia. Refleja ese destino en la sección final y en el prompt.

Brief (fuente de hechos):
${briefText}
Brief completo y controles elegidos:
${JSON.stringify(input.brief)}
El analizador determinista de XPage detectó esta cantidad en la oferta: ${enumerableRequest ? `${enumerableRequest.count} ${enumerableRequest.noun}` : "ninguna cantidad directa"}. Si detectó una cantidad, inclúyela exactamente como piezas concretas originales en explicitContentRequirements y en el copy/prompt de la sección. No reemplaces el inventario por una mención de la cifra.

IDs seleccionados: ${techniqueIds.join(", ")}. Cada contribuci\u00f3n debe identificar la t\u00e9cnica, versi\u00f3n de skill, decisi\u00f3n concreta, artefacto visible y estado. Registra tensiones reales y su resoluci\u00f3n. La cobertura de contribuciones debe coincidir exactamente con los m\u00e9todos seleccionados.
Incluye designSystem en DesignPlan con id, nombre, rationale y compositionRecipeIds. Usa el sistema elegido y selecciona recetas que estructuren de verdad el recorrido. Cada sección debe variar gesto, escala, alineación o densidad por función, no solo color. El HTML local de referencia puede orientar la riqueza compositiva, SVG propio e interacción útil; no reutilices su texto ni su tema.

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
    let plan = designPlanSchema.safeParse(data);
    if (!plan.success || !validateTechniqueCoverage(plan.data, techniqueIds)) {
      throw new Error("Eve devolvi\u00f3 un DesignPlan incompleto o no cubre los m\u00e9todos seleccionados.");
    }
    let contentFindings = enumerableContentFindings(plan.data, input.brief.offer);
    if (contentFindings.length) {
      const repair = await runEveStructured({
        modelChoice: input.modelChoice,
        outputSchema: designPlanSchema,
        message: `${message}\n\nREPARACIÓN OBLIGATORIA DEL PLAN. El analizador detectó ${enumerableRequest?.count} ${enumerableRequest?.noun}. El plan anterior está incompleto: ${contentFindings.join(" ")} Devuelve el DesignPlan completo corregido. Redacta cada pieza original completa, enumérala en explicitContentRequirements.requiredItems y copia todas las piezas completas en el copy de su sección y en prompt. No excedas el límite ni reemplaces piezas por una promesa. Conserva las decisiones restantes.\n\nPLAN ANTERIOR\n${JSON.stringify(plan.data)}`,
      });
      plan = designPlanSchema.safeParse(repair.data);
      if (!plan.success || !validateTechniqueCoverage(plan.data, techniqueIds)) {
        throw new Error("La reparación del plan no conservó el esquema o la cobertura de métodos.");
      }
      contentFindings = enumerableContentFindings(plan.data, input.brief.offer);
      if (contentFindings.length) throw new Error(`Plan incompleto: ${contentFindings.join(" ")}`);
    }
    const recipeIds = plan.data.designSystem?.compositionRecipeIds.filter((id) => compositionOptions.some((recipe) => recipe.id === id)) ?? [];
    const finalDesignSystem = {
      id: selectedSystem.recipe.id,
      name: selectedSystem.recipe.name,
      rationale: selectedSystem.reason,
      compositionRecipeIds: recipeIds.length ? recipeIds.slice(0, 4) : compositionOptions.slice(0, 3).map(({ id }) => id),
    };
    const finalPlan = {
      ...plan.data,
      designSystem: finalDesignSystem,
      prompt: ensureSystemInPrompt(plan.data.prompt, finalDesignSystem),
    };

    await recordTraceStep(input.traceId, {
      eventType: "decision",
      phase,
      title: "Integraci\u00f3n de aportes \u00b7 Eve",
      techniqueIds,
      provider: "eve-local",
      model: input.modelChoice,
      userPrompt: message,
      outputText: finalPlan.prompt,
      output: finalPlan,
      skillVersions: Object.fromEntries(finalPlan.contributions.map(({ techniqueId, skillVersion }) => [techniqueId, skillVersion])),
      decisionSummary: `Sistema: ${finalPlan.designSystem.name} · ${finalPlan.designSystem.rationale}\n` + finalPlan.contributions.map(({ techniqueId, decision, status, resolution }) => `${techniqueId} (${status}): ${decision}${resolution ? ` \u00b7 Resoluci\u00f3n: ${resolution}` : ""}`).join("\n"),
      references: [{ kind: "source", id: "brief", label: "Brief aportado", sourceType: "brief" }],
      durationMs: Date.now() - startedAt,
    });
    await updateTraceStatus(input.traceId, "prompt-ready");
    return NextResponse.json({
      prompt: finalPlan.prompt,
      techniqueIds,
      traceId: input.traceId,
      designPlan: finalPlan,
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
    const contractFailure = failureReason.startsWith("Plan incompleto:");
    return NextResponse.json({
      error: contractFailure ? failureReason : `Eve no pudo combinar los aportes con ${input.modelChoice}. ${failureReason}`,
      code: contractFailure ? "plan_contract_failed" : "eve_model_unavailable",
    }, { status: contractFailure ? 422 : 503 });
  }
}

async function generateTechniqueContribution(input: Extract<PromptRequest, { mode: "technique" }>) {
  const technique = getTechnique(input.techniqueId);
  const message = `Carga la skill ${technique.id} con load_skill y aplica solo el m\u00e9todo ${technique.id} (${technique.name}). Devuelve un aporte peque\u00f1o, estructurado y revisable por una persona. No construyas DesignPlan, secciones, HTML ni prompt final; eso corresponde a la combinaci\u00f3n posterior.

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
  const enumerableRequest = requestedEnumerableContent(input.brief.offer);
  const briefTextForSystems = `${input.brief.topic} ${input.brief.offer} ${input.brief.audience} ${input.brief.tone} ${input.brief.objective}`.toLocaleLowerCase("es");
  const systemCandidates = [...designSystems].map((recipe) => ({
    recipe,
    score: recipe.keywords.reduce((score, keyword) => score + (briefTextForSystems.includes(keyword) ? 1 : 0), 0),
  })).sort((a, b) => b.score - a.score).slice(0, 5).map(({ recipe }) => recipe);
  const compositionOptions = selectCompositionOptions(input.brief, 8);
  const skillNames: string[] = selected.map(({ id }) => id);
  skillNames.push("frontend-design", "combine");
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

Carga cada skill nombrada con load_skill y aplica sus procedimientos completos: ${skillNames.join(", ")}. Cada DesignPlan debe cubrir exactamente todos los métodos elegidos; los aportes deben estar presentes también en cada alternativa.

Direction picker de XPage: ofrece una selección corta de sistemas afines al brief, no un catálogo enorme. Asigna un sistema distinto a cada dirección y deriva su paleta/motivo de DesignDNA. Gramáticas:
${systemCandidates.map(({ id, name, visualGrammar, type, colorLogic, avoid }) => `- ${id} · ${name}: ${visualGrammar} Tipografía: ${type} Color: ${colorLogic} Evitar: ${avoid.join("; ")}`).join("\n")}
Composiciones candidatas: ${compositionOptions.map(({ id, name, pattern, antiPattern }) => `- ${id} (${name}): ${pattern} Control: ${antiPattern}`).join("\n")}
Incluye designSystem en cada DesignPlan con id, nombre, rationale y compositionRecipeIds. Cada alternativa debe cambiar al menos dos rasgos estructurales (hero, orden, ritmo, escala/densidad o modo de demostración), nunca solo color.

Para cada dirección define primera pantalla/hero, narrativa y ritmo de secciones, paleta por roles, tipografía disponible, motivo visual, uso de imagen/video (solo especificación), razón breve ligada al brief y al menos dos diferencias estructurales observables respecto de otra opción. Usa opciones contrastantes: por ejemplo, editorial asimétrica frente a demostración modular o narrativa de caso frente a recorrido de producto, solo si encaja con este brief. La elección de variedad controla cuánto divergen; no conviertas movimiento en animación automática. Respeta movimiento reducido y densidad elegida.

Cada campo designPlan.prompt debe ser un prompt final, específico y ejecutable derivado de esa misma dirección, método, DesignDNA, secciones, copy, recursos y restricciones. Incluye data-xpage-section y data-xpage-slot. No uses texto de relleno ni alargues para aparentar calidad. Incluye creativeSettings y creativeDirection dentro de cada plan, con id coincidente con la dirección.

Brief:
${briefText}
Detección determinista de contenido enumerable: ${enumerableRequest ? `${enumerableRequest.count} ${enumerableRequest.noun}` : "ninguna cantidad directa"}. Cada alternativa debe incluir exactamente esa cantidad como contenido completo en explicitContentRequirements, copy de sección y prompt; no conviertas la cantidad en una promesa.

Decisiones de métodos seleccionados: ${selected.map(({ id, name, instruction }) => `${id} (${name}): ${instruction}`).join("\n")}

No inventes hechos, datos, claims, garantías, testimonios, logos ni contenido de las referencias. Las URLs/descripciones son material de referencia proporcionado por el usuario, no evidencia verificada. Si no hay identidad de marca, declara cada dirección como propuesta creativa. Devuelve solo el objeto del esquema.`;
  const startedAt = Date.now();
  try {
    let { data } = await runEveStructured({
      modelChoice: input.modelChoice,
      message,
      outputSchema: creativeDirectionsResponseSchema,
    });
    let parsed = creativeDirectionsResponseSchema.safeParse(data);
    if (parsed.success) {
      const contentFindings = parsed.data.directions.flatMap((direction) => enumerableContentFindings(direction.designPlan, input.brief.offer));
      if (contentFindings.length) {
        const repair = await runEveStructured({
          modelChoice: input.modelChoice,
          outputSchema: creativeDirectionsResponseSchema,
          message: `${message}\n\nREPARACIÓN OBLIGATORIA: cada dirección debe contener ${enumerableRequest?.count} ${enumerableRequest?.noun} originales completos dentro de explicitContentRequirements y reflejados palabra por palabra en sections.copy y prompt. Fallos detectados: ${contentFindings.join(" ")} Revisa todas las alternativas y devuelve el objeto completo corregido. Conserva sus diferencias visuales y decisiones válidas.\n\nRESPUESTA ANTERIOR\n${JSON.stringify(parsed.data)}`,
        });
        data = repair.data;
        parsed = creativeDirectionsResponseSchema.safeParse(data);
        if (!parsed.success) throw new Error("La reparación de direcciones no conservó el esquema.");
        const remaining = parsed.data.directions.flatMap((direction) => enumerableContentFindings(direction.designPlan, input.brief.offer));
        if (remaining.length) throw new Error(`Planes de dirección incompletos: ${remaining.join(" ")}`);
      }
    }
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

    const usedSystemIds = new Set<string>();
    const directions = parsed.data.directions.map((direction, index) => {
      const proposed = direction.designPlan.designSystem;
      let selected = proposed ? systemCandidates.find(({ id }) => id === proposed.id) : undefined;
      if (!selected || usedSystemIds.has(selected.id)) {
        selected = systemCandidates.find(({ id }) => !usedSystemIds.has(id)) ?? systemCandidates[index % systemCandidates.length];
      }
      usedSystemIds.add(selected.id);
      const recipeIds = proposed?.compositionRecipeIds.filter((id) => compositionOptions.some((recipe) => recipe.id === id)) ?? [];
      const finalDesignSystem = {
        id: selected.id,
        name: selected.name,
        rationale: proposed?.rationale || `Sistema seleccionado por XPage según afinidad con el brief: ${selected.name}.`,
        compositionRecipeIds: recipeIds.length ? recipeIds : compositionOptions.slice(index, index + 2).map(({ id }) => id),
      };
      return {
        ...direction,
        designPlan: {
          ...direction.designPlan,
          designSystem: finalDesignSystem,
          prompt: ensureSystemInPrompt(direction.designPlan.prompt, finalDesignSystem),
        },
      };
    });
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
      decisionSummary: `Propuestas: ${directions.map(({ title }) => title).join(" · ")}\nSistemas: ${directions.map(({ designPlan }) => designPlan.designSystem?.name).join(" · ")}`,
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
    const contractFailure = failureReason.startsWith("Planes de dirección incompletos:");
    return NextResponse.json({
      error: contractFailure ? failureReason : `Eve no pudo validar las direcciones con ${input.modelChoice}. ${failureReason}`,
      code: contractFailure ? "plan_contract_failed" : "eve_directions_unavailable",
    }, { status: contractFailure ? 422 : 503 });
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

function ensureSystemInPrompt(prompt: string, system: { id: string; name: string; rationale: string; compositionRecipeIds: string[] }) {
  if (prompt.includes(system.id) && system.compositionRecipeIds.every((id) => prompt.includes(id))) return prompt;
  const directive = `\n\nDirección visual XPage: sistema ${system.id} (${system.name}). ${system.rationale} Composiciones seleccionadas: ${system.compositionRecipeIds.join(", ")}. Deriva los tokens visuales de DesignDNA y adapta la composición a cada sección.`;
  return prompt.length + directive.length <= 12_000 ? `${prompt}${directive}` : prompt;
}
