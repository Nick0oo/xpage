# Informe de prueba local de Eve

## Configuración reproducible

- Runtime instalado: Eve `0.68.0`; Node local `v24.18.0` (Eve requiere Node `>=24`).
- Modelo declarado por el agente: `chatgpt()` de `eve/models/openai` (modelo predeterminado documentado por Eve: `gpt-6-luna-fast`).
- Arranque de Next y su ruta local de Eve: desde `xpage/`, ejecutar `pnpm dev`.
- El servidor Eve que `withEve` crea para Next corre sin TUI (`eve dev --no-ui --port 0`). Para iniciar sesión, abrir otra terminal en `xpage/` y ejecutar `pnpm exec eve dev`; en su TUI usar `/login` → `ChatGPT Subscription` y completar la autorización de ChatGPT. Reiniciar `pnpm dev` para que la ruta de Next recoja la conexión local guardada.
- En XPage, abrir `http://localhost:3000/eve-prueba` y pulsar **Enviar prueba estructurada**. La solicitud pide un JSON `estado: "ok"` y `resumen`, y fuerza al agente a llamar `confirmar_prueba_local`.

## Evidencia y límites observados

La integración de código está lista y la compilación de Next incluye `/eve-prueba`. No se completó el login interactivo ni se observó una respuesta real de ChatGPT Subscription en esta sesión; por tanto, el recorrido XPage → Eve → ChatGPT y su latencia quedan **pendientes de comprobar manualmente**. No se configuró una clave de API de texto ni se copió ningún secreto.

Según la documentación de Eve 0.68.0, `/login` almacena credenciales OAuth administradas por Eve en el almacén de secretos del sistema operativo y selecciona ChatGPT Subscription como conexión local; esos modelos no funcionan en despliegue. Esa descripción es documentación del proveedor, no una verificación de almacenamiento en este equipo. Eve requiere Node `>=24`.

Comprobaciones ejecutadas desde `xpage/`: `pnpm lint`, `pnpm typecheck` y `pnpm build` pasaron. ESLint ignora `.eve/` porque contiene artefactos generados del runtime local. No se registró una latencia, continuidad tras reinicio autenticado ni el caso de sesión ausente/caducada con una solicitud real.
