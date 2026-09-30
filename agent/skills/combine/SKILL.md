---
name: combine
description: Run after individual technique contributions to produce one complete, editable and executable landing plan. Reconcile user-edited decisions, preserve every brief requirement, define section composition and interactions, and write the full build prompt. Use whenever XPage combines methods, even if only one method is selected.
---
# Combinar métodos · v2.0.0

## Propósito

Integra las decisiones editables de Eve y de la persona en una sola dirección, DesignPlan y prompt de construcción. Las skills son procedimientos especializados; no son secciones de página ni bloques para concatenar. La entrega debe servir a visitantes reales, conservar la procedencia y poder implementarse en el HTML autónomo de XPage.

## Material de referencia

Carga el `SKILL.md` completo de cada método seleccionado con `load_skill`; `frontend-design` y esta skill también son obligatorias en la fase de plan. Las referencias no vienen incluidas automáticamente al cargar una skill. Si existe `read_seed_reference`, consulta `frontend-design`, `web-prototype-skill`, `web-prototype-layouts`, `web-prototype-checklist` y `system-prompt-excerpts` en una llamada durante diseño; añade `xpage-adaptation` si seed-strings está seleccionado. El bundle es fuente OpenDesign copiada con atribución y licencia bajo `seed-strings/references/open-design/`, no un runtime/tool/plugin. Totality Festival es ejemplo de identidad contextual; no lo conviertas en tema base. Usa hallazgos concretos de las fuentes y deja fuera lo incompatible con brief, sistema explícito, XPage o esta tarea. Si la tool falla/no está disponible, continúa con instrucciones locales y no afirmes que leíste referencias.

## Precedencia y lectura del material

1. Hechos, cantidades, restricciones y revisiones expresas de la persona.
2. Accesibilidad y contratos verificables de XPage.
3. Identidad/sistema visual que la persona eligió, si existe en el catálogo local y no contradice hechos o acceso.
4. DesignDNA derivada de brief y gramática del sistema seleccionado.
5. Propósito narrativo, lectura y composición de cada sección.
6. Preferencias estéticas de las skills.

Trata lo que se escribió/editó en `decision` y `artifact` como autoridad. No los regeneres para reconciliarlos. Aplica cada aporte `applied`/`modified` en una ubicación comprobable; `modified` explica adaptación y tensión; `omitted` incluye razón concreta. Conserva exactamente una `TechniqueContribution` por ID seleccionado y usa la versión real del frontmatter de cada skill.

## Flujo de integración

### 1. Fija hechos, desconocidos y público

Extrae oferta, destinatario, acción/URL, voz, identidad, referencias no verificadas, requisitos enumerables, restricciones y datos faltantes. Conserva hechos con fuente/estado. Motivaciones, objeciones o dudas no provistas son hipótesis internas vinculadas a una señal, no resultados de investigación.

Separa claramente contenido para equipo (hipótesis, desconocidos, advertencias de diseño, razones para omitir un claim, decisiones de sistema y notas de crítica) del copy para visitantes. Las notas internas se guardan en contributions, `claims`, `negativeConstraints`, `discardedElements` o traza. No expongas en la landing frases del proceso como “el brief no concreta…”, “por definir”, “no representamos una función”, “no se presentan ejemplos” o un catálogo de lo que no sabes. El copy debe explicar directamente la oferta, el alcance respaldado, cómo se usa y qué acción real seguir. Si hace falta conocer una condición para decidir, solicítala internamente; publícala solo cuando sea un dato confirmado de la oferta.

No inventes hechos de negocio, precios, métricas, funciones, clientes, testimonios, garantías, credenciales, urgencia ni disponibilidad. El contenido creativo que la persona pide (artículo de muestra, guía, ejercicio, receta, trabalenguas) sí se escribe completo y original; márcalo “muestra”/“ejercicio” cuando sea útil para no confundirlo con un historial real. “No inventar hechos” nunca es motivo para omitir una pieza creativa solicitada.

