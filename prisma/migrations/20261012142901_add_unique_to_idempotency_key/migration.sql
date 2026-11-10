/*
  Warnings:

  - A unique constraint covering the columns `[idempotency_key]` on the table `balance_transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "balance_transactions_idempotency_key_key" ON "balance_transactions"("idempotency_key");
