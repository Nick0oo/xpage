# Plan 06 · Prueba de Eve con suscripción de ChatGPT en local

**Objetivo:** comprobar que el agente Eve de XPage puede atender una petición de Studio usando el inicio de sesión local con suscripción, sin una clave de API de texto. Esta prueba decide la configuración primaria del plan 01.

**No depende de:** otros planes. Debe ser pequeña y terminar antes de fijar el transporte del agente.

## Hechos conocidos y límite

Eve documenta `ChatGPT Subscription` en su comando local `/login` y dice que esos modelos son locales. OpenAI documenta el acceso de Codex por suscripción y la facturación separada del uso con API key. Esto **no demuestra todavía** que el flujo exacto XPage → Next.js → Eve → plan estructurado funcione en esta máquina; se prueba aquí. La clave de OpenRouter de imagen sigue siendo una credencial distinta. No automatizar la web de ChatGPT, copiar cookies ni trasladar tokens del navegador al código.

Fuentes: [Eve dev TUI](https://github.com/vercel/eve/blob/main/docs/guides/dev-tui.md), [Eve + Next.js](https://github.com/vercel/eve/blob/main/docs/guides/frontend/nextjs.mdx), [OpenAI Docs: autenticación de Codex](https://learn.chatgpt.com/docs/auth).

## Prueba del worker

1. Leer la documentación de la versión de Eve que se vaya a instalar, su requisito de Node y su integración `withEve`. Verificar que no cambie el proyecto Next existente ni inicialice otro Git.
2. Preparar un agente mínimo temporal **dentro de `xpage/`** con una skill y una herramienta de salida estructurada pequeña. Configurar canal local para el front existente.
3. Iniciar sesión mediante el flujo oficial local de Eve con ChatGPT, sin introducir API key de texto. Ejecutar una petición real desde una página o acción mínima de XPage y recibir resultado validado. Verificar continuidad tras reiniciar los procesos locales y comportamiento cuando la sesión falta o caduca.
4. Registrar en un informe corto: comando de inicio, versión, método de autenticación, modelo disponible, límites observados, almacenamiento de credenciales, latencia aproximada y fallos. No incluir secretos, tokens ni contenidos sensibles de credenciales.
5. Si funciona, dejar la conexión local lista para el plan 01 y un mensaje claro «Inicia sesión en Eve» cuando no haya sesión. Si falla, dejar evidencia reproducible y mantener la ruta de Gemini/OpenRouter hasta resolver la causa; no simular éxito.

## Aceptación

- Una solicitud de texto desde XPage llega a Eve y vuelve con datos estructurados sin clave de API de texto configurada.
- Reiniciar Next/Eve no exige copiar tokens manualmente; ausencia de sesión se comunica sin exponer credenciales.
- El informe diferencia qué se comprobó de lo que Eve/OpenAI documentan y deja un comando de reproducción local.
- `pnpm lint`, `pnpm typecheck` y el inicio local siguen funcionando.

**Frontera:** no planear despliegue, autenticación multiusuario ni usar la suscripción para una API genérica de imagen o vídeo. El producto está autorizado para uso local.
