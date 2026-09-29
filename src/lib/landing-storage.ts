import { savedLandingSchema, type SavedLanding } from "@/lib/schemas";

const LEGACY_STORAGE_KEY = "xpage.saved-landings.v1";
const IMPORTED_STORAGE_KEY = "xpage.saved-landings.sqlite-imported.v1";

let migrationPromise: Promise<void> | null = null;

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, { cache: "no-store", ...init });
  } catch {
    throw new Error("No se pudo conectar con la Biblioteca local. Revisa que XPage esté activo.");
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "string"
        ? payload.error
        : "La Biblioteca no pudo completar la operación.";
    throw new Error(message);
  }

  return payload as T;
}

function readLegacyLandings(): SavedLanding[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.flatMap((item) => {
      const result = savedLandingSchema.safeParse(item);
      return result.success ? [result.data] : [];
    });
  } catch {
    return [];
  }
}

async function ensureLegacyLandingsImported() {
  if (typeof window === "undefined") return;

  try {
    if (window.localStorage.getItem(IMPORTED_STORAGE_KEY) === "1") return;
  } catch {
    return;
  }

  if (migrationPromise) return migrationPromise;

  migrationPromise = (async () => {
    const landings = readLegacyLandings();
    if (landings.length > 0) {
      await requestJson<{ imported: number }>("/api/library/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landings }),
      });
    }

    try {
      window.localStorage.setItem(IMPORTED_STORAGE_KEY, "1");
    } catch {
      // The idempotent import can run again if browser storage is unavailable.
    }
  })().finally(() => {
    migrationPromise = null;
  });

  return migrationPromise;
}

export async function listLandings(): Promise<SavedLanding[]> {
  await ensureLegacyLandingsImported();
  const payload = await requestJson<unknown>("/api/library");
  return savedLandingSchema.array().parse(payload);
}

export async function getLanding(id: string): Promise<SavedLanding | null> {
  await ensureLegacyLandingsImported();
  const payload = await requestJson<unknown>(`/api/library?id=${encodeURIComponent(id)}`);
  if (payload === null) return null;
  return savedLandingSchema.parse(payload);
}

export async function saveLanding(item: SavedLanding): Promise<void> {
  const parsed = savedLandingSchema.parse(item);
  await ensureLegacyLandingsImported();
  await requestJson<SavedLanding>("/api/library", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed),
  });
}

export async function deleteLanding(id: string): Promise<boolean> {
  await ensureLegacyLandingsImported();
  const payload = await requestJson<{ deleted: boolean }>(
    `/api/library?id=${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
  return payload.deleted;
}

export async function recordHtmlExport(traceId: string | null | undefined, landingId: string | null, filename: string) {
  if (!traceId) return;
  await requestJson<{ recorded: boolean }>(`/api/traces/${encodeURIComponent(traceId)}/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "html-export", landingId: landingId ?? undefined, filename }),
  }).catch(() => undefined);
}
