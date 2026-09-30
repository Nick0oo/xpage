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
    summary: "Usa una cadena efímera para elegir una dirección compositiva diversa y fiel al brief.",
    purpose: "Inducir una ruta creativa concreta entre posibilidades válidas y dejarla lista para desarrollar e integrar.",
    inputs: "Brief completo, contenido obligatorio, controles de marca/accesibilidad y sus límites.",
    artifact: "Ficha breve y editable con cadena opaca, tres rutas válidas, ruta elegida, efecto observable, traducción visual y restricciones preservadas.",
    instruction: "Aplica String Seed of Thought como inspiración de prompting, no como generador de identidad: crea una cadena aleatoria corta sin significado temático y úsala para inducir una ruta entre tres composiciones plausibles que cumplen el mismo brief. Resume la ruta elegida y su efecto sin exponer razonamiento privado. Separa la cadena del motivo visual: deriva DesignDNA del brief y registra propuesta, no investigación. Conserva contenido, marca, accesibilidad y cambios del usuario; no alegues aleatoriedad criptográfica, determinismo ni fidelidad estadística. Incluye en artifact un dossier sustantivo editable de 2200 a 4500 caracteres (sin exceder el límite de 6000) con cadena, referencias cargadas, fuente del sistema, tres rutas, motivo propuesto, tokens por rol, stack tipográfico local, gesto del hero y tratamientos por sección, reglas de continuidad, destinos del inventario obligatorio, interacción accesible y restricciones preservadas.",
  },
  {
    id: "ambitious-prompts",
    name: "Prompts ambiciosos",
    summary: "Construye un recorrido completo con el material real del brief.",
    purpose: "Ayudar a cada visitante a entender la oferta, evaluar si encaja y llegar a una acción existente.",
    inputs: "Oferta, audiencia descrita, acción/destino, hechos y entregables proporcionados, restricciones y datos ausentes.",
    artifact: "Mapa editable de señal de audiencia, momento de decisión, tareas/orden de secciones, evidencia disponible, hipótesis vinculadas y datos pendientes.",
    instruction: "Lee agent/skills/ambitious-prompts/SKILL.md completo. Marca motivaciones/objeciones como hipótesis y relaciónalas con una señal del brief. Asigna a cada sección una tarea, contenido/evidencia y composición; usa una página corta cuando el material sea limitado. Deja preguntas, huecos y notas de investigación en el artefacto/traza; escribe para visitantes qué ofrece el producto y cómo avanzar sin relatar qué datos faltaron.",
  },
  {
    id: "creator-critic",
    name: "Creador y crítico",
    summary: "Ubica defectos concretos, repáralos y vuelve a comprobarlos.",
    purpose: "Mejorar ajuste al brief, contenido completo, coherencia y uso sin confundir crítica con gusto personal.",
    inputs: "Brief y fuentes, DesignDNA, secciones, copys, inventario, CTA, IDs, medios, acceso y artefacto que se revisa.",
    artifact: "Propuesta inicial, de dos a cinco hallazgos con ubicación/evidencia/regla/efecto/cambio y resumen de la revisión real.",
    instruction: "Lee agent/skills/creator-critic/SKILL.md completo. Revisa el plan/código recibido, prioriza omisiones, claims, acción y acceso; registra solo defectos observables y aplica el cambio en el mismo artefacto. Recomprueba lo afectado; no afirmes render, mediciones ni conversiones que no ocurrieron.",
  },
  {
    id: "image-assets",
    name: "Activos de imagen",
    summary: "Prepara slots, búsquedas iniciales y criterios para activos reales.",
    purpose: "Apoyar información difícil de explicar con texto y dejar lista su posterior búsqueda/selección en XPage.",
    inputs: "Sección y tarea, DesignDNA, sujeto/acción/contexto respaldados, espacio y recorte móvil.",
    artifact: "Slot por sección con escena, proporción, alt, fallback local, 1–3 consultas y criterios de selección; especificación sin candidato.",
    instruction: "Lee agent/skills/image-assets/SKILL.md completo. Propón imagen solo si aporta información; completa los campos de mediaSlot y section.mediaSlotIds, searchQueries y selectionCriteria. No declares candidato, autor, URL, licencia o archivo hasta que la búsqueda/API real y la persona lo seleccionen.",
  },
  {
    id: "video-assets",
    name: "Activos de vídeo",
    summary: "Define una secuencia opcional que pueda buscarse en stock gratuito.",
    purpose: "Mostrar acciones en las que el cambio temporal añade información que una imagen fija no comunica.",
    inputs: "Sección y acción respaldada, secuencia, duración, poster, movimiento reducido y condiciones de búsqueda.",
    artifact: "Slot por sección con secuencia, consultas y criterios de video stock, poster textual, controles manuales/silenciosos y fallback estático.",
    instruction: "Lee agent/skills/video-assets/SKILL.md completo. Omite video salvo que el cambio temporal tenga utilidad específica. Registra queries/criteria para la búsqueda real de stock gratuito existente; XPage no genera video ni confirma candidatos antes de buscar. Sin autoplay/sonido y con alternativa legible sin movimiento.",
  },
  {
    id: "subtractive-design",
    name: "Diseño sustractivo",
    summary: "Quita redundancia con una razón ligada al uso.",
    purpose: "Reducir esfuerzo de lectura sin perder contexto, requisitos, evidencia, acceso o preferencias del usuario.",
    inputs: "Mapa de secciones, mensajes repetidos, CTA/control, requisitos protegidos y comportamiento accesible.",
    artifact: "Inventario keep/combine/remove/open question, mapa posterior de secciones, preservación de inventario y lista exacta para discardedElements.",
    instruction: "Lee agent/skills/subtractive-design/SKILL.md completo. Asigna tarea a cada bloque y justifica cualquier descarte. Preserva cantidades, condiciones, contexto de decisión, accesibilidad, anclas y ediciones. Nunca simplifiques convirtiendo la página en un aviso sobre información faltante.",
  },
  {
    id: "negative-constraints",
    name: "Restricciones negativas",
    summary: "Convierte límites y prohibiciones en controles comprobables.",
    purpose: "Mantener claims, composición, interacción, medios y acceso dentro de las fuentes y límites explícitos.",
    inputs: "Brief, claim/fuente, exclusiones compositivas, inventario, identidad, accesibilidad y destino de acción.",
    artifact: "Reglas con origen/scope/check/acción ante falla, claim review y separación entre notas privadas y copy público.",
    instruction: "Lee agent/skills/negative-constraints/SKILL.md completo. Formula checks positivos y rastreables. Busca también sinónimos que eludan restricciones. Mantén incógnitas/hipótesis/decisiones en plan/traza, no como contenido para visitantes. Escribe completo el material creativo original pedido, sin atribuirlo a casos reales.",
  },
  {
    id: "human-copy",
    name: "Copy humano",
    summary: "Redacta copy público específico sin revelar notas de producción.",
    purpose: "Explicar valor y siguiente paso con lenguaje preciso, humano y apoyado por el brief.",
    inputs: "Oferta, audiencia, voz/vocabulario proporcionado, claims con fuente, inventario y acción real.",
    artifact: "Mapa de mensajes, pares antes/después representativos, copy de CTA y piezas creativas originales completas.",
    instruction: "Lee agent/skills/human-copy/SKILL.md completo. Explica directamente la oferta; cada bloque añade información. No publiques frases tipo «el brief no concreta», «por definir», «no representamos» o «no se presentan ejemplos». Escribe las guías/ejercicios/artículos originales que se pidieron y márcalos como muestra si pudieran parecer historial real; no inventes hechos de negocio.",
  },
];

export function getTechnique(id: TechniqueId): Technique {
  return techniques.find((technique) => technique.id === id)!;
}
