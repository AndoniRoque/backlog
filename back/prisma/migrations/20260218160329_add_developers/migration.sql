/*
  Warnings:

  - You are about to drop the column `developer` on the `Game` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Game" DROP COLUMN "developer",
ADD COLUMN     "developers" TEXT[] DEFAULT ARRAY[]::TEXT[];
