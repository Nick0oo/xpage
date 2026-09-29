import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordTraceStep } from "@/lib/generation-traces";
import { isLocalRequest } from "@/lib/media/request-guard";

export const runtime = "nodejs";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isLocalRequest(request)) return NextResponse.json({ error: "El editor solo está disponible en este equipo." }, { status: 403 });
  const { id } = await context.params;
  const proposal = await prisma.sectionEditProposal.findUnique({ where: { id }, include: { savedLanding: true } });
  if (!proposal || proposal.status !== "pending") return NextResponse.json({ error: "Esta propuesta ya no está pendiente." }, { status: 409 });
  const update = await prisma.sectionEditProposal.updateMany({ where: { id, status: "pending" }, data: { status: "rejected" } });
  if (update.count !== 1) return NextResponse.json({ error: "Esta propuesta ya no está pendiente." }, { status: 409 });
  await recordTraceStep(proposal.savedLanding.traceId ?? undefined, {
    eventType: "revision", phase: "section-edit-reject", title: `Propuesta descartada · ${proposal.sectionId}`,
    techniqueIds: JSON.parse(proposal.techniqueIdsJson), provider: "eve-local", model: proposal.modelChoice,
    userPrompt: proposal.instruction, output: { proposalId: id, sectionId: proposal.sectionId, reason: "user_discarded" },
    references: [{ kind: "landing", id: proposal.savedLandingId, label: proposal.savedLanding.title }, { kind: "section", id: proposal.sectionId }],
  }).catch(() => undefined);
  return NextResponse.json({ discarded: true });
}
