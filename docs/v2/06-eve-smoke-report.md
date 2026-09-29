# Informe de prueba local de Eve

## Configuración reproducible

- Runtime comprobado: Eve `0.68.0`; Node `v24.18.0` (Eve requiere Node `>=24`).
- El agente declara GPT-5.6 Luna normal como modelo base y admite selección dinámica de GPT-5.6 Luna, GPT-6 Luna, Gemini y Qwen. No se usa ningún modelo fast.
- `pnpm dev` arranca Next y el servidor local de Eve sin TUI. `pnpm eve:dev` abre Eve para iniciar sesión; usar `/login` y elegir `ChatGPT Subscription` cuando se necesite autorizar la cuenta.
- El launcher local antepone solo para el proceso el directorio que contiene `codex.exe` nativo; no requiere cambiar el PATH global ni copiar credenciales a `.env`.
- La página `/eve-prueba` envía una petición estructurada que requiere `estado: "ok"` y un `resumen` no vacío.

## Evidencia y límites

- **Confirmado:** una llamada real desde `/eve-prueba` devolvió JSON válido con `estado: "ok"` usando ChatGPT Subscription y GPT-5.6 Luna.
- **Confirmado después:** GPT-6 Luna respondió a una prueba de texto. Una petición `DesignPlan` desde `/api/prompts` no terminó dentro de 30 segundos; no se considera validado ese flujo completo.
- La generación de HTML, imagen y propuestas de edición no queda certificada por estas pruebas. La imagen usa OpenRouter y requiere una clave propia; no forma parte de la suscripción ChatGPT.
- No se configuró una clave de API de texto ni se copiaron tokens. El login local lo administra Eve/Codex.

La respuesta de `/eve-prueba` demuestra el recorrido local XPage → Eve → ChatGPT Subscription para esa salida estructurada. No prueba latencia estable, continuidad tras reinicio autenticado ni comportamiento ante una sesión ausente o caducada.
