/*
  Warnings:

  - You are about to drop the `AppState` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AppState" DROP CONSTRAINT "AppState_nowPlayingGameIgdbId_fkey";

-- DropTable
DROP TABLE "AppState";
