import { NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteSavedLanding,
  getSavedLanding,
  listSavedLandings,
  saveLandingRecord,
} from "@/lib/landing-repository";
import { savedLandingSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id");

  try {
    const landings = id ? await getSavedLanding(id) : await listSavedLandings();
    return NextResponse.json(landings);
  } catch {
    return NextResponse.json(
      { error: "No se pudo leer la Biblioteca. Reinicia XPage para reintentar." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = savedLandingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Los datos de la landing no son válidos." }, { status: 400 });
  }

  try {
    const landing = await saveLandingRecord(parsed.data);
    return NextResponse.json(landing, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "No se pudo guardar la landing en la base local." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  const parsedId = z.string().uuid().safeParse(id);

  if (!parsedId.success) {
    return NextResponse.json({ error: "El identificador de landing no es válido." }, { status: 400 });
  }

  try {
    const deleted = await deleteSavedLanding(parsedId.data);
    return NextResponse.json({ deleted });
  } catch {
    return NextResponse.json(
      { error: "No se pudo eliminar la landing de la base local." },
      { status: 500 },
    );
  }
}
