---
name: seed-strings
description: Construye DesignDNA como fuente única de verdad visual y de marca.
---
# Cadenas semilla · v1.2.0

## Propósito
Establece invariantes de marca antes de decidir secciones, copy o medios.

## Procedimiento
1. Separa hechos declarados, restricciones y elementos desconocidos; no completes vacíos como hechos.
2. Define un motivo visual concreto derivado de la oferta o el brief.
3. Propón paleta por rol y valor, tipografía disponible sin cargar fuentes remotas y composición.
4. Escribe de tres a cinco invariantes observables que se repitan en las secciones.
5. Comprueba contraste, legibilidad y que el copy y los medios respeten las invariantes.
6. Para dar carácter sin perder claridad, define una forma gráfica principal derivada de la oferta y aplícala con variaciones entre secciones; evita usar una misma fila de tarjetas como estructura automática.

## Entrega y verificación
Completa `designDNA` (`brandMotif`, `palette`, `typography`, `composition`, `invariants`) y describe la decisión en `contributions`. Marca elecciones estéticas como propuesta, no como investigación de marca.

## Ejemplo
Panadería de masa madre: motivo de cuaderno de fermentación, tinta carbón y crema, composición editorial con notas laterales; invariantes: textura sutil y fechas solo si constan en el brief.

## Ficha de decisión extendida
- **Fuente:** indica qué frase del brief sostiene identidad, oferta y audiencia. Si no hay marca, llama a la dirección una propuesta creativa.
- **Motivo:** expresa el concepto en una frase y tradúcelo a una forma concreta que pueda repetirse con variación (trama, corte, diagrama, marco, numeración, gesto tipográfico).
- **Tokens por rol:** usa `fondo`, `superficie`, `texto`, `texto secundario`, `acento`, `borde` y `foco` cuando apliquen. Los valores pueden ser descriptivos o hex; comprueba contraste antes de presentarlos como listos para producción.
- **Tipo:** especifica stack local con fallback y una escala de titulares/cuerpo/nota. No solicites fuentes remotas.
- **Composición:** define ancho de lectura, relación entre contenido e imagen, alineación del hero y cómo variará el ritmo entre secciones.
- **Invariantes:** escribe 3–5 reglas observables con lugar y propósito; al menos una puede variar entre secciones sin romper parentesco.

## Prueba de consistencia
Simula el sistema en hero, detalle y cierre: cada parte debe parecer la misma identidad y seguir cumpliendo una tarea distinta. Si el motivo exige decoración constante, si el color dificulta lectura o si no puede explicarse su procedencia, simplifica. `designDNA` queda como fuente única; cualquier ajuste se hace allí y se comunica a las demás técnicas.
