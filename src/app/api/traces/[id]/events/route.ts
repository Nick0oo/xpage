import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recordTraceStep } from "@/lib/generation-traces";

export const runtime = "nodejs";

const eventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("creative-direction-selection"),
    direction: z.object({
      id: z.string().regex(/^[a-z0-9-]+$/),
      title: z.string().min(1).max(120),
      rationale: z.string().min(1).max(1200),
      structuralDifference: z.array(z.string().min(1).max(300)).min(2).max(5),
    }),
  }),
  z.object({
    type: z.literal("prompt-edit"),
    directionId: z.string().regex(/^[a-z0-9-]+$/),
    prompt: z.string().trim().min(1).max(12_000),
  }),
]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "El identificador de traza no es válido." }, { status: 400 });
  }
  const parsed = eventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "El evento de dirección o edición no es válido." }, { status: 400 });
  }
  const trace = await prisma.generationTrace.findUnique({ where: { id }, select: { id: true } });
  if (!trace) return NextResponse.json({ error: "No encontramos esta trazabilidad." }, { status: 404 });

  if (parsed.data.type === "creative-direction-selection") {
    await recordTraceStep(id, {
      eventType: "decision",
      phase: "creative-direction-selected",
      title: `Dirección elegida · ${parsed.data.direction.title}`,
      outputText: parsed.data.direction.rationale,
      output: parsed.data.direction,
      decisionSummary: `${parsed.data.direction.title}: ${parsed.data.direction.structuralDifference.join("; ")}`,
    });
  } else {
    await recordTraceStep(id, {
      eventType: "revision",
      phase: "creative-prompt-edited",
      title: "Prompt creativo editado",
      outputText: parsed.data.prompt,
      output: { directionId: parsed.data.directionId, prompt: parsed.data.prompt },
      decisionSummary: `Prompt actualizado para la dirección ${parsed.data.directionId}.`,
    });
  }
  return NextResponse.json({ recorded: true });
}
