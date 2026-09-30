---
name: frontend-design
description: Diseña landings completas con identidad visual, contenido fiel al brief y composición editorial deliberada.
---
# Diseño frontend para landings · v1.0.0

## Objetivo
Convertir el plan y su DesignDNA en una página original que parezca hecha para esta oferta. HTML es el medio de entrega; la dirección de arte debe venir del contenido, el público, el tono y las restricciones del brief. Esta skill complementa `combine`: aquí se concreta la composición, no se vuelve a decidir la estrategia ni se sustituye el plan.

## Orden de trabajo
1. **Lee el encargo completo.** Extrae oferta, destinatario, acción, tono, hechos, referencias no verificadas, contenido obligatorio, cantidad, restricciones, `designDNA`, `designSystem`, `compositionRecipeIds`, secciones y slots. Conserva el plan como contrato editorial.
2. **Elige un gesto propio.** Formula en una frase la metáfora o lógica visual que nace de la oferta. Deriva de ella un recurso que puedas construir localmente: diagrama, escala tipográfica, numeración, recorte, marco, forma SVG o disposición de elementos. Si no hay identidad dada, preséntala como propuesta, no como marca existente.
3. **Traduce DesignDNA a reglas.** Define roles de color, familia tipográfica disponible, jerarquía, anchos, ritmo, material, bordes y movimiento. El `designSystem` aporta gramática compositiva y `DesignDNA` decide los tokens finales. Mantén la misma lógica visual en hero, secciones, medios, navegación y CTA.
4. **Asigna composición por tarea.** Para cada ID de sección anota el objetivo, la densidad y el gesto que mejor lo resuelve. Escoge entre 2 y 4 recetas disponibles cuando sean útiles. Alterna, por ejemplo, apertura tipográfica, explicación de lectura amplia, pieza numerada, inventario editorial, demostración visual y cierre; no conviertas cada variación en una tarjeta.
5. **Escribe la página completa.** El hero debe explicar qué se ofrece, para quién y cuál es el siguiente paso. Desarrolla cada sección planeada con su contenido específico. Si el plan incluye una lista o práctica enumerada, cada elemento aparece completo en el HTML inicial y en el copy visible, no solo en una etiqueta de cantidad.
6. **Construye, luego contrasta.** Implementa HTML semántico, CSS responsive y JavaScript solo si habilita una acción real. Compara el resultado con el plan y repara primero contenido, después estructura/accesibilidad, después variedad y pulido.

## Sistema visual aplicado
- Inicia en los colores provistos por marca o en la paleta por roles de `DesignDNA`. Define fondo, superficie, texto, texto secundario, borde, acento y foco; el acento debe señalar una acción o una relación de contenido.
- Usa como máximo una pareja tipográfica principal y una escala jerárquica intencional. Evita depender de fuentes remotas. Elige una tipografía de sistema solo cuando su neutralidad sea una decisión visual justificada.
- Escribe variables CSS para tokens repetidos y úsalas de forma consistente. No cambies de radio, sombras o acentos por sección sin motivo de contenido.
- Una página tiene una firma visual memorable: puede ser una palabra tratada como objeto, una secuencia, una ilustración geométrica, una regla editorial o un mapa. Desarróllala con variaciones funcionales, no la repitas como logo decorativo.
- Evita los defaults intercambiables: hero centrado sin motivo, degradado azul-violeta, blur de vidrio, pastillas por todas partes, filas de iconos de stock, esquinas exageradamente redondas, blobs, grillas Bento automáticas y la secuencia «hero + tres beneficios + testimonios» cuando no se deriva del brief.
- Usa textura, sombras, divisores, gráficos e iconos solo si explican jerarquía, material o función. CSS y SVG locales son preferibles a un recuadro que solo dice que falta una imagen.

## Recorrido de secciones
Antes de escribir CSS, construye este mapa privado de implementación; no lo incluyas como prosa de razonamiento en la entrega:

| Campo | Decisión requerida |
|---|---|
| ID y tarea | Coinciden con el plan; una tarea narrativa por sección |
| Idea nueva | El titular aporta una idea distinta al titular anterior |
| Contenido | Copy completo y requisitos enumerables ubicados aquí |
| Composición | Gesto, alineación, escala y densidad concretos |
| Relación visual | Recurso derivado de DesignDNA y distinto de la sección anterior |
| Navegación | Enlace activo con destino externo dado o ancla existente |

