/** Section-level composition recipes. A recipe is a starting point, never a
 * fixed wireframe: choose only the moves that clarify this offer. */
export type CompositionRecipe = {
  id: string;
  name: string;
  pattern: string;
  sectionRhythm: string;
  worksWhen: string;
  antiPattern: string;
};

export const compositionRecipes: readonly CompositionRecipe[] = [
  { id: "editorial-essay", name: "Ensayo editorial", pattern: "Hero con titular alineado a un borde y una imagen/forma focal; cuerpo en capítulos numerados con alternancia de columna amplia, nota lateral y figura anotada; cierre tipográfico.", sectionRhythm: "apertura amplia → detalle compacto → expansión visual → lista clara → cierre", worksWhen: "hay una idea central y contexto que se construye con explicación", antiPattern: "No convertir cada capítulo en una card ni estrechar demasiado el texto." },
  { id: "product-walkthrough", name: "Recorrido de producto", pattern: "Demostración dominante con etiqueta y breve introducción; pasos alternando interfaz y explicación; muestra concreta; alcance y CTA al final.", sectionRhythm: "mostrar → explicar → practicar/inspeccionar → resolver dudas → actuar", worksWhen: "el valor se entiende viendo una herramienta, objeto o proceso", antiPattern: "No inventar pantallas del producto ni simular controles que no funcionan." },
  { id: "learning-sequence", name: "Secuencia de aprendizaje", pattern: "Pregunta inicial, mapa de etapas, lección o ejercicio visible, lectura de ejemplo y recapitulación enlazada al CTA.", sectionRhythm: "orientar → enseñar → practicar → variar → sintetizar", worksWhen: "el brief pide ejercicios, explicación, método o guía", antiPattern: "No anunciar cantidad de piezas si el plan no contiene el contenido completo." },
  { id: "service-journey", name: "Viaje del servicio", pattern: "Promesa descriptiva y destinatario; alcance; proceso por etapas; criterios/dudas; contacto o reserva con destino real.", sectionRhythm: "encajar → entender alcance → conocer el proceso → decidir → contactar", worksWhen: "la persona necesita saber qué ocurre después de contratar o reservar", antiPattern: "No añadir credenciales, plazos, precios o resultados sin fuente." },
  { id: "campaign-poster", name: "Póster con recorrido", pattern: "Primera pantalla de gran gesto tipográfico, señal visual propia, información esencial agrupada y secciones breves para valor, contexto y acción.", sectionRhythm: "impacto → datos útiles → significado → participación", worksWhen: "la fecha, convocatoria, causa o acción principal organiza la oferta", antiPattern: "No sacrificar lectura por impacto ni inferir urgencia." },
  { id: "catalog-to-choice", name: "Catálogo hacia una elección", pattern: "Orientación común, inventario de opciones con diferencias reales, detalle en la opción prioritaria y guía para elegir.", sectionRhythm: "orientar → explorar → comparar → profundizar → elegir", worksWhen: "hay varias piezas, ejercicios, servicios o variantes expresas", antiPattern: "No uniformar piezas que requieren composición distinta ni inventar categorías." },
  { id: "story-to-proof", name: "Historia hacia evidencia", pattern: "Contexto breve, tensión explicada, respuesta de la oferta, evidencia proporcionada y siguiente paso.", sectionRhythm: "contexto → necesidad → respuesta → fundamento → acción", worksWhen: "el brief trae una historia, proceso o fuente demostrable", antiPattern: "No fabricar citas, clientes, caso de éxito ni antes/después." },
  { id: "interactive-explainer", name: "Explicador interactivo", pattern: "Concepto y esquema estáticos completos; una interacción local permite recorrer o filtrar material ya visible; resumen y CTA.", sectionRhythm: "entender → explorar → comprobar → continuar", worksWhen: "una interacción ayuda a comprender más rápido que otro párrafo", antiPattern: "No esconder contenido esencial tras JavaScript, tabs o acordeones." },
];

export function formatCompositionOptions(limit = 5) {
  return compositionRecipes.slice(0, limit).map(({ id, name, pattern, sectionRhythm, worksWhen, antiPattern }) =>
    `- ${id} / ${name}: ${pattern} Ritmo: ${sectionRhythm} Encaja si: ${worksWhen} Control: ${antiPattern}`,
  ).join("\n");
}

export function selectCompositionOptions(brief: { topic: string; offer: string; audience: string; objective?: string }, limit = 3) {
  const text = `${brief.topic} ${brief.offer} ${brief.audience} ${brief.objective ?? ""}`.toLocaleLowerCase("es");
  const matches = compositionRecipes.map((recipe) => {
    const terms = `${recipe.name} ${recipe.worksWhen}`.toLocaleLowerCase("es").split(/[^\p{L}\p{N}]+/u).filter((word) => word.length > 4);
    const score = terms.reduce((total, term) => total + (text.includes(term) ? 1 : 0), 0);
    return { recipe, score };
  }).sort((a, b) => b.score - a.score);
  const chosen = matches.filter(({ score }) => score > 0).slice(0, limit).map(({ recipe }) => recipe);
  return chosen.length ? chosen : [compositionRecipes[0], compositionRecipes[6], compositionRecipes[7]].slice(0, limit);
}
