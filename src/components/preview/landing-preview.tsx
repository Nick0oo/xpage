"use client";

import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildPreviewDocument } from "@/lib/preview-document";
import type { LandingCode } from "@/lib/schemas";

type LandingPreviewProps = {
  code: LandingCode;
};

export function LandingPreview({ code }: LandingPreviewProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const srcDoc = buildPreviewDocument(code);

  return (
    <section aria-labelledby="preview-heading" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Resultado</p>
          <h2 id="preview-heading" className="mt-1 font-display text-2xl">Vista previa</h2>
        </div>
        <div aria-label="Ancho de la vista previa" className="inline-flex rounded-lg border border-border bg-card p-1">
          <Button
            type="button"
            variant={device === "desktop" ? "secondary" : "ghost"}
            size="sm"
            aria-pressed={device === "desktop"}
            onClick={() => setDevice("desktop")}
          >
            <Monitor size={14} aria-hidden="true" />
            Escritorio
          </Button>
          <Button
            type="button"
            variant={device === "mobile" ? "secondary" : "ghost"}
            size="sm"
            aria-pressed={device === "mobile"}
            onClick={() => setDevice("mobile")}
          >
            <Smartphone size={14} aria-hidden="true" />
            Móvil
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-[#e9e9e2] p-2 sm:p-3">
        <iframe
          title={`Vista previa de ${code.title}`}
          srcDoc={srcDoc}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          loading="lazy"
          className={`mx-auto block h-[500px] rounded-xl border border-border bg-white shadow-sm transition-[width] duration-300 sm:h-[540px] ${
            device === "mobile" ? "w-[390px] max-w-full" : "w-full"
          }`}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        La vista previa está aislada. Los recursos remotos y los formularios no se ejecutan aquí.
      </p>
    </section>
  );
}
