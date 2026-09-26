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
  instruction: string;
};

export const techniques: readonly Technique[] = [
  {
    id: "seed-strings",
    name: "Cadenas semilla",
    summary: "Define una única fuente de verdad para toda la página.",
    instruction:
      "Crea una cadena semilla breve con marca, oferta, público, tono, estructura, paleta, tipografía y CTA. Reutiliza esos datos como fuente de verdad en cada sección para mantener consistencia.",
  },
  {
    id: "ambitious-prompts",
    name: "Prompts ambiciosos",
    summary: "Diseña desde la motivación y las dudas del público.",
    instruction:
      "Piensa en grande: entiende qué desea conseguir el público, qué le preocupa y qué necesita creer para actuar. Convierte esas motivaciones en una propuesta clara, argumentos concretos y una jerarquía visual memorable.",
  },
  {
    id: "creator-critic",
    name: "Creador y crítico",
    summary: "Haz una revisión de UX y conversión antes de entregar.",
    instruction:
      "Trabaja en una sola respuesta: plantea una primera dirección, evalúala como especialista en UX y CRO (claridad, credibilidad, fricción y jerarquía), y entrega una versión corregida. No muestres cadenas de pensamiento privadas; presenta solo decisiones y resultado final.",
  },
  {
    id: "image-assets",
    name: "Activos de imagen",
    summary: "Especifica imágenes con intención, encuadre y formato.",
    instruction:
      "Indica qué activos visuales ayudarían a contar la historia. Para cada uno describe sujeto, contexto, composición, luz, paleta, espacio para texto y proporción recomendada. Devuelve instrucciones de imagen, no archivos generados.",
  },
  {
    id: "video-assets",
    name: "Activos de vídeo",
    summary: "Define clips y movimiento que refuercen el mensaje.",
    instruction:
      "Describe una idea de vídeo o motion útil para la página: duración, secuencia de planos, ritmo, movimiento de cámara, bucle y relación con el mensaje. Respeta reproducción silenciosa, controles accesibles y movimiento reducido. Devuelve el prompt, no un archivo de vídeo.",
  },
  {
    id: "subtractive-design",
    name: "Diseño sustractivo",
    summary: "Elimina cada elemento que no aporte a la conversión.",
    instruction:
      "Diseña con intención y luego simplifica: elimina secciones, adornos, texto o controles que no ayuden a comprender la oferta ni a dar el siguiente paso. Conserva espacio, contraste y jerarquía.",
  },
  {
    id: "negative-constraints",
    name: "Restricciones negativas",
    summary: "Evita clichés, afirmaciones inventadas y ruido visual.",
    instruction:
      "Incluye restricciones explícitas: no inventes métricas, clientes, testimonios, precios ni garantías; evita texto de relleno, jerga vacía, degradados púrpura genéricos, falsas urgencias, CTA repetidos y elementos sin función.",
  },
  {
    id: "human-copy",
    name: "Copy humano",
    summary: "Escribe micro-copy natural, específico y fácil de entender.",
    instruction:
      "Reescribe títulos, etiquetas, botones y mensajes para que suenen humanos, directos y propios de esta marca. Usa frases cortas y verbos concretos; elimina lugares comunes, repeticiones y promesas que el brief no respalde.",
  },
];

export function getTechnique(id: TechniqueId): Technique {
  return techniques.find((technique) => technique.id === id)!;
}
