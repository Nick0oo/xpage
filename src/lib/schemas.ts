import { z } from "zod";
import { TECHNIQUE_IDS } from "@/lib/techniques";

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
});

export const promptRequestSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("technique"),
    brief: briefSchema,
    techniqueId: techniqueIdSchema,
    traceId: z.string().uuid().optional(),
  }),
  z.object({
    mode: z.literal("combine"),
    brief: briefSchema,
    techniqueIds: z.array(techniqueIdSchema).min(2).max(TECHNIQUE_IDS.length),
    traceId: z.string().uuid().optional(),
  }),
]).refine(
  (input) =>
    input.mode !== "combine" ||
    new Set(input.techniqueIds).size === input.techniqueIds.length,
  "No repitas técnicas en la combinación.",
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
  traceId: z.string().uuid().optional(),
});

export const imageRequestSchema = z.object({
  brief: briefSchema,
  traceId: z.string().uuid().optional(),
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
  html: landingCodeSchema.shape.html,
  css: landingCodeSchema.shape.css,
  js: landingCodeSchema.shape.js,
  traceId: z.string().uuid().nullable().optional(),
  createdAt: z.string().datetime(),
});

export type Brief = z.infer<typeof briefSchema>;
export type PromptRequest = z.infer<typeof promptRequestSchema>;
export type GeneratedPrompt = z.infer<typeof generatedPromptSchema>;
export type LandingCode = z.infer<typeof landingCodeSchema>;
export type SavedLanding = z.infer<typeof savedLandingSchema>;
