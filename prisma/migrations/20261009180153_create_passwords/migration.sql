-- CreateTable
CREATE TABLE "passwords" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "encrypted" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
