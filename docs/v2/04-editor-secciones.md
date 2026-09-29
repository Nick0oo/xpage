# Plan 04 · Editor de secciones con Eve

**Objetivo:** elegir un bloque de la preview, describir el cambio y revisar una propuesta antes de aplicarla.

## Recorrido disponible

1. En Studio, guarda la landing en Biblioteca para empezar su historial. La página se muestra en un `iframe` con sandbox opaco. Un clic o la selección con Enter/Espacio envía solo el `sectionId` al padre. El padre valida `event.source`, origen opaco, nonce y que el ID sea único y pertenezca al snapshot actual.
2. Elige una o varias técnicas, escribe el cambio y usa el modelo actualmente seleccionado en Studio. La solicitud llega al mismo Eve local y pide un `SectionPatch` estructurado para el contenido interior de una sola sección.
3. El panel compara la sección anterior y la propuesta en dos vistas aisladas. Aplicar y descartar son acciones explícitas; descartar no modifica la landing.
4. Aplicar crea una revisión persistente de HTML/CSS/JS y emite evento de traza con sección, técnicas, modelo, síntesis y referencias. Deshacer crea otra revisión que recupera la anterior; no elimina registros. Una propuesta creada sobre un contenido que cambió se rechaza como obsoleta.

## Límites de seguridad y conservación

- parse5 construye el árbol HTML para localizar y sustituir el contenido de una sección única. Se rechazan IDs ausentes o duplicados, etiquetas ejecutables, atributos de evento, cambios a slots de medios o cambios a nodos `<img>`, `<video>` y `<source>` existentes.
- PostCSS y el parser de selectores validan que cada selector nuevo comience con `[data-xpage-section="<id>"]`. No se permiten reglas CSS globales, anidamiento, carga de URL ni `@import`. El CSS/JS global existente y el JS de la landing se conservan.
- La revisión base y una huella del contenido protegen propuesta y aplicación. Si medios o contenido cambiaron después de una revisión, deshacer se bloquea y explica el motivo en vez de sobrescribir esos cambios.
- Landings antiguas siguen abriendo y descargando. Si no tienen marcadores válidos, el panel informa que la edición puntual está deshabilitada.
- El flujo es local a Studio y requiere guardar la landing. La Biblioteca sigue disponible para lectura, descarga y trazabilidad.

## Datos y trazabilidad

`SectionEditProposal` conserva la propuesta pendiente, su modelo/técnicas y huella de revisión. `SectionRevision` guarda el snapshot completo usado para deshacer. Los eventos de traza usan las fases `section-edit-proposal`, `section-edit-apply`, `section-edit-reject` y `section-edit-undo`; guardan síntesis y referencias, no cadena de pensamiento.

## Dependencias de parser

parse5 realiza el recorrido y serialización HTML. PostCSS analiza reglas CSS y `postcss-selector-parser` analiza selectores. Son dependencias directas para que los controles de alcance no dependan de regex.
