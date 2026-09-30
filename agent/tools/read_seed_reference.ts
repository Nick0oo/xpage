import { OPEN_DESIGN_REFERENCE_IDS, readLocalReference, type OpenDesignReferenceId } from "@/lib/open-design-references";
import { defineTool } from "eve/tools";
import { z } from "zod";

const referenceIds = [...OPEN_DESIGN_REFERENCE_IDS, "string-seed-of-thought"] as [OpenDesignReferenceId, ...OpenDesignReferenceId[]];

export default defineTool({
  description: "Lee referencias locales fijadas y atribuidas de OpenDesign para las skills de XPage. Devuelve solo documentos del catálogo allowlist; no importa plugins ni lee rutas proporcionadas por el usuario.",
  inputSchema: z.object({
    references: z.array(z.enum(referenceIds)).min(1).max(7),
  }),
  outputSchema: z.object({ items: z.array(z.object({ reference: z.string(), content: z.string() })) }),
  label: { start: () => "Leyendo referencia local atribuida", complete: () => "Referencia lista" },
  async execute({ references }) {
    const items = await Promise.all(references.map((reference) => readLocalReference(reference)));
    if (items.reduce((length, item) => length + item.content.length, 0) > 40_000) {
      throw new Error("El conjunto de referencias supera el límite de lectura local.");
    }
    return { items };
  },
});
