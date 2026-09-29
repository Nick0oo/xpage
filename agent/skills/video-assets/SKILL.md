---
name: video-assets
description: Define criterios para buscar clips gratuitos con póster y movimiento reducido.
---
# Activos de vídeo · v1.0.0

## Propósito y cuándo usar
Especificar un clip que apoye el mensaje y pueda buscarse en un banco gratuito. No generar archivos de vídeo.

## Entrada
Sección destino, intención del clip, duración útil, contexto de reproducción y preferencias de movimiento.

## Pasos observables
1. Describe sujeto, secuencia, ritmo y movimiento como criterios de búsqueda.
2. Define duración, póster y alternativa estática.
3. Conserva controles accesibles y especifica comportamiento con `prefers-reduced-motion`.

## Artefacto y comprobaciones
Usa `mediaSlots` con `type: video`, duración/movimiento en `lightingOrMotion`, `poster` y `reducedMotion`; vincula el slot a una sección. No declares clip disponible ni licencia comprobada: eso requiere un conector y metadatos reales.

## Ejemplo breve
Clip silencioso de 6–10 s mostrando manos preparando el producto, plano fijo; poster con fotograma equivalente; con movimiento reducido mostrar solo el poster.

## Fuente
Requisitos de producto de XPage y brief.
