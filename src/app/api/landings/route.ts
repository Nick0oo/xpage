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
import { landingCodeSchema, landingRequestSchema } from "@/lib/schemas";
import {
  ensureLandingTrace,
  recordProviderAttempts,
  setGenerationTraceStatus,
  type ProviderAttemptTrace,
} from "@/lib/generation-traces";

export const runtime = "nodejs";
export const maxDuration = 300;

const landingSystem = `Eres director creativo, diseñador de producto y desarrollador frontend senior. Sigue el prompt del usuario como brief de dirección y devuelve una landing completa: title, fragmento de body HTML, CSS independiente y JavaScript vanilla independiente.

DIRECCIÓN VISUAL
Lee la oferta, el público, el tono y las técnicas antes de escribir código. Convierte esa información en una dirección de arte concreta y propia de esta marca, no en una plantilla. La composición del hero debe variar según el concepto; no uses por defecto titular centrado, hero partido, Bento ni tres tarjetas iguales. Construye jerarquía con escala tipográfica, ritmo, espacio negativo, contraste y un motivo visual que tenga sentido para el producto. Si el brief no define identidad, propón una paleta corta con roles claros y tipografía del sistema. Define colores, tipografía, espaciado, radios y sombras con variables CSS y reutilízalas con consistencia.

ESTRATEGIA Y COPY
Haz que la primera pantalla explique qué ofrece la marca, para quién y qué puede hacer la persona a continuación. Ordena las secciones como un recorrido que responda dudas y lleve a una sola acción principal; usa solo las necesarias y evita texto de relleno. Escribe en español natural, específico y breve. No inventes clientes, testimonios, métricas, premios, precios, garantías, funciones ni pruebas. Si el brief no aporta prueba social, genera confianza explicando el producto, el proceso o el alcance real, sin simular evidencia. Mantén navegación y CTA simples, claros y consistentes.

REVISIÓN INTERNA
Antes de entregar, evalúa y corrige la propuesta con estos criterios: ¿la marca podría reconocerse sin ver el nombre?, ¿la oferta se entiende de inmediato?, ¿el orden de lectura conduce al CTA?, ¿cada elemento aporta?, ¿hay afirmaciones no respaldadas?, ¿funciona en móvil y con teclado? Entrega el resultado corregido; no expongas razonamiento privado ni una cadena de pensamiento.

IMPLEMENTACIÓN
Usa HTML semántico con header, nav, main, section, headings y footer cuando correspondan. El CSS debe ser completo, responsive desde móvil, accesible, legible, con estados focus visibles, contraste suficiente y soporte para prefers-reduced-motion. El JavaScript debe ser completo y limitarse a interacciones reales, locales y accesibles; no añadas controles decorativos que no funcionen.

LÍMITES DE ESTA VISTA PREVIA
No uses React, frameworks, imports, CDNs, fuentes remotas, imágenes remotas, iframes, formularios con envío, conexiones de red ni acceso a la ventana o al documento padre. No uses localStorage/sessionStorage. Si se piden imágenes o vídeo, representa la intención con una composición CSS o SVG en línea y deja un comentario breve indicando el activo reemplazable; no dejes rectángulos vacíos ni marcadores genéricos. Los enlaces deben navegar a secciones de la página; los botones deben tener una acción local funcional. Devuelve únicamente el contenido solicitado por el esquema.`;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = landingRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "El prompt está vacío o supera el límite permitido.", code: "invalid_input" },
      { status: 400 },
    );
  }

  if (!isTextProviderConfigured()) {
    return NextResponse.json(
      {
        error: "Configura GOOGLE_GENERATIVE_AI_API_KEY o OPENROUTER_API_KEY en .env.local y reinicia XPage.",
        code: "missing_api_key",
      },
      { status: 503 },
    );
  }

  const { prompt } = parsed.data;
  let traceId: string;
  try {
    const trace = await ensureLandingTrace({
      traceId: parsed.data.traceId,
      title: "Landing en construcción",
      prompt,
    });
    traceId = trace.id;
  } catch {
    return NextResponse.json(
      { error: "No se pudo iniciar la trazabilidad de esta landing.", code: "trace_unavailable" },
      { status: 500 },
    );
  }
  const attempts: ProviderAttemptTrace[] = [];

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
        instructions: landingSystem,
        output: Output.object({ schema: landingCodeSchema }),
        maxRetries: 0,
        maxOutputTokens: provider === "gemini" ? 24_000 : 12_000,
        providerOptions:
          provider === "gemini"
            ? { google: { thinkingConfig: { thinkingLevel: "low" } } }
            : undefined,
        prompt,
        timeout: { totalMs: provider === "gemini" ? 150_000 : 90_000 },
      });
      attempts.push({
        provider,
        model,
        status: "completed",
        durationMs: Date.now() - startedAt,
        output: result.output,
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
        traceId,
        phase: "landing-generation",
        title: "Construcción de la landing",
        systemPrompt: landingSystem,
        userPrompt: prompt,
        attempts,
      });
      await updateTraceStatus(traceId, "failed");
      return NextResponse.json(
        { error: "El proveedor no devolvió código válido para la landing.", code: "invalid_output" },
        { status: 502 },
      );
    }

    await recordProviderAttempts({
      traceId,
      phase: "landing-generation",
      title: "Construcción de la landing",
      systemPrompt: landingSystem,
      userPrompt: prompt,
      attempts,
    });
    await updateTraceStatus(traceId, "completed", output.title);
    return NextResponse.json({ ...output, traceId });
  } catch (error) {
    await recordProviderAttempts({
      traceId,
      phase: "landing-generation",
      title: "Construcción de la landing",
      systemPrompt: landingSystem,
      userPrompt: prompt,
      attempts,
    });
    await updateTraceStatus(traceId, "failed");
    const failure = getProviderFailure(error, "XPage landing generation failed");
    return NextResponse.json(failure.body, { status: failure.status });
  }
}

async function updateTraceStatus(traceId: string | undefined, status: string, title?: string) {
  if (!traceId) return;
  try {
    await setGenerationTraceStatus(traceId, status, title);
  } catch {
    console.error("XPage trace status update failed", { traceId, status });
  }
}
