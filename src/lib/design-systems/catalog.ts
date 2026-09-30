/**
 * A small, composable visual vocabulary for XPage. These are art-direction
 * recipes, not skins: Eve must derive the final palette and imagery from the
 * brief and keep every recipe subordinate to DesignDNA.
 */
export type DesignSystemRecipe = {
  id: string;
  name: string;
  bestFor: string;
  visualGrammar: string;
  type: string;
  colorLogic: string;
  material: string;
  motion: string;
  avoid: string[];
  keywords: string[];
};

export const designSystems: readonly DesignSystemRecipe[] = [
  {
    id: "field-notes",
    name: "Field Notes / editorial de campo",
    bestFor: "educación, investigación, cultura, gastronomía y servicios con conocimiento que explicar",
    visualGrammar: "Jerarquía de revista, márgenes generosos, numeración de capítulos, notas marginales y una imagen o diagrama con función documental. Alterna aperturas tipográficas con bloques de explicación; no convierte cada sección en una tarjeta.",
    type: "Serif editorial para titulares si está disponible localmente, sans legible para interfaz y cifras tabulares solo cuando existan datos reales.",
    colorLogic: "Fondo papel cálido o neutro, tinta de alto contraste y un acento extraído del tema; el acento señala navegación, etiquetas y llamadas a la acción.",
    material: "Líneas finas, papel sugerido con CSS, pies de figura y diagramas esquemáticos; evitar textura que reduzca contraste.",
    motion: "Revelación opcional breve de capítulos; contenido visible sin animación y sin depender de scroll-trigger.",
    avoid: ["dashboard con métricas inventadas", "ornamentos vintage genéricos", "columna de texto demasiado estrecha"],
    keywords: ["editorial", "revista", "investigación", "aprender", "curso", "receta", "cultura", "guía", "historia"],
  },
  {
    id: "product-proof",
    name: "Product Proof / demostración del producto",
    bestFor: "software, herramientas, flujos de trabajo, productos configurables o servicios con pasos demostrables",
    visualGrammar: "La interfaz o artefacto ocupa el centro de la explicación. Combina una demostración grande, anotaciones cortas, estados antes/después solo si están descritos y pasos numerados; usa módulos únicamente donde comparen opciones reales.",
    type: "Sans contemporánea con contraste de pesos claro; monoespaciada solo para etiquetas, comandos o contenido técnico real.",
    colorLogic: "Neutros de interfaz con un color de acción y superficies diferenciadas; reservar estados semánticos para significado real.",
    material: "Marcos de producto dibujados en CSS/SVG, diagramas de flujo y detalles de interacción con foco visible.",
    motion: "Transiciones pequeñas activadas por interacción; respetar prefers-reduced-motion y evitar simulación de una función inexistente.",
    avoid: ["capturas ficticias que parezcan producto real", "números de analítica inventados", "Bento repetitivo"],
    keywords: ["software", "app", "plataforma", "herramienta", "producto digital", "automatiza", "dashboard", "flujo", "proceso"],
  },
  {
    id: "studio-craft",
    name: "Studio Craft / taller material",
    bestFor: "oficios, bienestar, alimentos, objetos, hospitalidad y ofertas cuyo valor se entiende por materia o gesto",
    visualGrammar: "Composición cálida con escala humana: gesto/material como imagen principal, texto corto cercano y detalles de proceso en secuencia. Permite asimetría y formas orgánicas contenidas.",
    type: "Serif humanista o sans amable en títulos y sans de lectura en textos; evitar tipografías display en párrafos.",
    colorLogic: "Base mineral suave y tonos derivados de ingredientes, materiales o entorno mencionados; acento medido para acción.",
    material: "Formas recortadas, bordes suaves, líneas dibujadas y fotografía con luz natural si hay un recurso real; CSS/SVG sustitutivo con contenido.",
    motion: "Movimiento de baja amplitud y duración corta; la oferta y sus instrucciones nunca dependen del movimiento.",
    avoid: ["hojas y beige como estética automática", "sellos de calidad inventados", "fotografía genérica de banco sin relación"],
    keywords: ["artesanal", "hecho a mano", "taller", "café", "comida", "bienestar", "cuidado", "hotel", "producto físico", "material"],
  },
  {
    id: "signal-system",
    name: "Signal System / claridad de alto impacto",
    bestFor: "lanzamientos, campañas, eventos, causas y ofertas con una acción principal nítida",
    visualGrammar: "Un titular dominante, un gesto visual memorable y secuencia vertical con cambios de escala. Contraste fuerte y pocas piezas de interfaz; la acción se repite solo en puntos narrativos útiles.",
    type: "Sans display condensada o grotesca local para titulares y sans neutra para lectura; limitar estilos tipográficos a una jerarquía deliberada.",
    colorLogic: "Dos neutros de alto contraste más un acento vivo derivado de marca o tema; verificar contraste en estados normales y foco.",
    material: "Tipografía como forma, bloques de color y líneas con ritmo; ningún efecto desplaza el mensaje.",
    motion: "Preferir estados estáticos; movimiento opcional, corto y apagado con reduced-motion.",
    avoid: ["neón por defecto", "varios CTAs compitiendo", "urgencia o escasez no proporcionadas"],
    keywords: ["campaña", "evento", "festival", "lanzamiento", "inscripción", "causa", "donar", "convocatoria", "concierto"],
  },
  {
    id: "service-concierge",
    name: "Service Concierge / servicio guiado",
    bestFor: "servicios profesionales, consultoría, clínicas, reservas y decisiones que requieren confianza y pasos claros",
    visualGrammar: "Orientación de arriba abajo: para quién es, qué sucede, qué incluye, qué falta por saber y cómo dar el siguiente paso. Usa módulos de comparación solo con diferencias respaldadas y un CTA contextual.",
    type: "Sans de lectura estable con títulos sobrios; énfasis tipográfico para etapas y preguntas frecuentes.",
    colorLogic: "Neutros claros u oscuros equilibrados, un acento de marca para navegación y llamada; estados de éxito/alerta nunca decorativos.",
    material: "Líneas de proceso, listas explicativas y retratos solo cuando estén disponibles y autorizados.",
    motion: "Sin movimiento de fondo; transiciones discretas en menús o acordeones accesibles.",
    avoid: ["credenciales o reseñas no suministradas", "promesa de resultados", "formularios falsos"],
    keywords: ["asesoría", "consultoría", "servicio", "cita", "clínica", "salud", "abogado", "reserva", "profesional", "agencia"],
  },
  {
    id: "learning-atlas",
    name: "Learning Atlas / recorrido de aprendizaje",
    bestFor: "cursos, talleres, guías, métodos y productos que se entienden practicando por etapas",
    visualGrammar: "Mapa de aprendizaje con idea, ejemplo, práctica y síntesis; variación de composición entre capítulos. Muestra ejercicios o entregables reales en el flujo y separa orientación de contenido práctico.",
    type: "Sans muy legible con serif opcional para reflexión; estilos de código solo para fragmentos que lo requieran.",
    colorLogic: "Fondo claro y tinta oscura, acentos por etapa con contraste y consistencia; no codificar información solo por color.",
    material: "Índice visual, numeración, diagramas y muestras del ejercicio; evitar insignias de progreso si no hay interacción real.",
    motion: "Navegación por anclas y estados accesibles; no autoavanzar ni ocultar texto tras animaciones.",
    avoid: ["promesas de aprendizaje garantizado", "gamificación ornamental", "ejercicios anunciados pero ausentes"],
    keywords: ["curso", "clase", "taller", "aprender", "formación", "ejercicio", "practicar", "método", "lección", "estudiante"],
  },
];

