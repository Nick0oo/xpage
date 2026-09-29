ALTER TABLE "MediaAsset" ADD COLUMN "isCurrent" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX "MediaAsset_savedLandingId_isCurrent_idx" ON "MediaAsset"("savedLandingId", "isCurrent");
