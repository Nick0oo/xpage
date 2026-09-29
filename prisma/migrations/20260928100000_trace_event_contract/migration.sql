ALTER TABLE "GenerationTrace" ADD COLUMN "rootTraceId" TEXT;
ALTER TABLE "GenerationTrace" ADD COLUMN "parentTraceId" TEXT;
ALTER TABLE "GenerationTrace" ADD COLUMN "sourceTraceId" TEXT;
ALTER TABLE "GenerationTrace" ADD COLUMN "executionId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "GenerationTrace" ADD COLUMN "sequenceCounter" INTEGER NOT NULL DEFAULT 0;

UPDATE "GenerationTrace" SET "rootTraceId" = "id", "executionId" = "id";
UPDATE "GenerationTrace" SET "sequenceCounter" = (SELECT COALESCE(MAX("sequence"), 0) FROM "GenerationTraceStep" WHERE "GenerationTraceStep"."traceId" = "GenerationTrace"."id");

ALTER TABLE "GenerationTraceStep" ADD COLUMN "executionId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "GenerationTraceStep" ADD COLUMN "rootTraceId" TEXT;
ALTER TABLE "GenerationTraceStep" ADD COLUMN "parentTraceId" TEXT;
ALTER TABLE "GenerationTraceStep" ADD COLUMN "parentStepId" TEXT;
ALTER TABLE "GenerationTraceStep" ADD COLUMN "eventType" TEXT NOT NULL DEFAULT 'step';
ALTER TABLE "GenerationTraceStep" ADD COLUMN "skillVersionsJson" TEXT;
ALTER TABLE "GenerationTraceStep" ADD COLUMN "decisionSummary" TEXT;
ALTER TABLE "GenerationTraceStep" ADD COLUMN "referencesJson" TEXT;
ALTER TABLE "GenerationTraceStep" ADD COLUMN "metadataJson" TEXT;

UPDATE "GenerationTraceStep" SET
  "executionId" = (SELECT "executionId" FROM "GenerationTrace" WHERE "GenerationTrace"."id" = "GenerationTraceStep"."traceId"),
  "rootTraceId" = (SELECT "rootTraceId" FROM "GenerationTrace" WHERE "GenerationTrace"."id" = "GenerationTraceStep"."traceId");

CREATE UNIQUE INDEX "GenerationTraceStep_executionId_sequence_key" ON "GenerationTraceStep"("executionId", "sequence");
CREATE INDEX "GenerationTrace_executionId_idx" ON "GenerationTrace"("executionId");
