/*
  Warnings:

  - You are about to drop the column `userId` on the `Package` table. All the data in the column will be lost.
  - You are about to drop the column `packageId` on the `PackageHistoryEntry` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Package" DROP CONSTRAINT "Package_userId_fkey";

-- DropForeignKey
ALTER TABLE "PackageHistoryEntry" DROP CONSTRAINT "PackageHistoryEntry_packageId_fkey";

-- AlterTable
ALTER TABLE "Package" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "PackageHistoryEntry" DROP COLUMN "packageId";