export type DesignSystemSelection = { recipe: DesignSystemRecipe; reason: string; score: number };

/** Select one coherent starting grammar from actual brief language. */
export function selectDesignSystem(brief: { topic: string; offer: string; audience: string; tone: string; objective?: string; references?: string; designSystemId?: string }, explicitId = brief.designSystemId): DesignSystemSelection {
  const explicitlySelected = explicitId ? designSystems.find(({ id }) => id === explicitId) : undefined;
  if (explicitId && !explicitlySelected) throw new Error(`El sistema de diseño “${explicitId}” no existe en el catálogo XPage.`);
  const text = [brief.topic, brief.offer, brief.audience, brief.tone, brief.objective, brief.references].filter(Boolean).join(" ").toLocaleLowerCase("es");
  const ranked = designSystems.map((recipe) => ({
    recipe,
    score: recipe.keywords.reduce((score, keyword) => score + (text.includes(keyword) ? (keyword.includes(" ") ? 3 : 1) : 0), 0),
  })).sort((a, b) => b.score - a.score);
  const chosen = explicitlySelected
    ? { recipe: explicitlySelected, score: ranked.find(({ recipe }) => recipe.id === explicitId)?.score ?? 0 }
    : ranked[0].score > 0 ? ranked[0] : { recipe: designSystems.find(({ id }) => id === "service-concierge")!, score: 0 };
  const reason = explicitlySelected
    ? `La persona eligió ${chosen.recipe.name}; se conserva su gramática y se adapta al brief, la marca y la accesibilidad.`
    : chosen.score > 0
    ? `Se elige ${chosen.recipe.name} porque el brief contiene señales afines a ${chosen.recipe.bestFor}.`
    : `No hay señales suficientes para imponer una estética sectorial; se propone ${chosen.recipe.name} como punto de partida flexible y se deriva su motivo y paleta de la oferta.`;
  return { ...chosen, reason };
}