### 2. Reconcilia aportes sin perder su efecto

Agrupa decisiones por lo que cambian: narrativa, lenguaje, estructura, identidad, contenido inventariable, medios, exclusiones, accesibilidad y crítica. Refuerza decisiones compatibles; resuelve solo tensiones reales. Nombra la necesidad en conflicto, el control que manda, la resolución y dónde queda implementada. Conserva cada decisión del usuario y comprueba si una edición afecta dependencias (p.ej. ruta semilla → designDNA/secciones/prompt).

### 3. Selecciona una gramática y fija DesignDNA

Usa el `designSystemId` explícito si la persona eligió uno del catálogo local. Mantén ID/nombre estables; explica adaptación a la marca y solo descártalo por conflicto factual, de acceso o restricción explícita. Sin elección manual, usa selector/ranking XPage sobre el brief y explica una selección razonada. No reemplaces una elección por `service-concierge`, una composición beige/crema, neón o un split/hero genérico por comodidad. El sistema es gramática compositiva, no paleta o skin; `designDNA` es la identidad final única: motivo, roles de color, tipografía disponible localmente, composición e invariantes observables. Deriva propuestas de la oferta, no del estilo de referencia.

Selecciona 2–4 `compositionRecipeIds` reales del catálogo; asigna los que ayudan y justifica cada uno. Varía composición por tarea: puede usar entrada tipográfica, explicación ancha, secuencia, demostración, índice, diagrama, comparación sustentada, FAQ necesaria o cierre. Un nombre de receta no prueba uso: debe aparecer como estructura identificable. Evita repetir el mismo hero, cards, split o Bento sin necesidad. No fuerces diversidad decorativa si el brief requiere un patrón estable.

### 4. Arma el recorrido con información utilizable

Define primera pantalla (oferta, para quién, siguiente paso), alcance/funcionamiento, demo o piezas pedidas, dudas relevantes si hay respaldo y cierre. Para cada sección decide:

| Campo | Qué escribir |
|---|---|
| `id` / `role` | Identificador único y función clara |
| `purpose` | Pregunta/tarea específica de la persona |
| `headline` / `copy` | Idea nueva y explicación pública útil, sin notas de producción |
| `composition` | Estructura, escala, ancho, alineación y relación con secciones vecinas |
| `interaction` | Control exacto, estados, activación y fallback; “estática” si no hace falta |
| `mediaSlotIds` | Slots referidos existentes; vacío si el medio no aporta |

Con material suficiente, suele servir un recorrido de 5–7 secciones sustantivas; usa menos si la oferta es simple o el brief está corto. Desarrolla hechos y ejemplos disponibles en vez de rellenar con disclaimers, FAQ/tarjetas genéricas o bloques sobre falta de información. Cada título introduce una idea y el cuerpo agrega dato, alcance, proceso o contenido.

### 5. Preserva requisitos completos

Por cada entrega enumerada, crea una fila de `explicitContentRequirements` con ID único, enunciado, sección destino, `targetCount` exacto y cada pieza completa en `requiredItems`. Copia esas mismas piezas completas en el `copy` de esa sección y en el prompt editable. Cuenta entradas; un titular que dice “cinco ideas” no son cinco ideas. Respeta el máximo solicitado, no supongas inventario, y conserva la revisión de la persona palabra por palabra.

### 6. Define medios que puedan buscarse y seleccionarse

Cada slot pertenece a una sección y describe propósito, sujeto/acción/contexto, encuadre, luz/movimiento, proporción, alt y fallback local. Para imagen agrega 1–3 `searchQueries` y `selectionCriteria`: son valores para una búsqueda real futura, no resultados. La búsqueda de imagen usa los proveedores/APIs existentes; no inventes candidatos, autor, crédito o licencia. Video solo se ofrece si la secuencia explica mejor que una imagen fija: es una consulta al banco gratuito de stock configurado, no generación de video ni promesa de disponibilidad. Incluye secuencia, duración, query, criterios, poster, controles manuales/sin audio y alternativa estática/reduced-motion. El HTML previo a selección no lleva URL vacía ni placeholder hueco. El usuario puede cambiar consultas/criterios.

