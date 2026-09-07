CREATE TABLE "GameActivity" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "detail" TEXT,
    "gameId" TEXT NOT NULL,

    CONSTRAINT "GameActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GameActivity_gameId_createdAt_idx" ON "GameActivity"("gameId", "createdAt");

ALTER TABLE "GameActivity" ADD CONSTRAINT "GameActivity_gameId_fkey"
    FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;