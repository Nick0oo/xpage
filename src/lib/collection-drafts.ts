import { briefSchema, type Brief } from "@/lib/schemas";
import { MODEL_CHOICES } from "@/lib/model-choice";
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

function normalizeDraft(trace: {
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
    outputJson: string | null;
    outputText: string | null;
    userPrompt: string | null;
    model: string | null;
    techniqueIdsJson: string | null;
    status: string;
  }>;
  landings: Array<{ id: string; title: string }>;
}): GenerationDraft | null {
  const context = record(parseJson(trace.contextJson)) ?? {};
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
  const modelChoice = stringValue(context.modelChoice) ?? stringValue(step.model);
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
        where: { phase: "landing-generation" },
        orderBy: { sequence: "asc" },
      },
      landings: { select: { id: true, title: true } },
    },
  });
  return traces
    .map(normalizeDraft)
    .filter((draft): draft is GenerationDraft => draft !== null && draft.savedLandingId === null);
}

export async function getGenerationDraft(id: string) {
  const trace = await prisma.generationTrace.findUnique({
    where: { id },
    include: {
      steps: {
        where: { phase: "landing-generation" },
        orderBy: { sequence: "asc" },
      },
      landings: { select: { id: true, title: true } },
    },
  });
  return trace ? normalizeDraft(trace) : null;
}
