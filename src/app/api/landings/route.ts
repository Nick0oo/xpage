import { NextResponse } from "next/server";
import { parseFragment, type DefaultTreeAdapterTypes } from "parse5";
import { runEveStructured } from "@/lib/eve-runtime";
import { landingCodeSchema, landingRequestSchema } from "@/lib/schemas";
import {
  ensureLandingTrace,
  recordProviderAttempts,
  setGenerationTraceStatus,
} from "@/lib/generation-traces";

export const runtime = "nodejs";
export const maxDuration = 300;

const landingInstructions = `Eres director de arte y frontend senior. Construye una landing completa desde el prompt: devuelve título, HTML del body, CSS independiente y JavaScript vanilla independiente.

DIRECCIÓN: lee oferta, público, tono y métodos antes de programar. Propón una identidad visual reconocible y específica al brief. Varía la composición del hero con intención; evita repetir titular centrado, hero dividido, Bento o tres tarjetas iguales por defecto. Define variables CSS de color, tipo, espacio, radios y sombras. Mantén un hilo visual mediante un motivo gráfico coherente.

VARIEDAD VISUAL: elige una metáfora gráfica concreta derivada del contenido y conviértela en sistema visual. Alterna escalas, alineaciones, densidad, formas de bloques y ritmo entre secciones; evita plantillas de hero genérico seguido por tarjetas repetidas. Usa elementos tipográficos o CSS/SVG hechos a medida cuando mejoren el concepto. Cada sección debe tener un propósito visible y una composición propia, sin sacrificar legibilidad ni responsive.

RECORRIDO: la primera pantalla comunica oferta, destinatario y siguiente acción. Desarrolla un recorrido completo, no solo un hero y un resumen. Cuando el brief contenga material, suele funcionar una arquitectura de 5–7 secciones sustantivas con detalle de la oferta, ejemplos/entregables, explicación de uso y cierre; adapta el número y propósito a la oferta, sin secciones de relleno. El copy debe ser claro, natural y respaldable por el brief. No inventes clientes, testimonios, cifras, precios, premios, funciones ni garantías. Aplica todos los atributos data-xpage-section y data-xpage-slot del plan.

CTA: cada llamada a la acción debe funcionar. Usa la URL proporcionada en el brief o, si no existe, un enlace de ancla a la sección pertinente que ya esté en esta página. El CTA principal debe ser un enlace activo con class="cta"; no lo deshabilites ni presentes un botón que no haga nada.

INTERACCIÓN Y REVISIÓN: evalúa claridad, jerarquía, contraste, navegación, fricción, accesibilidad, responsive, riqueza del contenido y consistencia con DesignDNA. Cuando la oferta se beneficie de ello, incluye una interacción local útil (por ejemplo, tabs accesibles, pasos de una práctica o un selector); evita formularios ficticios, botones decorativos y controles sin respuesta. Corrige hallazgos concretos antes de devolver el resultado. No reveles razonamiento privado.

REQUISITOS DE CONTENIDO: cada elemento de explicitContentRequirements es obligatorio. Incluye todos los requiredItems completos, visibles y legibles dentro de su sección; no los reemplaces con un titular que solo mencione una cantidad. El texto debe seguir presente al desactivar JavaScript.

IMPLEMENTACIÓN: usa HTML semántico, estilos móviles primero, foco visible, contraste suficiente y prefers-reduced-motion. JavaScript solo para interacciones reales, locales y accesibles. No uses React, frameworks, imports, CDNs, fuentes/imágenes remotas, iframes, formularios con envío, red, almacenamiento web ni acceso al documento padre. Para medios, usa composición CSS/SVG útil hasta que exista un recurso local; jamás dejes un bloque vacío o un placeholder genérico. Devuelve solamente los campos del esquema.`;

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
  const message = `${landingInstructions}\n\nPROMPT EDITABLE DEL PLAN\n${prompt}\n\nSECCIONES OBLIGATORIAS\n${JSON.stringify(plannedSectionIds)}\n\nREQUISITOS VERIFICABLES\n${JSON.stringify(explicitContentRequirements, null, 2)}\n\nEntrega una landing completa y funcional. Prioriza la intención de marca y requisitos del prompt dentro de estos límites de vista previa.`;
  const attempts: Array<{ provider: string; model: string; status: "completed" | "failed"; durationMs: number; output?: unknown; errorMessage?: string }> = [];
  try {
    const generationStartedAt = Date.now();
    const { data } = await runEveStructured({ modelChoice, message, outputSchema: landingCodeSchema });
    const initial = landingCodeSchema.safeParse(data);
    if (!initial.success) throw new Error("Eve devolvió HTML, CSS o JavaScript incompleto.");
    attempts.push({ provider: "eve-local", model: modelChoice, status: "completed", durationMs: Date.now() - generationStartedAt, output: initial.data });
    let output = initial.data;
    let missing = missingLandingElements(output.html, explicitContentRequirements, plannedSectionIds);
    if (missing.length) {
      const repairStartedAt = Date.now();
      const repairMessage = `${message}\n\nREPARACIÓN FOCALIZADA: la versión anterior omitió estos elementos obligatorios: ${JSON.stringify(missing)}. Revisa el código anterior y devuelve la misma landing con esos textos completos en su sección indicada. Conserva su diseño y el resto del contenido; no elimines marcadores de sección y medios.\n\nCÓDIGO ANTERIOR\n${JSON.stringify(output)}`;
      const repair = await runEveStructured({ modelChoice, message: repairMessage, outputSchema: landingCodeSchema });
      const repaired = landingCodeSchema.safeParse(repair.data);
      if (!repaired.success) throw new Error("La reparación de contenido devolvió código incompleto.");
      output = repaired.data;
      missing = missingLandingElements(output.html, explicitContentRequirements, plannedSectionIds);
      attempts.push({ provider: "eve-local", model: modelChoice, status: missing.length ? "failed" : "completed", durationMs: Date.now() - repairStartedAt, output, ...(missing.length ? { errorMessage: `Faltan elementos obligatorios: ${missing.join("; ")}` } : {}) });
      if (missing.length) throw new Error(`La landing no cumple el contrato del plan: ${missing.join("; ")}`);
    }

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
    const missingContent = message.startsWith("La landing no cumple el contrato del plan:");
    return NextResponse.json({
      error: missingContent ? message : `Eve no pudo construir la landing con ${modelChoice}. Revisa el acceso al proveedor seleccionado e inténtalo otra vez.`,
      code: missingContent ? "plan_contract_failed" : "eve_model_unavailable",
    }, { status: missingContent ? 422 : 503 });
  }
}

