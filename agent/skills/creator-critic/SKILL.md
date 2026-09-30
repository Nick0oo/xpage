---
name: creator-critic
description: Revisa una propuesta con hallazgos observables y produce una revisión concreta.
---
# Creador y crítico · v1.1.0

## Propósito
Mejora el plan mediante una propuesta seguida de una revisión verificable, sin exponer razonamiento privado.

## Procedimiento
1. Formula una propuesta breve de dirección y recorrido.
2. Audita el plan frente al brief, DesignDNA, método seleccionado, accesibilidad y fuentes.
3. Anota de dos a cinco hallazgos específicos: elemento, criterio afectado y efecto para la persona usuaria.
4. Cambia secciones, copy, jerarquía o restricciones para resolver cada hallazgo.
5. Revisa que los cambios no introduzcan claims, fricción o inconsistencias nuevas.

## Entrega y verificación
Completa `creatorCritic.proposal`, `findings` y `revision` con resúmenes de resultado, no cadena de pensamiento. Cada hallazgo debe corresponder a un cambio o explicar por qué no aplica. No afirmes mejora de conversión sin experimento.

## Ejemplo
Hallazgo: el CTA principal aparece antes de explicar qué incluye la oferta; revisión: añade una sección breve de alcance antes del CTA.

## Protocolo de crítica acotada
Prioriza como máximo cinco problemas. Por hallazgo anota elemento localizado, criterio verificable, efecto y corrección. Ordena así: datos/entregables ausentes; acción falsa; barrera de lectura o acceso; inconsistencia de jerarquía; repetición estética. No listes preferencias personales como defectos.

## Crítica del sistema visual
Compara hero, sección más densa y cierre contra DesignDNA: ¿el motivo persiste?, ¿la composición cambia por función?, ¿el contraste separa contenido de decoración?, ¿hay un recurso remoto o una imagen que prometa una función no descrita? Propón el menor cambio capaz de corregir un problema real.

## Evidencia
Este método revisa el plan textual y las decisiones visibles descritas. Solo reporta inspección de captura/render, responsive real o medición si se ejecutó esa comprobación. No uses palabras como “convierte más” como resultado sin experimento.
## Rúbrica reproducible
Para cada hallazgo completa una tarjeta compacta: ubicación; evidencia del brief o plan; regla incumplida; efecto visible; corrección; comprobación posterior.
- Brief: la oferta se puede nombrar en una frase y no tiene claims sin fuente.
- Contenido: compara lista solicitada con los textos reales y el destino de sección. Cuenta entradas, no menciones.
- Estructura: cada ID del plan está representado; los títulos no repiten la misma idea; CTA y anclas existen.
- Visual: el motivo de DesignDNA aparece en formas distintas apropiadas a las tareas; al menos dos composiciones tienen razón funcional.
- Acceso: headings en orden, texto alternativo informativo, foco visible, estado no dependiente del color y movimiento reducido.
Prioriza omisiones y acciones falsas antes de preferencias visuales. Resuelve cinco problemas como máximo; si quedan más, corrige primero los que impiden entender o usar la página.
No uses «mejor», «más bonito» o «premium» como hallazgo sin señalar elemento y criterio observables.
Una observación sin reparación se registra solo cuando el cambio dañaría un requisito; explica ese bloqueo concreto.
Después de reparar, repite únicamente el chequeo ligado al defecto. No describas render, contraste medido ni comportamiento probado si solo leíste el plan.
Ejemplo: «La práctica anuncia cinco trabalenguas pero la sección solo contiene tres; agregar dos piezas completas al inventario y al copy antes de construir».
