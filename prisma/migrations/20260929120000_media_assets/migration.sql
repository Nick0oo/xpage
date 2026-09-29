CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAssetId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "creditUrl" TEXT NOT NULL,
    "license" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "durationSeconds" INTEGER,
    "localPath" TEXT NOT NULL,
    "posterPath" TEXT,
    "sectionId" TEXT NOT NULL,
    "slotId" TEXT NOT NULL,
    "altText" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "savedLandingId" TEXT NOT NULL,
    CONSTRAINT "MediaAsset_savedLandingId_fkey" FOREIGN KEY ("savedLandingId") REFERENCES "SavedLanding" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "MediaAsset_savedLandingId_sectionId_slotId_idx" ON "MediaAsset"("savedLandingId", "sectionId", "slotId");
