# Plan 04 · Editar una sección con IA y una técnica elegida

**Objetivo:** seleccionar una sección desde la vista previa, pedir un cambio en lenguaje natural y aplicar una o varias técnicas sin regenerar el resto de la página.

**Depende de:** secciones con ID del plan 01 y revisiones/eventos del plan 03. Los activos del plan 02 deben conservarse al editar.

## Unidad de edición

Cada sección editable tendrá un `sectionId` estable representado en el HTML por `data-xpage-section`. La composición final separará tokens CSS globales de estilos propios de sección. El primer editor modifica **HTML y CSS de una sección**; no toca JS global ni otras secciones de forma implícita. Header/footer podrán estar fuera de la selección inicial si no cumplen ese contrato.

La petición de IA contendrá proyecto, revisión base, sección objetivo, brief, plan de diseño, técnicas elegidas, medios vinculados e instrucción del usuario. La respuesta será `SectionPatch` validado: `sectionId`, HTML nuevo, CSS acotado a esa sección, resumen visible y advertencias. Se rechaza cualquier cambio de ID, salida sin sección o CSS que escape al alcance. Parsear HTML con una herramienta estructural, no con reemplazos por regex.

## Experiencia

En la preview, un clic selecciona la sección y abre un panel lateral: nombre y propósito de la sección, campo «qué quieres cambiar», selector de técnica(s), propuesta y acciones **Comparar**, **Aplicar** y **Descartar**. El iframe puede comunicar la selección con `postMessage`; validar `event.source`, un identificador de sesión y el `sectionId` contra el documento actual. El contenido del iframe nunca recibe acceso directo al estado principal de React.

Al aplicar, crear una `LandingRevision` hija y un evento de traza con antes/después y técnica usada. **Deshacer** vuelve a una revisión previa creando o seleccionando una revisión explícita; no borra la historia. Si la revisión base cambió mientras se generaba el parche, pedir recalcular la propuesta sobre la revisión actual.

## Secuencia del worker

1. Asegurar IDs estables al construir una landing nueva y un adaptador para landings antiguas sin IDs. Si la conversión histórica es ambigua, permitir vista previa pero desactivar la edición puntual con explicación.
2. Implementar extracción y sustitución estructural de una sección y validación del CSS acotado. Añadir pruebas con secciones anidadas, ID ausente, ID duplicado y CSS que intente afectar otros bloques.
3. Crear la acción del agente para proponer un `SectionPatch` con técnica seleccionada. Guardar la propuesta como pendiente; no aplicar cambios antes del clic del usuario.
4. Añadir selección en preview, panel de comparación y aplicación/deshacer. Mantener los medios asociados al `sectionId` si el parche no los cambia explícitamente.
5. Registrar intentos, propuestas rechazadas y revisiones aplicadas en trazabilidad.

## Aceptación

- Cambiar el copy del hero deja idénticos los demás bloques, el CSS global y el JS global.
- La técnica seleccionada figura en el parche y en la traza; otro método genera un cambio observable cuando corresponde.
- Se puede comparar, descartar, aplicar y deshacer sin perder la versión original ni el medio elegido.
- Una respuesta malformada o un parche para otro `sectionId` no altera la landing.
- Funciona con teclado y en ancho móvil; el iframe permanece aislado.
- `pnpm lint`, `pnpm typecheck`, `pnpm build` y pruebas de la transformación de secciones pasan.

**Frontera:** las ediciones globales de identidad o JavaScript podrán ser una acción separada posterior, nunca un efecto colateral de este editor.
