import { Checkbox } from "@/components/ui/checkbox";
import { techniques, type TechniqueId } from "@/lib/techniques";

type TechniqueSelectorProps = {
  selected: TechniqueId[];
  disabled?: boolean;
  onToggle: (id: TechniqueId) => void;
};

export function TechniqueSelector({ selected, disabled, onToggle }: TechniqueSelectorProps) {
  return (
    <fieldset disabled={disabled}>
      <legend className="sr-only">Selecciona técnicas de diseño</legend>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {techniques.map((technique, index) => {
          const checked = selected.includes(technique.id);
          const checkboxId = `technique-${technique.id}`;

          return (
            <div
              key={technique.id}
              className={`overflow-hidden rounded-xl border transition-colors ${
                checked ? "border-primary/45 bg-accent/35" : "border-border bg-card hover:border-primary/30"
              } ${disabled ? "opacity-60" : ""}`}
            >
              <label
                htmlFor={checkboxId}
                className="group flex min-h-[94px] cursor-pointer gap-3 p-3.5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-inset sm:p-4"
              >
                <Checkbox
                  id={checkboxId}
                  checked={checked}
                  onCheckedChange={() => onToggle(technique.id)}
                  aria-label={`Seleccionar ${technique.name}`}
                  className="mt-0.5"
                />
                <span className="min-w-0">
                  <span className="flex items-start gap-2">
                    <span className="text-[11px] tabular-nums text-muted-foreground">0{index + 1}</span>
                    <span className="text-sm font-medium leading-5">{technique.name}</span>
                  </span>
                  <span className="mt-1 block pl-7 text-xs leading-5 text-muted-foreground">
                    {technique.summary}
                  </span>
                </span>
              </label>
              <details className="group/details mx-3.5 border-t border-border/70 pb-2.5 pt-2 sm:mx-4">
                <summary className="cursor-pointer text-xs font-medium text-primary marker:text-primary focus-visible:outline-none focus-visible:underline">
                  Qué hará en tu prompt
                </summary>
                <p className="mt-2 pl-0.5 text-xs leading-5 text-muted-foreground">
                  {technique.instruction}
                </p>
              </details>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
