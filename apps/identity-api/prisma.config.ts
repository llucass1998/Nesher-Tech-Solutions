import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: '../../databases/identity/prisma/schema.prisma',
  migrations: {
    path: '../../databases/identity/prisma/migrations',
  },
  datasource: {
    url: process.env.IDENTITY_DATABASE_URL || 'postgresql://identity:change-me-identity-db-password@localhost:5437/identity?schema=public',
  },
});
