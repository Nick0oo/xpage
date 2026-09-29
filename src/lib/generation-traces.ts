import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

export type TraceStepInput = {
  id?: string;
  executionId?: string;
  parentTraceId?: string;
  parentStepId?: string;
  eventType?: "step" | "decision" | "source" | "asset" | "revision" | "export";
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
  skillVersions?: Record<string, string>;
  decisionSummary?: string;
  references?: TraceReference[];
  metadata?: Record<string, unknown>;
};

/** Contrato público de referencias: IDs estables, sin binarios dentro del evento. */
export type TraceReference = {
  kind: "project" | "revision" | "section" | "media-asset" | "source" | "claim" | "landing" | "url";
  id: string;
  label?: string;
  url?: string;
  sourceType?: "brief" | "documento" | "web" | "proveedor";
  claimStatus?: "provided" | "external-evidence" | "hypothesis" | "inference";
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

    const promptSteps = source?.steps.filter(
      (step) => step.phase === "technique-prompt" || step.phase === "combined-prompt",
    ) ?? [];

    const trace = await tx.generationTrace.create({
      data: {
        id,
        category: input.category,
        title: input.title,
        contextJson: JSON.stringify(input.context),
        rootTraceId: source?.rootTraceId ?? source?.id ?? id,
        parentTraceId: source?.id ?? null,
        sourceTraceId: source?.id ?? null,
        executionId: id,
        sequenceCounter: promptSteps.length || (typeof input.context.prompt === "string" && input.context.prompt.trim() ? 1 : 0),
      },
      select: { id: true },
    });

    if (promptSteps.length > 0) {
      await tx.generationTraceStep.createMany({
        data: promptSteps.map((step, index) => ({
          id: randomUUID(),
          traceId: id,
          executionId: id,
          rootTraceId: source?.rootTraceId ?? source?.id ?? id,
          parentTraceId: source?.id ?? null,
          parentStepId: step.id,
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
          executionId: id,
          rootTraceId: source?.rootTraceId ?? source?.id ?? id,
          parentTraceId: source?.id ?? null,
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
  return prisma.$transaction(async (tx) => {
    // Acquire SQLite's write lock before reading, avoiding read-to-write lock upgrades
    // when multiple workers append to the same trace concurrently.
    const counter = await tx.generationTrace.update({
      where: { id: traceId },
      data: { sequenceCounter: { increment: 1 } },
      select: { sequenceCounter: true },
    });
    if (input.id) {
      const existing = await tx.generationTraceStep.findUnique({ where: { id: input.id }, select: { id: true } });
      if (existing) {
        await tx.generationTrace.update({ where: { id: traceId }, data: { sequenceCounter: { decrement: 1 } } });
        return existing;
      }
    }
    const current = await tx.generationTrace.findUnique({ where: { id: traceId }, select: { id: true, rootTraceId: true, executionId: true } });
    if (!current) return;
    await tx.generationTraceStep.create({
      data: {
      id: input.id ?? randomUUID(),
      traceId,
      executionId: input.executionId ?? current.executionId,
      rootTraceId: current.rootTraceId ?? traceId,
      parentTraceId: input.parentTraceId ?? null,
      parentStepId: input.parentStepId ?? null,
      eventType: input.eventType ?? "step",
      sequence: counter.sequenceCounter,
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
      skillVersionsJson: input.skillVersions ? JSON.stringify(input.skillVersions) : null,
      decisionSummary: input.decisionSummary ?? null,
      referencesJson: input.references ? JSON.stringify(input.references) : null,
      metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
    await tx.generationTrace.update({ where: { id: traceId }, data: { updatedAt: new Date() } });
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
  executionId?: string;
  references?: TraceReference[];
}) {
  if (!input.traceId) return;

  try {
    for (const attempt of input.attempts) {
      const rawOutput = attempt.output as Record<string, unknown> | undefined;
      const isInlineImage = rawOutput && typeof rawOutput.image === "string" && typeof rawOutput.mediaType === "string";
      await recordTraceStep(input.traceId, {
        executionId: input.executionId,
        phase: input.phase,
        title: input.title,
        techniqueIds: input.techniqueIds,
        provider: attempt.provider,
        model: attempt.model,
        systemPrompt: input.systemPrompt,
        userPrompt: input.userPrompt,
        outputText: attempt.outputText,
        output: isInlineImage ? { mediaType: rawOutput.mediaType, mediaReferencePending: true } : attempt.output,
        references: input.references,
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
    rootTraceId: trace.rootTraceId ?? trace.id,
    parentTraceId: trace.parentTraceId,
    sourceTraceId: trace.sourceTraceId,
    executionId: trace.executionId || trace.id,
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
    rootTraceId: trace.rootTraceId ?? trace.id,
    parentTraceId: trace.parentTraceId,
    sourceTraceId: trace.sourceTraceId,
    executionId: trace.executionId || trace.id,
    createdAt: trace.createdAt.toISOString(),
    updatedAt: trace.updatedAt.toISOString(),
    landings: trace.landings,
    steps: trace.steps.map((step) => ({
      id: step.id,
      sequence: step.sequence,
      executionId: step.executionId || trace.executionId || trace.id,
      rootTraceId: step.rootTraceId ?? trace.rootTraceId ?? trace.id,
      parentTraceId: step.parentTraceId,
      parentStepId: step.parentStepId,
      eventType: step.eventType,
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
      skillVersions: parseJson(step.skillVersionsJson),
      decisionSummary: step.decisionSummary,
      references: parseJson(step.referencesJson),
      metadata: parseJson(step.metadataJson),
      sourceTraceId: step.parentTraceId,
      createdAt: step.createdAt.toISOString(),
    })),
  };
}
