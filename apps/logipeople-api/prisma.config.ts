import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: '../../databases/logipeople/prisma/schema.prisma',
  migrations: {
    path: '../../databases/logipeople/prisma/migrations',
  },
  datasource: {
    url: process.env.LOGIPEOPLE_DATABASE_URL as string,
  },
});
