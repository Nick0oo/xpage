import { randomUUID } from "node:crypto";
import { savedLandingSchema, type SavedLanding } from "@/lib/schemas";
import { prisma } from "@/lib/prisma";

type LandingRecord = {
  id: string;
  title: string;
  briefJson: string;
  techniqueIdsJson: string;
  prompt: string;
  creativeDirectionJson: string | null;
  sectionRevision: number;
  html: string;
  css: string;
  js: string;
  traceId: string | null;
  createdAt: Date;
  mediaAssets?: {
    id: string;
    type: string;
    sourceType: string;
    provider: string;
    providerAssetId: string;
    author: string;
    sourceUrl: string;
    creditUrl: string;
    license: string;
    mimeType: string;
    width: number | null;
    height: number | null;
    durationSeconds: number | null;
    sectionId: string;
    slotId: string;
    altText: string;
    createdAt: Date;
  }[];
};

function fromRecord(record: LandingRecord): SavedLanding {
  return savedLandingSchema.parse({
    id: record.id,
    title: record.title,
    brief: JSON.parse(record.briefJson),
    techniqueIds: JSON.parse(record.techniqueIdsJson),
    prompt: record.prompt,
    creativeDirection: record.creativeDirectionJson ? JSON.parse(record.creativeDirectionJson) : null,
    sectionRevision: record.sectionRevision,
    html: record.html,
    css: record.css,
    js: record.js,
    traceId: record.traceId,
    mediaAssets: "mediaAssets" in record && Array.isArray(record.mediaAssets) ? record.mediaAssets.map((asset) => ({
      id: asset.id,
      type: asset.type,
      sourceType: asset.sourceType,
      provider: asset.provider,
      providerAssetId: asset.providerAssetId,
      author: asset.author,
      sourceUrl: asset.sourceUrl,
      creditUrl: asset.creditUrl,
      license: asset.license,
      mimeType: asset.mimeType,
      width: asset.width,
      height: asset.height,
      durationSeconds: asset.durationSeconds,
      sectionId: asset.sectionId,
      slotId: asset.slotId,
      altText: asset.altText,
      createdAt: asset.createdAt.toISOString(),
    })) : [],
    createdAt: record.createdAt.toISOString(),
  });
}

function toRecord(landing: SavedLanding) {
  return {
    id: landing.id,
    title: landing.title,
    briefJson: JSON.stringify(landing.brief),
    techniqueIdsJson: JSON.stringify(landing.techniqueIds),
    prompt: landing.prompt,
    creativeDirectionJson: landing.creativeDirection ? JSON.stringify(landing.creativeDirection) : null,
    html: landing.html,
    css: landing.css,
    js: landing.js,
    traceId: landing.traceId ?? null,
    createdAt: new Date(landing.createdAt),
  };
}

async function ensureSavedLandingTrace(id: string) {
  await prisma.$transaction(async (tx) => {
    const landing = await tx.savedLanding.findUnique({ where: { id } });
    if (!landing || landing.traceId) return;

    const traceId = randomUUID();
    const techniqueIds = JSON.parse(landing.techniqueIdsJson) as string[];
    await tx.generationTrace.create({
      data: {
        id: traceId,
        category: "landing-page",
        title: landing.title,
        contextJson: JSON.stringify({
          brief: JSON.parse(landing.briefJson),
          techniqueIds,
          prompt: landing.prompt,
          source: "library-history",
        }),
        status: "completed",
      },
    });
    await tx.generationTraceStep.create({
      data: {
        id: randomUUID(),
        traceId,
        sequence: 1,
        phase: "landing-generation",
        title: "Registro histórico recuperado de Biblioteca",
        techniqueIdsJson: JSON.stringify(techniqueIds),
        userPrompt: landing.prompt,
        outputJson: JSON.stringify({
          title: landing.title,
          html: landing.html,
          css: landing.css,
          js: landing.js,
        }),
        status: "completed",
        createdAt: landing.createdAt,
      },
    });
    await tx.savedLanding.update({ where: { id }, data: { traceId } });
  });
}

export async function listSavedLandings() {
  const missingTraces = await prisma.savedLanding.findMany({
    where: { traceId: null },
    select: { id: true },
  });
  for (const landing of missingTraces) await ensureSavedLandingTrace(landing.id);

  const records = await prisma.savedLanding.findMany({
    orderBy: { createdAt: "desc" },
    include: { mediaAssets: { where: { isCurrent: true }, orderBy: { createdAt: "asc" } } },
  });
  return records.map(fromRecord);
}

export async function getSavedLanding(id: string) {
  await ensureSavedLandingTrace(id);
  const record = await prisma.savedLanding.findUnique({ where: { id }, include: { mediaAssets: { where: { isCurrent: true }, orderBy: { createdAt: "asc" } } } });
  return record ? fromRecord(record) : null;
}

export async function saveLandingRecord(landing: SavedLanding) {
  const { id, ...data } = toRecord(landing);
  const record = await prisma.savedLanding.upsert({
    where: { id },
    create: { id, ...data },
    update: data,
  });
  return fromRecord(record);
}

export async function importLandingRecords(landings: SavedLanding[]) {
  const uniqueLandings = [...new Map(landings.map((landing) => [landing.id, landing])).values()];

  if (uniqueLandings.length > 0) {
    await prisma.$transaction(
      uniqueLandings.map((landing) =>
        prisma.savedLanding.upsert({
          where: { id: landing.id },
          create: toRecord(landing),
          update: {},
        }),
      ),
    );
  }

  return uniqueLandings.length;
}

export async function deleteSavedLanding(id: string) {
  const assets = await prisma.mediaAsset.findMany({ where: { savedLandingId: id }, select: { localPath: true, posterPath: true } });
  const result = await prisma.savedLanding.deleteMany({ where: { id } });
  if (result.count) {
    const { removeStoredMedia } = await import("@/lib/media/storage");
    await Promise.all(assets.flatMap((asset) => [removeStoredMedia(asset.localPath), removeStoredMedia(asset.posterPath)]));
  }
  return result.count > 0;
}
