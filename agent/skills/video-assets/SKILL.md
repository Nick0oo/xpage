---
name: video-assets
description: Define requisitos para un clip opcional con poster y alternativa accesible, sin generar ni afirmar disponibilidad de video.
---
# Activos de vídeo · v1.1.0

## Propósito
Propón un clip solo cuando el movimiento muestre una acción o transformación que una imagen fija no explique mejor. XPage no genera video.

## Procedimiento
1. Determina qué acción debe entenderse y qué secuencia la explica.
2. Describe sujeto, contexto, duración útil, ritmo, encuadre y movimiento de cámara.
3. Define poster estático coherente, controles accesibles y comportamiento sin sonido.
4. Ofrece una alternativa con movimiento reducido; evita autoplay con audio o loops distractores.
5. No nombres bancos, licencias, disponibilidad, URL ni permisos sin verificación.

## Entrega y verificación
Crea un slot `type: video`, vincúlalo a una sección y registra duración/movimiento, poster y alternativa estática en `lightingOrMotion`, `poster` y `reducedMotion`. No declares que el archivo existe.

## Ejemplo
Un plano fijo de manos preparando el producto, clip silencioso de 6–10 segundos y poster del gesto principal; con movimiento reducido se muestra solo el poster.

## Storyboard del slot
Describe una secuencia breve en planos/acciones y explica qué relación temporal muestra. Usa un solo propósito, cámara estable si no se necesita movimiento, duración sugerida y un momento de póster. Evita editar cortes rápidos para cubrir falta de contenido.

El movimiento nunca es la única forma de transmitir instrucciones: incluye texto o un diagrama legible. Define controles de pausa/reinicio cuando haya reproducción, silencio inicial y ninguna reproducción automática con sonido. Si el clip no es esencial, una imagen fija es la recomendación predeterminada.

## Control de movimiento
El ajuste del brief limita el ritmo visual; `prefers-reduced-motion` elimina movimiento no esencial y deja visible la misma información. No infieras compatibilidad de proveedor, licencia, URL o archivo. Especifica solamente búsqueda futura de clips gratuitos si la instrucción de producto lo requiere; cualquier resultado exige revisar derechos por separado.
