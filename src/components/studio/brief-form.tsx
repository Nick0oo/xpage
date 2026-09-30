import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Brief } from "@/lib/schemas";
import { designSystems } from "@/lib/design-systems/catalog";

type BriefFormProps = {
  brief: Brief;
  errors: Partial<Record<keyof Brief, string>>;
  disabled?: boolean;
  onChange: (field: keyof Brief, value: string) => void;
};

const fields: {
  name: keyof Brief;
  label: string;
  placeholder: string;
  multiline?: boolean;
}[] = [
  {
    name: "topic",
    label: "Tema o industria",
    placeholder: "Ej. educación financiera para jóvenes",
  },
  {
    name: "offer",
    label: "Producto y beneficio principal",
    placeholder: "¿Qué ofreces y qué mejora para quien lo usa?",
    multiline: true,
  },
  {
    name: "audience",
    label: "Público objetivo",
    placeholder: "¿A quién va dirigida esta página?",
    multiline: true,
  },
  {
    name: "tone",
    label: "Tono o dirección visual",
    placeholder: "Ej. claro, optimista y directo; verde y minimalista",
    multiline: true,
  },
  {
    name: "cta",
    label: "Acción principal (opcional)",
    placeholder: "Ej. Empieza gratis",
  },
];

export function BriefForm({ brief, errors, disabled, onChange }: BriefFormProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
        const error = errors[field.name];
        const id = `brief-${field.name}`;

        return (
          <div
            key={field.name}
            className={field.name === "offer" || field.name === "tone" ? "sm:col-span-2" : ""}
          >
            <Label htmlFor={id} className="mb-2 block text-sm font-medium">
              {field.label}
            </Label>
            {field.multiline ? (
              <Textarea
                id={id}
                value={brief[field.name]}
                onChange={(event) => onChange(field.name, event.target.value)}
                placeholder={field.placeholder}
                rows={field.name === "offer" ? 3 : 2}
                disabled={disabled}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : undefined}
                className="min-h-0 resize-y bg-card"
              />
            ) : (
              <Input
                id={id}
                value={brief[field.name]}
                onChange={(event) => onChange(field.name, event.target.value)}
                placeholder={field.placeholder}
                disabled={disabled}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${id}-error` : undefined}
                className="h-11 bg-card"
              />
            )}
            {error ? (
              <p id={`${id}-error`} className="mt-1.5 text-xs text-destructive">
                {error}
              </p>
            ) : null}
          </div>
        );
        })}
      </div>
      <details className="rounded-xl border border-border bg-muted/20 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Dirección creativa y referencias (opcional)</summary>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">Comparte contexto para distinguir mejor las propuestas. Las URLs o descripciones se tratan como referencias tuyas; XPage no las verifica ni las descarga.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {([
            ["brand", "Marca o logo", "Nombre de marca y descripción breve del logo; no subas secretos."],
            ["palette", "Paleta preferida", "Colores o restricciones de marca; se pueden dejar vacíos."],
            ["references", "Referencias", "URLs o descripción de imágenes, campañas o sitios que te sirven de referencia."],
            ["avoid", "Qué evitar", "Composiciones, colores, recursos o clichés que no quieres."],
            ["objective", "Objetivo principal", "Por ejemplo: explicar el proceso, presentar una colección o captar solicitudes."],
          ] as const).map(([field, label, placeholder]) => (
            <div key={field} className={field === "references" || field === "avoid" ? "sm:col-span-2" : ""}>
              <Label htmlFor={`brief-${field}`} className="mb-2 block text-sm font-medium">{label}</Label>
              <Textarea
                id={`brief-${field}`}
                value={brief[field]}
                onChange={(event) => onChange(field, event.target.value)}
                placeholder={placeholder}
                rows={field === "references" || field === "avoid" ? 2 : 1}
                disabled={disabled}
                className="min-h-0 resize-y bg-card"
              />
            </div>
          ))}
          <SelectField label="Variedad" value={brief.variety} onChange={(value) => onChange("variety", value)} disabled={disabled} options={[["sutil", "Exploración sutil"], ["equilibrada", "Equilibrada"], ["atrevida", "Muy distinta"]]} />
          <SelectField label="Movimiento" value={brief.movement} onChange={(value) => onChange("movement", value)} disabled={disabled} options={[["reducido", "Mínimo"], ["moderado", "Solo cuando explica algo"], ["dinamico", "Dinámico, con alternativa reducida"]]} />
          <SelectField label="Densidad" value={brief.density} onChange={(value) => onChange("density", value)} disabled={disabled} options={[["aireada", "Aireada"], ["equilibrada", "Equilibrada"], ["densa", "Densa y editorial"]]} />
          <SelectField label="Sistema de diseño" value={brief.designSystemId ?? ""} onChange={(value) => onChange("designSystemId", value)} disabled={disabled} options={[["", "Dejar que Eve elija"], ...designSystems.map((recipe) => [recipe.id, recipe.name] as const)]} />
        </div>
      </details>
    </div>
  );
}

function SelectField({
  label,
  value,
  disabled,
  onChange,
  options,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  options: readonly (readonly [string, string])[];
}) {
  const id = `creative-${label.toLocaleLowerCase()}`;
  return (
    <div>
      <Label htmlFor={id} className="mb-2 block text-sm font-medium">{label}</Label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="min-h-11 w-full rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {options.map(([option, text]) => <option key={option} value={option}>{text}</option>)}
      </select>
    </div>
  );
}
