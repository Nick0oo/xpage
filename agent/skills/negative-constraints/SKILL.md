---
name: negative-constraints
description: Use when the page must preserve exclusions, brand/accessibility rules, factual boundaries, or user edits through combination and HTML. Convert negative instructions into positive, observable checks and identify their source. Never expose internal uncertainties, model reasoning, or production notes as visitor-facing copy.
---
# Restricciones negativas · v2.0.0

## Propósito

Vuelve verificables los límites de una landing: qué no debe aparecer, qué contenido requiere evidencia, qué conducta es inaceptable y qué se debe preservar. La restricción vive como regla interna para plan, traza y control de salida; no se convierte automáticamente en un titular que la página anuncia.

## Referencias locales

Si `read_seed_reference` está disponible, consulta `frontend-design`, `web-prototype-checklist` y `system-prompt-excerpts`; para HTML usa también `web-prototype-skill`. Aplica el checklist de oficio y composición atribuido a OpenDesign dentro de las reglas de XPage. Estas son referencias locales, no políticas remotas ni plugins ejecutables. No necesitas cargar Totality; no uses su estética como ejemplo universal. Registra solo referencias leídas.

## Procedimiento

1. **Extrae límites y procedencia.** Lee brief, método, preferencia de marca, accesibilidad, contenido enumerable, URLs/destino y decisiones editadas. Clasifica cada regla como explícita del usuario, obligación del producto/schema o prudencia derivada.
2. **Escribe una prueba local.** Convierte “no inventes testimonios” en “cada cita atribuida tiene texto/fuente en brief; si no, eliminar”; “no uses hero split” en “examinar estructura efectiva de hero en candidates, DesignDNA, prompt final y HTML”; “no autoplay” en “ningún video empieza solo y existe control visible”.
3. **Controla claims.** Para cada precio, cifra, garantía, cliente, cita, credencial, característica, resultado, disponibilidad, urgencia, integración o comparación, encuentra fuente exacta y estado (`brief-backed`, `hypothesis`, `unsupported`). Las hipótesis y lo no respaldado nunca se publican como hechos.
4. **Separa contexto interno y copy público.** Registra desconocidos, hipótesis, decisiones de diseño, notas de revisión y condiciones pendientes en artefacto de método, plan, traza o pregunta al usuario. La landing dice directamente qué ofrece, para quién, cómo se usa y qué acción puede tomar. No publique frases como “el brief no concreta”, “faltan datos”, “no representamos una función” o “no se presentan ejemplos”. Si una condición comercial importante sí debe conocerla el visitante, exprésala como parte factual de la oferta solo con texto confirmado.
5. **Permite crear material solicitado.** Los hechos de negocio deben venir del brief. Cuando la oferta incluye un artículo de demostración, trabalenguas, ejercicio, menú o guía, redacta la pieza original completa y rotúlala como muestra/ejercicio si hace falta; no la presentes como caso real, uso histórico o publicación existente. Conserva cantidad y destino en inventario, copy y prompt.
6. **Propaga restricciones.** Mantén cada control relevante en `negativeConstraints` y en el prompt editable; aplícalo a composición, secciones, slots, interacción, preview/HTML y reparación. Si una regla escrita se contradice con un artefacto visual/código, la presencia del artefacto indica incumplimiento.
7. **Revisa positivos y negativos.** Busca el literal y sinónimos/variantes que eludan la regla. Repara el contenido o declara un dato faltante internamente; no llenes la página de disclaimers para probar cautela.

## Artefacto editable

En `TechniqueContribution.artifact`, devuelve límites trazables:

```text
rule: texto afirmativo comprobable
source: campo/cita de brief, contrato XPage o requisito accesible
scope: plan/copy/prompt/HTML/media/interacción
check: evidencia que confirmaría cumplimiento
failure_action: quitar/cambiar/consultar, preservando requisito
public_copy: contenido útil que permanece en la página; “ningún disclaimer interno” cuando aplica
claims_reviewed: claim → fuente/estado → acción
enumerable_creative_work: piezas originales pedidas, cantidad y marca de “muestra” si aplica
references_read: nombres reales o “sin referencias locales”
```

`negativeConstraints` lleva checks completos y concretos; `claims` lleva fuente y estado. El texto privado de un `artifact` no se copia al copy de la landing. Para el análisis, separa claim no sustentado de pieza creativa original solicitada: la primera se elimina; la segunda puede escribirse sin presentarla como evidencia real.

## Ejemplo

Brief: curso para principiantes con cuatro ejercicios de muestra; no afirma alumnos reales ni resultados. Regla interna: “no incluir alumnos, testimonios ni tasas de finalización”. Copy público: titular del curso y cuatro ejercicios originales, marcados “práctica de muestra”. No mostrar “no podemos asegurar resultados”, salvo que sea una condición confirmada que deba conocer el comprador.

## Revisión

- Cada regla señala origen, superficie que cubre y prueba de cumplimiento.
- No aparecen afirmaciones factuales sin fuente ni activos/funciones no disponibles.
- Las exclusiones compositivas se comprueban por forma, no solo por etiqueta.
- Notas de incertidumbre o proceso permanecen en plan/traza; copy público explica directamente la oferta.
- El material creativo solicitado aparece completo con cantidad correcta y sin atribución histórica falsa.
- Las restricciones sobreviven al plan, prompt, edición y reparación del HTML.
