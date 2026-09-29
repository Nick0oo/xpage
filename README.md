# XPage

XPage es un estudio local para planear, construir y ajustar landings con Eve. Reúne brief, técnicas, dirección creativa, generación HTML, medios, editor por secciones, trazabilidad, Biblioteca y exportación.

## Requisitos y arranque

- Node.js 24 o posterior y pnpm 10.
- Codex CLI instalado en Windows y sesión local de ChatGPT/Codex iniciada. XPage detecta el ejecutable nativo de Codex para Eve; no modifica el PATH global.
- Las claves de Gemini, OpenRouter y Pexels son opcionales y solo se necesitan al elegir esos servicios.

Desde esta carpeta:

```bash
pnpm install
pnpm dev
```

Abre http://localhost:3000. Si Eve no encuentra una sesión local, inicia sesión con `pnpm eve:dev` y el comando `/login`; luego vuelve a XPage. No copies tokens a `.env`.

## Modelos y servicios

El selector de Studio ofrece GPT-5.6 Luna y GPT-6 Luna mediante Eve/Codex, además de Gemini y Qwen. La selección explícita se mantiene durante el flujo; un error del proveedor se muestra para permitir reintentar o cambiarlo. GPT-6 requiere acceso habilitado en la cuenta local.

Gemini usa `GOOGLE_GENERATIVE_AI_API_KEY` y `GEMINI_MODEL`. Qwen usa `OPENROUTER_API_KEY` y `OPENROUTER_MODEL`. Pexels usa `PEXELS_API_KEY` para buscar fotos y clips. XPage no genera vídeo. La generación opcional de imagen usa OpenRouter y requiere confirmación en Studio; puede consumir cuota o tener costo. La imagen se guarda como activo local, no como dato binario en la traza.

Copia `.env.example` a `.env.local` y completa solo los servicios que vas a usar. Las variables son de servidor: no las declares como `NEXT_PUBLIC_*` ni compartas el archivo.

## Recorrido

1. Completa el brief, elige técnicas y genera direcciones creativas.
2. Selecciona una dirección, revisa los aportes y ajusta el prompt antes de construir.
3. Guarda la landing en Biblioteca para conservar código, dirección elegida, traza y revisión.
4. Busca un medio o solicita una imagen opcional; asigna el resultado a una sección y espacio del plan.
5. En el editor, selecciona una sección marcada, pide una propuesta y compara antes de aplicarla. Los cambios se pueden deshacer. Las landings históricas sin marcadores siguen abriendo y descargándose, pero no admiten edición puntual.
6. Exporta HTML independiente o ZIP con medios locales y `CREDITOS.txt`.

## Datos locales y respaldo

XPage no tiene cuentas ni sincronización. La Biblioteca usa `prisma/xpage.db`; los binarios de medios están en `data/assets/`. Ambos directorios se excluyen de Git. Para respaldar una instalación, cierra XPage y copia la base SQLite y toda la carpeta `data/assets/` a un lugar seguro. Restaurar solo la base sin los activos conserva metadatos, pero los archivos asociados no estarán disponibles. Consulta [operación y datos locales](docs/v2/07-integracion-producto.md).

El ZIP de una landing con medios incluye `index.html`, archivos relativos bajo `assets/` y créditos. Sin medios, la descarga es un HTML autocontenido. Las exportaciones se registran en trazabilidad cuando hay una traza asociada.

## Comandos

```bash
pnpm dev       # Next.js y Eve en local
pnpm eve:dev   # sesión local de Eve/Codex y /login
pnpm lint
pnpm typecheck
pnpm build
pnpm start
pnpm db:migrate
pnpm db:studio
```
