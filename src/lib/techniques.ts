export const TECHNIQUE_IDS = [
  "seed-strings",
  "ambitious-prompts",
  "creator-critic",
  "image-assets",
  "video-assets",
  "subtractive-design",
  "negative-constraints",
  "human-copy",
] as const;

export type TechniqueId = (typeof TECHNIQUE_IDS)[number];

export type Technique = {
  id: TechniqueId;
  name: string;
  summary: string;
  purpose: string;
  inputs: string;
  artifact: string;
  instruction: string;
};

export const techniques: readonly Technique[] = [
  {
    id: "seed-strings",
    name: "Cadenas semilla",
    summary: "Fija una identidad visual consistente desde el brief.",
    purpose: "Convertir los datos de marca y oferta en reglas visuales reutilizables.",
    inputs: "Hechos del brief, marca, tono y restricciones.",
    artifact: "Motivo, paleta por roles, tipografía, composición e invariantes.",
    instruction: "Distingue hechos e hipótesis. Define un motivo visual concreto y de tres a cinco invariantes visibles en todas las secciones; comprueba contraste y consistencia.",
  },
  {
    id: "ambitious-prompts",
    name: "Prompts ambiciosos",
    summary: "Convierte motivaciones y dudas en un recorrido narrativo.",
    purpose: "Ayudar al público a pasar de interés a comprensión y acción.",
    inputs: "Audiencia, oferta, acción deseada y evidencia disponible.",
    artifact: "Hipótesis de audiencia y propósito concreto por sección.",
    instruction: "Formula motivaciones y objeciones como hipótesis. Ordena secciones para responderlas sin inventar hallazgos, métricas o claims.",
  },
  {
    id: "creator-critic",
    name: "Creador y crítico",
    summary: "Revisa la propuesta y entrega una revisión verificable.",
    purpose: "Detectar fricciones en claridad, jerarquía, evidencia y accesibilidad.",
    inputs: "Propuesta inicial, brief y criterios de uso.",
    artifact: "Propuesta, hallazgos observables y cambios aplicados.",
    instruction: "Formula una propuesta, encuentra de dos a cinco problemas concretos y cambia el plan para resolverlos. Resume decisiones; no muestres cadena de pensamiento ni afirmes resultados CRO medidos.",
  },
  {
    id: "image-assets",
    name: "Activos de imagen",
    summary: "Especifica imágenes con propósito y composición claros.",
    purpose: "Apoyar visualmente una idea que el texto no explica por sí solo.",
    inputs: "Sección destino, idea, contexto de marca y espacio disponible.",
    artifact: "Slots de imagen con sujeto, acción, encuadre, luz y texto alternativo.",
    instruction: "Describe sujeto, acción, contexto, composición, luz, paleta, proporción y espacio para texto. Enlaza cada imagen con su sección y no afirmes que el archivo existe.",
  },
  {
    id: "video-assets",
    name: "Activos de vídeo",
    summary: "Define movimiento útil, póster y alternativa accesible.",
    purpose: "Mostrar una acción o transformación que una imagen fija no explica mejor.",
    inputs: "Acción, sección, duración y preferencias de movimiento.",
    artifact: "Slot de clip con secuencia, poster, controles y alternativa estática.",
    instruction: "Especifica sujeto, secuencia, ritmo, encuadre y duración. Define póster, reproducción sin sonido y prefers-reduced-motion; no generes ni declares video disponible.",
  },
  {
    id: "subtractive-design",
    name: "Diseño sustractivo",
    summary: "Quita elementos que no ayudan a entender o decidir.",
    purpose: "Reducir ruido manteniendo información necesaria y accesible.",
    inputs: "Secciones, copy, controles, adornos y objeciones del brief.",
    artifact: "Elementos descartados con motivo y estructura simplificada.",
    instruction: "Asigna una función a cada sección. Elimina duplicación, adornos y CTA competitivos; conserva hechos, contexto de decisión y alternativas accesibles.",
  },
  {
    id: "negative-constraints",
    name: "Restricciones negativas",
    summary: "Evita claims inventados, exclusiones y barreras de acceso.",
    purpose: "Hacer explícitos los límites de contenido, marca y accesibilidad.",
    inputs: "Prohibiciones, fuentes, marca y requisitos expresos.",
    artifact: "Claims con fuente/estado y lista de controles verificables.",
    instruction: "Audita cifras, testimonios, logos, precios, garantías, contraste, foco, movimiento y controles. Elimina lo que no se pueda respaldar o marca el dato faltante.",
  },
  {
    id: "human-copy",
    name: "Copy humano",
    summary: "Escribe para personas con lenguaje directo y específico.",
    purpose: "Aclarar valor y siguiente paso sin clichés ni promesas vacías.",
    inputs: "Voz, vocabulario del público, oferta y hechos verificables.",
    artifact: "Titulares, texto de secciones, CTA y revisiones de copy.",
    instruction: "Usa verbos concretos y frases naturales. Reescribe titulares, etiquetas y botones; conserva fuente en cada claim y elimina relleno, repeticiones y superlativos no probados.",
  },
];

export function getTechnique(id: TechniqueId): Technique {
  return techniques.find((technique) => technique.id === id)!;
}
