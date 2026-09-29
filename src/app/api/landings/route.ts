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

RECORRIDO: la primera pantalla comunica oferta, destinatario y siguiente acción. Ordena solo las secciones necesarias para responder objeciones plausibles y guiar a un CTA. El copy debe ser claro, natural y respaldable por el brief. No inventes clientes, testimonios, cifras, precios, premios, funciones ni garantías. Aplica los atributos data-xpage-section y data-xpage-slot del plan para conectar las decisiones con el HTML.

REVISIÓN: evalúa claridad, jerarquía, contraste, navegación, fricción, accesibilidad, responsive y consistencia con DesignDNA. Corrige hallazgos concretos antes de devolver el resultado. No reveles razonamiento privado.

IMPLEMENTACIÓN: usa HTML semántico, estilos móviles primero, foco visible, contraste suficiente y prefers-reduced-motion. JavaScript solo para interacciones reales, locales y accesibles. No uses React, frameworks, imports, CDNs, fuentes/imágenes remotas, iframes, formularios con envío, red, almacenamiento web ni acceso al documento padre. Para medios, usa composición CSS/SVG útil hasta que exista un recurso local; jamás dejes un bloque vacío o un placeholder genérico. Devuelve solamente los campos del esquema.`;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = landingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "El prompt está vacío o supera el límite permitido.", code: "invalid_input" }, { status: 400 });
  }

  const { prompt, traceId, modelChoice } = parsed.data;
  let generationTraceId: string;
  try {
    const trace = await ensureLandingTrace({ traceId, title: "Landing en construcción", prompt });
    generationTraceId = trace.id;
  } catch {
    return NextResponse.json({ error: "No se pudo iniciar la trazabilidad de esta landing.", code: "trace_unavailable" }, { status: 500 });
  }

  const startedAt = Date.now();
  const message = `${landingInstructions}\n\nPROMPT EDITABLE DEL PLAN\n${prompt}\n\nEntrega una landing completa y funcional. Prioriza la intención de marca y requisitos del prompt dentro de estos límites de vista previa.`;
  try {
    const { data } = await runEveStructured({ modelChoice, message, outputSchema: landingCodeSchema });
    const output = landingCodeSchema.safeParse(data);
    if (!output.success) throw new Error("Eve devolvió HTML, CSS o JavaScript incompleto.");

    await recordProviderAttempts({
      traceId: generationTraceId,
      phase: "landing-generation",
      title: "Construcción de landing · Eve",
      systemPrompt: landingInstructions,
      userPrompt: prompt,
      attempts: [{
        provider: "eve-local",
        model: modelChoice,
        status: "completed",
        durationMs: Date.now() - startedAt,
        output: output.data,
      }],
    });
    await setTraceStatus(generationTraceId, "completed", output.data.title);
    return NextResponse.json({ ...output.data, traceId: generationTraceId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eve no pudo construir la landing.";
    await recordProviderAttempts({
      traceId: generationTraceId,
      phase: "landing-generation",
      title: "Construcción de landing · Eve",
      systemPrompt: landingInstructions,
      userPrompt: prompt,
      attempts: [{
        provider: "eve-local",
        model: modelChoice,
        status: "failed",
        durationMs: Date.now() - startedAt,
        errorMessage: message.slice(0, 500),
      }],
    }).catch(() => undefined);
    await setTraceStatus(generationTraceId, "failed");
    return NextResponse.json({
      error: `Eve no pudo construir la landing con ${modelChoice}. Revisa el acceso al proveedor seleccionado e inténtalo otra vez.`,
      code: "eve_model_unavailable",
    }, { status: 503 });
  }
}

async function setTraceStatus(traceId: string, status: string, title?: string) {
  try {
    await setGenerationTraceStatus(traceId, status, title);
  } catch {
    console.error("XPage landing trace status update failed", { traceId, status });
  }
}
