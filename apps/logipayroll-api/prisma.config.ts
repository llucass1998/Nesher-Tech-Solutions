import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: '../../databases/logipayroll/prisma/schema.prisma',
  migrations: {
    path: '../../databases/logipayroll/prisma/migrations',
  },
  datasource: {
    url: process.env.LOGIPAYROLL_DATABASE_URL as string,
  },
});
