import type { TechniqueId } from "@/lib/techniques";
import type { Brief, LandingCode } from "@/lib/schemas";

export type PromptResult = {
  id: string;
  brief: Brief;
  techniqueIds: TechniqueId[];
  combined: boolean;
  traceId: string;
  prompt: string;
  status: "loading" | "ready" | "error";
  error?: string;
};

export type ActiveLanding = {
  code: LandingCode;
  brief: Brief;
  techniqueIds: TechniqueId[];
  prompt: string;
  traceId: string;
  imageDataUrl: string | null;
  savedId: string | null;
};
