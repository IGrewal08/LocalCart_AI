/*
  Warnings:

  - You are about to drop the `UserProduct` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[userId,code]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UserProduct" DROP CONSTRAINT "UserProduct_productId_fkey";

-- DropForeignKey
ALTER TABLE "UserProduct" DROP CONSTRAINT "UserProduct_userId_fkey";

-- DropIndex
DROP INDEX "Product_code_key";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "UserProduct";

-- CreateIndex
CREATE INDEX "Product_userId_idx" ON "Product"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_userId_code_key" ON "Product"("userId", "code");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
