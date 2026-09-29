import { AppShell } from "@/components/app-shell";
import { EveSmokeTest } from "@/components/eve-smoke-test";

export default function EveSmokeTestPage() {
  return (
    <AppShell currentPage="eve">
      <EveSmokeTest />
    </AppShell>
  );
}
