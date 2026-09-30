---
name: seed-strings
description: Use the String Seed of Thought method to steer one distinct, brief-faithful creative direction for a landing page. Trigger when a user selects Cadenas semilla / seed-strings, asks for a seed-led concept, or wants several valid design possibilities narrowed to one expressive route. Treat the seed as an ephemeral, arbitrary text control signal, not a visual motif or brand fact. Carry the selected route through the combined plan, editable prompt, and generated page.
---
# Cadenas semilla · v2.0.0

## Propósito

Usa una cadena semilla arbitraria para inducir una decisión creativa entre varias rutas que ya cumplen el brief. El método aporta una dirección singular, reconocible y expresiva; no establece por sí solo la identidad de marca ni sustituye la estrategia, la composición, la accesibilidad o el contenido.

La investigación de String Seed of Thought estudia cadenas aleatorias como señal de control para inducir generaciones fieles a una distribución objetivo (PIF) o respuestas más diversas (DAG). Esta adaptación de XPage toma esa idea como inspiración de prompting. No afirma reproducir el método experimental, controlar una distribución estadística, producir aleatoriedad criptográfica ni garantizar resultados deterministas. Consulta `REFERENCE.md` para el alcance de la fuente y los límites de esta adaptación.

## Cargar referencias en Eve

Las referencias copiadas de OpenDesign están disponibles a través de `read_seed_reference`; `load_skill` por sí solo no carga referencias. Lee las fuentes juntas en una sola llamada por fase. En la fase de exploración consulta `string-seed-of-thought`, `xpage-adaptation`, `frontend-design`, `web-prototype-layouts` y `system-prompt-excerpts`. Usa `totality-festival-design` solo como ejemplo de un sistema expresivo si ayuda a estudiar cómo atar forma, paleta y motivo. Nunca heredes su paleta como predeterminada. El charter `system-prompt-excerpts` aporta criterios de oficio; queda subordinado al contrato de XPage.

Si se construye el HTML de un plan que incluye `seed-strings`, vuelve a cargar esta skill y consulta en una sola llamada `web-prototype-skill`, `web-prototype-checklist`, `system-prompt-excerpts` y `xpage-adaptation`. Consulta `web-prototype-layouts` solo si necesitas resolver una composición que el prompt final no especifica. Usa los patrones y el checklist para producir un recorrido completo, expresivo y sin relleno. Aplica solo ideas compatibles con el prompt final, HTML autónomo, contenido obligatorio, accesibilidad y sandbox de XPage. No cargues una referencia solo para afirmar que la leíste; usa su contenido en una decisión concreta.

## Cuándo usarla

- La persona seleccionó `seed-strings` o pidió explícitamente una dirección guiada por semilla.
- El brief admite más de una composición válida y conviene elegir una ruta con personalidad.
- Se necesita conservar una decisión creativa independiente en una contribución revisable y editable.

Si el brief solo permite una solución por restricciones, no fuerces divergencia: registra la restricción y aplica la semilla únicamente a una decisión secundaria que siga siendo útil. Si la semilla entra en conflicto con contenido, identidad confirmada, accesibilidad o controles del usuario, esas fuentes tienen precedencia.

## Procedimiento

### 1. Fija el espacio válido

Antes de generar alternativas, extrae del brief:

- Hechos expresos: oferta, público, acción, marca y tono.
- Inventario completo de contenidos que deben aparecer, con sus cantidades.
- Restricciones, fuentes, destino del CTA, requisitos de accesibilidad y elecciones que la persona ya fijó.
- Datos desconocidos. Márcalos como hipótesis o preguntas; no los conviertas en hechos.

Estas condiciones delimitan todas las alternativas. No uses la semilla para cambiar nombre, oferta, cantidad, destinatario, claims, precios, funcionamiento ni CTA.

Cada exclusión compositiva explícita también es una condición dura, no una preferencia: aplícala a las tres candidatas, la ruta seleccionada, el prompt editable y el HTML final. Por ejemplo, si el brief dice «avoid hero split», ninguna candidata puede proponer un hero dividido y `combine`/HTML no lo pueden reintroducir. Comprueba la forma real de cada composición, aunque use otro nombre o tratamiento gráfico.

### 2. Fija el espacio de variación

Identifica las decisiones compositivas que el brief permite variar, pero aún no elijas ni desarrolles una ruta. Cambia decisiones estructurales relevantes, no solo paleta, adjetivos o adornos. Entre las dimensiones posibles están:

