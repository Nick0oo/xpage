export type HtmlCompositionSeed = {
  id: string;
  title: string;
  recipeIds: string[];
  cues: string[];
  html: string;
  css: string;
};

/** Minimal semantic fragments to give Eve a real structural starting point.
 * IDs are explicit placeholders and must be replaced by IDs from the plan. */
export const htmlCompositionSeeds: readonly HtmlCompositionSeed[] = [
  {
    id: "chapter-spread",
    title: "Apertura editorial por capítulos",
    recipeIds: ["editorial-essay", "story-to-proof", "campaign-poster"],
    cues: ["editorial", "historia", "capítulo", "capitulo", "guía", "guia", "revista"],
    html: `<section class="chapter-spread" data-xpage-section="REEMPLAZAR-CON-ID-DEL-PLAN">
  <p class="chapter-spread__index" aria-hidden="true">01 / IDEA</p>
  <div class="chapter-spread__body">
    <p class="eyebrow">ETIQUETA ÚTIL</p>
    <h2>Titular que plantea la siguiente idea</h2>
    <p class="chapter-spread__lead">Explicación breve y respaldada por el brief.</p>
    <div class="chapter-spread__detail"><p>Detalle o ejemplo completo que añada contexto nuevo.</p></div>
  </div>
  <aside class="chapter-spread__note"><p>Nota marginal relacionada, nunca un claim inventado.</p></aside>
</section>`,
    css: `.chapter-spread{display:grid;grid-template-columns:minmax(4rem,.28fr) minmax(0,1.2fr) minmax(10rem,.52fr);gap:clamp(1rem,4vw,4rem);align-items:start;padding-block:clamp(3rem,8vw,7rem);border-top:1px solid var(--line)}.chapter-spread__body,.chapter-spread__note{min-width:0}.chapter-spread__index{font:600 .75rem/1.2 var(--font-body);letter-spacing:.1em}.chapter-spread__body h2{max-width:14ch;font-size:clamp(2rem,5vw,4.7rem);line-height:.98}.chapter-spread__lead{max-width:48ch;font-size:clamp(1.05rem,1.6vw,1.35rem)}.chapter-spread__detail{max-width:58ch;margin-top:2rem}.chapter-spread__note{padding-top:3rem;font-size:.9rem}@media(max-width:700px){.chapter-spread{grid-template-columns:2rem minmax(0,1fr);gap:.75rem 1rem}.chapter-spread__body,.chapter-spread__note{grid-column:2}.chapter-spread__note{padding-top:0}}`,
  },
  {
    id: "demonstration-stage",
    title: "Escenario de demostración",
    recipeIds: ["product-walkthrough", "interactive-explainer"],
    cues: ["producto", "demostración", "demostracion", "herramienta", "proceso", "interactivo", "pasos"],
    html: `<section class="demo-stage" data-xpage-section="REEMPLAZAR-CON-ID-DEL-PLAN">
  <div class="demo-stage__copy"><p class="eyebrow">PASO 02 · EXPLICACIÓN</p><h2>Una acción concreta que sí forma parte de la oferta</h2><p>Describe el resultado visible de la acción sin prometer efectos no comprobados.</p></div>
  <figure class="demo-stage__visual" data-xpage-slot="REEMPLAZAR-CON-ID-REAL-DEL-SLOT">
    <div class="demo-stage__artifact" role="img" aria-label="Descripción breve del diagrama o artefacto representado">DIAGRAMA CSS/SVG DERIVADO DEL BRIEF</div>
    <figcaption>La leyenda explica qué se observa y cómo se relaciona con la oferta.</figcaption>
  </figure>
  <ol class="demo-stage__steps"><li><strong>Entrada</strong><span>Material real que inicia el proceso.</span></li><li><strong>Acción</strong><span>Qué ocurre, explicado sin interfaz ficticia.</span></li><li><strong>Entrega</strong><span>Qué recibe o puede ver la persona.</span></li></ol>
</section>`,
    css: `.demo-stage{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(1.25rem,4vw,4rem);align-items:center;padding-block:clamp(3rem,8vw,7rem)}.demo-stage__copy{max-width:36rem}.demo-stage__copy h2{font-size:clamp(2rem,4vw,4rem);line-height:1.02}.demo-stage__visual{min-width:0;margin:0;padding:clamp(1rem,3vw,2rem);background:var(--surface);border:1px solid var(--line);border-radius:var(--radius,1rem)}.demo-stage__artifact{display:grid;min-height:clamp(12rem,28vw,24rem);place-items:center;text-align:center;color:var(--text);background:color-mix(in srgb,var(--accent) 12%,var(--surface));border:1px dashed var(--line);padding:1.5rem}.demo-stage__visual figcaption{margin-top:.8rem;font-size:.85rem}.demo-stage__steps{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;list-style:none;padding:0}.demo-stage__steps li{display:grid;gap:.5rem;padding:1rem 0;border-top:2px solid var(--accent);min-width:0}@media(max-width:700px){.demo-stage{grid-template-columns:minmax(0,1fr)}.demo-stage__steps{grid-template-columns:minmax(0,1fr)}}`,
  },
  {
    id: "practice-sequence",
    title: "Secuencia de práctica legible",
    recipeIds: ["learning-sequence", "catalog-to-choice", "service-journey"],
    cues: ["ejercicio", "práctica", "practica", "aprendizaje", "catálogo", "catalogo", "servicio", "etapas"],
    html: `<section class="practice-sequence" data-xpage-section="REEMPLAZAR-CON-ID-DEL-PLAN">
  <header class="practice-sequence__intro"><p class="eyebrow">RECORRIDO / 03</p><h2>El contenido se explora en piezas concretas</h2><p>Explica cómo se usa esta secuencia antes de presentar sus piezas.</p></header>
  <ol class="practice-sequence__list"><li><span class="practice-sequence__number" aria-hidden="true">01</span><div><h3>Título específico de la pieza</h3><p>Instrucción o ejemplo completo solicitado por el brief.</p></div></li><li><span class="practice-sequence__number" aria-hidden="true">02</span><div><h3>Otra pieza con tarea distinta</h3><p>Contenido concreto; no dejes el texto como placeholder.</p></div></li><li><span class="practice-sequence__number" aria-hidden="true">03</span><div><h3>Una tercera pieza solo si el plan la requiere</h3><p>Conserva aquí cada requiredItem de su sección.</p></div></li></ol>
</section>`,
    css: `.practice-sequence{display:grid;grid-template-columns:minmax(12rem,.62fr) minmax(0,1.38fr);gap:clamp(1.5rem,6vw,6rem);padding-block:clamp(3rem,8vw,7rem);border-block:1px solid var(--line)}.practice-sequence__intro{position:sticky;top:1.5rem;align-self:start;max-width:26rem}.practice-sequence__intro h2{font-size:clamp(2rem,4vw,3.5rem);line-height:1.02}.practice-sequence__list{list-style:none;margin:0;padding:0}.practice-sequence__list li{display:grid;grid-template-columns:3rem minmax(0,1fr);gap:1rem;padding:1.3rem 0;border-bottom:1px solid var(--line)}.practice-sequence__number{color:var(--accent);font-variant-numeric:tabular-nums}.practice-sequence__list h3{margin:0 0 .45rem;font-size:clamp(1.2rem,2vw,1.6rem)}.practice-sequence__list p{margin:0;max-width:58ch}@media(max-width:700px){.practice-sequence{grid-template-columns:minmax(0,1fr)}.practice-sequence__intro{position:static}}`,
  },
];

export function selectHtmlCompositionSeeds(prompt: string, maximum = 2) {
  const normalizedPrompt = prompt.toLocaleLowerCase("es");
  const recipeMatches = htmlCompositionSeeds.map((seed) => ({
    seed,
    score: seed.recipeIds.reduce((score, recipeId) => score + (normalizedPrompt.includes(recipeId) ? 4 : 0), 0)
      + seed.cues.reduce((score, cue) => score + (normalizedPrompt.includes(cue) ? 1 : 0), 0),
  })).sort((a, b) => b.score - a.score);
  const matched = recipeMatches.filter(({ score }) => score > 0).slice(0, maximum).map(({ seed }) => seed);
  return matched.length ? matched : htmlCompositionSeeds.slice(0, maximum);
}

export function formatHtmlCompositionSeeds(prompt: string) {
  const seeds = selectHtmlCompositionSeeds(prompt, 2);
  if (!seeds.length) return "";
  return seeds.map((seed) => `### ${seed.title} (adaptar solo la sección que lo necesite)\nHTML:\n${seed.html}\nCSS:\n${seed.css}`).join("\n\n");
}
