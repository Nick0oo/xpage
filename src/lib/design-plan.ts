import { z } from "zod";
import { TECHNIQUE_IDS } from "@/lib/techniques";

const techniqueIdSchema = z.enum(TECHNIQUE_IDS);

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

export const explicitContentRequirementSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  statement: z.string().min(1),
  sectionId: z.string().regex(/^[a-z0-9-]+$/),
  targetCount: z.number().int().positive().max(30).optional(),
  requiredItems: z.array(z.string().trim().min(1)).max(30),
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
  designSystem: z.object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(1),
    rationale: z.string().min(1),
    compositionRecipeIds: z.array(z.string().regex(/^[a-z0-9-]+$/)).min(1),
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
  explicitContentRequirements: z.array(explicitContentRequirementSchema).max(20).default([]),
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
  const requirementIds = new Set(plan.explicitContentRequirements.map(({ id }) => id));
  if (requirementIds.size !== plan.explicitContentRequirements.length) ctx.addIssue({ code: "custom", message: "Los requisitos de contenido deben tener IDs únicos.", path: ["explicitContentRequirements"] });
  for (const requirement of plan.explicitContentRequirements) {
    if (!ids.has(requirement.sectionId)) ctx.addIssue({ code: "custom", message: "Cada requisito debe apuntar a una sección existente.", path: ["explicitContentRequirements"] });
    if (requirement.targetCount !== undefined && requirement.requiredItems.length !== requirement.targetCount) ctx.addIssue({ code: "custom", message: "El inventario de contenido debe coincidir con la cantidad pedida.", path: ["explicitContentRequirements"] });
    const items = new Set(requirement.requiredItems.map((item) => item.trim().toLocaleLowerCase()));
    if (items.size !== requirement.requiredItems.length) ctx.addIssue({ code: "custom", message: "Los elementos requeridos deben ser únicos.", path: ["explicitContentRequirements"] });
  }
});

export type DesignPlan = z.infer<typeof designPlanSchema>;
export type TechniqueContribution = z.infer<typeof techniqueContributionSchema>;
export type LandingSection = z.infer<typeof landingSectionSchema>;
export type ExplicitContentRequirement = z.infer<typeof explicitContentRequirementSchema>;
export type MediaSlot = z.infer<typeof mediaSlotSchema>;

const spanishCounts: Record<string, number> = {
  uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
  seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
};
const enumerableNounPattern = "trabalenguas?|ejercicios?|recetas?|pasos?|preguntas?|ejemplos?|ideas?|frases?|actividades?|consejos?|historias?|poemas?|adivinanzas?|juegos?|retos?";

/** Extract a concrete enumerable deliverable from the offer as a deterministic floor. */
export function requestedEnumerableContent(offer: string) {
  const match = offer.match(new RegExp(`\\b(?:hasta\\s+)?(\\d{1,2}|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\\s+(${enumerableNounPattern})\\b`, "iu"));
  if (!match) return null;
  const count = /^\d+$/.test(match[1]) ? Number(match[1]) : spanishCounts[match[1].toLocaleLowerCase("es")];
  if (!count || count > 30) return null;
  return { count, noun: match[2].toLocaleLowerCase("es") };
}

/** Plans must turn a numeric promise in the brief into the complete visible inventory. */
export function enumerableContentFindings(plan: DesignPlan, offer: string) {
  const requested = requestedEnumerableContent(offer);
  if (!requested) return [];
  const matching = plan.explicitContentRequirements.filter((item) => {
    return item.statement.toLocaleLowerCase("es").includes(requested.noun);
  });
  const total = matching.reduce((sum, item) => sum + item.requiredItems.length, 0);
  const findings: string[] = [];
  if (total !== requested.count || matching.length !== 1 || matching[0]?.targetCount !== requested.count) {
    findings.push(`El brief ofrece ${requested.count} ${requested.noun}; el plan debe contener una lista con targetCount ${requested.count} y exactamente ${requested.count} piezas originales completas (actualmente ${total}).`);
  }
  const requirement = matching.length === 1 ? matching[0] : undefined;
  const section = requirement ? plan.sections.find(({ id }) => id === requirement.sectionId) : undefined;
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
  const missingFromCopy = requirement?.requiredItems.filter((item) => !normalize(section?.copy ?? "").includes(normalize(item))) ?? [];
  const missingFromPrompt = requirement?.requiredItems.filter((item) => !normalize(plan.prompt).includes(normalize(item))) ?? [];
  if (missingFromCopy.length) findings.push(`${missingFromCopy.length} piezas no aparecen completas en el copy de la sección asignada.`);
  if (missingFromPrompt.length) findings.push(`${missingFromPrompt.length} piezas no aparecen completas en el prompt editable.`);
  return findings;
}

export function validateTechniqueCoverage(plan: DesignPlan, selectedIds: readonly string[]) {
  const selected = new Set(selectedIds);
  const covered = new Set(plan.contributions.map(({ techniqueId }) => techniqueId));
  return TECHNIQUE_IDS.every((id) => !selected.has(id) || covered.has(id)) &&
    plan.contributions.every(({ techniqueId }) => selected.has(techniqueId));
}
