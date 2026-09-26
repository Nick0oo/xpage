import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Brief } from "@/lib/schemas";

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
  );
}
