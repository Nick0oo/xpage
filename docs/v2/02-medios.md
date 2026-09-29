# Plan 02 · Imágenes y vídeos dentro de la landing

**Objetivo:** buscar fotos y clips, guardar el medio elegido en la landing y conservarlo en preview, Biblioteca, traza y exportación. XPage no genera vídeo.

## Implementación

- Pexels es el conector de stock disponible para fotos y vídeos. La clave `PEXELS_API_KEY` solo se lee en servidor. Sin clave, con cuota agotada o sin resultados, Studio muestra un error recuperable; no cambia de proveedor en silencio. No se integró Pixabay en este corte.
- Cada resultado muestra autor y origen. La persona elige explícitamente foto o clip, sección y espacio del `DesignPlan`. Si el HTML no tiene un marcador único que coincida con el plan, XPage no lo modifica.
- La selección se descarga y valida en servidor. El archivo y, para vídeo, su póster se guardan bajo `data/assets`; SQLite guarda metadatos/rutas, nunca el binario. Sustituir un activo conserva la revisión anterior y marca cuál está vigente.
- La preview carga medios desde rutas locales. Los clips usan controles, `playsinline` y `preload="metadata"`; no se reproducen automáticamente. La Biblioteca vuelve a cargar la selección y muestra sus créditos.
- La exportación de una landing con medios es un ZIP con `index.html`, `assets/` y `CREDITOS.txt`; HTML y referencias de trazabilidad registran la exportación y los IDs de activos, no los bytes.
- La generación opcional de imagen usa la herramienta Eve existente y transporte OpenRouter configurado por el usuario. Studio requiere confirmación antes de la solicitud porque puede consumir cuota o tener costo. No se activa automáticamente ni se afirma que sea gratis.

## Límites y operación

- Pexels necesita `PEXELS_API_KEY`. Sus cuotas y condiciones dependen de la cuenta; revisar [documentación de Pexels](https://www.pexels.com/api/documentation/) y [licencia](https://www.pexels.com/legal-pages/license/).
- El paquete ZIP está limitado a 220 MB. El servidor devuelve un error recuperable si falta un archivo; vuelve a seleccionar ese medio antes de exportar.
- No se implementaron generación de vídeo ni Pixabay. La exportación y el guardado son locales; no suben activos a un hosting.
- La generación opcional usa una API externa y está sujeta al proveedor configurado. El binario de imagen no se copia a la traza.

## Validación

La integración admite comprobar UI, schema y compilación sin hacer llamadas con costo. El smoke de búsqueda/descarga Pexels requiere una clave válida; la generación de imagen no debe probarse automáticamente porque podría consumir cuota.
