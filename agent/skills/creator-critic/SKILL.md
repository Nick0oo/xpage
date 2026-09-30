---
name: creator-critic
description: Use when a plan or landing needs a bounded, evidence-based review followed by concrete repairs. Inspect brief fit, complete content, visual hierarchy, truthful claims, accessible behavior and internal references; report only observable defects and matched changes. Use whenever selected, without claiming a visual test that was not run.
---
# Creador y crítico · v2.0.0

## Propósito

Construye una propuesta deliberada, encuentra defectos que se puedan ubicar en el artefacto y aplica reparaciones proporcionadas. La crítica no es una opinión sobre gusto ni una narración de pensamiento privado: debe permitir que otra persona localice qué cambió y cómo se comprueba.

## Referencias locales

Si existe `read_seed_reference`, carga `frontend-design`, `web-prototype-checklist` y `system-prompt-excerpts` al revisar una landing; usa `web-prototype-layouts` solo si necesitas resolver un patrón. El material local es una selección atribuida de OpenDesign, no un plugin ejecutable. Usa Totality solo como ejemplo puntual cuando el brief justifique esa gramática; no es estilo predeterminado. Indica nombres realmente leídos en el artifact.

## Procedimiento

1. **Registra la propuesta inicial** en una frase con oferta, audiencia, acción y principio compositivo. Evalúa el artefacto recibido (o el plan recién elaborado), no un rediseño imaginado.
2. **Recorre criterios con evidencia:**
   - Brief: ¿oferta, público y acción son comprensibles? ¿cada claim tiene estado/fuente?
   - Contenido: compara cantidades y `requiredItems` con su copy/destino; cuenta las piezas completas.
   - Recorrido: asigna tarea distinta a cada sección; comprueba orden, CTA real y anclas.
   - Diseño: relaciona `designDNA` con hero, una sección interna y cierre; verifica variación que sirva a las tareas.
   - Uso: busca encabezados semánticos, texto alternativo, foco/teclado, contraste declarado como requisito, movimiento reducido y contenido disponible sin JS.
   - Integridad: comprueba IDs únicos, correspondencia entre secciones/slots/aportes, placeholders, imports/remotos o funciones no soportadas.
3. **Prioriza de dos a cinco hallazgos.** Por cada uno escribe ubicación, evidencia del brief/plan/código, regla afectada, efecto concreto y cambio. Atiende primero omisión de contenido, claims o acciones falsos y barreras de acceso; después jerarquía y repetición.
4. **Repara el mismo artefacto.** Cambia el plan, copy, tokens, composición o restricciones para corregir cada hallazgo. Si un requisito no puede satisfacerse con la información recibida, marca el dato pendiente en lugar de inventarlo.
5. **Vuelve a comprobar solo el defecto afectado.** Cuenta de nuevo los items corregidos, valida que los IDs sigan relacionados y que la revisión no cree una contradicción. Una inspección del plan/código no equivale a render, test con usuarios ni medición de contraste.

## Artefacto y contrato

Llena `creatorCritic.proposal`, `findings` y `revision` cuando el esquema lo admita. Incluye un resumen de la propuesta; `findings` debe contener de dos a cinco tarjetas breves si hay problemas reales (no inventes defectos para llegar al mínimo); `revision` nombra qué cambios quedaron. Si no hay de dos a cinco defectos defendibles, registra los que existan y explica por qué no se añaden más. Mantén la ficha de contribución del método dentro de `TechniqueContribution`:

```text
proposal: intención y recorrido inicial
findings: [ubicación | evidencia | criterio | efecto | cambio]
revision: artefacto/campos actualizados y resultado de la re-comprobación textual
scope: plan, HTML/código o render realmente inspeccionado
references_read: lista real o “sin referencias locales”
```

## Ejemplo

Hallazgo: `section.practice.copy` anuncia cinco ejercicios y enumera tres; el plan exige un inventario de cinco piezas. Cambio: añadir dos originales, mantener exactamente cinco en `requiredItems` y repetirlos en el copy; recontar ambos campos. No describirlo como “mayor conversión”.

## Revisión del método

- Todo hallazgo apunta a texto o estructura existente y a una regla explícita.
- Cada cambio corrige el hallazgo identificado; no se agregan preferencias como obligaciones.
- Toda corrección conserva la oferta, requisitos, restricciones y cambios previos del usuario.
- El resumen distingue revisión de texto/código, comprobación automática y render real.
- El resultado final evita métricas de CRO o accesibilidad que no se hayan medido.
