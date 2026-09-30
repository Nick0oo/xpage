import { NextResponse } from "next/server";
import { listGenerationDrafts } from "@/lib/collection-drafts";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(await listGenerationDrafts());
  } catch {
    return NextResponse.json({ error: "No se pudieron leer las generaciones sin guardar." }, { status: 500 });
  }
}
