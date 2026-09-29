# Plan 07 · Cerrar el flujo de XPage v2

**Objetivo:** unir agente, métodos, dirección creativa, medios, trazabilidad, editor, Biblioteca y exportación en un flujo único y comprensible.

**Depende de:** planes 01–05 y resultado del 06.

## Recorrido final

1. Crear o abrir un proyecto de landing.
2. Completar brief, referencias y técnicas; elegir una dirección visual.
3. Revisar aportes por técnica y prompt; construir la página.
4. Buscar/escoger imagen o vídeo, o generar imagen; asignar activos a secciones.
5. Seleccionar una sección y pedir un ajuste con técnica; comparar, aplicar o deshacer.
6. Guardar en Biblioteca, revisar trazabilidad y exportar un resultado utilizable.

El usuario debe poder salir y volver sin perder plan, activos o revisión vigente. La Biblioteca muestra prompt original, dirección elegida, versión actual y acceso a historial. La trazabilidad está enlazada desde cada acción significativa.

## Secuencia del worker

1. Revisar contratos y migraciones reales de los otros workers; resolver nombres o datos inconsistentes en una sola adaptación, sin crear otra capa genérica.
2. Unificar el estado de Studio alrededor de `LandingProject` y revisión actual. Retirar rutas o estados antiguos solamente después de migrar/abrir landings previas y comprobar el nuevo flujo.
3. Completar la exportación: HTML autocontenido para páginas sin vídeo o con imágenes pequeñas, y paquete con archivos relativos cuando haya vídeo. Incluir un documento breve de créditos de medios y registrar la exportación en traza.
4. Añadir controles visibles de estado: proveedor local sin sesión, búsqueda sin clave, activo faltante, proyecto no guardado, propuesta de edición pendiente, operación costosa.
5. Hacer una revisión funcional de accesibilidad y rendimiento: navegación por teclado, foco, contraste, `prefers-reduced-motion`, tamaños de medios y errores de red.
6. Actualizar README, `.env.example` y explicación local de datos. Mantener SQLite y activos locales ignorados por Git; documentar copia de seguridad de ambos.

## Aceptación de extremo a extremo

- Una landing individual y una combinada completan todo el recorrido desde brief hasta exportación y recarga.
- Una imagen generada y un vídeo de banco aparecen en preview, Biblioteca, traza y paquete exportado.
- Una edición de sección conserva medios y otras secciones; deshacer recupera la versión anterior.
- Una landing histórica abre y se puede descargar; si no puede editarse por secciones, la UI lo explica.
- Fallos de sesión, proveedor o búsqueda no corrompen el proyecto ni borran una revisión válida.
- `pnpm lint`, `pnpm typecheck`, `pnpm build` pasan y se documenta la prueba manual completa en escritorio y móvil.

## Cierre Git

En este mismo clon, simular el PR de la rama de integración con un merge local hacia `develop`, resolver conflictos y volver a ejecutar los controles anteriores. No usar worktrees. `main` recibe solo el conjunto ya validado conforme al flujo Git acordado.
