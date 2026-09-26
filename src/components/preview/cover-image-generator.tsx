import Image from "next/image";
import { Download, ImagePlus, LoaderCircle, Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

type CoverImageGeneratorProps = {
  imageDataUrl: string | null;
  loading: boolean;
  error: string;
  onGenerate: () => void;
};

export function CoverImageGenerator({
  imageDataUrl,
  loading,
  error,
  onGenerate,
}: CoverImageGeneratorProps) {
  const mediaType = imageDataUrl?.match(/^data:(image\/[\w.+-]+);base64,/)?.[1] ?? "image/png";
  const extension = mediaType.split("/")[1]?.replace("x-", "") ?? "png";

  return (
    <section aria-labelledby="cover-image-heading" className="space-y-3 rounded-xl border border-border bg-accent/20 p-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary">
          <ImagePlus size={17} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="cover-image-heading" className="font-display text-xl">Visual de portada</h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Recraft V4.1 Flash cuesta aprox. US$0.007 por imagen. Si se satura, XPage prueba Muse Image (US$0.01).
          </p>
        </div>
      </div>

      {imageDataUrl ? (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-lg border border-border bg-background">
            <Image
              src={imageDataUrl}
              alt="Imagen de portada generada para la landing"
              width={1536}
              height={1024}
              unoptimized
              className="aspect-video w-full object-cover"
            />
          </div>
          <a
            href={imageDataUrl}
            download={`xpage-portada.${extension}`}
            className={buttonVariants({ variant: "outline", className: "w-full" })}
          >
            <Download size={15} aria-hidden="true" />
            Descargar imagen
          </a>
        </div>
      ) : (
        <Button type="button" variant="outline" onClick={onGenerate} disabled={loading} className="w-full">
          {loading ? (
            <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
          ) : (
            <Sparkles size={15} aria-hidden="true" />
          )}
          {loading ? "Generando imagen…" : "Generar portada · hasta 2 llamadas"}
        </Button>
      )}

      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      <p className="text-[11px] leading-4 text-muted-foreground">
        Los precios pueden cambiar. La imagen y su prompt quedan en la trazabilidad de esta landing; descárgala para usarla fuera de XPage.
      </p>
    </section>
  );
}
