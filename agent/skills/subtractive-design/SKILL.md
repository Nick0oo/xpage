---
name: subtractive-design
description: Audita secciones, adornos, copy y controles; elimina ruido sin sacrificar comprensión, evidencia o accesibilidad.
---
# Diseño sustractivo · v1.2.0

## Propósito
Conservar lo necesario para entender la oferta y actuar, retirando duplicación y ornamentación sin función.

## Procedimiento
1. Da a cada sección una función y una pregunta concreta que resuelve. Una landing completa puede necesitar varias secciones para mostrar su oferta, ejemplos y recorrido.
2. Revisa párrafos, tarjetas, navegación, badges, controles y recursos frente a esa función.
3. Retira repeticiones y ruido, pero no reduzcas profundidad útil ni elimines ejemplos y entregables que el usuario solicitó. Menos secciones no significa mejor diseño.
4. Conserva información factual necesaria, contexto para decidir, detalles útiles, contenido obligatorio y alternativas accesibles.
5. Recomprueba ritmo y continuidad tras cada eliminación.

## Entrega y verificación
Registra eliminaciones concretas y su razón en `discardedElements`; documenta en `contributions.artifact` qué simplificaste. La estructura debe explicar oferta, objeciones relevantes, ejemplos o entregables y siguiente paso. No impongas tres secciones ni confundas menos contenido con más claridad automáticamente.

## Ejemplo
Retira una fila de logos sin respaldo; conserva una explicación breve del proceso que sí está descrito.

## Auditoría de densidad
Para cada bloque pregunta: ¿qué decisión o comprensión permite?, ¿repite otro bloque?, ¿lleva la evidencia más cerca del claim?, ¿es contenido requerido? Retira repetición si la página sigue completa. Conserva ejemplos, alcance y objeciones útiles aunque la página quede más larga.

## Simplificación visual
Retira adornos que compitan con titulares, bordes y sombras repetidos, badges vacíos y módulos sin diferencia funcional. No retires un motivo visual que conecta capítulos ni una orientación que ayuda a navegar. Sustituye el patrón, no solo lo borres, cuando una sección pierda estructura.

## Entrega
En `discardedElements` registra lo quitado y la razón concreta. Revisa el flujo antes/después para asegurar que la transición entre secciones todavía explica oferta, ejemplos y acción. “Menos es más” no cuenta como razón.
