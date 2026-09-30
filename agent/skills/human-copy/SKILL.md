---
name: human-copy
description: Use when landing headlines, section copy, labels, calls to action, or microcopy need to sound clear, specific, and human while staying faithful to evidence. Write useful visitor-facing content; keep hypotheses, missing inputs, production notes and design rationale in plan/traces rather than exposing them on the page.
---
# Copy humano · v2.0.0

## Propósito

Escribe como una persona que explica una oferta útil a otra persona: concreta, directa, respetuosa y fácil de recorrer. El copy debe ayudar a entender, evaluar y actuar. La cautela factual no consiste en publicar todas las incógnitas internas; consiste en no afirmar lo que no es verdad y en pedir los datos ausentes fuera del texto promocional.

## Referencias

No atribuyas a OpenDesign la investigación de copy humano. Sus materiales locales pueden ayudar con jerarquía y composición: si `read_seed_reference` está disponible, lee `frontend-design` y `web-prototype-checklist` cuando el texto forme parte de una página y registra esas referencias como contexto visual, no como fuente lingüística. La ficha local `REFERENCE.md` describe las referencias generales de lenguaje claro. No afirmes que la tool verifica estilo o legibilidad automáticamente.

## Cuándo se aplica

- `human-copy` fue seleccionado o el texto suena abstracto, redundante, exagerado, frío o lleno de microcopy genérico.
- Se redactan piezas originales pedidas por la oferta, además de copy descriptivo.
- La página necesita preservar una voz o términos de marca expresos.

## Procedimiento

1. **Crea un mapa de lenguaje.** Extrae palabras/giros de oferta y audiencia, verbos de la tarea, nombres exactos del producto, voz declarada y claims respaldados. Mantén etiquetas del usuario y vocabulario técnico necesario; no imites errores.
2. **Define un mensaje por bloque.** Un título afirma una idea específica; el cuerpo agrega información nueva y necesaria. Si el cuerpo repite título/beneficio con sinónimos, reemplázalo con funcionamiento, alcance, ejemplo, condición o siguiente paso real.
3. **Escribe desde la utilidad del visitante.** Explica directamente oferta, destinatario, qué recibe/cómo funciona con los datos disponibles, y qué puede hacer a continuación. No describas el proceso de redacción ni conviertas preguntas del equipo en copy: frases como “el brief no concreta…”, “por definir”, “no representamos…” o “no se presentan ejemplos” pertenecen a plan/traza o a una consulta interna.
4. **Distingue hechos de obras creativas.** No inventes funcionamiento del producto, precios, cifras, resultados, clientes, testimonios ni garantías. Sí puedes crear el artículo, menú, ejercicio, guía, trabalenguas o ejemplo que el usuario pide como entrega; escribe las piezas completas y márcalas “muestra”/“ejercicio” cuando alguien podría confundirlas con experiencia real. No las presentes como blog histórico o testimonio.
5. **Construye afirmaciones con fuente.** Para una frase verificable, confirma que el brief la respalda. Si falta dato, registra `open_input`/`hypothesis` internamente. En público, elimina la frase no sustentada o describe una capacidad neutral confirmada; no uses disclaimers sobre limitaciones del encargo salvo petición explícita.
6. **Edita microcopy.** CTA usa verbo y objeto/destino concretos (“Solicitar una cita” si el brief da ese paso), nunca “Descubre más” si puede especificarse. Labels y controles anticipan su efecto; errores explican qué corregir sin culpar.
7. **Comprueba lectura.** Quita relleno, nominalizaciones, superlativos sin fuente, urgencia artificial, fórmulas “revoluciona el futuro”, “lleva al siguiente nivel”, “solución integral” y llamadas impersonales. Alterna ritmos sin sacrificar precisión. Evita infantilizar o fingir intimidad.
8. **Protege inventarios.** No parafrasees textos que deben reproducirse exactamente; cada pieza pedida permanece completa en su sección y prompt final. Mantén nombres, cifras y condiciones tal como los fijó el usuario.

## Artefacto editable

Completa `TechniqueContribution.artifact` con una muestra pequeña pero accionable:

```text
voice: rasgos claros con evidencia del brief, no arquetipo inventado
audience_terms: vocabulario que ya usa el brief
message_map: bloque → única idea → fuente/estado
headline_and_copy: selección de 2–5 pares representativos antes/después si hay reescritura
cta: texto, acción y destino real
creative_samples: piezas originales pedidas, cantidad y etiqueta de muestra/ejercicio
internal_open_inputs: datos pendientes que no salen al visitante
claims_removed_or_softened: texto → motivo/fuente
references_read: nombres reales o “sin referencias locales”
```

Usa `copyRevisions` para las ediciones de contenido más significativas; no vuelques correcciones menores de puntuación. Marca cada claim con fuente/estado según el esquema. `combine` decide el copy completo y conserva íntegros los requisitos enumerables.

## Ejemplo

Brief: “Boletín semanal con ejercicios de escritura para principiantes; suscribirse por correo; no se da archivo de artículos publicados”. Copy público: “Un ejercicio breve para empezar a escribir esta semana”, muestra escrita para ese boletín. No digas “aún no hay artículos publicados” ni inventes suscriptores o aperturas.

## Revisión

- Oferta, destinatario y siguiente paso aparecen sin revelar notas del proceso.
- Cada bloque añade información, no repite la promesa ni usa clichés.
- Todo claim de negocio tiene fuente; piezas originales pedidas no se hacen pasar por casos reales.
- Los campos internos de hipótesis/desconocidos no se trasladan al copy de landing.
- El CTA anuncia acción real, el microcopy ayuda a usarla y se conserva el inventario completo.
