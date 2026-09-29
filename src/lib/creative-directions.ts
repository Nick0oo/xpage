import { z } from "zod";
import { designPlanSchema } from "@/lib/design-plan";

export const creativeDirectionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  concept: z.string().min(1),
  firstScreen: z.string().min(1),
  narrative: z.string().min(1),
  palette: z.string().min(1),
  typography: z.string().min(1),
  motif: z.string().min(1),
  mediaUse: z.string().min(1),
  rationale: z.string().min(1),
  structuralDifference: z.array(z.string().min(1)).min(2),
  designPlan: designPlanSchema,
});

export const creativeDirectionsResponseSchema = z.object({
  directions: z.array(creativeDirectionSchema).min(2).max(3),
});

export type CreativeDirection = z.infer<typeof creativeDirectionSchema>;
