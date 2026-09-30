import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { runEveStructured } from "@/lib/eve-runtime";
import { briefSchema, landingCodeSchema, techniqueIdSchema } from "@/lib/schemas";
import { recordProviderAttempts, recordTraceStep } from "@/lib/generation-traces";
import { MODEL_CHOICES } from "@/lib/model-choice";
import { isLocalRequest } from "@/lib/media/request-guard";
import { applySectionFragment, insertSectionAfter, getEditableSections, extractSection, relevantCss, validateScopedCss } from "@/lib/section-edits/document";
import { sectionPatchSchema } from "@/lib/section-edits/schemas";
import { getTechnique } from "@/lib/techniques";

export const runtime = "nodejs";
export const maxDuration = 300;

const requestSchema = z.object({
  code: landingCodeSchema,
  brief: briefSchema,
  afterSectionId: z.string().regex(/^[a-z0-9-]{1,80}$/).optional(),
  instruction: z.string().trim().min(4).max(1200),
  techniqueIds: z.array(techniqueIdSchema).min(1).max(20),
  modelChoice: z.enum(MODEL_CHOICES),
  traceId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  if (!isLocalRequest(request)) return NextResponse.json({ error: "El editor solo está disponible en este equipo." }, { status: 403 });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisa la instrucción, el brief y las técnicas seleccionadas." }, { status: 400 });
  const input = parsed.data;
  const sections = getEditableSections(input.code.html);
  if (input.afterSectionId && !sections.some((section) => section.id === input.afterSectionId && section.editable)) return NextResponse.json({ error: "La sección de referencia no es editable." }, { status: 409 });
  const sectionId = `section-${randomUUID().slice(0, 8)}`;
  const techniques = input.techniqueIds.map((id) => {
    const technique = getTechnique(id);
    return `- ${technique.name}: propósito ${technique.purpose}; aporte ${technique.artifact}; instrucción ${technique.instruction}`;
  }).join("\n");
  const contextSection = (input.afterSectionId ? sections.find((section) => section.id === input.afterSectionId && section.editable) : undefined) ?? sections.find((section) => section.editable);
  const neighborHtml = contextSection ? extractSection(input.code.html, contextSection.id).html.slice(0, 12_000) : "Sin sección vecina.";
  const visualCss = contextSection ? relevantCss(input.code.css, contextSection.id, neighborHtml).slice(0, 10_000) : input.code.css.slice(0, 10_000);
  const rootTokens = input.code.css.match(/:root\s*\{[^}]{1,6000}\}/)?.[0] ?? "";
  const message = `Diseña una sección nueva para esta landing. Devuelve exclusivamente SectionPatch con sectionId "${sectionId}", html interior (sin wrapper), css con selectores que comiencen por [data-xpage-section="${sectionId}"], summary y warnings. La nueva sección debe aportar una parte concreta del recorrido y tener un título semántico, texto natural y diseño responsive accesible. No repitas secciones existentes, no inventes claims, cifras, testimonios ni recursos. No incluyas script, style, iframe, manejadores de eventos ni URLs de imágenes/video. No agregues marcadores data-xpage-slot; los medios existentes se mantienen intactos y se colocan por el espacio de medios después.

BRIEF:
${JSON.stringify(input.brief)}

TÉCNICAS SELECCIONADAS:
${techniques}

SECCIONES ACTUALES:
${sections.map((section, index) => `${index + 1}. ${section.id}: ${section.title}`).join("\n")}

INSTRUCCIÓN PARA LA NUEVA SECCIÓN:
${input.instruction}`;
  const fullMessage = `Carga la skill frontend-design con load_skill y también estas skills de método: ${input.techniqueIds.join(", ")}. Sigue sus procedimientos completos y adapta la dirección visual a la identidad de la landing que se muestra abajo. Conserva sus tokens, motivo, tipografía, paleta, formas y nivel de contraste; crea una composición adecuada para el propósito nuevo y evita una skin genérica.

HTML VECINO PARA DAR CONTINUIDAD (no copiar literalmente):
${neighborHtml}

CSS RELEVANTE DEL VECINO:
${visualCss || "Sin reglas relacionadas."}

TOKENS GLOBALES EXISTENTES:
${rootTokens || "No hay bloque :root explícito."}

Instrucción completa de sección:
${message}`;
  const startedAt = Date.now();
  try {
    const result = await runEveStructured({ modelChoice: input.modelChoice, message: fullMessage, outputSchema: sectionPatchSchema });
    const patch = sectionPatchSchema.parse(result.data);
    if (patch.sectionId !== sectionId) throw new Error("Eve respondió con un marcador de sección inesperado.");
    const css = validateScopedCss(patch.css, sectionId);
    const scaffold = insertSectionAfter(input.code.html, sectionId, input.afterSectionId);
    const newHtml = applySectionFragment(scaffold, sectionId, patch.html, [], []);
    if (input.traceId) await recordTraceStep(input.traceId, {
      eventType: "step", phase: "studio-new-section", title: `Sección creada · ${patch.summary}`,
      techniqueIds: input.techniqueIds, provider: "eve-local", model: input.modelChoice, userPrompt: input.instruction,
      output: { sectionId, summary: patch.summary, warnings: patch.warnings }, decisionSummary: patch.summary,
      durationMs: Date.now() - startedAt, references: [{ kind: "section", id: sectionId, label: patch.summary }],
    }).catch(() => undefined);
    await recordProviderAttempts({
      traceId: input.traceId, phase: "studio-new-section", title: "Studio new section",
      techniqueIds: input.techniqueIds, userPrompt: input.instruction,
      attempts: [{ provider: "eve-local", model: input.modelChoice, status: "completed", durationMs: Date.now() - startedAt, output: { sectionId, summary: patch.summary, warnings: patch.warnings } }],
      references: [{ kind: "section", id: sectionId, label: patch.summary }],
    });
    return NextResponse.json({
      code: { ...input.code, html: newHtml, css: [input.code.css, css].filter(Boolean).join("\n") },
      sectionId, summary: patch.summary, warnings: patch.warnings,
    });
  } catch (error) {
    await recordProviderAttempts({
      traceId: input.traceId, phase: "studio-new-section", title: "Studio new section failed",
      techniqueIds: input.techniqueIds, userPrompt: input.instruction,
      attempts: [{ provider: "eve-local", model: input.modelChoice, status: "failed", durationMs: Date.now() - startedAt, errorMessage: error instanceof Error ? error.message : "Unknown generation failure" }],
    });
    return NextResponse.json({ error: `Eve no pudo crear la sección. ${error instanceof Error ? error.message : "Inténtalo de nuevo."}` }, { status: 503 });
  }
}
