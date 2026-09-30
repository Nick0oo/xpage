import { z } from "zod";
import { MODEL_CHOICES, DEFAULT_MODEL_CHOICE } from "@/lib/model-choice";
import { techniqueIdSchema } from "@/lib/schemas";
import { TECHNIQUE_IDS } from "@/lib/techniques";

export const sectionPatchSchema = z.object({
  sectionId: z.string().regex(/^[a-z0-9-]{1,80}$/),
  html: z.string().min(1).max(24_000),
  css: z.string().max(24_000),
  summary: z.string().trim().min(1).max(600),
  warnings: z.array(z.string().trim().min(1).max(240)).max(8),
});

export const sectionEditProposalRequestSchema = z.object({
  savedLandingId: z.string().uuid(),
  sectionId: z.string().regex(/^[a-z0-9-]{1,80}$/),
  baseRevision: z.number().int().nonnegative(),
  instruction: z.string().trim().min(4).max(1200),
  techniqueIds: z.array(techniqueIdSchema).min(1).max(TECHNIQUE_IDS.length),
  modelChoice: z.enum(MODEL_CHOICES).default(DEFAULT_MODEL_CHOICE),
}).refine((input) => new Set(input.techniqueIds).size === input.techniqueIds.length, "No repitas técnicas en la selección.");

export const codeEditProposalRequestSchema = z.object({
  savedLandingId: z.string().uuid(),
  baseRevision: z.number().int().nonnegative(),
  html: z.string().min(1).max(80_000),
  css: z.string().max(80_000),
  js: z.string().max(40_000),
  summary: z.string().trim().min(4).max(600),
  modelChoice: z.enum(MODEL_CHOICES).optional(),
  techniqueIds: z.array(techniqueIdSchema).max(TECHNIQUE_IDS.length).optional(),
});

export const sectionEditApplySchema = z.object({
  proposalId: z.string().uuid(),
});

export const sectionEditUndoSchema = z.object({
  savedLandingId: z.string().uuid(),
  baseRevision: z.number().int().nonnegative(),
  targetRevisionId: z.string().uuid(),
});

export type SectionPatch = z.infer<typeof sectionPatchSchema>;
