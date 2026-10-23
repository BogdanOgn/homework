import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BalanceTransaction, Prisma } from '@generated/prisma/client.js';
import { UserRepository } from './user.repository.js';
import { PrismaService } from '../prisma/prisma.service.js';

const senderId = 'fe46a3d6-7f2a-41d4-b008-e7b8265c7de8';
const recipientId = '0b7c1f52-3a4e-4d8b-9c61-2f5e8a9d4b17';
const idempotencyKey = '6d2f8e4a-1b3c-4e5f-8a7b-9c0d1e2f3a4b';

const savedTransfer: BalanceTransaction = {
  id: 'a1b2c3d4-0000-4000-8000-000000000001',
  senderId,
  senderLogin: 'sender',
  senderOldBalance: new Prisma.Decimal(100),
  senderNewBalance: new Prisma.Decimal(50),
  recipientId,
  recipientLogin: 'recipient',
  sendedBalance: new Prisma.Decimal(50),
  idempotencyKey,
  createdAt: new Date('2026-10-23T12:00:00.000Z'),
};

describe('UserRepository', () => {
  let userRepository: UserRepository;

  const tx = {
    balanceTransaction: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
  };

  const prismaService = {
    $transaction: vi.fn(),
    balanceTransaction: {
      findUnique: vi.fn(),
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: ConfigService,
          useValue: { getOrThrow: vi.fn() },
        },
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    userRepository = moduleRef.get(UserRepository);
  });

  describe('balanceTransfer', () => {
    it('two concurrent requests with the same key debit once and return the same result', async () => {
      tx.balanceTransaction.findUnique.mockResolvedValue(null);
      tx.balanceTransaction.create.mockResolvedValue(savedTransfer);
      tx.user.update
        .mockResolvedValueOnce({
          id: senderId,
          login: 'sender',
          balance: new Prisma.Decimal(50),
        })
        .mockResolvedValueOnce({
          id: recipientId,
          login: 'recipient',
          balance: new Prisma.Decimal(50),
        });

      prismaService.$transaction
        .mockImplementationOnce((callback: (client: typeof tx) => unknown) =>
          callback(tx),
        )
        .mockRejectedValueOnce(
          new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
            code: 'P2002',
            clientVersion: 'test',
          }),
        );
      prismaService.balanceTransaction.findUnique.mockResolvedValue(
        savedTransfer,
      );

      const [first, second] = await Promise.all([
        userRepository.balanceTransfer(
          senderId,
          recipientId,
          50,
          idempotencyKey,
        ),
        userRepository.balanceTransfer(
          senderId,
          recipientId,
          50,
          idempotencyKey,
        ),
      ]);

      const expected = {
        oldBalance: 100,
        newBalance: 50,
        senderLogin: 'sender',
        recipientLogin: 'recipient',
      };

      expect(first).toEqual(expected);
      expect(second).toEqual(expected);
      expect(tx.user.update).toHaveBeenCalledTimes(2);
      expect(tx.balanceTransaction.create).toHaveBeenCalledTimes(1);
    });
  });
});
