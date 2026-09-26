# XPage

XPage convierte un brief en prompts de landing basados en ocho técnicas de diseño. Puedes editar y combinar prompts, generar una página, previsualizar e inspeccionar su HTML, CSS y JavaScript, descargarla como un archivo `.html` y guardarla en la Biblioteca local.

Las landings guardadas se almacenan en una base SQLite local con Prisma. El archivo `prisma/xpage.db` sobrevive al reiniciar Next.js y está excluido de Git.

## Requisitos

- Node.js 22 o posterior (se recomienda Node.js 24 LTS para AI SDK 7).
- pnpm 10 o posterior.
- Una clave de Gemini, una clave de OpenRouter o ambas.

## Inicio local

Desde esta carpeta (`xpage/`):

```bash
pnpm install
```

Copia `.env.example` a `.env.local` y completa las claves que quieras usar:

```dotenv
GOOGLE_GENERATIVE_AI_API_KEY=tu_clave_de_gemini
GEMINI_MODEL=gemini-3.8-flash
OPENROUTER_API_KEY=tu_clave_de_openrouter
OPENROUTER_MODEL=qwen/qwen3.8-27b:free
OPENROUTER_FALLBACK_MODEL=z-ai/glm-5.2:free
OPENROUTER_IMAGE_MODEL=recraft/recraft-v4.1-flash
OPENROUTER_IMAGE_FALLBACK_MODEL=meta/muse-image
```

Las claves solo se leen en el servidor. No las pongas en variables `NEXT_PUBLIC_*` ni las subas a Git. Después, inicia Next.js:

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

Al iniciar `pnpm dev`, XPage aplica las migraciones pendientes y conserva las páginas guardadas en `prisma/xpage.db`. Si cambias el esquema, crea y aplica una migración con:

```bash
pnpm db:migrate
```

Puedes inspeccionar la base local con `pnpm db:studio`. No borres `prisma/xpage.db` si quieres conservar la Biblioteca.

## Proveedores de IA

- Las solicitudes de texto prueban Gemini primero. Si Gemini responde con saturación o límite (`503` o `429`), XPage prueba Qwen y, si Qwen también se satura, GLM. Si falta la clave de Gemini, usa la misma cadena de OpenRouter directamente.
- Qwen y GLM son variantes gratuitas. OpenRouter publica un límite del plan gratuito de 50 solicitudes diarias, sujeto a cambios.
- Cada acción de texto puede usar hasta 3 llamadas. No hay otros reintentos automáticos. Los reintentos manuales inician una acción nueva.
- La portada es opcional y usa Recraft V4.1 Flash (aprox. US$0.007 por imagen) y Muse Image (US$0.01) solo si Recraft se satura. Estos modelos de imagen no son gratuitos. La imagen queda en memoria durante la sesión; descárgala para conservarla. No se incrusta en el HTML ni se guarda en la Biblioteca.

## Uso

1. Completa el brief con el tema, la oferta, el público y el tono.
2. Selecciona una o más técnicas. XPage genera un prompt por técnica, en secuencia.
3. Edita un prompt y construye la landing. El proveedor de texto sigue el orden descrito arriba.
4. Revisa la vista previa aislada, inspecciona y copia sus tres archivos, descarga el HTML o guarda la página.
5. En la vista previa, puedes generar y descargar una imagen de portada.

## Alcance del MVP

- La Biblioteca guarda únicamente las landings que marques manualmente en SQLite local. No hay cuentas, sincronización ni historial automático de llamadas a la IA.
- La primera vez que abras la Biblioteca, XPage importa las páginas antiguas de `localStorage` a SQLite y conserva la copia original del navegador.
- La vista previa bloquea conexiones y recursos remotos dentro de un `iframe` con sandbox. Las landings generadas no cargan imágenes remotas; la portada se obtiene y descarga por separado.
- La descarga HTML integra el código de la landing. La imagen no se añade al archivo descargado.

Modelos y límites: [Qwen gratis](https://openrouter.ai/qwen/qwen3.8-27b:free), [GLM gratis](https://openrouter.ai/z-ai/glm-5.2:free), [Recraft V4.1 Flash](https://openrouter.ai/recraft/recraft-v4.1-flash), [Muse Image](https://openrouter.ai/meta/muse-image) y [plan gratuito de OpenRouter](https://openrouter.ai/pricing/).

## Comandos

```bash
pnpm dev       # desarrollo local
pnpm lint      # revisión estática
pnpm typecheck # comprobación de tipos
pnpm build     # compilación de producción
pnpm start     # iniciar la compilación de producción
```
