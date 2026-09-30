import { briefSchema, type Brief } from "@/lib/schemas";
import { MODEL_CHOICES } from "@/lib/model-choice";
import { DEFAULT_GEMINI_MODEL, DEFAULT_OPENROUTER_TEXT_MODEL } from "@/lib/ai/providers";
import { prisma } from "@/lib/prisma";

export type GenerationDraft = {
  id: string;
  title: string;
  createdAt: string;
  html: string;
  css: string;
  js: string;
  brief: Brief | null;
  techniqueIds: string[];
  prompt: string | null;
  modelChoice: string | null;
  originalModel: string | null;
  context: unknown;
  trace: {
    category: string;
    status: string;
    rootTraceId: string;
    parentTraceId: string | null;
    sourceTraceId: string | null;
  };
  completeness: { hasBrief: boolean; hasPrompt: boolean; hasTechniques: boolean; hasModel: boolean };
  savedLandingId: string | null;
};

function parseJson(value: string | null): unknown {
  if (!value) return null;
  try { return JSON.parse(value) as unknown; } catch { return value; }
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function knownModelChoice(value: string | null): string | null {
  if (!value) return null;
  if (MODEL_CHOICES.includes(value as (typeof MODEL_CHOICES)[number])) return value;
  if (value === DEFAULT_GEMINI_MODEL) return "gemini";
  if (value === DEFAULT_OPENROUTER_TEXT_MODEL) return "qwen";
  return null;
}

function landingCode(value: unknown) {
  const item = record(value);
  if (!item || typeof item.html !== "string" || !item.html.trim()) return null;
  return {
    title: stringValue(item.title),
    html: item.html,
    css: typeof item.css === "string" ? item.css : "",
    js: typeof item.js === "string" ? item.js : "",
  };
}

function stepOutput(step: { outputJson: string | null; outputText: string | null }) {
  const structured = landingCode(parseJson(step.outputJson));
  if (structured) return structured;
  if (step.outputText) {
    const parsed = parseJson(step.outputText);
    return landingCode(parsed);
  }
  return null;
}

const DRAFT_STEP_PHASES = ["landing-generation", "combined-design-plan"] as const;

type DraftTraceRecord = {
  id: string;
  category: string;
  title: string;
  contextJson: string;
  status: string;
  rootTraceId: string | null;
  parentTraceId: string | null;
  sourceTraceId: string | null;
  createdAt: Date;
  steps: Array<{
    phase: string;
    outputJson: string | null;
    outputText: string | null;
    userPrompt: string | null;
    model: string | null;
    techniqueIdsJson: string | null;
    status: string;
  }>;
  landings: Array<{ id: string; title: string }>;
};

function contextWithLineage(trace: DraftTraceRecord, tracesById: Map<string, DraftTraceRecord>) {
  const relatedIds = [trace.rootTraceId, trace.sourceTraceId, trace.parentTraceId]
    .filter((id): id is string => Boolean(id) && id !== trace.id);
  const sourcePromptTraceId = record(parseJson(trace.contextJson))?.sourcePromptTraceId;
  if (typeof sourcePromptTraceId === "string" && sourcePromptTraceId !== trace.id) relatedIds.push(sourcePromptTraceId);

  const related = [...new Set(relatedIds)].map((id) => tracesById.get(id)).filter((item): item is DraftTraceRecord => Boolean(item));
  const context: Record<string, unknown> = {};
  for (const item of [...related, trace]) {
    const itemContext = record(parseJson(item.contextJson));
    if (!itemContext) continue;
    for (const [key, value] of Object.entries(itemContext)) {
      if (value !== null && value !== undefined) context[key] = value;
    }
  }

  if (!record(context.designPlan)) {
    const planSource = [trace, ...related].find((item) =>
      [...item.steps].reverse().some((step) => step.phase === "combined-design-plan" && record(parseJson(step.outputJson))),
    );
    const planStep = planSource && [...planSource.steps].reverse().find((step) => step.phase === "combined-design-plan" && record(parseJson(step.outputJson)));
    const plan = record(planStep ? parseJson(planStep.outputJson) : null);
    if (plan) {
      context.designPlan = plan;
      context.designPlanTraceId = planSource?.id;
    }
  }

  return context;
}

function normalizeDraft(trace: DraftTraceRecord, tracesById: Map<string, DraftTraceRecord>): GenerationDraft | null {
  const context = contextWithLineage(trace, tracesById);
  const candidates = trace.steps.map((step) => ({ step, output: stepOutput(step) })).filter(
    (candidate): candidate is { step: (typeof trace.steps)[number]; output: NonNullable<ReturnType<typeof stepOutput>> } => candidate.output !== null,
  );
  if (candidates.length === 0) return null;
  const selected = [...candidates].reverse().find(({ step }) => step.status === "completed") ?? candidates.at(-1)!;
  const { step, output } = selected;
  const parsedBrief = briefSchema.safeParse(context.brief);
  const contextTechniques = Array.isArray(context.techniqueIds)
    ? context.techniqueIds.filter((id): id is string => typeof id === "string")
    : [];
  const stepTechniques = parseJson(step.techniqueIdsJson);
  const techniqueIds = contextTechniques.length
    ? contextTechniques
    : Array.isArray(stepTechniques) ? stepTechniques.filter((id): id is string => typeof id === "string") : [];
  const prompt = stringValue(context.prompt) ?? stringValue(step.userPrompt);
  const title = output.title ?? trace.title;
  const contextModel = stringValue(context.modelChoice);
  const originalModel = stringValue(step.model) ?? contextModel;
  const modelChoice = knownModelChoice(contextModel) ?? knownModelChoice(stringValue(step.model));
  const savedLandingId = trace.landings[0]?.id ?? null;

  return {
    id: trace.id,
    title,
    createdAt: trace.createdAt.toISOString(),
    html: output.html,
    css: output.css,
    js: output.js,
    brief: parsedBrief.success ? parsedBrief.data : null,
    techniqueIds,
    prompt,
    modelChoice,
    originalModel,
    context,
    trace: {
      category: trace.category,
      status: trace.status,
      rootTraceId: trace.rootTraceId ?? trace.id,
      parentTraceId: trace.parentTraceId,
      sourceTraceId: trace.sourceTraceId,
    },
    completeness: {
      hasBrief: parsedBrief.success,
      hasPrompt: prompt !== null,
      hasTechniques: techniqueIds.length > 0,
      hasModel: modelChoice !== null && MODEL_CHOICES.includes(modelChoice as (typeof MODEL_CHOICES)[number]),
    },
    savedLandingId,
  };
}

export async function listGenerationDrafts() {
  const traces = await prisma.generationTrace.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      steps: {
        where: { phase: { in: [...DRAFT_STEP_PHASES] } },
        orderBy: { sequence: "asc" },
      },
      landings: { select: { id: true, title: true } },
    },
  });
  const tracesById = new Map(traces.map((trace) => [trace.id, trace as DraftTraceRecord]));
  return traces
    .map((trace) => normalizeDraft(trace, tracesById))
    .filter((draft): draft is GenerationDraft => draft !== null && draft.savedLandingId === null);
}

