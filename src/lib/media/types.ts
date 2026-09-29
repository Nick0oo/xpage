export type MediaAssetRecord = {
  id: string;
  type: "image" | "video";
  sourceType: "stock" | "generated";
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
  createdAt: string;
};

export function publicMediaAsset(asset: MediaAssetRecord) {
  return {
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
    createdAt: asset.createdAt,
  };
}
