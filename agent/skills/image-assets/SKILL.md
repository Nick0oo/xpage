---
name: image-assets
description: Especifica imágenes por espacio; no afirma que el archivo ya exista.
---
# Activos de imagen · v1.0.0

## Propósito y cuándo usar
Definir intención visual para los espacios que realmente necesitan imagen.

## Entrada
Secciones, DesignDNA, mensaje que debe apoyar cada imagen y destino.

## Pasos observables
1. Decide si la imagen aporta información o atmósfera útil; evita decorado redundante.
2. Para cada espacio, especifica sujeto, encuadre, luz, proporción, texto alternativo y uso.
3. Distingue siempre la especificación de un activo buscado, generado o descargado.

## Artefacto y comprobaciones
Usa `mediaSlots` con `type: image`, `subject`, `framing`, `lightingOrMotion`, `aspectRatio`, `altText` y propósito. Vincula el slot a la sección. La especificación no prueba que exista un archivo.

## Ejemplo breve
Una taza en primer plano, luz lateral suave, vertical 4:5, sin texto incrustado; alt describe la escena solo si la imagen comunica contenido.

## Fuente
Dirección creativa derivada del brief y DesignDNA.
