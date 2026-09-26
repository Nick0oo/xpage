-- CreateTable
CREATE TABLE "GenerationTrace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contextJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GenerationTraceStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "traceId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "phase" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "techniqueIdsJson" TEXT,
    "provider" TEXT,
    "model" TEXT,
    "systemPrompt" TEXT,
    "userPrompt" TEXT,
    "outputText" TEXT,
    "outputJson" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "errorMessage" TEXT,
    "durationMs" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GenerationTraceStep_traceId_fkey" FOREIGN KEY ("traceId") REFERENCES "GenerationTrace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SavedLanding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "briefJson" TEXT NOT NULL,
    "techniqueIdsJson" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "css" TEXT NOT NULL,
    "js" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "traceId" TEXT,
    CONSTRAINT "SavedLanding_traceId_fkey" FOREIGN KEY ("traceId") REFERENCES "GenerationTrace" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_SavedLanding" ("briefJson", "createdAt", "css", "html", "id", "js", "prompt", "techniqueIdsJson", "title") SELECT "briefJson", "createdAt", "css", "html", "id", "js", "prompt", "techniqueIdsJson", "title" FROM "SavedLanding";
DROP TABLE "SavedLanding";
ALTER TABLE "new_SavedLanding" RENAME TO "SavedLanding";
CREATE UNIQUE INDEX "SavedLanding_traceId_key" ON "SavedLanding"("traceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "GenerationTraceStep_traceId_sequence_idx" ON "GenerationTraceStep"("traceId", "sequence");