- cómo entra el hero (titular editorial, pieza tipográfica, escena o demostración);
- cómo se explica el valor (secuencia, mapa, catálogo, comparación respaldada o caso);
- ritmo y densidad (pausas, notas laterales, cambios de escala, alternancia de texto y demostración);
- cómo se presentan los entregables o la evidencia;
- cómo se resuelve el cierre y se reencuentra el CTA.

La variedad solicitada y el tono son condiciones de entrada, no adjetivos para el copy final. Si el usuario pide una dirección atrevida, lúdica o visualmente intensa, las tres alternativas admisibles también deben respetar ese nivel de expresión; no presentes dos rutas seguras y una única ruta atrevida como coartada. Si pide sutileza, conserva el mismo cuidado y variedad estructural con gestos más discretos. No alteres hechos ni requisitos para obtener novedad. Si el usuario pidió una distribución o referencias concretas, describe esa distribución de forma explícita; sin una distribución de entrada, no alegues fidelidad estadística.

### 3. Crea y aplica la cadena

Genera primero una cadena corta y opaca con formato libre (por ejemplo, `rZ6.18/aQ`). No asignes significado temático a sus caracteres, no repitas una plantilla de caracteres como si codificara una estética o ruta, no presentes la cadena como una palabra clave mágica y no afirmes que puede reproducirse exactamente en otra ejecución. Varía la forma literal entre ejecuciones sin atribuir significado al formato. La cadena es una señal de prompting, no una fuente de hechos.

Usa la cadena para inducir tres rutas compositivas breves dentro de las posibilidades válidas y comprométete con una sola. Cada alternativa debe diferenciarse de las otras en al menos dos ejes sustantivos: estructura del hero, orden/forma de las secciones, escala y superficie gráfica, tratamiento del contenido o interacción local cuando sea pertinente. Describe evidencia visible para cada diferencia; renombrar el mismo índice lineal o cambiar solo paleta no cuenta. Todas deben corresponder al tono y variedad del brief, y selecciona la que exprese mejor esa intención en lo observable, no simplemente la primera opción segura. Resume el efecto creativo en lenguaje normal; no expongas razonamiento privado ni finjas que la cadena contiene la instrucción literalmente. Registra las otras rutas como alternativas revisables, no como páginas adicionales.

Una cadena distinta puede ayudar a explorar otra dirección si la persona pide alternativas; no prometas que cambiar la cadena producirá necesariamente un resultado distinto. En XPage, la contribución normal selecciona una dirección para que `combine` pueda desarrollarla, no genera varias landing pages.

### 4. Traduce la ruta a un plan implementable

Expresa la dirección elegida como una decisión visual y editorial concreta ligada al brief. Completa `designDNA` solo con propuestas coherentes con los hechos y controles:

- `brandMotif`: una imagen conceptual o gesto gráfico de la dirección elegida, claramente derivado de la oferta o presentado como propuesta creativa. No confundas la cadena opaca con el motivo.
- `palette`: roles legibles y compatibles con la marca confirmada o con una propuesta claramente identificada. No deduzcas colores del aspecto de los caracteres.
- `typography`: jerarquía y stacks disponibles localmente; no dependas de fuentes remotas.
- `composition`: explica el ritmo, la escala, la alineación y el patrón de lectura seleccionados.
- `invariants`: de tres a cinco reglas observables para dar continuidad con variación funcional entre secciones.

Elige dos a cuatro `compositionRecipeIds` del catálogo que se usen de verdad. Una receta es vocabulario compositivo, no una piel rígida. Asigna a cada sección una forma acorde con su tarea y conserva la dirección elegida al pasar de hero a detalle, entrega, dudas pertinentes y cierre. Incluye recursos gráficos locales (CSS/SVG, tipografía, líneas, diagramas, anotaciones o recortes) cuando aclaren el concepto; no añadas adorno por cumplir. Para una petición atrevida o lúdica, muestra la ruptura en decisiones implementables: una escala que cambie con intención, un gesto gráfico derivado del sujeto y superficies o ritmos que varíen entre secciones. Una dirección atrevida no exige neón, y una composición editorial cálida no es el valor por defecto: papel crema y acento rojo solo encajan si el brief o el concepto elegido los justifica.

### 5. Registra un aporte breve y editable

