import type { TechniqueId } from "@/lib/techniques";
import type { Brief, LandingCode } from "@/lib/schemas";
import type { DesignPlan } from "@/lib/design-plan";
import type { ModelChoice } from "@/lib/model-choice";
import type { CreativeDirection } from "@/lib/creative-directions";
import type { MediaAssetRecord } from "@/lib/media/types";
import type { TechniqueContribution } from "@/lib/design-plan";

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
  creativeDirection?: CreativeDirection;
  methodContributions?: TechniqueContribution[];
  lastTracedPrompt?: string;
};

export type TechniqueRun = {
  id: string;
  techniqueId: TechniqueId;
  traceId: string;
  modelChoice: ModelChoice;
  status: "queued" | "loading" | "ready" | "error";
  contribution: TechniqueContribution | null;
  error?: string;
};

export type ActiveLanding = {
  code: LandingCode;
  brief: Brief;
  techniqueIds: TechniqueId[];
  prompt: string;
  traceId: string;
  savedId: string | null;
  modelChoice: ModelChoice;
  designPlan: DesignPlan | null;
  mediaAssets: MediaAssetRecord[];
  creativeDirection?: CreativeDirection | null;
};
