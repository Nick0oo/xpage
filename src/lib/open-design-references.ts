import { readFile } from "node:fs/promises";
import path from "node:path";

export const openDesignReferences = [
  { id: "frontend-design", title: "Frontend design", sourcePath: "skills/frontend-design/SKILL.md", fileName: "frontend-design.md", use: "Dirección visual específica, tipografía, imágenes, ritmo y acabado.", sourceUrl: "https://github.com/nexu-io/open-design/blob/5b19dfa4351b3eed33826ee72746a7c653c23a54/skills/frontend-design/SKILL.md", license: "Apache-2.0; la fuente conserva atribución a Anthropic.", sourceKind: "skill source" },
  { id: "web-prototype-skill", title: "Web prototype workflow", sourcePath: "plugins/_official/examples/web-prototype/SKILL.md", fileName: "web-prototype-skill.md", use: "Flujo de composición de prototipo web; se adapta al HTML local de XPage.", sourceUrl: "https://github.com/nexu-io/open-design/blob/5b19dfa4351b3eed33826ee72746a7c653c23a54/plugins/_official/examples/web-prototype/SKILL.md", license: "Apache-2.0", sourceKind: "example plugin skill reference" },
  { id: "web-prototype-layouts", title: "Web prototype layouts", sourcePath: "plugins/_official/examples/web-prototype/references/layouts.md", fileName: "web-prototype-layouts.md", use: "Patrones y secuencias compositivas por sección.", sourceUrl: "https://github.com/nexu-io/open-design/blob/5b19dfa4351b3eed33826ee72746a7c653c23a54/plugins/_official/examples/web-prototype/references/layouts.md", license: "Apache-2.0", sourceKind: "example plugin reference" },
  { id: "web-prototype-checklist", title: "Web prototype checklist", sourcePath: "plugins/_official/examples/web-prototype/references/checklist.md", fileName: "web-prototype-checklist.md", use: "Revisión de contenido, ritmo, CTA, responsive y elementos de relleno.", sourceUrl: "https://github.com/nexu-io/open-design/blob/5b19dfa4351b3eed33826ee72746a7c653c23a54/plugins/_official/examples/web-prototype/references/checklist.md", license: "Apache-2.0", sourceKind: "example plugin reference" },
  { id: "totality-festival-design", title: "Totality Festival · design system", sourcePath: "design-systems/totality-festival/DESIGN.md", fileName: "totality-festival-design.md", use: "Ejemplo de un sistema expresivo cohesivo; solo si el contexto lo justifica.", sourceUrl: "https://github.com/nexu-io/open-design/blob/5b19dfa4351b3eed33826ee72746a7c653c23a54/design-systems/totality-festival/DESIGN.md", license: "Apache-2.0", sourceKind: "design system reference" },
  { id: "totality-festival-usage", title: "Totality Festival · usage", sourcePath: "design-systems/totality-festival/USAGE.md", fileName: "totality-festival-usage.md", use: "Notas de uso asociadas al ejemplo Totality.", sourceUrl: "https://github.com/nexu-io/open-design/blob/5b19dfa4351b3eed33826ee72746a7c653c23a54/design-systems/totality-festival/USAGE.md", license: "Apache-2.0", sourceKind: "design system reference" },
  { id: "system-prompt-excerpts", title: "System prompt excerpts", sourcePath: "apps/daemon/src/prompts/core-slim.ts + official-system.ts", fileName: "system-prompt-excerpts.md", use: "Extractos atribuidos sobre ajuste al objetivo, oficio y evitar relleno.", sourceUrl: "https://github.com/nexu-io/open-design/tree/5b19dfa4351b3eed33826ee72746a7c653c23a54/apps/daemon/src/prompts", license: "Apache-2.0", sourceKind: "attributed excerpts" },
  { id: "xpage-adaptation", title: "XPage adaptation notes", sourcePath: "XPage-authored adaptation notes based on the included bundle", fileName: "XPAGE-ADAPTATION.md", use: "Límites de atribución y adaptación local al contrato de XPage.", sourceUrl: "", license: "XPage-authored", sourceKind: "local adaptation" },
] as const;

export const localReferenceCatalog = [
  ...openDesignReferences,
  { id: "string-seed-of-thought", title: "String Seed of Thought · XPage research note", sourcePath: "agent/skills/seed-strings/REFERENCE.md", fileName: "REFERENCE.md", use: "Alcance experimental de la inspiración de prompting usada por seed-strings y límites de la adaptación.", sourceUrl: "", license: "XPage-authored research note", sourceKind: "local research note" },
] as const;

export const OPEN_DESIGN_REFERENCE_IDS = openDesignReferences.map(({ id }) => id) as readonly (typeof openDesignReferences)[number]["id"][];
export type OpenDesignReferenceId = (typeof openDesignReferences)[number]["id"] | "string-seed-of-thought";

const referenceDirectory = path.resolve(process.cwd(), "agent", "skills", "seed-strings", "references", "open-design");

export async function readLocalReference(reference: OpenDesignReferenceId) {
  const fileName = localReferenceCatalog.find((entry) => entry.id === reference)?.fileName;
  if (!fileName) throw new Error("Referencia local fuera del catálogo.");
  const filePath = reference === "string-seed-of-thought"
    ? path.resolve(process.cwd(), "agent", "skills", "seed-strings", fileName)
    : path.resolve(referenceDirectory, fileName);
  if (!filePath.startsWith(reference === "string-seed-of-thought" ? path.resolve(process.cwd(), "agent", "skills", "seed-strings") : referenceDirectory)) {
    throw new Error("La ruta solicitada queda fuera del catálogo local.");
  }
  const content = await readFile(filePath, "utf8");
  if (content.length > 20_000) throw new Error(`La referencia ${reference} supera el límite de lectura local.`);
  return { reference, content };
}

export const eveLocalTools = [
  { id: "read_seed_reference", title: "Leer referencias locales", kind: "Eve tool", status: "available", summary: "Lee solo los documentos enumerados del bundle local y con atribución de OpenDesign." },
  { id: "generate_image", title: "Generar imagen", kind: "Eve tool", status: "configured by provider", summary: "Usa el proveedor de imagen que configura XPage; no sustituye la búsqueda/selección de medios de landing." },
  { id: "confirmar_prueba_local", title: "Confirmar prueba local", kind: "Eve tool", status: "available", summary: "Acción local dedicada a la habilidad prueba-local." },
] as const;
