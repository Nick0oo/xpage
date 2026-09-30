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
