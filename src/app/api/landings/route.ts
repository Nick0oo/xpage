import { NextResponse } from "next/server";
import { parseFragment, type DefaultTreeAdapterTypes } from "parse5";
import postcss from "postcss";
import { runEveStructured } from "@/lib/eve-runtime";
import { landingCodeSchema, landingRequestSchema } from "@/lib/schemas";
import { z } from "zod";
import { formatHtmlCompositionSeeds } from "@/lib/design-templates/html-seeds";
import {
  ensureLandingTrace,
  recordProviderAttempts,
  recordTraceStep,
  setGenerationTraceStatus,
} from "@/lib/generation-traces";

export const runtime = "nodejs";
export const maxDuration = 300;

const landingInstructions = `Eres director de arte y frontend senior. Antes de programar, carga la skill frontend-design con load_skill y aplica su procedimiento completo. Usa el sistema y las composiciones que el plan decidió; DesignDNA define la identidad final. Construye una landing completa desde el prompt: devuelve título, HTML del body, CSS independiente y JavaScript vanilla independiente.

DIRECCIÓN: lee oferta, público, tono, DesignDNA, designSystem, compositionRecipeIds y métodos antes de programar. DesignDNA manda; adapta cualquier gramática para respetarla. Propón una identidad reconocible y específica al brief. Traduce el motivo visual a recursos propios con CSS/SVG y define tokens útiles de color, tipo, espacio, bordes y foco. Cambia composición del hero y de las secciones por propósito; evita repetir titular centrado, split, Bento o tres tarjetas iguales por defecto.

VARIEDAD VISUAL: elige una metáfora gráfica concreta derivada del contenido y conviértela en sistema visual. Alterna escalas, alineaciones, densidad, formas de bloques y ritmo entre secciones; evita plantillas de hero genérico seguido por tarjetas repetidas. Usa elementos tipográficos o CSS/SVG hechos a medida cuando mejoren el concepto. Cada sección debe tener un propósito visible y una composición propia, sin sacrificar legibilidad ni responsive.

RECORRIDO: la primera pantalla comunica oferta, destinatario y siguiente acción. Desarrolla el recorrido completo, no solo hero y resumen. Con suficiente material, normalmente usa 5–7 secciones sustantivas con tareas distintas: alcance, detalle, ejemplos/entregables, explicación, dudas pertinentes y cierre. Adapta el número al valor real y evita relleno. Mantén contenido requerido visible y completo. No inventes clientes, testimonios, cifras, precios, premios, funciones ni garantías. Aplica todos los atributos data-xpage-section y data-xpage-slot del plan en los elementos reales.

CTA: cada llamada a la acción debe funcionar. Usa la URL proporcionada en el brief o, si no existe, un enlace de ancla a la sección pertinente que ya esté en esta página. El CTA principal debe ser un enlace activo con class="cta"; no lo deshabilites ni presentes un botón que no haga nada.

INTERACCIÓN Y REVISIÓN: antes de entregar, realiza una crítica focalizada de cinco criterios: (1) brief y claims respaldados; (2) jerarquía/ritmo y variedad de composición; (3) detalle y requisitos completos; (4) teclado, foco, contraste, semántica, móvil y reduced-motion; (5) coherencia con DesignDNA, composición, secciones, slots y CTA. Corrige los defectos de mayor impacto. No reportes capturas, mediciones ni pruebas visuales si no se ejecutaron; esta revisión del código es una autoinspección, no una medición. Cuando ayude a comprender, añade una interacción local útil y accesible; su contenido debe existir completo sin JavaScript. Evita formularios ficticios, botones decorativos y controles sin respuesta. No reveles razonamiento privado.

REQUISITOS DE CONTENIDO: cada elemento de explicitContentRequirements es obligatorio. Incluye todos los requiredItems completos, visibles y legibles dentro de su sección; no los reemplaces con un titular que solo mencione una cantidad. El texto debe seguir presente al desactivar JavaScript.

IMPLEMENTACIÓN: usa HTML semántico, estilos móviles primero, foco visible, contraste suficiente y prefers-reduced-motion. A 360, 390, 768 y 1440 px evita overflow horizontal: deja envolver titulares, usa tamaños fluidos, min-width:0 en hijos flex/grid y mantén notas, controles y SVG dentro del viewport. JavaScript solo para interacciones reales, locales y accesibles. No uses React, frameworks, imports, CDNs, fuentes/imágenes remotas, iframes, formularios con envío, red, almacenamiento web ni acceso al documento padre. Para medios, usa composición CSS/SVG que sí comunique hasta que exista un recurso local; nunca dejes un bloque vacío o un placeholder genérico. Devuelve solamente los campos del esquema.`;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = landingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "El prompt está vacío o supera el límite permitido.", code: "invalid_input" }, { status: 400 });
  }

  const { prompt, traceId, modelChoice, explicitContentRequirements = [], plannedSectionIds = [] } = parsed.data;
  let generationTraceId: string;
  try {
    const trace = await ensureLandingTrace({ traceId, title: "Landing en construcción", prompt });
    generationTraceId = trace.id;
  } catch {
    return NextResponse.json({ error: "No se pudo iniciar la trazabilidad de esta landing.", code: "trace_unavailable" }, { status: 500 });
  }

  const startedAt = Date.now();
  const compositionSeeds = formatHtmlCompositionSeeds(prompt);
  const message = `${landingInstructions}\n\nPROMPT EDITABLE DEL PLAN\n${prompt}\n\nFRAGMENTOS DE COMPOSICIÓN HTML/CSS XPage\n${compositionSeeds}\n\nAdapta estos esqueletos a los IDs, contenido, medio y DesignDNA del prompt; mezcla sus patrones por sección y altera las partes que no encajen. Son fragmentos concretos de referencia, no secciones adicionales obligatorias ni una plantilla global. Sustituye todo texto de ejemplo/placeholder por copy del plan. Usa solo media slots del plan; quita data-xpage-slot si no existe slot real. Mantén las secciones y detalles del brief aunque el esqueleto sea más breve.\n\nSECCIONES OBLIGATORIAS\n${JSON.stringify(plannedSectionIds)}\n\nREQUISITOS VERIFICABLES\n${JSON.stringify(explicitContentRequirements, null, 2)}\n\nEntrega una landing completa y funcional. Prioriza la intención de marca y requisitos del prompt dentro de estos límites de vista previa.`;
  const attempts: Array<{ provider: string; model: string; status: "completed" | "failed"; durationMs: number; output?: unknown; errorMessage?: string }> = [];
  let cssParsePassed: boolean | null = null;
  let initialQualityFindings: string[] = [];
  let finalQualityFindings: string[] = [];
  let qualityRepairApplied = false;
  let htmlQualityChecked = false;
  try {
    const generationStartedAt = Date.now();
    const { data } = await runEveStructured({ modelChoice, message, outputSchema: landingCodeSchema });
    const initial = landingCodeSchema.safeParse(data);
    if (!initial.success) throw new Error("Eve devolvió HTML, CSS o JavaScript incompleto.");
    attempts.push({ provider: "eve-local", model: modelChoice, status: "completed", durationMs: Date.now() - generationStartedAt, output: initial.data });
    let output = initial.data;
    const initialCssError = cssSyntaxError(output.css);
    cssParsePassed = !initialCssError;
    if (initialCssError) {
      initialQualityFindings.push(`CSS inválido: ${initialCssError}`);
      const repairStartedAt = Date.now();
      const cssRepairSchema = z.object({ css: landingCodeSchema.shape.css });
      const repairMessage = `Repair only the syntax of this CSS. Do not redesign or change colors, scale, composition, selectors, or behavior. Return only { css }. Preserve all styles and fix only syntax errors that prevent parsing. Parser error: ${initialCssError}\n\nORIGINAL CSS\n${output.css}`;
      try {
        const { data: repairData } = await runEveStructured({ modelChoice, message: repairMessage, outputSchema: cssRepairSchema });
        const repaired = cssRepairSchema.safeParse(repairData);
        if (!repaired.success) throw new Error("Eve returned incomplete CSS.");
        const repairCssError = cssSyntaxError(repaired.data.css);
        if (repairCssError) throw new Error(`Repaired CSS is still invalid: ${repairCssError}`);
        output = { ...output, css: repaired.data.css };
        cssParsePassed = true;
        qualityRepairApplied = true;
        attempts.push({ provider: "eve-local", model: modelChoice, status: "completed", durationMs: Date.now() - repairStartedAt, output: { css: repaired.data.css } });
      } catch (error) {
        const reason = error instanceof Error ? error.message : "CSS syntax error";
        attempts.push({ provider: "eve-local", model: modelChoice, status: "failed", durationMs: Date.now() - repairStartedAt, errorMessage: reason.slice(0, 300) });
        throw new Error(`CSS_INVALID: CSS syntax repair failed. ${reason.slice(0, 220)}`);
      }
    }
    let missing = missingLandingElements(output.html, explicitContentRequirements, plannedSectionIds);
    htmlQualityChecked = true;
    finalQualityFindings = missing;
    if (missing.length) {
      initialQualityFindings.push(...missing);
      qualityRepairApplied = true;
      const repairStartedAt = Date.now();
      const repairMessage = `${message}\n\nREPARACIÓN FOCALIZADA: la versión anterior omitió estos elementos obligatorios: ${JSON.stringify(missing)}. Revisa el código anterior y devuelve la misma landing con esos textos completos en su sección indicada. Conserva su diseño y el resto del contenido; no elimines marcadores de sección y medios.\n\nCÓDIGO ANTERIOR\n${JSON.stringify(output)}`;
      const repair = await runEveStructured({ modelChoice, message: repairMessage, outputSchema: landingCodeSchema });
      const repaired = landingCodeSchema.safeParse(repair.data);
      if (!repaired.success) throw new Error("La reparación de contenido devolvió código incompleto.");
      output = repaired.data;
      const repairedCssError = cssSyntaxError(output.css);
      cssParsePassed = !repairedCssError;
      if (repairedCssError) {
        finalQualityFindings = [`CSS inválido tras la reparación de contenido: ${repairedCssError}`];
        throw new Error(`CSS_INVALID: la reparación de contenido dejó CSS inválido. ${repairedCssError}`);
      }
      missing = missingLandingElements(output.html, explicitContentRequirements, plannedSectionIds);
      htmlQualityChecked = true;
      finalQualityFindings = missing;
      attempts.push({ provider: "eve-local", model: modelChoice, status: missing.length ? "failed" : "completed", durationMs: Date.now() - repairStartedAt, output, ...(missing.length ? { errorMessage: `Faltan elementos obligatorios: ${missing.join("; ")}` } : {}) });
      if (missing.length) throw new Error(`La landing no cumple el contrato del plan: ${missing.join("; ")}`);
    }

    await recordLandingQualityReview({
      traceId: generationTraceId,
      cssParsePassed,
      plannedSectionIds,
      requirements: explicitContentRequirements,
      findings: finalQualityFindings,
      initialFindings: initialQualityFindings,
      repaired: qualityRepairApplied,
      htmlQualityChecked,
      status: "completed",
    });

    await recordProviderAttempts({
      traceId: generationTraceId,
      phase: "landing-generation",
      title: "Construcción de landing · Eve",
      systemPrompt: landingInstructions,
      userPrompt: prompt,
      attempts,
    });
    await setTraceStatus(generationTraceId, "completed", output.title);
    return NextResponse.json({ ...output, traceId: generationTraceId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eve no pudo construir la landing.";
    if (!finalQualityFindings.length && message.startsWith("La landing no cumple el contrato del plan:")) {
      finalQualityFindings = message.replace("La landing no cumple el contrato del plan:", "").split(";").map((finding) => finding.trim()).filter(Boolean);
    }
    await recordLandingQualityReview({
      traceId: generationTraceId,
      cssParsePassed,
      plannedSectionIds,
      requirements: explicitContentRequirements,
      findings: finalQualityFindings.length ? finalQualityFindings : [message.slice(0, 300)],
      initialFindings: initialQualityFindings,
      repaired: qualityRepairApplied,
      htmlQualityChecked,
      status: "failed",
    });
    if (attempts.length > 0 && attempts.at(-1)?.status === "completed") {
      attempts.push({ provider: "eve-local", model: modelChoice, status: "failed", durationMs: Math.max(0, Date.now() - startedAt - attempts.reduce((sum, attempt) => sum + attempt.durationMs, 0)), errorMessage: message.slice(0, 500) });
    }
    await recordProviderAttempts({
      traceId: generationTraceId,
      phase: "landing-generation",
      title: "Construcción de landing · Eve",
      systemPrompt: landingInstructions,
      userPrompt: prompt,
      attempts: attempts.length ? attempts : [{
        provider: "eve-local",
        model: modelChoice,
        status: "failed",
        durationMs: Date.now() - startedAt,
        errorMessage: message.slice(0, 500),
      }],
    }).catch(() => undefined);
    await setTraceStatus(generationTraceId, "failed");
    if (message.startsWith("CSS_INVALID:")) {
      return NextResponse.json({ error: message.replace("CSS_INVALID: ", ""), code: "invalid_generated_css" }, { status: 422 });
    }
    const missingContent = message.startsWith("La landing no cumple el contrato del plan:");
    const qualityContractFailed = finalQualityFindings.length > 0 && !message.startsWith("CSS_INVALID:");
    return NextResponse.json({
      error: missingContent ? message : qualityContractFailed ? `La landing no superó la revisión de calidad incluso después de la reparación: ${finalQualityFindings.join("; ")}` : `Eve no pudo construir la landing con ${modelChoice}. Revisa el acceso al proveedor seleccionado e inténtalo otra vez.`,
      code: missingContent || qualityContractFailed ? "plan_contract_failed" : "eve_model_unavailable",
    }, { status: missingContent || qualityContractFailed ? 422 : 503 });
  }
}

function cssSyntaxError(css: string) {
  try {
    postcss.parse(css);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message.slice(0, 220) : "Invalid CSS syntax";
  }
}

function missingLandingElements(html: string, requirements: Array<{ sectionId: string; requiredItems: string[] }>, sectionIds: string[]) {
  const fragment = parseFragment(html);
  const elements = parsedElements(fragment);
  const sectionMarkers = elements.filter((element) => parsedAttribute(element, "data-xpage-section") !== undefined);
  const markerIds = new Set(sectionMarkers.map((element) => parsedAttribute(element, "data-xpage-section")).filter((id): id is string => id !== undefined));
  const missingSections = sectionIds.filter((id) => !markerIds.has(id) || !sectionMarkers.some((element) => parsedAttribute(element, "data-xpage-section") === id && element.tagName === "section")).map((id) => `Seccion <section> sin marker: ${id}`);
  const duplicateIds = elements.map((element) => parsedAttribute(element, "id")).filter((id): id is string => id !== undefined).filter((id, index, all) => all.indexOf(id) !== index);
  const missingHeading = elements.some((element) => element.tagName === "h1") ? [] : ["Falta un titular principal <h1>"];
  const normalizedHtml = normalizeContent(html);
  const leakedPlaceholders = [
    "REEMPLAZAR-CON-ID-DEL-PLAN",
    "REEMPLAZAR-CON-ID-REAL-DEL-SLOT",
  ].filter((marker) => html.toLocaleUpperCase().includes(marker));
  const placeholderCopy = [
    "diagrama css svg derivado del brief",
    "titular que plantea la siguiente idea",
    "etiqueta util",
    "titulo especifico de la pieza",
    "contenido concreto no dejes el texto como placeholder",
    "una tercera pieza solo si el plan la requiere",
    "explicacion breve y respaldada por el brief",
  ].filter((copy) => normalizedHtml.includes(copy));
  const seedPlaceholders = [...leakedPlaceholders, ...placeholderCopy.map((copy) => `Copy de muestra sin adaptar: ${copy}`)];
  const missingItems = requirements.flatMap(({ sectionId, requiredItems }) => {
    const targetSection = sectionMarkers.find((element) => parsedAttribute(element, "data-xpage-section") === sectionId && element.tagName === "section");
    const sectionText = targetSection ? normalizeContent(parsedText(targetSection)) : "";
    return requiredItems.filter((item) => !sectionText.includes(normalizeContent(item))).map((item) => `Contenido requerido faltante en ${sectionId}: ${item}`);
  });
  const primaryCtas = elements.filter((element) => parsedAttribute(element, "class")?.split(/\s+/).includes("cta"));
  const inactivePrimaryCta = primaryCtas.length === 0 || primaryCtas.some((element) =>
    element.tagName !== "a" || !parsedAttribute(element, "href") || parsedAttribute(element, "href") === "#" || parsedAttribute(element, "href")?.startsWith("javascript:") || parsedAttribute(element, "aria-disabled") === "true")
    ? ["El CTA principal no es un enlace con destino real"] : [];
  const missingAlt = elements.some((element) => element.tagName === "img" && parsedAttribute(element, "alt") === undefined)
    ? ["Hay imágenes sin texto alternativo"] : [];
  const targetIds = new Set(elements.map((element) => parsedAttribute(element, "id")).filter((id): id is string => id !== undefined));
  const brokenAnchors = elements
    .map((element) => parsedAttribute(element, "href"))
    .filter((href): href is string => href?.startsWith("#") === true)
    .map((href) => href.slice(1))
    .filter((id) => !targetIds.has(id))
    .map((id) => `Enlace interno sin destino: #${id}`);
  return [...missingSections, ...missingHeading, ...missingItems, ...inactivePrimaryCta, ...missingAlt, ...duplicateIds.map((id) => `ID HTML duplicado: ${id}`), ...brokenAnchors, ...seedPlaceholders];
}

async function recordLandingQualityReview(input: {
  traceId: string;
  cssParsePassed: boolean | null;
  plannedSectionIds: string[];
  requirements: Array<{ requiredItems: string[] }>;
  findings: string[];
  initialFindings: string[];
  repaired: boolean;
  htmlQualityChecked: boolean;
  status: "completed" | "failed";
}) {
  const findingMatches = (prefixes: string[]) => input.findings.filter((finding) => prefixes.some((prefix) => finding.startsWith(prefix)));
  const controls = {
    cssParse: input.cssParsePassed === null ? "not-reached" : input.cssParsePassed ? "passed" : "failed",
    plannedSections: !input.htmlQualityChecked ? "not-reached" : { expected: input.plannedSectionIds.length, missing: findingMatches(["Seccion <section>"]) },
    requiredItems: !input.htmlQualityChecked ? "not-reached" : { expected: input.requirements.reduce((count, item) => count + item.requiredItems.length, 0), missing: findingMatches(["Contenido requerido faltante"]) },
    primaryCta: !input.htmlQualityChecked ? "not-reached" : findingMatches(["El CTA principal"]).length ? "failed" : "passed",
    imageAlt: !input.htmlQualityChecked ? "not-reached" : findingMatches(["Hay imágenes sin texto alternativo"]).length ? "failed" : "passed",
    uniqueIds: !input.htmlQualityChecked ? "not-reached" : findingMatches(["ID HTML duplicado:"]).length ? "failed" : "passed",
    seedPlaceholders: !input.htmlQualityChecked ? "not-reached" : findingMatches(["REEMPLAZAR-CON-", "Copy de muestra sin adaptar:"]).length ? "failed" : "passed",
  };
  await recordTraceStep(input.traceId, {
    eventType: "decision",
    phase: "landing-quality-review",
    title: "Puerta de calidad determinista · HTML/CSS",
    status: input.status,
    decisionSummary: `Resultado: ${input.status}; reparación aplicada: ${input.repaired ? "sí" : "no"}; CSS válido: ${input.cssParsePassed === null ? "no alcanzado" : input.cssParsePassed ? "sí" : "no"}; hallazgos finales: ${input.findings.length}.`,
    output: {
      controls,
      initialFindings: input.initialFindings,
      finalFindings: input.findings,
      repaired: input.repaired,
      scope: "Validación determinista de estructura/contenido y parseo CSS. No incluye captura, render visual ni medición de contraste.",
    },
  });
}

type HtmlNode = DefaultTreeAdapterTypes.Node;
type HtmlParent = DefaultTreeAdapterTypes.ParentNode;
type HtmlElement = DefaultTreeAdapterTypes.Element;

function parsedElements(parent: HtmlParent): HtmlElement[] {
  const result: HtmlElement[] = [];
  for (const node of parent.childNodes) {
    if (!("tagName" in node)) continue;
    result.push(node, ...parsedElements(node));
    if ("content" in node) result.push(...parsedElements(node.content));
  }
  return result;
}

function parsedAttribute(element: HtmlElement, name: string) {
  return element.attrs.find((item) => item.name === name)?.value;
}

function parsedText(parent: HtmlParent): string {
  return parent.childNodes.map((node: HtmlNode) => {
    if ("tagName" in node) {
      if (node.tagName === "script" || node.tagName === "style") return "";
      return parsedText(node);
    }
    return "value" in node ? node.value : "";
  }).join(" ");
}

function normalizeContent(value: string) {
  return value.replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

async function setTraceStatus(traceId: string, status: string, title?: string) {
  try {
    await setGenerationTraceStatus(traceId, status, title);
  } catch {
    console.error("XPage landing trace status update failed", { traceId, status });
  }
}
