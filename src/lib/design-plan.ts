import { z } from "zod";
import { techniqueIdSchema } from "@/lib/schemas";
import { TECHNIQUE_IDS } from "@/lib/techniques";

export const mediaSlotSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  type: z.enum(["image", "video"]),
  purpose: z.string().min(1),
  subject: z.string().min(1),
  framing: z.string().min(1),
  lightingOrMotion: z.string().min(1),
  aspectRatio: z.string().min(1),
  altText: z.string().min(1),
  poster: z.string().optional(),
  reducedMotion: z.string().optional(),
});

export const landingSectionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  role: z.string().min(1),
  purpose: z.string().min(1),
  headline: z.string().min(1),
  copy: z.string().min(1),
  cta: z.string().optional(),
  mediaSlotIds: z.array(z.string()),
});

export const techniqueContributionSchema = z.object({
  techniqueId: techniqueIdSchema,
  skillVersion: z.string().min(1),
  status: z.enum(["applied", "modified", "omitted"]),
  decision: z.string().min(1),
  artifact: z.string().min(1),
  reason: z.string().optional(),
  tensions: z.array(z.string()),
  resolution: z.string().optional(),
});

export const designPlanSchema = z.object({
  schemaVersion: z.literal("1.0.0"),
  concept: z.string().min(1),
  creativeSettings: z.object({
    objective: z.string(),
    variety: z.enum(["sutil", "equilibrada", "atrevida"]),
    movement: z.enum(["reducido", "moderado", "dinamico"]),
    density: z.enum(["aireada", "equilibrada", "densa"]),
    referenceTreatment: z.string(),
  }).optional(),
  creativeDirection: z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(1),
    rationale: z.string().min(1),
    structuralDifference: z.array(z.string().min(1)).min(2),
  }).optional(),
  designDNA: z.object({
    brandMotif: z.string().min(1),
    palette: z.array(z.object({ role: z.string().min(1), value: z.string().min(1) })).min(2),
    typography: z.string().min(1),
    composition: z.string().min(1),
    invariants: z.array(z.string()),
  }),
  audienceHypotheses: z.array(z.object({ motivation: z.string(), objection: z.string() })),
  sections: z.array(landingSectionSchema).min(1),
  mediaSlots: z.array(mediaSlotSchema),
  contributions: z.array(techniqueContributionSchema).min(1),
  claims: z.array(z.object({ text: z.string(), status: z.enum(["brief-backed", "hypothesis", "unsupported"]), source: z.string() })),
  discardedElements: z.array(z.object({ element: z.string(), reason: z.string() })),
  negativeConstraints: z.array(z.string()),
  voice: z.string().min(1),
  copyRevisions: z.array(z.object({ before: z.string(), after: z.string(), reason: z.string() })),
  creatorCritic: z.object({ proposal: z.string(), findings: z.array(z.string()), revision: z.string() }).optional(),
  prompt: z.string().min(1).max(12_000),
}).superRefine((plan, ctx) => {
  const ids = new Set(plan.sections.map((section) => section.id));
  if (ids.size !== plan.sections.length) ctx.addIssue({ code: "custom", message: "Los IDs de sección deben ser únicos.", path: ["sections"] });
  const contributionIds = new Set(plan.contributions.map((item) => item.techniqueId));
  if (contributionIds.size !== plan.contributions.length) ctx.addIssue({ code: "custom", message: "Cada técnica debe tener una sola contribución.", path: ["contributions"] });
  for (const contribution of plan.contributions) {
    if (contribution.status === "omitted" && !contribution.reason) ctx.addIssue({ code: "custom", message: "Una técnica omitida requiere razón.", path: ["contributions"] });
  }
});

export type DesignPlan = z.infer<typeof designPlanSchema>;
export type TechniqueContribution = z.infer<typeof techniqueContributionSchema>;
export type LandingSection = z.infer<typeof landingSectionSchema>;
export type MediaSlot = z.infer<typeof mediaSlotSchema>;

export function validateTechniqueCoverage(plan: DesignPlan, selectedIds: readonly string[]) {
  const selected = new Set(selectedIds);
  const covered = new Set(plan.contributions.map(({ techniqueId }) => techniqueId));
  return TECHNIQUE_IDS.every((id) => !selected.has(id) || covered.has(id)) &&
    plan.contributions.every(({ techniqueId }) => selected.has(techniqueId));
}
