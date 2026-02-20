/*
  Warnings:

  - You are about to drop the column `nowPlayingGameId` on the `AppState` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "AppState" DROP CONSTRAINT "AppState_nowPlayingGameId_fkey";

-- AlterTable
ALTER TABLE "AppState" DROP COLUMN "nowPlayingGameId",
ADD COLUMN     "nowPlayingGameIgdbId" INTEGER;

-- AddForeignKey
ALTER TABLE "AppState" ADD CONSTRAINT "AppState_nowPlayingGameIgdbId_fkey" FOREIGN KEY ("nowPlayingGameIgdbId") REFERENCES "Game"("igdbId") ON DELETE SET NULL ON UPDATE CASCADE;
