import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { recordTraceStep } from "@/lib/generation-traces";
import { techniqueIdSchema } from "@/lib/schemas";

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
  z.object({
    type: z.literal("html-export"),
    landingId: z.string().uuid().optional(),
    filename: z.string().trim().min(1).max(180),
  }),
  z.object({
    type: z.literal("method-contribution-edit"),
    techniqueId: techniqueIdSchema,
    decision: z.string().trim().min(1).max(1200),
    artifact: z.string().trim().min(1).max(3000),
  }),
  z.object({
    type: z.literal("final-prompt-edit"),
    techniqueIds: z.array(techniqueIdSchema).min(1).max(8),
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
    return NextResponse.json({ error: "El evento de dirección, edición o exportación no es válido." }, { status: 400 });
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
  } else if (parsed.data.type === "prompt-edit") {
    await recordTraceStep(id, {
      eventType: "revision",
      phase: "creative-prompt-edited",
      title: "Prompt creativo editado",
      outputText: parsed.data.prompt,
      output: { directionId: parsed.data.directionId, prompt: parsed.data.prompt },
      decisionSummary: `Prompt actualizado para la dirección ${parsed.data.directionId}.`,
    });
  } else if (parsed.data.type === "method-contribution-edit") {
    await recordTraceStep(id, {
      eventType: "revision",
      phase: "technique-contribution-edited",
      title: `Aporte revisado · ${parsed.data.techniqueId}`,
      output: { techniqueId: parsed.data.techniqueId, decision: parsed.data.decision, artifact: parsed.data.artifact },
      decisionSummary: `Aporte de ${parsed.data.techniqueId} editado por el usuario.`,
      references: [{ kind: "source", id: `technique:${parsed.data.techniqueId}` }],
    });
  } else if (parsed.data.type === "final-prompt-edit") {
    await recordTraceStep(id, {
      eventType: "revision",
      phase: "combined-prompt-edited",
      title: "Prompt final revisado",
      techniqueIds: parsed.data.techniqueIds,
      outputText: parsed.data.prompt,
      output: { techniqueIds: parsed.data.techniqueIds, prompt: parsed.data.prompt },
      decisionSummary: "Prompt final actualizado por el usuario antes de construir la landing.",
      references: parsed.data.techniqueIds.map((techniqueId) => ({ kind: "source" as const, id: `technique:${techniqueId}` })),
    });
  } else {
    await recordTraceStep(id, {
      eventType: "export",
      phase: "html-export",
      title: "HTML de landing exportado",
      output: { filename: parsed.data.filename },
      references: parsed.data.landingId ? [{ kind: "landing", id: parsed.data.landingId }] : [],
    });
  }
  return NextResponse.json({ recorded: true });
}
