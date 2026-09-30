---
name: combine
description: Integra métodos revisados en un plan, sistema visual y recorrido únicos; resuelve tensiones, preserva contenido y deja decisiones auditables.
---
# Combinación de métodos · v1.3.0

## Misión
Transforma aportes independientes en una landing coherente. Los métodos son lentes con responsabilidades distintas; no son secciones separadas ni fragmentos que se pegan en secuencia. La entrega es una propuesta única que sirve al brief, puede inspeccionarse y se puede convertir en HTML completo.

## Secuencia de trabajo
1. **Ancla en evidencia.** Extrae oferta, destinatario, acción, voz, contenido expreso, restricciones, fuentes y datos ausentes. Marca hipótesis como tales. No conviertas referencias no verificadas en hechos.
2. **Lee los aportes como decisiones.** Conserva los cambios del usuario, incluso si no coinciden con tu preferencia. Para cada método registra aplicación, estado y artefacto observable. No inventes una contribución ausente ni declares aplicado algo que no afecta el plan.
3. **Resuelve tensiones.** Compara las decisiones que compiten por el mismo elemento (jerarquía, densidad, imagen/movimiento, tono, detalle). Aplica la precedencia: hechos y accesibilidad → restricciones expresas → identidad disponible → DesignDNA → propósito de sección → preferencias estilísticas. Explica la resolución en la contribución relevante.
4. **Fija DesignDNA una sola vez.** Define un motivo derivado del brief, paleta con roles, tipografía local, composición e invariantes verificables. No hagas que cada método imponga su paleta o una identidad separada.
5. **Elige gramática y composición.** Usa el sistema visual curado que XPage obtuvo del brief como punto de partida. Registra `designSystem` y entre dos y cuatro `compositionRecipeIds` que sí aparecen en el recorrido. Adapta o descarta la receta si el brief, la marca o la accesibilidad lo exigen. Cada sección debe resolver una tarea y variar su composición por una razón observable.
6. **Diseña el recorrido.** Ordena interés, explicación de valor, alcance, demostración/ejemplo, dudas pertinentes y acción. Con material suficiente usa normalmente 5–7 secciones sustantivas; reduce cuando la oferta sea simple, nunca por plantilla. No agregues secciones de relleno.
7. **Escribe contenido que exista.** Transforma cada entrega enumerable expresa en `explicitContentRequirements` con destino y lista completa. Incluye las mismas piezas completas en `sections[].copy` y en `prompt`. Mencionar el número sin las piezas no cumple.
8. **Pasa la crítica focalizada.** Audita brief/evidencia, jerarquía/composición, contenido, accesibilidad/responsive, y coherencia/IDs. Registra de dos a cinco hallazgos solo si aplican, y cambia el plan para resolverlos. Si creator-critic está seleccionado, usa sus campos específicos. No digas que renderizaste o mediste algo sin hacerlo.
9. **Comprueba el contrato.** Recorre secciones, medios, requisitos, claims, CTA, anclas, contribuciones e invariantes. El prompt editable y plan final deben contar la misma página.

## Precedencia y decisiones
- Los hechos del brief y los controles de accesibilidad siempre ganan frente a preferencias estéticas.
- `designDNA` es la única fuente de decisiones de marca. `designSystem` aporta un vocabulario compositivo, no una paleta paralela.
- Métodos compatibles se refuerzan. Ante conflicto real, nombra ambas necesidades y explica cuál cede, cómo se adapta y dónde queda reflejada.
- Un método `modified` incluye modificación y razón. `omitted` incluye razón verificable. `applied` nombra el elemento afectado.
- La cantidad de secciones sigue a la cantidad de valor que hay que explicar. No equipares minimalismo con poca información.

## Artefactos obligatorios
- Una contribución por método seleccionado, con la versión real del `SKILL.md`, `status`, `decision`, `artifact`, y tensiones/resoluciones pertinentes.
- `designDNA`, `designSystem`, `sections`, `mediaSlots`, `explicitContentRequirements`, `claims`, `negativeConstraints`, `discardedElements`, `voice` y `prompt` coherentes entre sí.
- `creatorCritic.proposal`, hallazgos concretos y revisión cuando ese método esté seleccionado.
- IDs únicos y estables; cada requisito y slot apunta a una sección existente.
- El prompt HTML incluye `data-xpage-section` por cada `<section>` y `data-xpage-slot` por recurso. Todo CTA conduce a URL proporcionada o ancla real.

