import { NextResponse } from "next/server";
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

RECORRIDO: la primera pantalla comunica oferta, destinatario y siguiente acción. Ordena solo las secciones necesarias para responder objeciones plausibles y guiar a un CTA. El copy debe ser claro, natural y respaldable por el brief. No inventes clientes, testimonios, cifras, precios, premios, funciones ni garantías. Aplica los atributos data-xpage-section y data-xpage-slot del plan para conectar las decisiones con el HTML.

REVISIÓN: evalúa claridad, jerarquía, contraste, navegación, fricción, accesibilidad, responsive y consistencia con DesignDNA. Corrige hallazgos concretos antes de devolver el resultado. No reveles razonamiento privado.

REQUISITOS DE CONTENIDO: cada elemento de explicitContentRequirements es obligatorio. Incluye todos los requiredItems completos, visibles y legibles dentro de su sección; no los reemplaces con un titular que solo mencione una cantidad. El texto debe seguir presente al desactivar JavaScript.

IMPLEMENTACIÓN: usa HTML semántico, estilos móviles primero, foco visible, contraste suficiente y prefers-reduced-motion. JavaScript solo para interacciones reales, locales y accesibles. No uses React, frameworks, imports, CDNs, fuentes/imágenes remotas, iframes, formularios con envío, red, almacenamiento web ni acceso al documento padre. Para medios, usa composición CSS/SVG útil hasta que exista un recurso local; jamás dejes un bloque vacío o un placeholder genérico. Devuelve solamente los campos del esquema.`;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = landingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "El prompt está vacío o supera el límite permitido.", code: "invalid_input" }, { status: 400 });
  }

  const { prompt, traceId, modelChoice, explicitContentRequirements = [] } = parsed.data;
  let generationTraceId: string;
  try {
    const trace = await ensureLandingTrace({ traceId, title: "Landing en construcción", prompt });
    generationTraceId = trace.id;
  } catch {
    return NextResponse.json({ error: "No se pudo iniciar la trazabilidad de esta landing.", code: "trace_unavailable" }, { status: 500 });
  }

  const startedAt = Date.now();
  const message = `${landingInstructions}\n\nPROMPT EDITABLE DEL PLAN\n${prompt}\n\nREQUISITOS VERIFICABLES\n${JSON.stringify(explicitContentRequirements, null, 2)}\n\nEntrega una landing completa y funcional. Prioriza la intención de marca y requisitos del prompt dentro de estos límites de vista previa.`;
  const attempts: Array<{ provider: string; model: string; status: "completed" | "failed"; durationMs: number; output?: unknown; errorMessage?: string }> = [];
  try {
    const generationStartedAt = Date.now();
    const { data } = await runEveStructured({ modelChoice, message, outputSchema: landingCodeSchema });
    const initial = landingCodeSchema.safeParse(data);
    if (!initial.success) throw new Error("Eve devolvió HTML, CSS o JavaScript incompleto.");
    attempts.push({ provider: "eve-local", model: modelChoice, status: "completed", durationMs: Date.now() - generationStartedAt, output: initial.data });
    let output = initial.data;
    let missing = missingRequiredItems(output.html, explicitContentRequirements);
    if (missing.length) {
      const repairStartedAt = Date.now();
      const repairMessage = `${message}\n\nREPARACIÓN FOCALIZADA: la versión anterior omitió estos elementos obligatorios: ${JSON.stringify(missing)}. Revisa el código anterior y devuelve la misma landing con esos textos completos en su sección indicada. Conserva su diseño y el resto del contenido; no elimines marcadores de sección y medios.\n\nCÓDIGO ANTERIOR\n${JSON.stringify(output)}`;
      const repair = await runEveStructured({ modelChoice, message: repairMessage, outputSchema: landingCodeSchema });
      const repaired = landingCodeSchema.safeParse(repair.data);
      if (!repaired.success) throw new Error("La reparación de contenido devolvió código incompleto.");
      output = repaired.data;
      missing = missingRequiredItems(output.html, explicitContentRequirements);
      attempts.push({ provider: "eve-local", model: modelChoice, status: missing.length ? "failed" : "completed", durationMs: Date.now() - repairStartedAt, output, ...(missing.length ? { errorMessage: `Faltan elementos obligatorios: ${missing.join("; ")}` } : {}) });
      if (missing.length) throw new Error(`La landing sigue omitiendo contenido obligatorio: ${missing.join("; ")}`);
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
    const missingContent = message.startsWith("La landing sigue omitiendo contenido obligatorio:");
    return NextResponse.json({
      error: missingContent ? message : `Eve no pudo construir la landing con ${modelChoice}. Revisa el acceso al proveedor seleccionado e inténtalo otra vez.`,
      code: missingContent ? "required_content_missing" : "eve_model_unavailable",
    }, { status: missingContent ? 422 : 503 });
  }
}

function missingRequiredItems(html: string, requirements: Array<{ requiredItems: string[] }>) {
  const visible = normalizeContent(html.replace(/<script\b[\s\S]*?<\/script>/gi, " ").replace(/<style\b[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
  return requirements.flatMap(({ requiredItems }) => requiredItems.filter((item) => !visible.includes(normalizeContent(item))));
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