export async function getGenerationDraft(id: string) {
  const trace = await prisma.generationTrace.findUnique({
    where: { id },
    include: {
      steps: {
        where: { phase: { in: [...DRAFT_STEP_PHASES] } },
        orderBy: { sequence: "asc" },
      },
      landings: { select: { id: true, title: true } },
    },
  });
  if (!trace) return null;

  const relatedIds = [trace.rootTraceId, trace.sourceTraceId, trace.parentTraceId]
    .filter((relatedId): relatedId is string => Boolean(relatedId) && relatedId !== trace.id);
  const sourcePromptTraceId = record(parseJson(trace.contextJson))?.sourcePromptTraceId;
  if (typeof sourcePromptTraceId === "string" && sourcePromptTraceId !== trace.id) relatedIds.push(sourcePromptTraceId);
  const relatedTraces = relatedIds.length ? await prisma.generationTrace.findMany({
    where: { id: { in: [...new Set(relatedIds)] } },
    include: {
      steps: { where: { phase: { in: [...DRAFT_STEP_PHASES] } }, orderBy: { sequence: "asc" } },
      landings: { select: { id: true, title: true } },
    },
  }) : [];
  const tracesById = new Map([[trace.id, trace as DraftTraceRecord], ...relatedTraces.map((item) => [item.id, item as DraftTraceRecord] as const)]);
  return normalizeDraft(trace, tracesById);
}
