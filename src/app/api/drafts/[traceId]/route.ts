import { NextResponse } from "next/server";
import { z } from "zod";
import { getGenerationDraft } from "@/lib/collection-drafts";

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext<"/api/drafts/[traceId]">) {
  const { traceId } = await context.params;
  if (!z.string().uuid().safeParse(traceId).success) {
    return NextResponse.json({ error: "El identificador de generación no es válido." }, { status: 400 });
  }

  try {
    const draft = await getGenerationDraft(traceId);
    if (!draft) return NextResponse.json({ error: "No encontramos una salida HTML completa para esta generación." }, { status: 404 });
    return NextResponse.json(draft);
  } catch {
    return NextResponse.json({ error: "No se pudo abrir la generación sin guardar." }, { status: 500 });
  }
}
