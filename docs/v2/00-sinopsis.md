# XPage v2: sinopsis para los workers

Estado: plan aprobado para una aplicación **exclusivamente local**. Este documento y los siete planes siguientes son instrucciones de trabajo; todavía no implementan funciones.

## Objetivo

Convertir XPage en un estudio de landings donde las ocho técnicas produzcan decisiones visibles, activos utilizables y revisiones trazables. El usuario podrá buscar imágenes y vídeos gratuitos, generar imágenes por API, construir la landing, elegir una sección y reescribirla con IA aplicando una técnica. No se generarán archivos de vídeo por IA.

Se conserva el requisito académico: brief, prompt por técnica, combinación de técnicas, ejecución de la landing y Biblioteca con el prompt de origen. La interfaz seguirá en español y priorizará claridad.

## Diagnóstico del código actual

- `src/lib/techniques.ts` resume cada método en una instrucción. `src/app/api/prompts/route.ts` y `src/app/api/landings/route.ts` generan prompts y código con llamadas de texto, pero no producen un plan de diseño estructurado.
- `src/app/api/images/route.ts` genera una portada opcional. El navegador la conserva temporalmente; no se inserta en el HTML ni en la Biblioteca. No hay búsqueda de medios ni archivos de vídeo.
- `prisma/schema.prisma` y `src/lib/generation-traces.ts` ya guardan trazas y pasos. Falta registrar decisiones por método, procedencia de medios, revisiones y relaciones entre resultados. El resultado de imagen en base64 puede crecer mucho dentro de SQLite.
- `LandingCode` contiene `title`, `html`, `css`, `js`. No existen IDs de sección estables para una edición parcial fiable.
- La skill `design-taste-frontend` instalada en `.agents/skills/` guía al agente **desarrollador**; no se ejecuta dentro de XPage.
- Al redactar estos planes, `pnpm typecheck` y `pnpm lint` pasan. `main` contiene cambios locales sin confirmar que pertenecen al trabajo previo del usuario.

## Arquitectura objetivo

Un solo proyecto Next.js en `xpage/`, un agente Eve en `xpage/agent/`, SQLite para metadatos y archivos locales ignorados por Git para los medios. Eve se integra con el front existente; no se crea un repositorio, app paralela ni otro front de chat obligatorio.

```text
Brief + referencias + técnicas
           ↓
Agente Eve: 8 skills de método + 1 de combinación
           ↓
Plan de diseño validado + prompts editables
           ↓
Landing con secciones identificadas + espacios para medios
           ↓
Buscar/elegir medios · editar sección · comparar revisiones
           ↓
Biblioteca + exportación + trazabilidad de todo el proceso
```

Las skills describen el criterio de cada técnica. Las herramientas de Eve y los módulos del servidor ejecutan acciones: guardar resultados, buscar en bancos, generar imágenes, validar código y registrar pasos. No se dependerá de que una skill Markdown haga una llamada API por sí sola.

### Contratos compartidos mínimos

Los nombres exactos se pueden ajustar durante el primer plan, pero todos los workers usarán estos conceptos:

| Concepto | Campos esenciales |
| --- | --- |
| `LandingProject` | ID, brief, técnicas, dirección creativa, revisión actual, traza raíz |
| `DesignPlan` | concepto, tokens visuales, recorrido de secciones, espacios de medios, aportes por técnica, dudas pendientes |
| `LandingSection` | ID estable, tipo/rol, propósito, HTML y CSS de alcance definido, medios vinculados |
| `LandingRevision` | ID, proyecto, revisión padre, código o cambio de sección, fecha, traza que la produjo |
| `MediaAsset` | ID, tipo, origen, proveedor, URL de fuente, autor/licencia, prompt si fue generado, ruta local, metadatos, sección de destino |
| `TraceStep` | ejecución y paso, fase, técnica y versión, entradas/salidas o referencias, decisión, fuente, proveedor/modelo, estado, tiempo |

