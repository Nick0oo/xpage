import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

export type TraceStepInput = {
  phase: string;
  title: string;
  techniqueIds?: string[];
  provider?: string;
  model?: string;
  systemPrompt?: string;
  userPrompt?: string;
  outputText?: string;
  output?: unknown;
  status?: "completed" | "failed";
  errorMessage?: string;
  durationMs?: number;
};

export type ProviderAttemptTrace = {
  provider: string;
  model: string;
  status: "completed" | "failed";
  durationMs: number;
  outputText?: string;
  output?: unknown;
  errorMessage?: string;
};

function parseJson(value: string | null | undefined): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

export async function createGenerationTrace(input: {
  category: string;
  title: string;
  context: Record<string, unknown>;
  sourceTraceId?: string;
}) {
  const id = randomUUID();
  return prisma.$transaction(async (tx) => {
    const source = input.sourceTraceId
      ? await tx.generationTrace.findUnique({
          where: { id: input.sourceTraceId },
          include: { steps: { orderBy: { sequence: "asc" } } },
        })
      : null;

    const trace = await tx.generationTrace.create({
      data: {
        id,
        category: input.category,
        title: input.title,
        contextJson: JSON.stringify(input.context),
      },
      select: { id: true },
    });

    const promptSteps = source?.steps.filter(
      (step) => step.phase === "technique-prompt" || step.phase === "combined-prompt",
    ) ?? [];

    if (promptSteps.length > 0) {
      await tx.generationTraceStep.createMany({
        data: promptSteps.map((step, index) => ({
          id: randomUUID(),
          traceId: id,
          sequence: index + 1,
          phase: step.phase,
          title: step.title,
          techniqueIdsJson: step.techniqueIdsJson,
          provider: step.provider,
          model: step.model,
          systemPrompt: step.systemPrompt,
          userPrompt: step.userPrompt,
          outputText: step.outputText,
          outputJson: step.outputJson,
          status: step.status,
          errorMessage: step.errorMessage,
          durationMs: step.durationMs,
          createdAt: step.createdAt,
        })),
      });
    } else if (typeof input.context.prompt === "string" && input.context.prompt.trim()) {
      const techniqueIds = Array.isArray(input.context.techniqueIds)
        ? input.context.techniqueIds.filter((id): id is string => typeof id === "string")
        : [];
      await tx.generationTraceStep.create({
        data: {
          id: randomUUID(),
          traceId: id,
          sequence: 1,
          phase: "prompt-context",
          title: "Prompt utilizado para construir la landing",
          techniqueIdsJson: techniqueIds.length ? JSON.stringify(techniqueIds) : null,
          outputText: input.context.prompt,
        },
      });
    }

    return trace;
  });
}

export async function ensureLandingTrace(input: {
  traceId?: string;
  title: string;
  prompt: string;
}) {
  if (input.traceId) {
    const existing = await prisma.generationTrace.findUnique({
      where: { id: input.traceId },
      select: { id: true },
    });
    if (existing) return existing;
  }

  return createGenerationTrace({
    category: "landing-page",
    title: input.title,
    context: { prompt: input.prompt },
  });
}

export async function recordTraceStep(traceId: string | undefined, input: TraceStepInput) {
  if (!traceId) return;

  const current = await prisma.generationTrace.findUnique({
    where: { id: traceId },
    select: { id: true, _count: { select: { steps: true } } },
  });
  if (!current) return;

  await prisma.generationTraceStep.create({
    data: {
      id: randomUUID(),
      traceId,
      sequence: current._count.steps + 1,
      phase: input.phase,
      title: input.title,
      techniqueIdsJson: input.techniqueIds ? JSON.stringify(input.techniqueIds) : null,
      provider: input.provider ?? null,
      model: input.model ?? null,
      systemPrompt: input.systemPrompt ?? null,
      userPrompt: input.userPrompt ?? null,
      outputText: input.outputText ?? null,
      outputJson: input.output === undefined ? null : JSON.stringify(input.output),
      status: input.status ?? "completed",
      errorMessage: input.errorMessage ?? null,
      durationMs: input.durationMs ?? null,
    },
  });

  await prisma.generationTrace.update({
    where: { id: traceId },
    data: { updatedAt: new Date() },
  });
}

export async function recordProviderAttempts(input: {
  traceId?: string;
  phase: string;
  title: string;
  techniqueIds?: string[];
  systemPrompt?: string;
  userPrompt: string;
  attempts: ProviderAttemptTrace[];
}) {
  if (!input.traceId) return;

  try {
    for (const attempt of input.attempts) {
      await recordTraceStep(input.traceId, {
        phase: input.phase,
        title: input.title,
        techniqueIds: input.techniqueIds,
        provider: attempt.provider,
        model: attempt.model,
        systemPrompt: input.systemPrompt,
        userPrompt: input.userPrompt,
        outputText: attempt.outputText,
        output: attempt.output,
        status: attempt.status,
        errorMessage: attempt.errorMessage,
        durationMs: attempt.durationMs,
      });
    }
  } catch {
    // Tracing storage should not turn a successful model response into a failed generation.
    console.error("XPage trace persistence failed", { traceId: input.traceId, phase: input.phase });
  }
}

export async function setGenerationTraceStatus(traceId: string | undefined, status: string, title?: string) {
  if (!traceId) return;
  await prisma.generationTrace.updateMany({
    where: { id: traceId },
    data: { status, ...(title ? { title } : {}) },
  });
}

export async function listGenerationTraces() {
  const traces = await prisma.generationTrace.findMany({
    where: { steps: { some: { phase: "landing-generation" } } },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { steps: true } },
      landings: { select: { id: true, title: true }, orderBy: { createdAt: "desc" } },
    },
  });

  return traces.map((trace) => ({
    id: trace.id,
    category: trace.category,
    title: trace.title,
    context: parseJson(trace.contextJson),
    status: trace.status,
    createdAt: trace.createdAt.toISOString(),
    updatedAt: trace.updatedAt.toISOString(),
    stepCount: trace._count.steps,
    landings: trace.landings,
    savedToLibrary: trace.landings.length > 0,
  }));
}

export async function getGenerationTrace(id: string) {
  const trace = await prisma.generationTrace.findUnique({
    where: { id },
    include: {
      steps: { orderBy: { sequence: "asc" } },
      landings: { select: { id: true, title: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!trace) return null;

  return {
    id: trace.id,
    category: trace.category,
    title: trace.title,
    context: parseJson(trace.contextJson),
    status: trace.status,
    createdAt: trace.createdAt.toISOString(),
    updatedAt: trace.updatedAt.toISOString(),
    landings: trace.landings,
    steps: trace.steps.map((step) => ({
      id: step.id,
      sequence: step.sequence,
      phase: step.phase,
      title: step.title,
      techniqueIds: parseJson(step.techniqueIdsJson),
      provider: step.provider,
      model: step.model,
      systemPrompt: step.systemPrompt,
      userPrompt: step.userPrompt,
      outputText: step.outputText,
      output: parseJson(step.outputJson),
      status: step.status,
      errorMessage: step.errorMessage,
      durationMs: step.durationMs,
      createdAt: step.createdAt.toISOString(),
    })),
  };
}