Devuelve los campos del contrato `TechniqueContribution`. `decision` resume la ruta elegida y por qué sirve al brief. En `artifact`, guarda una ficha sustantiva pero compacta (apunta a 2,200–4,500 caracteres; nunca excedas el límite de interfaz de 6,000) que pueda revisar y editar la persona. Incluye tokens propuestos por rol con valores concretos, un gesto compositivo aplicable sección por sección y destinos claros para el contenido obligatorio. No escribas copy final ni reemplaces el trabajo de `combine`:

```text
seed: rZ6.18/aQ
seed_role: señal efímera; no es un hecho, palabra clave ni motivo
references_read: string-seed-of-thought; frontend-design; web-prototype-layouts; system-prompt-excerpts; xpage-adaptation
design_system_source: selector local de XPage pendiente de combine; la referencia de sistema cargada es solo inspiración, no skin heredada
valid_routes: 1) ... 2) ... 3) ...
selected_route: ...
route_effect: ...
brand_motif_proposal: ...
palette_roles: fondo=...; superficie=...; texto=...; secundario=...; acento=...; borde/foco=...
typography: stack local y escala/tamaño/altura de línea por nivel
composition: ancho/ritmo/alineación/escala; gesto del hero y tratamiento de cada sección
continuity_rules: 3–5 reglas observables y dónde reaparecen
content_homes: hero=...; detalle=...; entrega/demostración=... (mapea cada inventario y cantidad requerida); cierre=...
interaction: comportamiento exacto del control pedido o elegido; semántica/teclado/foco, estado sin JS y fallback reduced-motion
constraints_kept: hechos, inventario/cantidades, marca, accesibilidad, CTA
```

Mantén el artefacto compacto para que sobreviva a la edición y al paso de integración. No escondas una decisión sustantiva dentro de la cadena: escríbela también en `selected_route` y `route_effect`. Si el usuario cambia esos campos, prevalece su edición en la combinación posterior. `applied` significa que la ruta seleccionada cambia el plan; `modified` explica el límite o ajuste; `omitted` requiere una razón concreta y no debe aparecer si el método sí afectó el plan.

### 6. Integra y conserva la ascendencia

Al combinar:

1. Carga la skill completa y lee el aporte editado. Trata la edición de la persona como autoritativa; no regeneres ni sustituyas silenciosamente la semilla o la ruta elegida.
2. Conserva una contribución de `seed-strings` con versión real, estado, decisión y artefacto. Resume el efecto en `designDNA`, el orden y composición de secciones, sin duplicar una identidad paralela.
3. Comprueba que el prompt editable nombra la dirección elegida, sus reglas visuales implementables y las restricciones que la acotan. Mantén esos datos si el prompt se vuelve a editar.
4. Al crear HTML, vuelve a leer el prompt final como contrato. Lleva la dirección a CSS/SVG, jerarquía, ritmo, secciones y detalles; preserva copy obligatorio, markers, slots, CTA y comportamiento accesible.
5. Si durante una edición posterior se cambia un elemento con impacto en la dirección, actualiza ese elemento y los ecos que dependan de él. No restaures una elección anterior sobre una edición expresa de la persona.

La dirección queda completa solo cuando se puede reconocer en más de un punto de la página, cada aparición apoya una tarea distinta, y la página sigue funcionando sin medios, movimiento o scripts opcionales.

## Reglas de calidad

- **Contraste real:** las rutas se distinguen por composición o modo de explicación, no por renombrar el mismo split ni por cambiar solamente colores.
- **Variedad calibrada:** cada ruta admisible corresponde al tono y nivel de variedad expresos. Para `atrevida`, incluye diferencias estructurales y de escala/superficie que se puedan localizar en el plan; evita pares que sean el mismo índice lineal con títulos distintos. Enuncia el hecho visual que prueba la diferencia.
- **Dirección específica:** deriva la forma gráfica principal de la oferta o del sujeto; no uses una estética educativa editorial, papel crema o acento rojo como opción automática. Esas decisiones son válidas si la premisa las sostiene. Tampoco fuerces colores brillantes o neón para aparentar variedad.
- **Interacción completa:** si el brief pide interacción local, describe el control exacto, sus estados, activación por teclado/foco y el contenido/fallback sin JavaScript o movimiento. Si no se pidió, propón interacción solo si mejora una tarea real.
- **Expresividad con función:** elige un gesto visual concreto y desarróllalo con variaciones de escala, orientación o densidad. No uses un blob, gradiente, garabato o patrón aleatorio solo para alegar originalidad.
- **Brief completo:** preserva todas las piezas solicitadas. No resumas una lista enumerable como promesa ni rellenes con secciones sin contenido.
- **Integridad factual:** intuiciones de diseño son propuestas, no investigación de marca o audiencia. No inventes evidencia, beneficios, métricas, testimonios ni garantías.
- **Accesibilidad:** conserva contraste, orden de lectura, HTML semántico, foco visible, operación por teclado y `prefers-reduced-motion`. La decoración no debe tapar contenido.
- **Medios honestos:** especifica un slot y su propósito; no afirmes que el archivo existe. Da una alternativa comprensible si se omite.
- **Revisabilidad:** identifica qué decisión cambió por la semilla y dónde aparece en la página. La cadena aislada no cuenta como aplicación.