Una landing con suficiente material explica oferta, alcance, funcionamiento, demostración o práctica, dudas respaldadas y cierre. No fuerces ese orden si la página requiere catálogo, cronología, ensayo, campaña o recorrido de producto. No dejes fuera una sección del plan para ahorrar diseño; si el plan es inconsistente, conserva su contenido y evita inventar hechos.

## Copy y datos
- Trata los hechos del brief como fuente. Las referencias son inspiración no verificada; no reproduzcas marca ni atribuyas resultados.
- Un título plantea una idea. Su párrafo añade alcance, ejemplo o explicación útil; no vuelve a decir la misma promesa con sinónimos.
- Conserva completas y literales las piezas de `explicitContentRequirements.requiredItems`. Puedes añadir numeración y etiquetas alrededor, pero no corregir ni abreviar la pieza.
- No inventes precios, clientes, citas, datos, certificados, prestaciones, garantías o disponibilidad. Los ejercicios, trabalenguas, ejemplos y textos originales pedidos sí se redactan: son la entrega creativa, no una afirmación factual.
- Todos los enlaces y botones anuncian el resultado que realmente tienen. CTA principal con clase `cta`, enlace externo aportado o ancla real; no uses `href="#"`.

## Implementación y accesibilidad
- Incluye cada `data-xpage-section="id"` exactamente en su elemento `<section>` correspondiente; conserva el orden del plan y no cambies los IDs.
- Cada slot real usa `data-xpage-slot="id"` en el contenedor de su sección. No declares un recurso como existente si solo está planificado.
- HTML semántico, un solo `<h1>`, jerarquía de headings ordenada, texto alternativo útil, foco claramente visible, controles operables con teclado y contraste legible.
- Diseño mobile-first. Prueba mentalmente a 360, 390, 768 y 1440 px: titulares pueden envolver; grids y flex hijos usan `min-width: 0`; imágenes, tablas, SVG, controles y notas permanecen dentro del viewport.
- Evita animación automática y scroll-driven obligatorio. Respeta `prefers-reduced-motion`; todo contenido central se entiende con CSS desactivado y sin JavaScript.
- No uses frameworks, imports, red, CDN, fuentes ni activos remotos, `iframe`, formularios falsos, almacenamiento web o acceso al documento padre. Los gráficos son locales y el HTML/CSS/JS devuelto permanece independiente.

## Autoinspección antes de entregar
1. **Brief:** ¿en una mirada se entienden oferta, público y acción? ¿Cada claim tiene respaldo?
2. **Inventario:** ¿aparece cada ID de sección y cada elemento enumerable completo, legible y sin depender de JS?
3. **Composición:** ¿hero, sección más densa y cierre se reconocen como la misma identidad con tareas visuales diferentes? ¿Hay tarjetas o splits repetidos sin razón?
4. **Interacción:** ¿cada enlace tiene destino real? ¿la navegación por teclado y los estados focus son claros?
5. **Pantallas:** ¿el contenido largo puede envolver sin cortar ni crear overflow? ¿la página se sostiene con movimiento reducido?
6. **Contrato:** ¿IDs, slots, copy, DesignDNA, receta y sección final coinciden con el plan?

Registra solo correcciones observables. No afirmes que renderizaste, navegaste, mediste contraste o mejoraste conversiones si no ocurrió.

## Ejemplo de aplicación
Brief: «Practicar hasta 5 trabalenguas con la letra r».
- Incorrecto: un bloque que dice «Cinco retos para practicar la erre» y tres frases de ejemplo.
- Correcto: inventario de cinco trabalenguas originales completos; los cinco se encuentran en la sección de práctica, en `requiredItems`, en `sections[].copy` y en el HTML visible. El plan usa una composición de lectura para recitarlos, no cinco tarjetas idénticas por defecto.

## Sistema de diseño de Eve
Esta skill aplica los principios de craft derivados de `frontend-design` en OpenDesign: dirección visual concreta, uso de un sistema como contrato, rechazo de defaults genéricos, interfaz real y autoevaluación. Los traduce a la salida independiente y accesible de XPage, integra `DesignDNA` y exige inventario comprobable antes del HTML.

## OpenDesign-derived source notes
The local `frontend-design` procedure adapts the first-party OpenDesign frontend-design workflow and system-prompt ideas researched at `nexu-io/open-design` (Apache-2.0, revision 5b19dfa). Sources, scope, and the no-vendored-runtime decision are documented in `src/lib/design-systems/README.md`. XPage's design-system selector and structured artifact contract remain local.