## Inventario enumerable
Para un pedido de cinco ejercicios, redacta cinco ejercicios originales y útiles dentro de la sección indicada. Para “hasta cinco”, puede ofrecerse el máximo solo si las cinco piezas son apropiadas; no transformes el máximo en una cantidad contractual distinta sin necesidad. Nunca excedas límites explícitos. Distingue ejemplos creados para explicar la oferta de pruebas o resultados reales.

## Revisión de copy y claims
Cada titular introduce una idea nueva. El párrafo explica alcance o ejemplo, no parafrasea el titular. El CTA expresa la acción y tiene destino. Todo claim cita brief/fuente y estado (`brief-backed`, `hypothesis`, `unsupported`); elimina lo unsupported. No uses urgencia, cifras o testimonios inventados.

## Medios
Los slots son especificaciones futuras, no recursos existentes. Se vinculan por ID a su sección. Propón imagen cuando haga más comprensible una idea; video solo cuando la secuencia comunique algo que una imagen fija no puede. Define encuadre, acción, luz/paleta, proporción y alt; para video, póster, silencio, controles y alternativa de movimiento reducido.

## Ejemplo de tensión
Image-assets pide mostrar una acción y negative-constraints exige poco movimiento: conserva una imagen secuencial o clip con controles si aporta comprensión, sin autoplay, con póster y estado estático completo para `prefers-reduced-motion`. Explica la decisión y conserva el contenido legible sin el medio.

## No hacer
No concatenar métodos, crear una sección por método, repetir una fila de tarjetas, inferir investigación, presentar intuición CRO como medición, resumir entregables pedidos, omitir conflictos, inventar acciones, ni exponer razonamiento privado.

## Propagación de Cadenas semilla

Cuando `seed-strings` está seleccionado, lee su skill completa y conserva el dossier de `contributions[].artifact` como una decisión revisable. La cadena es una señal efímera de exploración; no es un motivo, paleta, hecho de marca ni instrucción codificada. Usa `selected_route` y `route_effect` del artefacto editado por la persona como autoridad. No regeneres, sustituyas ni interpretes de nuevo la semilla durante la combinación.

Propaga la dirección elegida por cuatro puntos: (1) resume su traducción a `designDNA` como propuesta derivada del brief; (2) aplícala al propósito, orden y gesto compositivo de las secciones y a las recetas realmente usadas; (3) describe los mismos recursos concretos e invariantes en el campo `prompt` editable; (4) preserva la ficha de semilla en la contribución final. Si el usuario edita la ruta, el motivo o una regla del prompt, refleja esa edición y ajusta sus dependencias. Si una restricción confirmada limita la ruta, registra `modified` y explica la adaptación. No afirmes distribución estadística, determinismo ni resultados experimentales para esta adaptación de diseño.

Comprueba al cierre que la ruta sigue siendo visible en el plan y el prompt, que se reconoce en varias secciones con funciones distintas y que no desplaza copy obligatorio, marca aprobada, CTA, accesibilidad ni contenido completo. En la construcción HTML, las reglas del prompt son el contrato: aplícalas en composición y recursos CSS/SVG locales sin volver a sortear una ruta.

## Procedimiento de integración, de principio a fin

### A. Fijar el contrato de la página
Convierte el brief a una ficha de una línea por dato: oferta; destinatario; acción; voz; restricciones; fuente; estado del dato. Conserva el texto original del brief junto con esa ficha. Una preferencia visual no autoriza modificar oferta, público, cantidad, nombre ni destino de un CTA.

Lee las skills indicadas y sus referencias por completo antes de integrar. Cada método elegido entrega una decisión y una pieza de evidencia que se pueda localizar en la página. Los métodos no elegidos no aparecen como contribuciones inventadas. Si el brief presenta una cantidad para un producto creativo, cuenta la lista concreta antes de avanzar: un rótulo «5 ejemplos» no es cinco ejemplos.

### B. Resolver una sola identidad visual
Aplica `frontend-design` como procedimiento común, aunque los métodos seleccionados sean solo de copy o medios. Primero selecciona la gramática disponible más afín al brief; luego transforma esa gramática a través de `designDNA`. Escribe la identidad como reglas implementables, por ejemplo: «tinta verde profunda para lectura, marfil para fondo, rojo coral solo para acción; titulares serif compactos; notas numeradas al margen; imágenes como recortes de taller». Evita reglas vacías como «moderno y elegante».