function missingLandingElements(html: string, requirements: Array<{ sectionId: string; requiredItems: string[] }>, sectionIds: string[]) {
  const fragment = parseFragment(html);
  const elements = parsedElements(fragment);
  const visible = normalizeContent(parsedText(fragment));
  const markerIds = new Set(elements.map((element) => parsedAttribute(element, "data-xpage-section")).filter((id): id is string => id !== undefined));
  const missingSections = sectionIds.filter((id) => !markerIds.has(id)).map((id) => `Seccion sin marker: ${id}`);
  const missingItems = requirements.flatMap(({ requiredItems }) => requiredItems.filter((item) => !visible.includes(normalizeContent(item))));
  const disabledPrimaryCta = elements.some((element) => element.tagName === "button"
    && parsedAttribute(element, "class")?.split(/\s+/).includes("cta")
    && (parsedAttribute(element, "disabled") !== undefined || parsedAttribute(element, "aria-disabled") === "true"))
    ? ["El CTA principal esta deshabilitado"] : [];
  const targetIds = new Set(elements.map((element) => parsedAttribute(element, "id")).filter((id): id is string => id !== undefined));
  const brokenAnchors = elements
    .map((element) => parsedAttribute(element, "href"))
    .filter((href): href is string => href?.startsWith("#") === true)
    .map((href) => href.slice(1))
    .filter((id) => !targetIds.has(id))
    .map((id) => `Enlace interno sin destino: #${id}`);
  return [...missingSections, ...missingItems, ...disabledPrimaryCta, ...brokenAnchors];
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
