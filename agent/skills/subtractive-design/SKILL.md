---
name: subtractive-design
description: Use when a landing plan contains repeated copy, decorative UI, competing actions, overlong sections, or redundant controls. Evaluate each element by the visitor task it supports; remove or combine only what can be removed without losing evidence, required content, context, access or an explicit user choice.
---
# Diseño sustractivo · v2.0.0

## Propósito

Reduce el esfuerzo de lectura y decisión eliminando o combinando elementos que no cumplen una tarea útil. La reducción es una decisión editorial con conservación de contenido, nunca una consigna estética para vaciar la página ni una invitación a borrar requisitos.

## Referencias locales

Si está disponible `read_seed_reference`, para propuesta/plan consulta `frontend-design`, `web-prototype-layouts` y `system-prompt-excerpts`; usa `web-prototype-checklist` en la revisión y `web-prototype-skill` al construir HTML. Las referencias fijadas de OpenDesign informan composición modular y revisión de oficio, no ordenan copiar un layout. Totality Festival solo es referencia contextual si el brief lo justifica. Anota las que realmente leíste.

## Cuándo se aplica

- Se seleccionó `subtractive-design`, o aparecen bloques que repiten una misma promesa/tarea.
- Hay más de un CTA con el mismo destino, adornos que compiten con el contenido o controles cuya acción no está clara.
- La página requiere recortar, pero tiene inventarios, condiciones, objeciones o contexto que deben seguir disponibles.

## Procedimiento

1. **Fija el conjunto protegido.** Copia los hechos respaldados, claims y fuentes, inventario explícito completo/cantidades, accesibilidad, restricciones, CTA/destino y decisiones editadas por el usuario. Ninguno se elimina por brevedad.
2. **Haz inventario de candidatos.** Recorre cada sección, idea/copy, medio, adorno, CTA/control y pregunta. Para cada elemento pregunta: qué tarea resuelve, quién lo necesita, si se repite, si puede combinarse y qué información se perdería.
3. **Elige conservar, combinar, retirar o pedir dato.** Combina dos bloques solo si comparten tarea y se mantiene la relación con los hechos; elimina una repetición con referencia a la copia restante; elimina decoración solo cuando no contribuya a la identidad/comprensión; conserva un control si tiene una acción operable.
4. **Mantén recorrido suficiente.** Asegura que hero aún define oferta/audiencia/acción, que detalles necesarios para decidir sobreviven y que el cierre conserva un destino real. No fuerces tres secciones ni una longitud objetivo.
5. **Valida los costes.** Para cada eliminación, comprueba explícitamente que no desapareció ninguna pieza enumerada, fuente, condición, texto informativo, alt/fallback, estado de teclado/foco, sección referida por ancla o elección anterior de la persona.
6. **Documenta incertidumbre.** Si dos contenidos parecen duplicados pero su diferencia cambia una condición, mantén ambos o pide el dato en `open_inputs`; no adivines.

## Artefacto editable

Devuelve en `TechniqueContribution.artifact` una tabla compacta:

```text
element | tarea actual | decisión (keep/combine/remove/open question) | razón observable
preserved_inventory: IDs/requisitos/cantidades y secciones destino sin cambios
section_map_after: sección → tarea → contenido que sobrevive
cta_map: acción principal, otros enlaces necesarios y destino real
removed_elements: lista exacta que `discardedElements` debe reflejar
accessibility_preserved: teclado/foco/semántica/texto alternativo/reduced-motion
references_read: nombres leídos o “sin referencias locales”
```

`discardedElements` del plan debe repetir los descartes sustantivos y sus motivos; no escondas la eliminación en prosa. Propón un máximo de 12 candidatos relevantes en la ficha, no cada palabra cambiada. Si no hay nada que retirar, registra que la estructura se conserva y por qué.

## Ejemplo

El plan tiene tres secciones que repiten “fácil de usar”; el brief detalla además instalación y requisitos técnicos. Combina las tres promesas en una descripción apoyada en esos pasos; conserva instalación y requisitos porque cambian la decisión. Retira un CTA duplicado solo si la acción principal permanece disponible.

## Revisión

- Para cada descarte hay una razón observable ligada a una tarea, no “se ve más limpio”.
- Los hechos, condiciones, piezas solicitadas y cambios del usuario sobreviven exactamente.
- La información para decidir sigue antes del CTA y el destino existe.
- La interacción restante conserva etiqueta, operación por teclado, foco y alternativa accesible.
- No se redujo la página a longitud fija ni se convirtió en collage vacío.
