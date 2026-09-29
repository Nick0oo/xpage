import type { TechniqueId } from "@/lib/techniques";
import type { Brief, LandingCode } from "@/lib/schemas";
import type { DesignPlan } from "@/lib/design-plan";
import type { ModelChoice } from "@/lib/model-choice";

export type PromptResult = {
  id: string;
  brief: Brief;
  techniqueIds: TechniqueId[];
  combined: boolean;
  traceId: string;
  prompt: string;
  status: "loading" | "ready" | "error";
  error?: string;
  designPlan?: DesignPlan | null;
  generationMode?: "eve-design-plan" | "legacy-prompt";
  modelChoice: ModelChoice;
};

export type ActiveLanding = {
  code: LandingCode;
  brief: Brief;
  techniqueIds: TechniqueId[];
  prompt: string;
  traceId: string;
  imageDataUrl: string | null;
  savedId: string | null;
  modelChoice: ModelChoice;
};
