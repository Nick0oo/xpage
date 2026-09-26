"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { LandingCode } from "@/lib/schemas";

type CodeTabsProps = {
  code: LandingCode;
};

function CodePanel({ label, source }: { label: string; source: string }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  async function copySource() {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      setCopyError("");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopyError("El navegador no permitió copiar. Selecciona el código y cópialo manualmente.");
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-[#171a17]">
      <div className="flex min-h-12 items-center justify-between gap-3 border-b border-white/10 px-3 sm:px-4">
        <span className="font-mono text-xs text-white/60">{label}</span>
        <Button type="button" variant="ghost" size="sm" onClick={copySource} className="text-white hover:bg-white/10 hover:text-white">
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
      <pre className="max-h-[440px] overflow-auto p-4 text-xs leading-6 text-[#e6e9e3]">
        <code>{source || "<!-- Sin contenido -->"}</code>
      </pre>
      {copyError ? <p role="status" className="border-t border-white/10 px-4 py-2 text-xs text-white/70">{copyError}</p> : null}
    </div>
  );
}

export function CodeTabs({ code }: CodeTabsProps) {
  return (
    <section aria-labelledby="code-heading" className="space-y-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Inspección</p>
        <h2 id="code-heading" className="mt-1 font-display text-2xl">HTML, CSS y JavaScript</h2>
      </div>
      <Tabs defaultValue="html" className="gap-3">
        <TabsList variant="line" className="w-full justify-start border-b border-border px-0">
          <TabsTrigger value="html" className="max-w-24">HTML</TabsTrigger>
          <TabsTrigger value="css" className="max-w-24">CSS</TabsTrigger>
          <TabsTrigger value="js" className="max-w-24">JavaScript</TabsTrigger>
        </TabsList>
        <TabsContent value="html"><CodePanel label="index.html · fragmento" source={code.html} /></TabsContent>
        <TabsContent value="css"><CodePanel label="styles.css" source={code.css} /></TabsContent>
        <TabsContent value="js"><CodePanel label="script.js" source={code.js} /></TabsContent>
      </Tabs>
    </section>
  );
}
