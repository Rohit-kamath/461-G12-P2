/*
  Warnings:

  - Added the required column `version` to the `Packages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Packages" ADD COLUMN     "version" VARCHAR(255) NOT NULL;
