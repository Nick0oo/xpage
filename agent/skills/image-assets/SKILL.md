---
name: image-assets
description: Use when a landing brief calls for a purposeful still image, asset specification, or real image search. Create section-linked image slots with composition, alt text, searchable queries, and selection criteria that the XPage media workspace can use. Describe candidates only after a real search returns them.
---
# Activos de imagen · v2.0.0

## Propósito y límite

Especifica qué imagen ayudaría a entender una sección, cómo buscar/seleccionar una adecuada y cómo debe encajar en la composición. Esta skill no genera archivos ni afirma que un activo esté disponible, autorizado o seleccionado. La búsqueda y selección se hacen después desde las herramientas reales de medios.

## Referencias locales

Cuando `read_seed_reference` esté disponible, consulta `frontend-design`, `web-prototype-layouts` y `web-prototype-checklist`; para construir HTML consulta además `web-prototype-skill`. Estas referencias fijas y atribuidas de OpenDesign orientan dirección visual, jerarquía del recorte y revisión; no aportan imágenes o plugins ejecutables. Menciona solo las referencias efectivamente leídas. Evita usar la muestra Totality si no tiene relación clara con el brief.

## Cuándo aplicarla

- El método `image-assets` fue seleccionado o la sección necesita información visual que el copy, diagrama o tipografía no expresan con igual claridad.
- Se conoce la tarea y el lugar que ocuparía el activo en el recorrido.
- Si la imagen es meramente decorativa, redundante o se usaría como prueba no proporcionada, recomienda omitirla.

## Procedimiento

1. **Elige la tarea visual.** Escribe qué debe permitir ver o comparar la imagen y qué dato sigue explicado en texto. No uses “hacerlo atractivo” como único propósito.
2. **Ancla el slot.** Asigna un ID corto y único y vincúlalo a una sección existente mediante `mediaSlotIds`. Nunca inventes una sección destino ni reutilices un slot en otras secciones.
3. **Define la escena.** Completa sujeto, acción, contexto, punto de atención, encuadre, distancia/perspectiva, luz y relación cromática con DesignDNA. Distingue una propuesta de escena de una característica verificada del producto.
4. **Planifica proporción/recorte.** Elige una relación de aspecto (por ejemplo `4:3`, `3:2`, `1:1`, `16:9`) y describe la zona que debe sobrevivir a recortes de móvil. Deja espacio para texto solo si la composición lo pide; evita incrustar texto en la imagen.
5. **Crea consultas de búsqueda.** Incluye una a tres frases concretas, simples y buscables: sujeto/acción + contexto; puede incluir una variante de encuadre o luz. No metas keywords de marca que filtren por algo no disponible ni llames “candidatos” a estas consultas. Son valores iniciales para la búsqueda real de imágenes que ofrece XPage.
6. **Escribe criterio de selección.** Indica qué observar al comparar resultados: coincidencia de sujeto/acción, contexto no engañoso, orientación/recorte, foco, paleta, ausencia de texto/logos y legibilidad junto al copy. Para una oferta cuyo producto no se ve, no simules una captura.
7. **Redacta texto alternativo contextual.** Si la imagen transmite contenido, describe esa información en una frase concisa, sin empezar por “imagen de”. Si es puro adorno y no añade información, indica `altText: ""` cuando el contrato de medios lo permita; en el contrato actual, explica en `purpose` que puede omitirse y acuerda alt breve descriptivo en el slot requerido. No repitas el párrafo adyacente.
8. **Deja fallback listo.** Describe el gesto visual local (CSS/SVG/diagrama) o el copy que mantiene la sección comprensible si no hay imagen seleccionada. No dejes un rectángulo vacío.

## Artefacto editable

En `TechniqueContribution.artifact`, registra una ficha por slot de imagen con este contrato:

```text
slot_id / section_id:
purpose: información que aporta y relación con el copy
scene: sujeto, acción y contexto
framing: foco, plano, orientación, recorte móvil y espacio para texto
lighting_or_palette: luz y relación con DesignDNA
aspect_ratio: proporción elegida y motivo
alt_text: texto alternativo final, o nota de omisión decorativa
search_queries: 1–3 consultas iniciales para búsqueda real
selection_criteria: criterios concretos para aceptar/descartar resultados
fallback: diagrama/recurso local que conserva sentido sin el activo
status: specification-only; no existe candidato hasta ejecutar búsqueda
references_read: nombres leídos o “sin referencias locales”
```

Los slots usan el ID de `mediaSlots`; `section.mediaSlotIds` repite ese ID. Las consultas y criterios pertenecen al artifact y también deben reflejarse en el prompt editable para sobrevivir a la combinación. Al hacer una búsqueda posterior, el workspace muestra solo candidatos reales con proveedor, autor, fuente/crédito y licencia devuelta por la API; la decisión del usuario conserva esa procedencia.

## Ejemplo

Para explicar una sesión de ajuste de bicicleta: `subject=manos ajustando freno de bicicleta urbana en un taller realista`; consulta inicial `mechanic adjusting bicycle brake in small workshop`; criterio = que se vea el cable y la pinza en acción, recorte horizontal con manos visibles, sin marca identificable ni interfaz ficticia. Fallback: diagrama CSS/SVG de la palanca y la pinza. Esto no afirma que exista el archivo.

## Revisión

- El slot apoya una tarea visible de su sección y tiene un ID referido correctamente.
- Escena, orientación y encuadre sirven al contenido; no fabrican evidencia del negocio.
- Hay consultas buscables y criterios de selección independientes, no una afirmación de resultados.
- Alt text describe el dato visual sin duplicar copy; la ausencia del activo no vacía la sección.
- La elección futura permanece vinculada a candidato, autor/fuente y licencia reales.