El motivo no es una ilustración aislada. Debe poder reaparecer de formas adecuadas a cada tarea: una línea puede convertirse en eje del recorrido, subrayado editorial y señal de foco; una letra puede servir de gráfico central, marcador de práctica y detalle del cierre. Si marca, tema o accesibilidad chocan con la receta, anota qué regla se adaptó y qué conserva su función.

### C. Diseñar el argumento antes del estilo
Escribe primero el orden de secciones con esta estructura de decisión (no es una plantilla fija):

| Fase posible | Pregunta que contesta | Evidencia apropiada |
|---|---|---|
| Orientación | ¿Qué es y para quién? | La oferta y el destinatario del brief |
| Comprensión | ¿Cómo es o qué incluye? | Alcance y pasos conocidos |
| Demostración | ¿Qué puedo inspeccionar o practicar? | Entregables concretos, muestras originales pedidas, demo respaldada |
| Decisión | ¿Qué duda real queda? | Datos del brief; nunca objeciones o testimonios fabricados |
| Acción | ¿Cuál es el siguiente paso? | URL dada o ancla a contenido que existe |

Cada sección apunta a una sola pregunta principal. Una sola sección puede resolver más de una pregunta cuando el contenido es breve. Amplía el recorrido cuando haya contenido real para desarrollar; no añadas FAQ, métricas, logos ni testimonios por inercia. Asigna a cada sección un verbo de composición diferente: abrir, explicar, comparar, practicar, orientar, cerrar. Dos secciones contiguas no deben compartir el mismo gesto visual sin una razón.

### D. Asignar a los métodos su parte
Agrupa los aportes por la variable que cambian, no por el orden en que llegaron: narrativa, lenguaje, visual, medios, simplificación y crítica. Combina sus decisiones compatibles en el mismo componente. Ejemplo: copy humano pide un titular concreto, prompts ambiciosos pide hacer clara la audiencia y el sistema editorial usa ese titular como apertura asimétrica; eso es una solución integrada, no tres piezas apiladas.

Al resolver una tensión, nombra la necesidad y el control que manda. Ejemplo: «video-assets sugiere movimiento para mostrar el proceso; negative-constraints fija movimiento reducido. Se conserva la explicación estática y se deja el video como recurso manual opcional». Registra estado, decisión, artefacto visible y una adaptación verificable en el aporte correcto.

### E. Preservar y localizar los entregables
Por cada requisito enumerable, registra una sola fila de inventario con ID estable, frase del requisito, sección destino, cantidad exacta y texto completo de cada pieza. Coloca el mismo contenido en el copy de esa sección y el prompt de construcción. Antes de acabar, cuenta las piezas y coteja la lista palabra por palabra. Si una pieza aparece en dos secciones por razones de lectura, sigue contando como un solo elemento del inventario.

Los ejemplos originales solicitados sí son contenido a producir. Nombres, cifras, hechos, testimonios, beneficios y garantías del producto siguen necesitando fuente. No uses la regla de «no inventar hechos» para evadir un ejercicio, un trabalenguas, una receta o una pregunta que el usuario sí pidió redactar.

### F. Pasar la crítica como una reparación
Haz una única revisión focalizada después de completar el plan. Por cada hallazgo conserva cuatro datos: elemento localizado; criterio incumplido; efecto observable; reparación aplicada. Examina primero entregables ausentes, claims sin fuente, sección omitida o CTA falso. Después examina semántica, foco, lectura móvil, movimiento reducido, jerarquía y repetición visual. No reescribas el plan entero por preferencia estética; modifica el menor número de decisiones que resuelve defectos reales.

### G. Cierre de consistencia
El plan y su prompt deben describir la misma página. Confirma IDs de secciones únicos; requisitos y slots con sección existente; cada receta seleccionada aplicada por lo menos una vez; aportes cubiertos exactamente; claims enlazados a su fuente; títulos que cuentan un argumento al leerse en secuencia; CTA que lleva a un destino real; y cada pieza del inventario completa en su sección. Solo entonces considera el plan listo para transformarse en HTML.

## Caso de referencia: practicar la letra «r»
Para un brief que ofrece hasta cinco trabalenguas, el mapa debe reservar una sección de práctica que realmente los contenga. El plan entrega cinco trabalenguas completos, distintos entre sí y en español natural; `targetCount` es cinco. DesignDNA puede convertir el ritmo fonético de la erre en señal editorial, pero no sustituye contenido. Una composición de página puede presentarlos como lista numerada legible con marcas tipográficas distintas; no hace falta cinco tarjetas. La revisión busca cinco textos completos en el mismo destino y en el prompt editable.
