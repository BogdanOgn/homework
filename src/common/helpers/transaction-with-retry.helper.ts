import { Prisma } from '@generated/prisma/client.js';

export const transactionWithRetry = async <T>(
  fn: () => Promise<T>,
  retry: number = 3,
): Promise<T | { isConflict: true }> => {
  let currentRetry = 0;

  while (currentRetry < retry) {
    try {
      return await fn();
    } catch (error: unknown) {
      const isConflict =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034';

      if (!isConflict) {
        throw error;
      }
      currentRetry++;

      await new Promise((resolve) => setTimeout(resolve, 50 * currentRetry));
    }
  }

  return { isConflict: true };
};
