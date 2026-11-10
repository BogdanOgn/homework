/*
  Warnings:

  - A unique constraint covering the columns `[sender_id,idempotency_key]` on the table `balance_transactions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sender_new_balance` to the `balance_transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sender_old_balance` to the `balance_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "balance_transactions_idempotency_key_key";

-- DropIndex
DROP INDEX "balance_transactions_sender_id_idx";

-- AlterTable
ALTER TABLE "balance_transactions" ADD COLUMN     "sender_new_balance" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "sender_old_balance" DECIMAL(12,2) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "balance_transactions_sender_id_idempotency_key_key" ON "balance_transactions"("sender_id", "idempotency_key");
