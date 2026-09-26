import { APICallError, generateImage, generateText } from "ai";
import { NextResponse } from "next/server";
import {
  getOpenRouterImageFallbackModel,
  getOpenRouterImageModel,
  isOpenRouterConfigured,
} from "@/lib/ai/providers";
import {
  getProviderFailure,
  ProviderCallError,
  shouldFallbackToOpenRouter,
  TextFallbackError,
} from "@/lib/ai/errors";
import { imageRequestSchema } from "@/lib/schemas";
import { recordProviderAttempts, type ProviderAttemptTrace } from "@/lib/generation-traces";
import {
  DEFAULT_OPENROUTER_IMAGE_FALLBACK_MODEL,
  DEFAULT_OPENROUTER_IMAGE_MODEL,
} from "@/lib/ai/providers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = imageRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Revisa el brief antes de generar la imagen.", code: "invalid_input" },
      { status: 400 },
    );
  }

  if (!isOpenRouterConfigured()) {
    return NextResponse.json(
      {
        error: "Configura OPENROUTER_API_KEY en .env.local y reinicia XPage para generar imágenes.",
        code: "missing_api_key",
      },
      { status: 503 },
    );
  }

  const { brief, traceId } = parsed.data;
  const prompt = [
    "Create one polished, photorealistic or art-directed hero image for a modern landing page.",
    `Subject or industry: ${brief.topic}.`,
    `Product and benefit: ${brief.offer}.`,
    `Target audience: ${brief.audience}.`,
    `Visual direction: ${brief.tone}.`,
    "Compose a wide 16:9 image with a clear focal subject and useful negative space for a headline.",
    "Use a coherent palette and natural lighting. Do not include text, typography, logos, watermarks, UI mockups, or collages.",
  ].join("\n");
  const attempts: ProviderAttemptTrace[] = [];
  const recraftStartedAt = Date.now();

  try {
    const model = process.env.OPENROUTER_IMAGE_MODEL?.trim() || DEFAULT_OPENROUTER_IMAGE_MODEL;
    const { image } = await generateImage({
      model: getOpenRouterImageModel(),
      prompt,
      aspectRatio: "16:9",
      maxRetries: 0,
    });

    attempts.push({
      provider: "openrouter-recraft",
      model,
      status: "completed",
      durationMs: Date.now() - recraftStartedAt,
      output: { image: image.base64, mediaType: image.mediaType },
    });
    await recordImageAttempts(traceId, prompt, attempts);

    return NextResponse.json({ image: image.base64, mediaType: image.mediaType });
  } catch (primaryError) {
    const primaryStatus = APICallError.isInstance(primaryError) ? primaryError.statusCode : undefined;
    const recraftError = new ProviderCallError("openrouter-recraft", primaryError);
    if (!shouldFallbackToOpenRouter(recraftError)) {
      attempts.push({
        provider: "openrouter-recraft",
        model: process.env.OPENROUTER_IMAGE_MODEL?.trim() || DEFAULT_OPENROUTER_IMAGE_MODEL,
        status: "failed",
        durationMs: Date.now() - recraftStartedAt,
        errorMessage: [primaryError instanceof Error ? primaryError.name : "UnknownError", primaryStatus ? `HTTP ${primaryStatus}` : ""].filter(Boolean).join(" · "),
      });
      await recordImageAttempts(traceId, prompt, attempts);
      return providerErrorResponse(recraftError);
    }

    attempts.push({
      provider: "openrouter-recraft",
      model: process.env.OPENROUTER_IMAGE_MODEL?.trim() || DEFAULT_OPENROUTER_IMAGE_MODEL,
      status: "failed",
      durationMs: Date.now() - recraftStartedAt,
      errorMessage: [primaryError instanceof Error ? primaryError.name : "UnknownError", primaryStatus ? `HTTP ${primaryStatus}` : ""].filter(Boolean).join(" · "),
    });

    const museStartedAt = Date.now();
    try {
      const model = process.env.OPENROUTER_IMAGE_FALLBACK_MODEL?.trim() || DEFAULT_OPENROUTER_IMAGE_FALLBACK_MODEL;
      const { files } = await generateText({
        model: getOpenRouterImageFallbackModel(),
        prompt,
        maxRetries: 0,
      });
      const image = files.find((file) => file.mediaType.startsWith("image/"));

      if (!image) {
        attempts.push({
          provider: "openrouter-muse",
          model,
          status: "failed",
          durationMs: Date.now() - museStartedAt,
          errorMessage: "Muse Image no devolvió una imagen.",
        });
        await recordImageAttempts(traceId, prompt, attempts);
        return NextResponse.json(
          { error: "Muse Image no devolvió una imagen. Vuelve a intentarlo.", code: "invalid_output" },
          { status: 502 },
        );
      }

      attempts.push({
        provider: "openrouter-muse",
        model,
        status: "completed",
        durationMs: Date.now() - museStartedAt,
        output: { image: image.base64, mediaType: image.mediaType },
      });
      await recordImageAttempts(traceId, prompt, attempts);

      return NextResponse.json({ image: image.base64, mediaType: image.mediaType });
    } catch (fallbackError) {
      const fallbackStatus = APICallError.isInstance(fallbackError) ? fallbackError.statusCode : undefined;
      attempts.push({
        provider: "openrouter-muse",
        model: process.env.OPENROUTER_IMAGE_FALLBACK_MODEL?.trim() || DEFAULT_OPENROUTER_IMAGE_FALLBACK_MODEL,
        status: "failed",
        durationMs: Date.now() - museStartedAt,
        errorMessage: [fallbackError instanceof Error ? fallbackError.name : "UnknownError", fallbackStatus ? `HTTP ${fallbackStatus}` : ""].filter(Boolean).join(" · "),
      });
      await recordImageAttempts(traceId, prompt, attempts);
      return providerErrorResponse(
        new TextFallbackError([
          recraftError,
          new ProviderCallError("openrouter-muse", fallbackError),
        ]),
      );
    }
  }
}

async function recordImageAttempts(traceId: string | undefined, prompt: string, attempts: ProviderAttemptTrace[]) {
  await recordProviderAttempts({
    traceId,
    phase: "image-generation",
    title: "Generación de imagen de portada",
    userPrompt: prompt,
    attempts,
  });
}

function providerErrorResponse(error: unknown) {
  const failure = getProviderFailure(error, "XPage cover image generation failed", "openrouter-recraft");
  return NextResponse.json(failure.body, { status: failure.status });
}
