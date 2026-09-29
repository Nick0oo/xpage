ALTER TABLE "SavedLanding" ADD COLUMN "sectionRevision" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "SectionRevision" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "savedLandingId" TEXT NOT NULL,
  "revision" INTEGER NOT NULL,
  "parentRevisionId" TEXT,
  "sourceRevisionId" TEXT,
  "sectionId" TEXT,
  "summary" TEXT NOT NULL,
  "html" TEXT NOT NULL,
  "css" TEXT NOT NULL,
  "js" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SectionRevision_savedLandingId_fkey" FOREIGN KEY ("savedLandingId") REFERENCES "SavedLanding" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "SectionRevision_savedLandingId_revision_key" ON "SectionRevision"("savedLandingId", "revision");
CREATE INDEX "SectionRevision_savedLandingId_createdAt_idx" ON "SectionRevision"("savedLandingId", "createdAt");

CREATE TABLE "SectionEditProposal" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "savedLandingId" TEXT NOT NULL,
  "baseRevision" INTEGER NOT NULL,
  "baseFingerprint" TEXT NOT NULL,
  "sectionId" TEXT NOT NULL,
  "techniqueIdsJson" TEXT NOT NULL,
  "modelChoice" TEXT NOT NULL,
  "instruction" TEXT NOT NULL,
  "patchJson" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "revisionId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SectionEditProposal_savedLandingId_fkey" FOREIGN KEY ("savedLandingId") REFERENCES "SavedLanding" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "SectionEditProposal_savedLandingId_createdAt_idx" ON "SectionEditProposal"("savedLandingId", "createdAt");
