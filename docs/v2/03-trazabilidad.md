# Plan 03 · Trazabilidad de métodos, medios y revisiones

**Objetivo:** responder, para cualquier landing, qué datos entraron, qué método se aplicó, qué decisión produjo, qué proveedor intervino, qué activo se eligió y qué cambió después.

**Depende de:** contratos de plan, sección y contribución del plan 01. Publica el contrato de eventos para 02, 04, 05 y 07.

## Registro mínimo

Extender `GenerationTrace`/`GenerationTraceStep` o migrarlos de modo compatible; evitar dos sistemas de trazas paralelos. Cada evento nuevo tendrá ID, traza raíz, ejecución, evento padre si existe, orden, fase, tipo, versión de skill, técnicas, estado, fechas/duración y referencias a proyecto, revisión, sección y activo. Guardar entradas/salidas textuales útiles y resúmenes de decisiones; binarios y resultados grandes se referencian por ID.

Las fuentes se clasificarán como `brief`, `documento`, `web` o `proveedor`. Cada afirmación mostrará si es dato aportado, evidencia externa, hipótesis o inferencia del agente. La vista no fingirá disponer de pruebas de rendimiento o psicología de usuarios que no existan. Guardar uso/coste cuando el proveedor lo devuelva; si no, mostrar «no disponible», sin inventar cifras.

## Profundización de los ocho métodos

Crear una ficha de investigación versionada por método, cerca de su skill, con: definición, cuándo conviene, entradas, procedimiento, entregable, señales de calidad, riesgos, ejemplos aplicados a XPage y fuentes consultadas. La guía PDF es el temario; contrastar sus afirmaciones de conversión o diseño con documentación o investigación primaria cuando se presenten como hechos. Cada ejecución conservará la versión de la ficha/skill que utilizó, aunque después se edite el texto.

## Secuencia del worker

1. Revisar trazas ya existentes y migraciones. Diseñar una migración aditiva que conserve sus URLs, pasos y landings históricas. No reescribir datos antiguos como si contuvieran decisiones nuevas.
2. Crear una API interna simple para registrar eventos desde Eve, rutas actuales, medios y editor. Evitar contar pasos con `count + 1` sin protección ante concurrencia; asegurar orden único por ejecución.
3. Registrar fases: brief, investigación/dirección, método, combinación, prompt editado, construcción, revisión crítica, búsqueda/generación/selección de activo, edición de sección, aceptación/reversión y exportación.
4. Actualizar la lista para incluir procesos de prompt y procesos incompletos, con filtros claros. En detalle, mostrar línea de tiempo, aportes por método, fuentes, activos, revisiones y resultado sin abrir todos los prompts largos de entrada.
5. Migrar nuevas imágenes a referencias de `MediaAsset`. Para trazas históricas con base64, seguir leyéndolas y ofrecer migración diferida si hace falta, sin borrarlas.

## Aceptación

- Una landing individual y una combinada permiten seguir método → decisión → prompt → código → activo → revisión.
- Fallos y reintentos aparecen como eventos separados; no sobrescriben el resultado exitoso anterior.
- Una fuente/hipótesis se distingue visualmente; no se muestra razonamiento privado del modelo.
- Landings y trazas antiguas siguen abriendo. Una traza nueva con imagen no almacena base64 en SQLite.
- Las escrituras simultáneas no duplican orden ni pierden eventos.
- `pnpm lint`, `pnpm typecheck`, `pnpm build` y comprobación de migración con copia de datos de prueba pasan.

**Frontera:** el worker crea registro y visualización; no decide la política creativa ni los conectores de bancos.

## Contrato aditivo publicado

`src/lib/generation-traces.ts` exporta `recordTraceStep(traceId, input)` y los tipos `TraceStepInput` y `TraceReference`; `recordProviderAttempts` acepta `executionId` y `references`. Los campos nuevos son opcionales para mantener los escritores existentes. Un worker puede registrar, por ejemplo:

```ts
await recordTraceStep(traceId, {
  executionId,
  parentStepId,
  eventType: "revision",
  phase: "section-edit",
  title: "Sección revisada",
  decisionSummary: "Se aclaró el CTA según el brief.",
  skillVersions: { "human-copy": "1.0.0" },
  references: [
    { kind: "section", id: sectionId, label: "Hero" },
    { kind: "media-asset", id: assetId, label: "Imagen hero" },
  ],
});
```

Cada llamada asigna su secuencia dentro de una transacción y persiste el evento junto con el contador; `id` opcional permite reintento idempotente. Los eventos clonados conservan `parentTraceId` y `parentStepId`, y las trazas mantienen raíz, origen y ejecución. Las referencias aceptan `sourceType` (`brief`, `documento`, `web`, `proveedor`) y `claimStatus` (`provided`, `external-evidence`, `hypothesis`, `inference`). Guardar síntesis y evidencia verificable; nunca cadena de pensamiento. Las imágenes nuevas no se persisten como base64: pasar el ID real de `MediaAsset` en `references` cuando el worker de medios lo entregue. El marcador histórico base64 sigue siendo legible en la vista.

La migración añade columnas con defaults seguros y rellena la raíz/ejecución de los registros existentes sin reinterpretar sus decisiones. `listGenerationTraces()` incluye trazas sin construcción, como procesos prompt-only e incompletos.
