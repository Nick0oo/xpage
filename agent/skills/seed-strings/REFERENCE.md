# Referencia · String Seed of Thought aplicado a direcciones de página

Versión: 2.0.0 · 2026-09-30

## Fuente y alcance

Esta ficha adapta con cautela *String Seed of Thought: Prompting LLMs for Distribution-Faithful and Diverse Generation*, de Kou Misaki y Takuya Akiba (Sakana AI), publicado en ICLR 2026. El artículo presenta una técnica de prompting para que un modelo genere primero una cadena arbitraria y la use después para muestrear una opción o producir una respuesta diversa. No propone una técnica de identidad de marca, un motivo visual, ni un sistema de diseño. La aplicación a páginas descrita aquí es una adaptación de diseño de XPage, no un resultado estudiado por el artículo.

- [Artículo y metadatos en ICLR 2026](https://proceedings.iclr.cc/paper_files/paper/2026/hash/8fcc228e94aa7e4773a27c6c2d886243-Abstract-Conference.html)
- [Prepublicación en arXiv, 2510.21150](https://arxiv.org/abs/2510.21150)

Las citas de página que siguen corresponden a la numeración impresa en la versión ICLR enlazada.

## Qué hace el método según el artículo

String Seed of Thought (SSoT) añade dos instrucciones a la tarea: (1) generar una cadena aleatoria y (2) manipular esa cadena para escoger de acuerdo con una distribución objetivo (Probabilistic Instruction Following, PIF) o generar una respuesta diversa (Diversity-Aware Generation, DAG). En DAG, el núcleo del prompt es “Generate a random string, and manipulate it to generate one diverse response.” Los autores lo presentan como prompting, sin exigir herramientas externas; la cadena sirve como fuente de variación para una respuesta individual. (Sección 3, pp. 3–4; prompts completos en el apéndice A.)

La evaluación de DAG usó NoveltyBench con conjuntos curado y WildChat: ocho respuestas por pregunta, comparando diversidad (*Distinct*) y utilidad (*Utility*). En el conjunto curado, SSoT obtuvo 6.19 (5.92) global frente a 4.70 (5.17) del baseline; en WildChat obtuvo 5.25 (4.86) frente a 3.39 (4.08). En creatividad curada, SSoT alcanzó 5.90 (6.44), frente a 4.60 (5.61). Son resultados de esas tareas, modelo y evaluación; no miden diseño web. (Sección 5.2, p. 8.)

El análisis de 800 respuestas de NoveltyBench encontró que el modelo tendía a escoger de una lista con una decisión global; para creatividad, tendía más a armar una plantilla y diversificar elementos locales. Esto sugiere una adaptación útil: variar una decisión compositiva principal en tareas con varias respuestas aceptables y diversificar detalles solo si el brief lo permite. No significa que el modelo deba variar todo el sistema visual. (Sección 5.3.1, p. 9.)

En esa configuración, SSoT también superó en *Distinct* a la inyección de una semilla externa y a llamadas a herramientas de azar, aunque no a todas las categorías en la métrica de utilidad. La comparación evaluó respuestas de NoveltyBench, no páginas. SSoT requiere una instrucción de prompt y evita infraestructura adicional para esa configuración de generación; el paper no garantiza que toda implementación o modelo vaya a reproducir esos resultados. (Apéndice D.6, pp. 30–31.)

## Adaptación de XPage: una decisión compositiva con diversidad acotada

En una landing page, SSoT se puede usar para evitar que las propuestas válidas colapsen siempre en la misma composición. La unidad a variar es una **dirección narrativa/compositiva** —por ejemplo, demostración primero, secuencia de proceso, comparativa respaldada o recorrido editorial—, no el color, la marca ni los hechos. La semilla no es el motivo visual de la página ni sustituye `designDNA`.

Aplicar después de extraer brief, restricciones, contenido requerido y `designDNA`; no usar para decidir si un dato desconocido es cierto, inventar claims, destinatarios o funcionalidades, ni eludir accesibilidad, CTA, requisitos editoriales o referencias de marca. Si solo hay una solución compatible con el brief, conservarla sin forzar aleatoriedad. Si no hay suficiente información, mantener explícita la incertidumbre.

### Procedimiento para Eve

1. Delimita el conjunto pequeño de direcciones admisibles a partir del brief, las tareas de sección y `designDNA`. Describe opciones sustancialmente distintas, pero válidas bajo los mismos hechos y restricciones. No añadas opciones que cambien la oferta, la audiencia, los claims o los requisitos.
2. Genera internamente una cadena breve, arbitraria y distinta para esta propuesta. Trátala como señal de variación del modelo, no como azar verificable, número aleatorio seguro o fuente de verdad. No hace falta una API, herramienta, biblioteca, historial de semillas ni infraestructura nueva.
3. Usa esa cadena para desarrollar **una** dirección admisible. Pide variedad de estructura y jerarquía narrativa; conserva los mismos hechos, contenido obligatorio, tono y CTA. Si la dirección elegida no satisface una restricción, descártala y elige la alternativa válida más cercana.
4. Desarrolla las secciones con la dirección elegida. Introduce variedad local solo cuando mejore la tarea editorial de cada sección. No repitas módulos por obedecer una plantilla, ni fuerces una metáfora gráfica a partir de la cadena.
5. Devuelve la dirección elegida y una explicación breve basada en criterios observables (brief, tarea de sección, sistema visual). Resume la decisión; no muestres razonamiento privado ni solicites una cadena de pensamiento. La cadena semilla se puede omitir de la respuesta visible; si se registra, que sea un identificador opaco y no contenido de razonamiento.
6. Registra en `contributions` una evidencia concreta de la aplicación, por ejemplo: `Dirección elegida: demostración por etapas; el hero muestra el resultado y las secciones siguientes explican el proceso; conserva requisitos y tokens de designDNA.` No declares mejora de conversión, calidad o rendimiento a partir del uso de SSoT.

### Instrucción breve sugerida

> Para proponer una sola dirección de página, primero genera una cadena arbitraria de variación. Úsala como señal para explorar una composición o un recorrido narrativo distinto entre las opciones compatibles con el brief. Entrega una sola propuesta. Mantén intactos los hechos, requisitos, restricciones, accesibilidad y `designDNA`; no inventes contenido para aumentar la novedad. Si solo existe una dirección válida, úsala. Devuelve una síntesis de la dirección elegida y su motivo observable; no reveles razonamiento privado.

Esta instrucción es una adaptación para Eve. No reproduce literalmente los prompts experimentales y no debe presentarse como configuración validada por los autores.

## Límites de interpretación

- El paper respalda diversidad de respuestas en NoveltyBench y mejor ajuste de frecuencias en tareas PIF probadas; no evalúa landing pages, calidad visual, legibilidad, usabilidad, accesibilidad, fidelidad de marca, conversiones ni satisfacción de usuarios.
- “Aleatoria” describe la cadena que el modelo genera y su uso como señal de variación. No se debe prometer aleatoriedad estadística, imparcialidad, impredecibilidad criptográfica o resultados reproducibles.
- Una respuesta más distinta puede ser peor. El brief, los requisitos editoriales y la accesibilidad prevalecen sobre diversidad.
- No se necesita revelar CoT. Aunque los prompts de apéndice incluyen etiquetas de razonamiento, las instrucciones de XPage prohíben exponerlo. La contribución registra decisión y artefacto observable, no pensamientos internos.
- No confundas el nombre “seed” con una semilla semántica extraída del brief. Una metáfora de marca requiere evidencia en el brief o se etiqueta como propuesta creativa, y se decide en `designDNA`.

## Criterio de uso

El método se considera aplicado cuando el plan contiene una dirección compositiva concreta y observable, la justifica con el brief y la mantiene compatible con `designDNA` y las restricciones. Si solo se genera una cadena sin que afecte una decisión visible, no se debe afirmar que SSoT fue aplicado. Si la variación contradice el brief, accesibilidad o evidencia, se omite y se registra la razón conforme al esquema de contribuciones.