### 7. Pasa la crítica y escribe el prompt final

Revisa claims, IDs, URLs/anclas, media/section IDs, copy público, inventario, jerarquía, interacción, semántica, foco, movimiento reducido, contenido sin JS, referencias y restricciones negativas. Registra solo defectos reales y corrige el plan. No afirmes contraste medido, render, comportamiento probado o resultado de conversión si no se realizó.

El campo `prompt` es el contrato ejecutable en español para construir la página completa; no lo reduzcas a resumen, briefing general o estética. Debe contener, en orden legible:

1. **Tarea y límites:** crear standalone body HTML, CSS y JS vanilla, sin dependencias remotas, con copy público directo y sin notas internas/placeholder.
2. **Brief y fuente:** oferta, audiencia, acción/destino, voz, marca/hechos respaldados; referencias del usuario marcadas como no verificadas y límites factuales.
3. **Dirección implementable:** sistema elegido e ID, racional/adaptaciones, DesignDNA con tokens y valores por rol, stack tipográfico, motivo/recursos, anchos/ritmo e invariantes.
4. **Plano completo de secciones:** por cada ID/orden, tarea, título, copy final, inventario textual completo, composición concreta, contenido y transición; no borrar secciones al construir.
5. **Interacciones:** cada control, etiqueta/estado/evento/teclado/foco y fallback sin JS; define si no hay interacción y evita controles falsos.
6. **Slots de medios:** sección/slot ID, tipo, propósito, descripción, query(s), criterios seleccionables, alt, proporción, poster/reduced-motion y alternativa gráfica local. Distingue especificación de activo encontrado.
7. **Pruebas de entrega:** lista explícita de secciones e items requeridos que deben estar completos en DOM; clases/URLs del CTA; `data-xpage-section` en cada `<section>` y `data-xpage-slot` en cada slot.
8. **Acceso y responsive:** HTML semántico, foco, teclado, contraste intencional, móvil, `prefers-reduced-motion`, contenido entendible sin JS.
9. **Chequeo al finalizar:** cotejar salida con inventario/IDs/CTA; reparar omisiones localizadas una vez; reportar solo comprobaciones realmente hechas.

Incluye detalles específicos, copy final y decisiones de composición, no solo adjetivos. El prompt y plan deben describir la misma página. Si el prompt llega al límite de 12.000 caracteres, comprime repeticiones manteniendo las nueve partes y todo el inventario. No muevas metadatos de decisión a los párrafos que verá el visitante.

## Ejemplo de integración

Brief: taller ofrece cuatro ejercicios originales y una URL de inscripción. Ambitious-prompts propone el paso de orientación a práctica; human-copy pide verbos concretos; subtractive-design quita una segunda promesa repetida; negative-constraints descarta reseñas no provistas; creator-critic nota que faltaba un ejercicio. Resultado: una sección de práctica con cuatro piezas completas, marca “ejercicios de muestra”, diseño de secuencia numerada, una nota interna sobre testimonios omitidos y un único enlace de inscripción con URL real. La landing no anuncia “no se proporcionaron reseñas”.

## Cierre de consistencia

Antes de entregar confirma una vez: cobertura exacta de métodos; versión real; sistema explícito respetado o razón de adaptación; contribuciones editadas preservadas; IDs estables; cada requisito y slot asignado; inventario completo en plan/copy/prompt; claims sustentados; contenido público sin notas internas; interacciones/CTA reales; prompt implementable y coherente. Este cierre es inspección de artefactos, no evaluación masiva ni prueba visual.