Los binarios viven fuera de SQLite; la base conserva rutas y metadatos. Las revisiones y los eventos son inmutables. Las landings antiguas se podrán abrir y convertir al formato nuevo sin perder su código ni su prompt.

## Decisiones cerradas

1. XPage se usa localmente. Eve con inicio de sesión de ChatGPT es la vía primaria para texto **si la prueba de extremo a extremo del plan 06 funciona**. Las claves de Gemini/OpenRouter existentes quedan como alternativa explícita; la generación de imágenes por API conserva su propia credencial y puede costar dinero.
2. Imagen: búsqueda en banco gratuito y generación por API. Vídeo: **solo búsqueda de clips gratuitos**; no se integra un generador de vídeo.
3. El front es uno solo. Cada técnica activa campos, controles y resultados pertinentes; la combinación muestra aportes y conflictos resueltos.
4. La primera edición parcial cubre una sección a la vez: HTML y CSS acotado a esa sección. CSS global y JS global no se cambian silenciosamente.
5. Una traza explica decisiones observables y fuentes. No solicita ni almacena cadenas privadas de pensamiento del modelo.
6. Los costes, límites y licencias de proveedores se consultan al implementar cada conector; no se codifican como promesas permanentes.

## Orden de ejecución

1. Preparar el baseline Git: conservar los cambios actuales, establecer `develop` desde un estado acordado y dejar intactos los datos de SQLite.
2. [06 · Acceso local](06-acceso-local.md): prueba breve de Eve y suscripción. Se puede hacer antes de la integración definitiva.
3. [01 · Eve y métodos](01-eve-metodos.md): agente, skills y contratos del plan de diseño.
4. [03 · Trazabilidad](03-trazabilidad.md): esquema de eventos y revisiones que usarán los demás frentes.
5. [05 · Dirección creativa](05-direccion-creativa.md): brief enriquecido y calidad de las propuestas.
6. [02 · Medios](02-medios.md): búsqueda, generación de imagen e inserción real.
7. [04 · Editor de secciones](04-editor-secciones.md): selección, propuesta, aceptación y reversión.
8. [07 · Integración](07-integracion-producto.md): recorrido completo, exportación y limpieza de rutas antiguas.

Las investigaciones de fuentes pueden coincidir en el tiempo. Los workers que escriben código trabajan **uno por rama y por turno** en este único clon. Usar `feat/*` desde `develop`, sin worktrees. Para cada rama, simular el PR con un merge local hacia `develop`, resolver conflictos y validar el flujo afectado, `pnpm lint`, `pnpm typecheck` y `pnpm build` antes de darla por integrada. No mezclar los cambios locales previos del usuario en un commit de otro worker.

## Reglas de entrega para cada worker

- Leer este documento, su plan y `AGENTS.md`; inspeccionar el código actual antes de editar. Para cambios en Next.js, leer la guía pertinente de `node_modules/next/dist/docs/`.
- Mantener los esquemas y contratos compartidos. Si un plan requiere cambiar un contrato de otro frente, documentar el cambio antes de seguir.
- Hacer una demostración manual del camino principal y un caso de error; añadir pruebas automatizadas solo donde validen transformaciones o persistencia que puedan romper datos.
- Entregar archivos modificados, comportamiento observable, comprobaciones ejecutadas y límites que permanezcan.

## Fuentes de partida

- `../../../8 Técnicas Avanzadas de Diseño de Landing Pages con IA - Guía y Prompts.pdf` y `../../../Actividad para dentro de 8 días.pdf` están en la raíz del repositorio Git.
- [Eve en Next.js](https://github.com/vercel/eve/blob/main/docs/guides/frontend/nextjs.mdx) y [skills de Eve](https://github.com/vercel/eve/blob/main/docs/skills.mdx).
- [Inicio de sesión local de Eve](https://github.com/vercel/eve/blob/main/docs/guides/dev-tui.md) y [autenticación de Codex](https://learn.chatgpt.com/docs/auth).
- [API de Pexels](https://www.pexels.com/api/documentation/) y [API de Pixabay](https://pixabay.com/api/docs/).
