import { NextResponse } from "next/server";
import { z } from "zod";
import { runEveStructured } from "@/lib/eve-runtime";
import { isLocalRequest } from "@/lib/media/request-guard";
import { getTechnique } from "@/lib/techniques";
import { applySectionFragment, extractSection, getSectionCode, relevantCss, validateScopedCss } from "@/lib/section-edits/document";
import { sectionPatchSchema } from "@/lib/section-edits/schemas";
import { briefSchema, landingCodeSchema, techniqueIdSchema } from "@/lib/schemas";
import { MODEL_CHOICES } from "@/lib/model-choice";

export const runtime = "nodejs";
export const maxDuration = 300;

const requestSchema = z.object({
  code: landingCodeSchema,
  brief: briefSchema,
  sectionId: z.string().regex(/^[a-z0-9-]{1,80}$/),
  instruction: z.string().trim().min(4).max(1200),
  techniqueIds: z.array(techniqueIdSchema).min(1).max(20),
  modelChoice: z.enum(MODEL_CHOICES),
});

export async function POST(request: Request) {
  if (!isLocalRequest(request)) return NextResponse.json({ error: "El editor solo está disponible en este equipo." }, { status: 403 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisa la sección y las instrucciones seleccionadas." }, { status: 400 });
  const input = parsed.data;
  let target: ReturnType<typeof extractSection>;
  try {
    target = extractSection(input.code.html, input.sectionId);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "La sección no se puede editar." }, { status: 409 });
  }
  try {
    const techniques = input.techniqueIds.map((id) => {
      const technique = getTechnique(id);
      return `- ${technique.name}: ${technique.purpose} Aporte: ${technique.artifact} Instrucción: ${technique.instruction}`;
    }).join("\n");
    const cssContext = relevantCss(input.code.css, input.sectionId, target.html);
    const message = `Edita solo la sección indicada de esta landing. Devuelve SectionPatch con sectionId, html (contenido interior, sin wrapper section), css, summary y warnings. Conserva literalmente medios y data-xpage-slot. No cambies otras secciones ni JavaScript. HTML semántico, responsive, accesible y claims respaldados por brief. No agregues script/style/iframe ni manejadores HTML. CSS con selectores que comiencen por [data-xpage-section="${input.sectionId}"], sin URLs ni reglas globales.\n\nBRIEF:\n${JSON.stringify(input.brief)}\n\nTÉCNICAS:\n${techniques}\n\nINSTRUCCIÓN:\n${input.instruction}\n\nHTML actual:\n${target.innerHtml}\n\nCSS relacionado:\n${cssContext}`;
    const result = await runEveStructured({ modelChoice: input.modelChoice, message, outputSchema: sectionPatchSchema });
    const patch = sectionPatchSchema.parse(result.data);
    if (patch.sectionId !== input.sectionId) throw new Error("Eve respondió para otra sección.");
    const css = validateScopedCss(patch.css, input.sectionId);
    const html = getSectionCode(input.code.html, input.sectionId, patch.html);
    const fullHtml = applySectionFragment(input.code.html, input.sectionId, patch.html, target.slotIds, target.mediaMarkup);
    return NextResponse.json({
      proposalId: "preview-only",
      baseRevision: 0,
      beforeHtml: target.html,
      afterHtml: html,
      fullHtml,
      css,
      nextCss: [input.code.css, css].filter(Boolean).join("\n"),
      patch,
    });
  } catch (error) {
    return NextResponse.json({ error: `Eve no pudo proponer este cambio. ${error instanceof Error ? error.message : "Inténtalo de nuevo."}` }, { status: 503 });
  }
}
