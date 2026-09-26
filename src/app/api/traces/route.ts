import { NextResponse } from "next/server";
import { traceCreateSchema } from "@/lib/schemas";
import { createGenerationTrace, listGenerationTraces } from "@/lib/generation-traces";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await listGenerationTraces());
  } catch {
    return NextResponse.json({ error: "No se pudo leer la trazabilidad." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const parsed = traceCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Los datos de la trazabilidad no son válidos." }, { status: 400 });
  }

  try {
    const trace = await createGenerationTrace(parsed.data);
    return NextResponse.json(trace, { status: 201 });
  } catch {
    return NextResponse.json({ error: "No se pudo iniciar el registro de trazabilidad." }, { status: 500 });
  }
}
