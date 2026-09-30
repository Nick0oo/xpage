import { readFile } from "node:fs/promises";
import path from "node:path";
import { defineTool } from "eve/tools";
import { z } from "zod";

const referenceFiles = {
  "frontend-design": "frontend-design.md",
  "web-prototype-skill": "web-prototype-skill.md",
  "web-prototype-layouts": "web-prototype-layouts.md",
  "web-prototype-checklist": "web-prototype-checklist.md",
  "totality-festival-design": "totality-festival-design.md",
  "totality-festival-usage": "totality-festival-usage.md",
  "system-prompt-excerpts": "system-prompt-excerpts.md",
  "xpage-adaptation": "XPAGE-ADAPTATION.md",
  "string-seed-of-thought": "REFERENCE.md",
} as const;

export default defineTool({
  description: "Lee una referencia local fijada y con licencia que documenta inspiración de diseño para la skill seed-strings. Solo admite nombres de archivo enumerados; no lee rutas proporcionadas por el usuario.",
  inputSchema: z.object({
    references: z.array(z.enum(Object.keys(referenceFiles) as [keyof typeof referenceFiles, ...(keyof typeof referenceFiles)[]])).min(1).max(5),
  }),
  outputSchema: z.object({ items: z.array(z.object({ reference: z.string(), content: z.string() })) }),
  label: {
    start: () => "Leyendo referencia de diseño local",
    complete: () => "Referencia de diseño lista",
  },
  async execute({ references }) {
    const skillDirectory = path.resolve(process.cwd(), "agent", "skills", "seed-strings");
    const items = await Promise.all(references.map(async (reference) => {
      const fileName = referenceFiles[reference];
      const filePath = reference === "string-seed-of-thought"
        ? path.join(skillDirectory, fileName)
        : path.join(skillDirectory, "references", "open-design", fileName);
      let content: string;
      try {
        content = await readFile(filePath, "utf8");
      } catch (error) {
        const detail = error instanceof Error ? error.message : "error desconocido";
        throw new Error(`No se pudo leer la referencia ${reference} en ${filePath}: ${detail}`);
      }
      if (content.length > 20_000) throw new Error(`La referencia ${reference} supera el límite de lectura local.`);
      return { reference, content };
    }));
    if (items.reduce((length, item) => length + item.content.length, 0) > 40_000) {
      throw new Error("El conjunto de referencias supera el límite de lectura local.");
    }
    return { items };
  },
});
