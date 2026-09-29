# Plan 05 · Dirección creativa más audaz y comprobable

**Objetivo:** conseguir diseños distintos y prompts útiles para construirlos, con decisiones justificadas por el brief y sus referencias.

**Depende de:** `DesignPlan` y skills del plan 01. Publica eventos al plan 03.

## Cambios de producto

Ampliar el brief sin volverlo pesado: permitir marca/logo o paleta opcional, URLs o imágenes de referencia, elementos que deben evitarse y objetivo principal. Exponer tres controles simples: **variedad**, **movimiento** y **densidad**. El usuario puede dejar los valores sugeridos; el agente los interpreta según el sector y el público. La skill de gusto instalada para el desarrollador sirve como referencia, pero el producto debe incorporar sus principios pertinentes en las skills Eve y en evaluaciones propias.

Antes de generar código, ofrecer dos o tres direcciones diferenciadas. Cada una especificará concepto, retícula/hero, ritmo de secciones, paleta con roles, tipo, motivo visual, uso de imagen/vídeo y una razón breve ligada al brief. El usuario elige una dirección; el prompt final se deriva de ella y de los métodos seleccionados. **Más palabras no es un criterio de calidad**: el prompt debe concretar composición, copy, comportamiento, recursos y restricciones.

## Criterios de calidad

- Distancia real entre alternativas: composición, secuencia narrativa o medio principal diferentes, no solo colores cambiados.
- Coherencia: el mismo `DesignDNA` se aplica en todas las secciones y los activos.
- Claridad: la oferta, el destinatario y la acción se entienden en la primera pantalla.
- Evidencia: no se inventan testimonios, métricas, clientes, precios ni ventajas no aportadas.
- Accesibilidad: contraste, foco visible, jerarquía, respuesta móvil y movimiento reducido.
- Selección editorial: eliminar elementos que no ayuden a explicar la oferta o actuar.

## Secuencia del worker

### Estado de implementación (2026-09-28)

- Implementado: brief opcional con marca, paleta, referencias textuales/URLs, elementos a evitar, objetivo y controles de variedad, movimiento y densidad. Los registros antiguos reciben valores predeterminados al validarse.
- Implementado: una solicitud Eve produce dos o tres direcciones estructuradas con su propio `DesignPlan`; la interfaz permite compararlas y elegir una antes de construir. El prompt seleccionado se puede editar.
- Implementado: la traza registra alternativas, elección y cambios posteriores al prompt. Las referencias son contexto escrito por el usuario; el sistema no descarga ni verifica las URLs.
- Pendiente de evaluación: generación real repetida para briefs de distintos sectores y revisión de capturas de HTML renderizado. Por tanto, la aceptación visual y de diversidad no se considera demostrada todavía.

1. Reunir ejemplos breves de referencias y resultados actuales para detectar repeticiones. Documentar cuatro o cinco patrones repetidos medibles: hero, retícula, paleta, secciones, copy y activos.
2. Ampliar brief y schemas con campos opcionales, manteniendo compatibilidad con registros antiguos. Guardar referencias como datos de entrada de proyecto, no como hechos verificados.
3. Implementar generación y elección de direcciones estructuradas. Incorporar restricciones y controles en el `DesignPlan`, no en un bloque de texto final pegado al prompt.
4. Generar prompts completos desde el plan elegido; mostrar en UI el concepto, la estructura, el aporte de cada método y la instrucción ejecutable.
5. Renderizar al menos tres briefs de sectores distintos y revisar capturas en escritorio y móvil. Ajustar skills/criterios donde se repita la misma composición; conservar los ejemplos en una pequeña carpeta de evaluación del proyecto.

## Aceptación

- Para un mismo brief aparecen al menos dos direcciones con diferencias estructurales visibles antes de construir.
- El usuario puede elegir dirección y modificar el prompt, y ambos cambios quedan en la traza.
- Una referencia de marca presente se respeta; si no existe, el agente declara su propuesta como decisión creativa.
- En los ejemplos de evaluación no se repite la misma plantilla de hero y tarjetas en todos los casos.
- La calidad se revisa en HTML renderizado, no solo leyendo el prompt.
- `pnpm lint`, `pnpm typecheck`, `pnpm build` y revisión visual móvil/escritorio pasan.

**Frontera:** este worker no añade bibliotecas de animación ni efectos por defecto. Movimiento y complejidad se justifican por el producto.
