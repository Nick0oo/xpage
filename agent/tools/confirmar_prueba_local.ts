import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Confirma que Eve recibió el tema de una prueba local de XPage.",
  inputSchema: z.object({ tema: z.string().trim().min(1).max(160) }),
  outputSchema: z.object({ recibido: z.literal(true), tema: z.string() }),
  execute({ tema }) {
    return { recibido: true as const, tema };
  },
});
