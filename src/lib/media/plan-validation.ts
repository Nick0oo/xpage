import { designPlanSchema } from "@/lib/design-plan";
import { prisma } from "@/lib/prisma";

export async function validateMediaDestination(input: { savedLandingId: string; sectionId: string; slotId: string; type: "image" | "video" }) {
  const landing = await prisma.savedLanding.findUnique({ where: { id: input.savedLandingId }, select: { traceId: true } });
  if (!landing?.traceId) return false;
  const trace = await prisma.generationTrace.findUnique({ where: { id: landing.traceId }, select: { contextJson: true } });
  if (!trace) return false;
  try {
    const context: unknown = JSON.parse(trace.contextJson);
    if (!context || typeof context !== "object" || !("designPlan" in context)) return false;
    const parsed = designPlanSchema.safeParse(context.designPlan);
    if (!parsed.success) return false;
    const slot = parsed.data.mediaSlots.find((mediaSlot) => mediaSlot.id === input.slotId && mediaSlot.type === input.type);
    const section = parsed.data.sections.find((landingSection) => landingSection.id === input.sectionId);
    return Boolean(slot && section?.mediaSlotIds.includes(slot.id));
  } catch {
    return false;
  }
}
