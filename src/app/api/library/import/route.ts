import { NextResponse } from "next/server";
import { z } from "zod";
import { importLandingRecords } from "@/lib/landing-repository";
import { savedLandingSchema } from "@/lib/schemas";

export const runtime = "nodejs";

const importSchema = z.object({
  landings: z.array(savedLandingSchema),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = importSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "La Biblioteca antigua no tiene un formato válido." }, { status: 400 });
  }

  try {
    const imported = await importLandingRecords(parsed.data.landings);
    return NextResponse.json({ imported });
  } catch {
    return NextResponse.json(
      { error: "No se pudieron importar las landings anteriores." },
      { status: 500 },
    );
  }
}
