/*
  Warnings:

  - You are about to drop the `API_Token` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Packages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "API_Token" DROP CONSTRAINT "API_Token_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Packages" DROP CONSTRAINT "Packages_user_id_fkey";

-- DropTable
DROP TABLE "API_Token";

-- DropTable
DROP TABLE "Packages";

-- DropTable
DROP TABLE "Users";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "isAdmin" BOOLEAN NOT NULL,
    "password" VARCHAR(255) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" VARCHAR(255) NOT NULL,
    "metadataId" TEXT NOT NULL,
    "dataId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageMetadata" (
    "id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "version" VARCHAR(255) NOT NULL,

    CONSTRAINT "PackageMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageData" (
    "id" VARCHAR(255) NOT NULL,
    "content" TEXT,
    "URL" VARCHAR(255),
    "JSProgram" VARCHAR(255),

    CONSTRAINT "PackageData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageRating" (
    "id" SERIAL NOT NULL,
    "busFactor" DOUBLE PRECISION NOT NULL,
    "correctness" DOUBLE PRECISION NOT NULL,
    "rampUp" DOUBLE PRECISION NOT NULL,
    "responsiveMaintainer" DOUBLE PRECISION NOT NULL,
    "licenseScore" DOUBLE PRECISION NOT NULL,
    "goodPinningPractice" DOUBLE PRECISION NOT NULL,
    "pullRequest" DOUBLE PRECISION NOT NULL,
    "netScore" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PackageRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageHistoryEntry" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "packageId" TEXT NOT NULL,
    "action" TEXT NOT NULL,

    CONSTRAINT "PackageHistoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "APIToken" (
    "id" VARCHAR(255) NOT NULL,
    "userId" INTEGER NOT NULL,
    "numUsage" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "uploadPermission" BOOLEAN NOT NULL,
    "searchPermission" BOOLEAN NOT NULL,
    "downloadPermission" BOOLEAN NOT NULL,

    CONSTRAINT "APIToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthenticationRequest" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "secret" VARCHAR(255) NOT NULL,

    CONSTRAINT "AuthenticationRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_metadataId_fkey" FOREIGN KEY ("metadataId") REFERENCES "PackageMetadata"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_dataId_fkey" FOREIGN KEY ("dataId") REFERENCES "PackageData"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageHistoryEntry" ADD CONSTRAINT "PackageHistoryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageHistoryEntry" ADD CONSTRAINT "PackageHistoryEntry_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "APIToken" ADD CONSTRAINT "APIToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthenticationRequest" ADD CONSTRAINT "AuthenticationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
