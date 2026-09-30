---
name: ambitious-prompts
description: Use when a landing brief needs a fuller persuasive journey from audience context to a supported next step. Turn motivations and objections into labeled hypotheses, then create a section-by-section narrative with concrete evidence homes. Use whenever this method is selected, including sparse briefs; scale the page to the evidence instead of inventing depth.
---
# Prompts ambiciosos · v2.0.0

## Propósito y alcance

Diseña un recorrido que ayude a una persona a entender una oferta, decidir si encaja y dar un siguiente paso real. «Ambicioso» significa investigar todas las tareas narrativas que el brief permite resolver; no significa prometer más, alargar la página ni tratar conjeturas como investigación de audiencia. Este método aporta una arquitectura persuasiva revisable; `combine` es quien integra y redacta el plan completo.

## Referencias locales

Cuando la capacidad `read_seed_reference` esté disponible, carga una sola vez por fase `frontend-design`, `web-prototype-layouts` y `web-prototype-checklist`. Para HTML consulta también `web-prototype-skill`. Son extractos atribuidos y fijados de OpenDesign incluidos en `seed-strings/references/open-design/`; sirven para explorar jerarquía, variantes compositivas y revisión. Adapta sus ideas al brief y al contrato autónomo de XPage. La muestra Totality Festival es un ejemplo expresivo opcional, nunca una identidad inicial. Cita las referencias realmente leídas en `artifact`; si la tool no está disponible, registra `sin referencias locales` y aplica este procedimiento sin simular la lectura.

## Cuándo se aplica

- Se seleccionó `ambitious-prompts` o la página necesita explicar oferta, alcance, funcionamiento y acción.
- El brief aporta señales que permitan formular preguntas de decisión o ejemplos específicos.
- Una página corta sigue siendo válida si solo hay una tarea y un hecho comprobado.

## Procedimiento

1. **Extrae señales.** Separa frases y hechos presentes en el brief, requisitos contables, fuentes, audiencia descrita, acción deseada, restricciones y vacíos. No conviertas demografía supuesta, “pain points” genéricos o tendencias en investigación.
2. **Formula hipótesis útiles.** Añade motivaciones u objeciones solo cuando una señal del brief permita explicar su relevancia. Escríbelas como hipótesis y registra la señal vinculada. Si no hay señal suficiente, devuelve una lista vacía; no fabriques preguntas solo para completar el esquema.
3. **Mapea el recorrido.** Para cada sección propuesta, define una tarea para el visitante, la información necesaria, evidencia o contenido que el brief ofrece, forma de explicar y señal de salida hacia la sección siguiente. Ordena desde “¿qué es y para quién?” hacia “¿qué incluye/ocurre?” y después hacia una decisión o acción respaldada.
4. **Resuelve cada hueco con honestidad.** Si la decisión requiere un dato ausente, omítelo, formula una pregunta abierta o señala qué debe aportar el usuario. No cubras el hueco con testimonios, cifras, garantía, precio, comparación o FAQ inventados.
5. **Elige profundidad proporcional.** Con evidencia variada, propone normalmente cinco a siete tareas sustantivas distintas; con poca información, usa menos. No conviertas cada beneficio en una tarjeta/sección. Una demo, lista o pieza creativa se incluye completa si el brief la pide.
6. **Conecta diseño con lectura.** Propón una composición para cada tarea (secuencia, demostración, catálogo real, nota editorial, comparación respaldada, preguntas, etc.). Cambia el patrón cuando cambie la tarea; no llames “ambicioso” a añadir decoración, una segunda columna o secciones repetidas.
7. **Define acción comprobable.** Conserva el CTA y destino entregados. Si no hay destino, sugiere una ancla a contenido real de la propia página o deja la decisión indicada como propuesta; no prometas envío, reserva ni compra sin una función proporcionada.

## Artefacto editable

Devuelve `TechniqueContribution`; apunta a una ficha de 700–1,400 caracteres para que la persona pueda revisar cada paso:

```text
audience_signal: cita/paráfrasis fiel o “no proporcionada”
decision_moment: qué debe poder decidir el visitante
journey: tarea → dato/contenido del brief → evidencia o estado de hipótesis → forma compositiva
sections: id y propósito de cada etapa propuesta, en orden
questions: hipótesis vinculada a señal, o ninguna
content_homes: requisitos enumerables y sección destino, con cantidad/textos si ya existen
action: CTA y destino del brief, o ancla local propuesta
open_inputs: datos que siguen haciendo falta
references_read: nombres exactos o “sin referencias locales”
```

No redactes en `artifact` una landing paralela ni cierres decisiones que pertenezcan a `combine`. El artefacto es un mapa que `combine` puede mantener, modificar explicando la tensión o dejar fuera con razón.

## Ejemplo

Brief: “asesoría de bicicletas urbanas; la persona trae su bici, revisamos frenos y cambios; pedir cita por teléfono”. Resultado: tarea central = entender qué se revisa antes de llamar; recorrido breve = alcance real de la revisión → cómo es la cita descrita → teléfono proporcionado. “¿Cuánto cuesta?” solo sería una hipótesis si aparece como señal; si no hay precio, se registra como dato ausente, no como sección con promesa.

## Revisión

- Cada tarea responde a una pregunta distinta y usa una señal real o marca un vacío.
- Las motivaciones son hipótesis trazables, no resultados de investigación.
- El inventario enumerado y sus cantidades tienen una sección destino y contenido completo.
- El número de secciones sigue el material disponible; ninguna repite la misma promesa.
- El CTA lleva a una URL proporcionada o a contenido/ancla existente; no hay conversión declarada ni acción ficticia.
- Las composiciones explican una necesidad de lectura y las referencias se atribuyen solo si fueron cargadas.
