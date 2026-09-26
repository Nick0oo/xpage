import { NextResponse } from "next/server";
import { z } from "zod";
import { getGenerationTrace } from "@/lib/generation-traces";

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext<"/api/traces/[id]">) {
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "El identificador no es válido." }, { status: 400 });
  }

  try {
    const trace = await getGenerationTrace(id);
    return trace
      ? NextResponse.json(trace)
      : NextResponse.json({ error: "No encontramos esta trazabilidad." }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "No se pudo abrir la trazabilidad." }, { status: 500 });
  }
}
