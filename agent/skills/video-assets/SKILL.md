---
name: video-assets
description: Use when a real sequence of movement explains a landing section better than a still image and the user wants a future stock-video search specification. Define an optional, silent, controllable clip with a real search query, candidate criteria, poster and static/reduced-motion alternative. XPage does not generate video; available results come only from its configured free stock-video search.
---
# Activos de vídeo · v2.0.0

## Propósito y límite

Usa movimiento solo si el orden temporal de acciones comunica algo que una imagen fija no puede mostrar igual de bien. Esta skill propone un slot y una búsqueda futura; no genera ni obtiene video, no afirma existencia/gratuidad/licencia de un archivo y no diseña una API de generación. En XPage los resultados se consultan mediante el banco gratuito configurado (Pexels); si no está disponible, el plan conserva una alternativa estática.

## Referencias locales

Si `read_seed_reference` está disponible, carga `frontend-design`, `web-prototype-layouts` y `web-prototype-checklist`; para HTML carga también `web-prototype-skill`. Adapta las ideas de composición y crítica de OpenDesign a reproducción local, sin autoplay, sin dependencias remotas en el HTML y con control accesible. No cargues Totality como estilo automático. Menciona solo lo leído.

## Criterio de uso

No propongas un video para ambientar, completar una sección ni sustituir una fotografía. Antes de abrir un slot, responde: “¿Qué estado A pasa a qué estado B, qué aprende la persona al ver el cambio, y por qué un fotograma/diagrama no lo explica igual?”. Si no hay respuesta específica, omite video y usa imagen, secuencia estática o nada.

## Procedimiento

1. **Define la secuencia.** Escribe acción inicial, dos a cuatro momentos ordenados, estado final y duración aproximada. No incluyas funciones/beneficios que el brief no respalde.
2. **Asigna la sección y el uso.** Crea un ID único, `type: "video"`, propósito, sujeto, encuadre, `aspectRatio`, contexto/luz si importa y referencia en `mediaSlotIds`. Limita a un slot de clip solo donde una secuencia añade información.
3. **Escribe consultas reales de stock.** Entrega una a tres consultas simples en inglés o español según términos visuales útiles; especifica sujeto + acción + contexto. Sirven para búsqueda de stock real posterior. No simules thumbnails, URL, autor, licencia, resultados ni disponibilidad.
4. **Define qué aceptar.** Criterios concretos de contenido, duración, encuadre, movimiento de cámara, orientación, contexto no engañoso y ausencia de marcas/logos. Rechaza loops que no muestran el proceso, material que promete una instalación real inexistente o clips cuyo mensaje dependa del audio.
5. **Diseña el póster.** Indica el momento y encuadre que comunica la secuencia detenida. Usa `poster` como descripción textual del fotograma requerido; no lo trates como un archivo local hasta que el usuario seleccione uno.
6. **Asegura uso accesible.** Controles nativos, pausa y reproducción manual, `muted` si el clip es silencioso, sin autoplay; conserva subtítulos si hay voz (preferiblemente no uses voz). Con `prefers-reduced-motion`, reemplaza u oculta movimiento con el póster y copy; el contenido relevante aparece fuera del reproductor sin JavaScript.
7. **Describe fallback y destino.** Una ilustración/diagrama o una secuencia numerada HTML transmite el paso sin clip. El Media Workspace puede buscar candidatos reales de video y asociar una selección a `sectionId`/`slotId`; hasta entonces el artifact es especificación.

## Artefacto editable

Usa `TechniqueContribution.artifact` y los campos del contrato de XPage:

```text
slot_id / section_id:
purpose: cambio o proceso que necesita movimiento
sequence: inicio → 2–4 acciones → cierre; duración aproximada
subject / context:
framing / aspect_ratio: movimiento, punto focal y recorte móvil
poster: descripción del fotograma fijo
search_queries: 1–3 consultas para el buscador de stock real
selection_criteria: acción visible, duración, movimiento, contexto y exclusiones
playback: manual, controls, sin sonido, sin autoplay
reduced_motion: alternativa completa de imagen/secuencia estática
alt_text: propósito textual de la pieza y caption/transcripción si hay información no visual
status: specification-only; ningún archivo/candidato confirmado
references_read: nombres reales o “sin referencias locales”
```

En `mediaSlots`, `poster` y `reducedMotion` capturan los requisitos del player actual; añade `searchQueries` y `selectionCriteria` cuando el contrato esté disponible. Repite el resumen en el prompt editable. En el HTML generado, no apuntes a URLs de búsqueda ni uses un `<video>` vacío. La UI de medios conserva candidato real, autor, fuente/crédito y licencia al seleccionar.

## Ejemplo

Un brief describe el plegado de una caja: secuencia plano fijo de cartón → dos pliegues → caja armada, 6–10 segundos, cámara cenital. El detalle temporal sí aporta; criterios: manos y pliegues visibles, sin logotipo ni instrucciones incrustadas. Poster: cartón a medio plegar. Alternativa: tres dibujos SVG numerados siempre visibles. Esto especifica búsqueda; no afirma que exista el clip.

## Revisión

- La secuencia tiene un cambio que no comunica igual una imagen fija.
- Consulta y criterios orientan una búsqueda libre real y no inventan resultados.
- El plan no contiene ruta/URL de video inexistente ni autoplay.
- El póster y la alternativa estática conservan el contenido importante.
- El movimiento es opcional, silencioso, controlable y respeta movimiento reducido.
- Candidato/autor/licencia se incorporan solo después de una selección real.
