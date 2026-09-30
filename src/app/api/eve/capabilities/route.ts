import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { techniques, TECHNIQUE_IDS } from "@/lib/techniques";
import { localReferenceCatalog, eveLocalTools, readLocalReference, type OpenDesignReferenceId } from "@/lib/open-design-references";

export const runtime = "nodejs";

const builtInSkills = ["frontend-design", "combine"] as const;
const skillIds = [...TECHNIQUE_IDS, ...builtInSkills];

function metadata(content: string) {
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "Skill XPage";
  const version = heading.match(/v?(\d+\.\d+\.\d+)$/i)?.[1] ?? "versión actual";
  const name = content.match(/^name:\s*(.+)$/m)?.[1]?.trim() ?? heading;
  const description = content.match(/^description:\s*(.+)$/m)?.[1]?.trim() ?? "Procedimiento local cargado por Eve.";
  return { heading, name, version, description };
}

async function readSkill(id: string) {
  if (!skillIds.includes(id as (typeof skillIds)[number])) return null;
  const directory = path.resolve(process.cwd(), "agent", "skills", id);
  const filePath = path.resolve(directory, "SKILL.md");
  if (!filePath.startsWith(directory)) return null;
  const content = await readFile(filePath, "utf8");
  return { id, ...metadata(content), content };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const skillId = url.searchParams.get("skillId");
  const referenceId = url.searchParams.get("referenceId") as OpenDesignReferenceId | null;

  if (skillId) {
    const skill = await readSkill(skillId);
    if (!skill) return NextResponse.json({ error: "La skill no está en el catálogo de Eve." }, { status: 404 });
    return NextResponse.json({ skill });
  }

  if (referenceId) {
    const reference = localReferenceCatalog.find((item) => item.id === referenceId);
    if (!reference) return NextResponse.json({ error: "La referencia no está en el catálogo local." }, { status: 404 });
    const { content } = await readLocalReference(referenceId);
    return NextResponse.json({ reference, content });
  }

  const skills = await Promise.all(skillIds.map(async (id) => {
    const skill = await readSkill(id);
    const technique = techniques.find((entry) => entry.id === id);
    return skill ? {
      id,
      name: technique?.name ?? skill.name,
      heading: skill.heading,
      version: skill.version,
      description: skill.description,
      purpose: technique?.purpose ?? skill.description,
      inputs: technique?.inputs ?? "Plan XPage, sistema elegido, secciones, contenido, slots y límites del brief.",
      artifact: technique?.artifact ?? (id === "combine"
        ? "DesignPlan completo y prompt final listo para construir una landing."
        : "HTML, CSS y JavaScript standalone según el DesignPlan."),
      executable: true,
    } : null;
  }));

  return NextResponse.json({
    skills: skills.filter(Boolean),
    tools: eveLocalTools,
    references: localReferenceCatalog,
    referenceBoundary: "Material de referencia textual local con atribución; no instala ni ejecuta los plugins de OpenDesign.",
    skillLoader: { id: "load_skill", kind: "Eve built-in", status: "available", summary: "Carga una skill XPage seleccionada para ejecutar su procedimiento." },
  });
}
