"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildPreviewDocument, makeDownloadName } from "@/lib/preview-document";
import type { LandingCode } from "@/lib/schemas";

type DownloadHtmlButtonProps = {
  code: LandingCode;
};

export function DownloadHtmlButton({ code }: DownloadHtmlButtonProps) {
  function downloadHtml() {
    const blob = new Blob([buildPreviewDocument(code)], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = makeDownloadName(code.title);
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={downloadHtml}>
      <Download aria-hidden="true" />
      Descargar HTML
    </Button>
  );
}
