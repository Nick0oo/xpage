---
name: combine
description: Integra varias técnicas en un plan y recorrido únicos, con precedencia, tensiones, decisiones y revisiones explícitas.
---
# Combinación de técnicas · v1.1.0

## Propósito
Crear una sola dirección de diseño coherente a partir de las técnicas seleccionadas. No concatenes instrucciones ni generes una página por técnica.

## Procedimiento
1. Carga cada skill seleccionada y extrae su entrega antes de escribir el plan.
2. Construye una identidad visual y un recorrido únicos; usa las técnicas como lentes para mejorar ese recorrido.
3. Incluye una contribución con versión, estado, decisión y artefacto para cada técnica seleccionada.
4. Compara decisiones incompatibles entre pares y registra la tensión concreta y su resolución.
5. Aplica esta precedencia: hechos del brief y accesibilidad; restricciones expresas; DesignDNA; propósito narrativo; decisiones visuales y copy.
6. Conserva solo secciones funcionales. Resuelve duplicados sin sacrificar necesidades del público.
7. Si creator-critic está seleccionado, registra propuesta, hallazgos observables y revisión del plan integrado. Si una técnica no cambia una decisión, justifícalo.
8. Verifica fuentes de claims, slots enlazados a secciones, IDs únicos, invariantes y que el prompt editable refleje el plan final.

## Entrega y verificación
Completa `contributions`, `sections`, `claims`, `negativeConstraints` y `prompt`. Cada tensión requiere resolución explícita y cada método seleccionado debe estar cubierto. No muestres cadena de pensamiento ni presentes intuiciones CRO como medidas.

### Entregables de contenido
- Extrae pedidos concretos y medibles del brief y conserva su alcance en el plan; no los resumas como un titular genérico.
- Registra cada pedido en `explicitContentRequirements` con su sección y una lista de piezas concretas (`requiredItems`). Usa `targetCount` cuando la cantidad de piezas esté pedida.
- Para una práctica que ofrece hasta cinco ejercicios, incluye cinco ejercicios originales como ejemplos de la oferta, sin afirmar que existan datos, clientes o resultados ajenos al brief.
- Repite esas piezas en `sections[].copy` y en `prompt`. La etapa HTML debe mostrar el inventario completo y legible.
- Comprueba que la cantidad del inventario y los textos requeridos coincidan antes de finalizar; una frase que solo anuncie el número no satisface el pedido.

## Ejemplo
Video-assets pide movimiento y negative-constraints pide movimiento mínimo: especifica un clip silencioso con poster y controles; con `prefers-reduced-motion`, usa solo el poster y conserva el mensaje.
