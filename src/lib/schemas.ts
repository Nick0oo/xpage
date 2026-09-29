import { z } from "zod";
import { TECHNIQUE_IDS } from "@/lib/techniques";
import { MODEL_CHOICES, DEFAULT_MODEL_CHOICE } from "@/lib/model-choice";
import { creativeDirectionSchema } from "@/lib/creative-directions";
import { techniqueContributionSchema } from "@/lib/design-plan";

export const techniqueIdSchema = z.enum(TECHNIQUE_IDS);

export const briefSchema = z.object({
  topic: z.string().trim().min(2, "Cuéntanos el tema o industria.").max(180),
  offer: z
    .string()
    .trim()
    .min(2, "Describe el producto o beneficio.")
    .max(360),
  audience: z
    .string()
    .trim()
    .min(2, "Describe a quién va dirigida.")
    .max(280),
  tone: z.string().trim().min(2, "Indica el tono o dirección visual.").max(180),
  cta: z.string().trim().max(180).optional().default(""),
  brand: z.string().trim().max(180).optional().default(""),
  palette: z.string().trim().max(240).optional().default(""),
  references: z.string().trim().max(1200).optional().default(""),
  avoid: z.string().trim().max(360).optional().default(""),
  objective: z.string().trim().max(240).optional().default(""),
  variety: z.enum(["sutil", "equilibrada", "atrevida"]).default("equilibrada"),
  movement: z.enum(["reducido", "moderado", "dinamico"]).default("moderado"),
  density: z.enum(["aireada", "equilibrada", "densa"]).default("equilibrada"),
});

export const promptRequestSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("technique"),
    brief: briefSchema,
    techniqueId: techniqueIdSchema,
    modelChoice: z.enum(MODEL_CHOICES).default(DEFAULT_MODEL_CHOICE),
    traceId: z.string().uuid().optional(),
  }),
  z.object({
    mode: z.literal("combine"),
    brief: briefSchema,
    techniqueIds: z.array(techniqueIdSchema).min(1).max(TECHNIQUE_IDS.length),
    methodContributions: z.array(techniqueContributionSchema).min(1).max(TECHNIQUE_IDS.length),
    modelChoice: z.enum(MODEL_CHOICES).default(DEFAULT_MODEL_CHOICE),
    traceId: z.string().uuid().optional(),
  }),
  z.object({
    mode: z.literal("directions"),
    brief: briefSchema,
    techniqueIds: z.array(techniqueIdSchema).min(1).max(TECHNIQUE_IDS.length),
    modelChoice: z.enum(MODEL_CHOICES).default(DEFAULT_MODEL_CHOICE),
    traceId: z.string().uuid().optional(),
  }),
]).refine(
  (input) =>
    (input.mode !== "combine" && input.mode !== "directions") ||
    new Set(input.techniqueIds).size === input.techniqueIds.length,
  "No repitas técnicas en la selección.",
);

export const generatedPromptSchema = z.object({
  prompt: z.string().trim().min(1).max(12_000),
});

export const landingCodeSchema = z.object({
  title: z.string().trim().min(1).max(120),
  html: z.string().min(1).max(80_000),
  css: z.string().max(80_000),
  js: z.string().max(40_000),
});

export const landingRequestSchema = z.object({
  prompt: z.string().trim().min(1).max(12_000),
  plannedSectionIds: z.array(z.string().regex(/^[a-z0-9-]{1,80}$/)).max(20).optional(),
  explicitContentRequirements: z.array(z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    statement: z.string().min(1).max(500),
    sectionId: z.string().regex(/^[a-z0-9-]+$/),
    targetCount: z.number().int().positive().max(30).optional(),
    requiredItems: z.array(z.string().trim().min(1).max(500)).max(30),
  }).superRefine((requirement, ctx) => {
    if (requirement.targetCount !== undefined && requirement.requiredItems.length !== requirement.targetCount) {
      ctx.addIssue({ code: "custom", message: "La lista debe coincidir con la cantidad de contenido solicitada.", path: ["requiredItems"] });
    }
  })).max(20).optional(),
  modelChoice: z.enum(MODEL_CHOICES).default("gemini"),
  traceId: z.string().uuid().optional(),
});

export const imageRequestSchema = z.object({
  brief: briefSchema,
  modelChoice: z.enum(MODEL_CHOICES).default(DEFAULT_MODEL_CHOICE),
  traceId: z.string().uuid().optional(),
  destination: z.object({
    savedLandingId: z.string().uuid(),
    sectionId: z.string().regex(/^[a-z0-9-]{1,80}$/),
    slotId: z.string().regex(/^[a-z0-9-]{1,80}$/),
    altText: z.string().trim().max(300).optional(),
  }).optional(),
});

export const traceCreateSchema = z.object({
  category: z.string().trim().min(1).max(60),
  title: z.string().trim().min(1).max(180),
  context: z.record(z.string(), z.unknown()),
  sourceTraceId: z.string().uuid().optional(),
});

export const savedLandingSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(120),
  brief: briefSchema,
  techniqueIds: z.array(techniqueIdSchema).min(1).max(TECHNIQUE_IDS.length),
  prompt: z.string().min(1).max(12_000),
  creativeDirection: creativeDirectionSchema.nullable().optional(),
  sectionRevision: z.number().int().nonnegative().optional(),
  modelChoice: z.enum(MODEL_CHOICES).default(DEFAULT_MODEL_CHOICE),
  html: landingCodeSchema.shape.html,
  css: landingCodeSchema.shape.css,
  js: landingCodeSchema.shape.js,
  traceId: z.string().uuid().nullable().optional(),
  mediaAssets: z.array(z.object({
    id: z.string().uuid(),
    type: z.enum(["image", "video"]),
    sourceType: z.enum(["stock", "generated"]),
    provider: z.string(),
    providerAssetId: z.string(),
    author: z.string(),
    sourceUrl: z.string().url(),
    creditUrl: z.string().url(),
    license: z.string(),
    mimeType: z.string(),
    width: z.number().int().nullable(),
    height: z.number().int().nullable(),
    durationSeconds: z.number().int().nullable(),
    sectionId: z.string(),
    slotId: z.string(),
    altText: z.string(),
    createdAt: z.string().datetime(),
  })).optional(),
  createdAt: z.string().datetime(),
});

export type Brief = z.infer<typeof briefSchema>;
export type PromptRequest = z.infer<typeof promptRequestSchema>;
export type GeneratedPrompt = z.infer<typeof generatedPromptSchema>;
export type LandingCode = z.infer<typeof landingCodeSchema>;
export type SavedLanding = z.infer<typeof savedLandingSchema>;
