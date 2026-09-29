import { ArrowRight, Check, Compass, Layers3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CreativeDirection } from "@/lib/creative-directions";
import { techniques } from "@/lib/techniques";

export function CreativeDirectionPicker({
  directions,
  onChoose,
  disabled = false,
}: {
  directions: CreativeDirection[];
  onChoose: (direction: CreativeDirection) => void;
  disabled?: boolean;
}) {
  if (directions.length === 0) return null;

  return (
    <section aria-labelledby="creative-directions-heading" className="space-y-4 rounded-2xl border border-primary/20 bg-primary/[0.025] p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Una generación · {directions.length} rutas</p>
          <h3 id="creative-directions-heading" className="mt-1 font-display text-xl sm:text-2xl">Elige una dirección para construir</h3>
          <p className="mt-1 max-w-2xl text-sm leading-5 text-muted-foreground">Cada opción incluye su propia estructura, estilo y prompt. Los métodos seleccionados se aplican en las tres.</p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Compass size={14} aria-hidden="true" /> Compara composición y recorrido</span>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        {directions.map((direction, index) => (
          <article key={direction.id} className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card">
            <header className="border-b border-border/70 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Dirección 0{index + 1}</p>
              <h4 className="mt-1 font-display text-lg leading-tight">{direction.title}</h4>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{direction.concept}</p>
            </header>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <div className="rounded-lg bg-muted/40 p-3 sm:col-span-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Primera pantalla</p>
                <p className="mt-1 text-sm leading-5">{direction.firstScreen}</p>
              </div>
              <Detail label="Recorrido" value={direction.narrative} />
              <Detail label="Paleta" value={direction.palette} />
              <Detail label="Tipografía" value={direction.typography} />
              <Detail label="Motivo visual" value={direction.motif} />
              <Detail label="Imagen y movimiento" value={direction.mediaUse} />
              <Detail label="Por qué encaja" value={direction.rationale} />
              <div className="sm:col-span-2">
                <p className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"><Layers3 size={13} aria-hidden="true" /> Diferencias estructurales</p>
                <ul className="mt-1.5 grid gap-1 sm:grid-cols-2">
                  {direction.structuralDifference.map((item) => <li key={item} className="flex gap-2 text-xs leading-5"><Check size={13} className="mt-1 shrink-0 text-primary" aria-hidden="true" /><span>{item}</span></li>)}
                </ul>
              </div>
              {direction.designPlan.creativeSettings ? (
                <div className="flex flex-wrap gap-1.5 sm:col-span-2" aria-label="Controles aplicados">
                  <SettingChip>Variedad {direction.designPlan.creativeSettings.variety}</SettingChip>
                  <SettingChip>Movimiento {direction.designPlan.creativeSettings.movement}</SettingChip>
                  <SettingChip>Densidad {direction.designPlan.creativeSettings.density}</SettingChip>
                  {direction.designPlan.creativeSettings.objective ? <SettingChip>Objetivo {direction.designPlan.creativeSettings.objective}</SettingChip> : null}
                </div>
              ) : null}
              <div className="sm:col-span-2 border-t border-border/70 pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Métodos incorporados</p>
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {direction.designPlan.contributions.map((item) => (
                    <li key={item.techniqueId} className="rounded-full bg-muted px-2 py-1 text-[11px]">
                      {techniques.find(({ id }) => id === item.techniqueId)?.name}: {item.artifact}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="sm:col-span-2">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Secciones planeadas</p>
                <ol className="grid gap-1 sm:grid-cols-2">
                  {direction.designPlan.sections.map((section) => (
                    <li key={section.id} className="rounded-md border border-border/70 px-2.5 py-2 text-xs">
                      <span className="font-medium">{section.role}</span><span className="text-muted-foreground"> · {section.purpose}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <footer className="mt-auto border-t border-border/70 p-3">
              <Button type="button" className="w-full" onClick={() => onChoose(direction)} disabled={disabled}>
                Elegir esta dirección <ArrowRight size={15} aria-hidden="true" />
              </Button>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-xs leading-5">{value}</p></div>;
}

function SettingChip({ children }: { children: React.ReactNode }) {
  return <span className="max-w-full break-words rounded-full bg-accent/60 px-2 py-1 text-[11px] text-foreground">{children}</span>;
}
