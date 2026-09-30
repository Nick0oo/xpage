# XPage v3 · métodos y espacios de trabajo

## Objetivo

Mejorar las salidas reales de Eve y hacer accesibles sus herramientas desde Biblioteca, trazabilidad y Studio. Mantener un único agente Eve, el mismo repo y las estructuras de datos actuales. Prioridad: implementación directa, workers Luna normal en una rama compartida, commits por entrega y un build final. Sin worktrees, TDD ni nuevas dependencias salvo necesidad concreta.

## 1. Métodos y generación

- Rehacer las siete skills pendientes: prompts ambiciosos, creador/crítico, imagen, vídeo, diseño sustractivo, restricciones negativas y copy humano; desarrollar especialmente `combine`.
- Cada skill explica cuándo aplicarse, procedimiento, artefacto editable, decisiones observables, ejemplo y criterios de revisión. Cargar las referencias reales y atribuidas de OpenDesign por la tool existente cuando corresponda.
- Preservar contenido enumerado, cantidades, restricciones, dirección visual y edición del usuario desde aporte a combinación y HTML. El prompt final incluye recorrido completo, tokens, composición por sección, interacción, medios y requisitos verificables.
- Imagen y vídeo muestran slots, consultas, candidatos reales, selección, autor/fuente y destino. No inventar resultados de búsqueda ni afirmar generación de vídeo. Vídeo solo de banco gratuito; imagen conserva búsqueda y API configurada.

## 2. Biblioteca y generaciones sin guardar

- Rehacer el índice como espacio visual de páginas: búsqueda, filtros, tarjetas con preview seguro y acciones claras.
- Enlazar siempre a `/library/[id]`: detalles, preview, editor, prompt, descarga, medios y trazabilidad según disponibilidad.
- Añadir una pestaña de generaciones sin guardar recuperadas de salidas HTML completas en trazas. Ver, descargar, abrir en Studio y guardar explícitamente; no añadirlas automáticamente a Biblioteca.
- Reutilizar contratos de landing y persistencia existentes. No introducir otra base ni migración para duplicar páginas.

## 3. Trazabilidad por proceso

- Presentar carpetas desplegables por raíz de proceso usando `rootTraceId`, `parentTraceId` y `sourceTraceId`.
- Mostrar etapas/ejecuciones, estado, fecha, vínculos a páginas y acceso a eventos individuales; conservar errores y procedencia.
- No agrupar por títulos parecidos ni borrar las trazas originales. Ajustar vínculo de nuevas ejecuciones si la inspección muestra que falta.

## 4. Studio

- Un espacio de edición más claro: lista de secciones, preview y panel de cambios/código con acciones separadas.
- Añadir secciones mediante Eve, reordenar con drag and drop y botones accesibles, editar HTML/CSS/JS y previsualizar antes de aplicar.
- Preservar marcadores de secciones/slots, revisión, undo y aislamiento del preview. Usar las propuestas/revisiones existentes para cambios guardados; las páginas sin guardar conservan estado editable sin guardado silencioso.
- Conectar candidaturas y selección de medios reales con los métodos imagen/vídeo y el editor.

## 5. Espacio Eve

- Ampliar `/eve-prueba` con conexión/modelo, prueba actual, catálogo de skills, sistemas de diseño y materiales/plugins de OpenDesign realmente disponibles.
- Permitir inspeccionar y utilizar el sistema de diseño elegido en la creación. Mostrar con precisión qué es una referencia y qué es una tool ejecutable.
- No implementar un marketplace o runtime de plugins paralelo. Mantener el agente actual y controles locales existentes.

## Reparto y propiedad de archivos

1. **Worker métodos/Eve**: `agent/**`, prompts/landings, catálogo de técnicas, eventos de edición de aportes, espacio Eve y selección de sistema. No editar Studio/Home sin coordinación.
2. **Worker colección/trazas**: Biblioteca, trazabilidad, APIs de colección/drafts, repositorio de landings y helpers de trazas. Publicar contrato para abrir drafts en Studio.
3. **Worker Studio/medios**: Home, componentes Studio/media/preview y APIs/helpers de edición de secciones. Integrar contrato de drafts y selección de sistema acordados con los otros workers.

Workers comparten `feat/xpage-workspaces-v3`. El coordinador hace los commits con archivos explícitos, integra localmente en `develop`, ejecuta `pnpm build`, resuelve errores y publica `main` según autorización existente.

## Criterios de entrega

- Ocho métodos y combinado mantienen el brief y producen artefactos útiles y específicos.
- Biblioteca permite abrir detalles/editor y recuperar generaciones sin guardar.
- Un proceso aparece como una carpeta navegable con todas sus ejecuciones relacionadas.
- Studio permite crear/reordenar secciones y editar código sin perder preview, revisión ni undo.
- Eve muestra y permite usar capacidades realmente integradas.
- Build final correcto. Revisión manual focalizada de navegación y edición; no batería de generaciones de pago.
