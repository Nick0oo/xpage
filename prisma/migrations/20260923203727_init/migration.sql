-- CreateTable
CREATE TABLE "SavedLanding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "briefJson" TEXT NOT NULL,
    "techniqueIdsJson" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "css" TEXT NOT NULL,
    "js" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL
);
