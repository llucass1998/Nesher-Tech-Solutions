import 'dotenv/config';
import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não encontrada.');
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// A palavra "export" é a mágica que permite outras pastas usarem o banco!
export const prisma = new PrismaClient({
  adapter,
});
