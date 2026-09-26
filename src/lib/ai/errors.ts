import { APICallError, NoObjectGeneratedError } from "ai";

export type ProviderId =
  | "gemini"
  | "openrouter"
  | "openrouter-fallback"
  | "openrouter-recraft"
  | "openrouter-muse";

type ProviderFailure = {
  status: number;
  body: { error: string; code: string };
};

export class ProviderCallError extends Error {
  constructor(
    readonly provider: ProviderId,
    readonly originalError: unknown,
  ) {
    super(`${provider} request failed`);
    this.name = "ProviderCallError";
  }
}

export class TextFallbackError extends Error {
  constructor(readonly failures: ProviderCallError[]) {
    super("AI provider fallback chain failed");
    this.name = "TextFallbackError";
  }
}

function statusFor(error: unknown) {
  return APICallError.isInstance(error) ? error.statusCode : undefined;
}

function underlyingError(error: unknown) {
  return error instanceof ProviderCallError ? error.originalError : error;
}

export function shouldFallbackToOpenRouter(error: unknown) {
  const cause = underlyingError(error);
  return (
    NoObjectGeneratedError.isInstance(cause) ||
    (APICallError.isInstance(cause) && cause.isRetryable)
  );
}

function providerName(provider: ProviderId) {
  switch (provider) {
    case "gemini":
      return "Gemini";
    case "openrouter":
      return "OpenRouter Qwen";
    case "openrouter-fallback":
      return "OpenRouter GLM";
    case "openrouter-recraft":
      return "Recraft V4.1 Flash";
    case "openrouter-muse":
      return "Muse Image";
  }
}

function describeAttemptFailure(failure: ProviderCallError) {
  const provider = providerName(failure.provider);
  const cause = failure.originalError;

  if (APICallError.isInstance(cause)) {
    if (cause.statusCode === 429) return `${provider} respondió HTTP 429`;
    if (cause.statusCode) return `${provider} respondió HTTP ${cause.statusCode}`;
  }

  if (NoObjectGeneratedError.isInstance(cause)) {
    if (cause.finishReason === "length") {
      return `${provider} alcanzó el límite de tokens antes de completar la respuesta`;
    }
    return `${provider} no devolvió una respuesta con el formato esperado`;
  }

  if (cause instanceof Error && /timeout/i.test(cause.name)) {
    return `${provider} agotó el tiempo de espera`;
  }

  return `${provider} falló sin un código HTTP identificable`;
}

function failureFor(
  error: ProviderCallError,
  failures: ProviderCallError[],
): ProviderFailure {
  const provider = providerName(error.provider);
  const providerNames = failures.map((failure) => providerName(failure.provider));
  const wasFallback = failures.length > 1;
  const cause = error.originalError;

  if (APICallError.isInstance(cause)) {
    if (cause.statusCode === 503) {
      return {
        status: 503,
        body: {
          error: `${providerNames.join(", ")} están temporalmente saturados. Espera un momento y vuelve a intentarlo.`,
          code: "provider_overloaded",
        },
      };
    }

    if (cause.statusCode === 429) {
      const attemptSummary = failures.map(describeAttemptFailure).join("; ");
      return {
        status: 429,
        body: {
          error: `No se pudo completar la generación. ${attemptSummary}. Revisa el panel de uso de los proveedores que respondieron 429; puede ser un límite por minuto o una cuota diaria.`,
          code: "provider_rate_limited",
        },
      };
    }

    if (cause.statusCode === 401 || cause.statusCode === 403) {
      return {
        status: 503,
        body: {
          error: error.provider === "gemini"
            ? "Google rechazó la API key o el acceso al modelo. Revisa la clave y los permisos en Google AI Studio."
            : "OpenRouter rechazó la API key o el acceso al modelo. Revisa la clave en OpenRouter.",
          code: "provider_auth_error",
        },
      };
    }

    if (cause.statusCode === 402) {
      return {
        status: 402,
        body: {
          error: "OpenRouter no tiene saldo disponible para esta generación de imagen. Revisa tus créditos.",
          code: "provider_payment_required",
        },
      };
    }

    if (cause.isRetryable) {
      return {
        status: 503,
        body: {
          error: `No se pudo completar la generación. ${failures.map(describeAttemptFailure).join("; ")}. Inténtalo de nuevo en un momento.`,
          code: "provider_temporarily_unavailable",
        },
      };
    }
  }

  if (NoObjectGeneratedError.isInstance(cause)) {
    return {
      status: 502,
      body: {
        error: wasFallback
          ? `No se pudo completar la generación. ${failures.map(describeAttemptFailure).join("; ")}. Intenta de nuevo con un prompt más breve.`
          : `${provider} no devolvió una landing válida. Intenta de nuevo con un prompt más breve.`,
        code: "invalid_generated_output",
      },
    };
  }

  return {
    status: 502,
    body: {
      error: wasFallback
        ? `No se pudo completar la generación. ${failures.map(describeAttemptFailure).join("; ")}. Vuelve a intentarlo manualmente.`
        : `${provider} no pudo completar la solicitud. Vuelve a intentarlo manualmente.`,
      code: "generation_failed",
    },
  };
}

export function getProviderFailure(
  caughtError: unknown,
  operation: string,
  defaultProvider: ProviderId = "gemini",
): ProviderFailure {
  const wasFallback = caughtError instanceof TextFallbackError;
  const failures = wasFallback
    ? caughtError.failures
    : caughtError instanceof ProviderCallError
      ? [caughtError]
      : [new ProviderCallError(defaultProvider, caughtError)];
  const providerError = failures[failures.length - 1];
  const failureStatuses = failures.map((failure) => statusFor(failure.originalError));
  const failureStatus = statusFor(providerError.originalError);

  // Provider errors contain request data and may include credentials. Log metadata only.
  console.error(operation, {
    provider: providerError.provider,
    statusCode: failureStatus,
    failureStatuses,
    failures: failures.map((failure) => {
      const originalError = failure.originalError;
      return {
        provider: failure.provider,
        statusCode: statusFor(originalError),
        isRetryable:
          APICallError.isInstance(originalError) ? originalError.isRetryable : undefined,
        finishReason:
          NoObjectGeneratedError.isInstance(originalError)
            ? originalError.finishReason
            : undefined,
        errorName: originalError instanceof Error ? originalError.name : "UnknownError",
      };
    }),
    isRetryable:
      APICallError.isInstance(providerError.originalError)
        ? providerError.originalError.isRetryable
        : undefined,
    finishReason:
      NoObjectGeneratedError.isInstance(providerError.originalError)
        ? providerError.originalError.finishReason
        : undefined,
    errorName:
      providerError.originalError instanceof Error
        ? providerError.originalError.name
        : "UnknownError",
  });

  return failureFor(providerError, failures);
}
