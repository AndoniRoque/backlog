-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('BACKLOG', 'PLAYING', 'COMPLETED', 'DROPPED', 'PAUSED');

-- CreateEnum
CREATE TYPE "PriorityTag" AS ENUM ('NONE', 'FAVORITE', 'MUST_PLAY');

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "releaseYear" INTEGER,
    "estimatedHours" INTEGER,
    "status" "GameStatus" NOT NULL DEFAULT 'BACKLOG',
    "priority" "PriorityTag" NOT NULL DEFAULT 'NONE',
    "igdbId" INTEGER,
    "igdbSlug" TEXT,
    "summary" TEXT,
    "developer" TEXT,
    "coverUrl" TEXT,
    "heroUrl" TEXT,
    "store" TEXT,
    "queuePosition" INTEGER,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppState" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nowPlayingGameId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_igdbId_key" ON "Game"("igdbId");

-- CreateIndex
CREATE UNIQUE INDEX "Game_queuePosition_key" ON "Game"("queuePosition");

-- CreateIndex
CREATE INDEX "Game_title_idx" ON "Game"("title");

-- CreateIndex
CREATE INDEX "Game_status_idx" ON "Game"("status");

-- CreateIndex
CREATE INDEX "Game_priority_idx" ON "Game"("priority");

-- AddForeignKey
ALTER TABLE "AppState" ADD CONSTRAINT "AppState_nowPlayingGameId_fkey" FOREIGN KEY ("nowPlayingGameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;
