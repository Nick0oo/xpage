# Plan 02 · Imágenes y vídeos dentro de la landing

**Objetivo:** buscar imágenes y clips gratuitos, generar imágenes por API y usar el activo elegido en la landing, la Biblioteca, la traza y la exportación. **No generar vídeo por IA.**

**Depende de:** espacios de medios del plan 01 y esquema de traza del plan 03.

## Alcance y decisiones

- Búsqueda inicial: Pexels para fotos y vídeos; Pixabay como segundo conector si la integración inicial queda validada. Ambos requieren conservar enlace de origen y mostrar atribución del banco al presentar resultados de API. Verificar sus condiciones vigentes al implementar.
- Generación de imagen: reutilizar primero el proveedor existente de `src/app/api/images/route.ts`, encapsulado tras una interfaz de proveedor. Avisar antes de una llamada que pueda costar dinero. No prometer una cuota gratuita permanente de generación.
- Vídeo: búsqueda y elección de clips de banco gratuito. En la página, usar `<video>` con póster, reproducción silenciada si es fondo, controles cuando corresponda y alternativa para `prefers-reduced-motion`.
- El usuario elige un resultado antes de colocarlo. Nunca tomar automáticamente el primer resultado de búsqueda como definitivo.

## Modelo y archivos previstos

`MediaAsset` tendrá ID, `image|video`, `stock|generated`, proveedor, ID/URL del proveedor, autor, enlace de crédito, licencia o condiciones y fecha de consulta, prompt de generación cuando aplique, MIME, dimensiones/duración, ruta local, póster, alt/caption y `sectionId`/`slotId` de destino. El binario se guarda en un directorio local ignorado por Git, por ejemplo `xpage/data/assets/`; SQLite solo guarda metadatos y ruta. Limitar tamaño, tipo y URL de descarga.

Crear adaptadores de búsqueda en `src/lib/media/providers/`, almacenamiento/validación en `src/lib/media/`, rutas servidor en `src/app/api/media/` y controles en `src/components/media/`. Añadir el directorio de binarios a `.gitignore`. El worker puede ajustar nombres respetando el contrato compartido.

## Secuencia del worker

1. Consultar documentación y licencias de los bancos; verificar cómo descargar cada tipo de archivo y qué atribución mostrar. Guardar API keys solo en servidor.
2. Implementar búsqueda paginada con filtros básicos (consulta, orientación para imagen, tipo y duración para vídeo cuando la API lo permita), estado sin resultados y error de cuota. Mostrar fuente y creador junto a cada tarjeta.
3. Implementar selección y descarga local controlada. Vincular el activo al espacio de una sección. Para imagen generada, guardar prompt, modelo, coste estimado si se puede conocer y archivo; dejar de guardar base64 en nuevas trazas.
4. Renderizar activos en preview aislado mediante una ruta local permitida explícitamente por la CSP, sin abrir conexiones arbitrarias desde el HTML generado. Probar tanto `localhost` como `127.0.0.1` si ambos están soportados.
5. Exportar imágenes dentro del HTML cuando el tamaño sea razonable; para vídeo, ofrecer un paquete con HTML, clip, póster y créditos relativos. No generar un HTML que funcione solo mientras XPage esté abierto sin avisar.

## Aceptación

- Buscar y elegir una foto y un vídeo los coloca en secciones correctas; la vista previa y la Biblioteca los muestran después de recargar.
- Una imagen generada entra en un espacio real de la landing y mantiene sus datos de generación.
- La traza muestra consulta/prompt, opciones elegidas, proveedor, autor/licencia y destino; SQLite no recibe el binario/base64 nuevo.
- Preview y exportación reproducen o muestran medios sin romper el aislamiento del iframe. El vídeo respeta movimiento reducido.
- Sin clave de banco o al llegar a un límite, el resto del Studio funciona y explica cómo continuar.
- `pnpm lint`, `pnpm typecheck`, `pnpm build` y una prueba manual por cada fuente integrada pasan.

**Frontera:** el worker no construye generadores de vídeo ni un mercado propio de activos. El plan 07 hará la revisión final de exportaciones y créditos.

## Fuentes de implementación

- [Pexels API](https://www.pexels.com/api/documentation/) y [licencia](https://www.pexels.com/legal-pages/license/).
- [Pixabay API](https://pixabay.com/api/docs/) y [licencia](https://pixabay.com/service/license-summary/).
