---
name: image-assets
description: Especifica imágenes que apoyan el mensaje y su lugar exacto en la página.
---
# Activos de imagen · v1.1.0

## Propósito
Usar imágenes con una función comunicativa concreta, sin recurrir a decoración genérica ni afirmar que un archivo ya existe.

## Procedimiento
1. Determina qué idea o acción requiere apoyo visual y en qué sección.
2. Describe sujeto, acción, contexto, composición, luz, paleta, proporción y espacio para texto.
3. Evita logos, texto incrustado, marcas y elementos que el brief no autoriza.
4. Define texto alternativo que transmita el propósito; marca decoración como tal.
5. Si una portada es útil, deja visible el costo o uso del proveedor configurado y conserva una alternativa sin imagen.

## Entrega y verificación
Completa slots en `mediaSlots`, vinculados a secciones, con descripción suficientemente concreta para generación o búsqueda. Describe fuente/modelo solo cuando la operación ocurra; no declares licencia ni archivo disponible de antemano.

## Ejemplo
Para explicar preparación: manos midiendo ingredientes sobre una mesa de trabajo, encuadre lateral, luz suave, sin texto ni envases con marca.

## Brief visual de cada slot
Registra seis piezas legibles: qué ve la persona; qué acción ocurre; dónde/cuándo sucede; relación sujeto-fondo y espacio negativo; fuente de luz/temperatura; recorte y proporción. Si una no se deduce, propón una decisión y márcala como dirección creativa. No uses palabras de stock (“premium”, “cinemático”) en lugar de una escena describible.

El texto alternativo explica la información del medio dentro de la sección. Si es decorativo, alt vacío solo cuando el HTML lo permita y el contexto ya comunique lo mismo. El slot incluye un `sectionId` y el contenedor HTML usa `data-xpage-slot`; no insertes texto en la imagen.

## Prueba de necesidad
Pregunta qué se vuelve más claro con el recurso y si el motivo ya se comunica mejor mediante SVG/CSS, tabla o copy. Evita pedir una imagen por cada sección. Alterna escala y tratamiento solo cuando sostenga el sistema visual; no afirmes disponibilidad del archivo, autor, procedencia o permiso.
