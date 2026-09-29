# Plan 01 · Eve y los ocho métodos

**Objetivo:** reemplazar la dependencia de una sola instrucción corta por un agente local que produzca un `DesignPlan` verificable, prompts editables y aportes explícitos de cada técnica. La app existente sigue siendo el front.

**Depende de:** prueba de acceso local del plan 06. Define los contratos que usarán 02–05 y 07.

## Entrega

- Integrar Eve dentro de `xpage/agent/` y conectarlo al Next.js existente con `eve/next`. Leer la documentación de la versión realmente instalada antes de configurar rutas, canal y modelo.
- Crear `agent/skills/<id>/SKILL.md` para los ocho IDs de `src/lib/techniques.ts` y `agent/skills/combine/SKILL.md`. Mantener esos IDs para no romper landings antiguas.
- Definir y validar `DesignPlan`, `LandingSection`, `MediaSlot` y `TechniqueContribution` con Zod en un módulo compartido. Persistir la versión de cada skill aplicada.
- Hacer que Eve entregue el plan mediante una herramienta con esquema validado o un adaptador equivalente de salida estructurada. Una respuesta narrativa del agente no sustituye el contrato.
- Conservar la opción de ver y editar el prompt resultante. Durante esta rama, mantener la ruta anterior como respaldo hasta que el plan 07 complete la migración del flujo.

## Contrato de cada skill

Cada archivo contendrá: propósito, cuándo usarla, datos de entrada, pasos observables, artefacto producido, comprobaciones, ejemplos breves y fuentes. Referencias extensas irán en un archivo hermano para que Eve cargue solo lo necesario. El agente registra una **síntesis de decisiones**, sin pedir cadena de pensamiento.

| Skill | Artefacto mínimo verificable |
| --- | --- |
| Cadenas semilla | `DesignDNA`: motivo, paleta con roles, tipografía, composición e invariantes de marca |
| Prompts ambiciosos | mapa de motivaciones y objeciones como **hipótesis**, propósito de cada sección y CTA |
| Creador y crítico | propuesta, auditoría breve de UX/CRO/accesibilidad y versión corregida; segunda pasada real cuando se seleccione |
| Activos de imagen | especificación de imagen por espacio: sujeto, encuadre, luz, proporción, texto alternativo y uso |
| Activos de vídeo | guion/criterios de búsqueda, duración, póster y comportamiento con movimiento reducido; sin generación de vídeo |
| Diseño sustractivo | lista de elementos descartados y razón, más estructura final reducida |
| Restricciones negativas | restricciones comprobables de copy, evidencia, composición y medios |
| Copy humano | voz de marca, ejemplos de microcopy y pares antes/después cuando revise texto |
| Combinación | un solo plan, aporte por método, conflictos resueltos y precedencia aplicada |

Precedencia al combinar: hechos del brief y accesibilidad → identidad y restricciones globales → objetivos de sección → decisiones visuales y copy. La skill combinadora elimina duplicados; no concatena ocho prompts. Una técnica puede no alterar una sección y debe explicar por qué.

## Secuencia del worker

1. Revisar el flujo actual de `/api/prompts`, `/api/landings`, schemas, trazas y UI. Usar la guía PDF como punto de partida y verificar afirmaciones técnicas con fuentes adicionales; no presentar hipótesis de conversión como hechos medidos.
2. Instalar/configurar Eve en el proyecto existente, sin ejecutar un inicializador que cree otro Git, otro proyecto Next.js o reemplace el front. Probar un turno local desde XPage.
3. Crear los contratos Zod y un adaptador entre el estado de Studio y el agente. Asegurar IDs de ejecución y salidas que puedan persistirse y trazarse.
4. Implementar las nueve skills, empezar por dos técnicas distintas, validar el contrato y completar las restantes. La combinación debe producir un resultado coherente con esas dos.
5. Añadir en Studio una vista concisa de aportes por método y plan de secciones; conservar el prompt editable.

## Aceptación

- Una técnica produce un plan estructurado y un prompt; dos técnicas producen un plan combinado con aportes identificables.
- «Creador y crítico» deja evidencia de una propuesta y una revisión, no solo la frase «revísalo internamente».
- Con el mismo brief, cambiar la técnica cambia decisiones del plan observables en la UI.
- Falla o salida incompleta de Eve no guarda un plan inválido; el usuario ve un error recuperable.
- `pnpm lint`, `pnpm typecheck`, `pnpm build` y prueba manual local del flujo individual/combinado pasan.

**Frontera:** este worker no implementa conectores de medios, el editor ni la vista final de trazabilidad. Publica sus contratos para esos planes.