## Ejemplos

### Ejemplo trabajado: taller de encuadernación

Brief hipotético de práctica: taller para principiantes; el brief proporciona cuatro pasos (cortar, plegar, coser, cubrir), pide mostrarlos todos y da un enlace de inscripción. No proporciona marca, testimonios ni paleta. Esta muestra no es una plantilla ni un sistema predeterminado:

```text
seed: bQ.7r/J2
seed_role: señal efímera de variación; no aporta significado visual
references_read: string-seed-of-thought, frontend-design, web-prototype-layouts, system-prompt-excerpts, xpage-adaptation
design_system_source: sistema final pendiente del selector local de XPage; colores siguientes son propuesta para este ejemplo
valid_routes: (1) catálogo de herramientas; (2) secuencia de cuatro pliegues; (3) índice editorial de materiales
selected_route: secuencia de cuatro pliegues, con el proceso como argumento de la página
route_effect: pasar de hoja plana a cuadernillo; el recorrido enseña los pasos sin prometer resultados del taller
brand_motif_proposal: una línea de costura que atraviesa un pliego y reaparece como regla de alineación
palette_roles: --page:#10172A; --surface:#18243C; --text:#F4F7FF; --muted:#B7C3D9; --action:#FF725E; --border:#43516D; --focus:#73E0D0
typography: system-ui; h1 clamp(3rem,8vw,6.5rem)/.92, h2 clamp(2rem,4vw,3.5rem)/1.05, body 1rem/1.65, labels .75rem/.1em tracking
composition: contenido max-width 72rem; hero tipográfico a la izquierda con pliego SVG grande en diagonal a la derecha; alternar pasos verticales numerados con un corte horizontal de ancho completo; cierre oscuro con el CTA provisto
continuity_rules: línea de costura fina en hero/pasos/cierre; número grande solo en cada paso; coral reservado al CTA; anchos de lectura cambian por función; no repetir tarjetas
content_homes: hero=oferta, principiantes y CTA real; proceso=los cuatro pasos completos en orden; cierre=repetir enlace de inscripción
interaction: cada paso usa <details><summary> con etiqueta visible; resumen operable por teclado y foco claro; todos los nombres de pasos permanecen visibles sin JS; la explicación se despliega de forma nativa, sin movimiento requerido
constraints_kept: cuatro pasos exactos; sin testimonios/claims añadidos; marca no proporcionada; verificar contraste de tokens antes de producción; conservar destino CTA
```

Los valores muestran el nivel de concreción solicitado, no afirman que el contraste ya se midió. Si la persona proporciona un sistema de marca, ese sistema reemplaza la propuesta de color. La línea de costura es una traducción del proceso descrito; no se deduce de `p9-Kv4-nQ`. Mantén la ruta expresiva sin aplicar automáticamente esta paleta, este pliegue ni el control `details` a otros briefs.

### Semilla subordinada a una restricción

Brief: servicio regulado con marca, paleta y orden de contenido aprobados. La contribución elige, entre rutas compatibles, un índice lateral y anotaciones de pasos. Registra `modified` si el gesto elegido debe reducirse para respetar la marca. Mantiene textos, colores, orden, claims y accesibilidad aprobados.

## Cierre

Antes de entregar, coteja brief y aporte: una cadena opaca breve; una ruta seleccionada; diferencias compositivas observables; motivo y decisiones de marca presentados correctamente; reglas llevadas a secciones reales; y ninguna obligación perdida. Corrige defectos localizados. No afirmes pruebas visuales, resultados de conversión o determinismo si no ocurrieron.
