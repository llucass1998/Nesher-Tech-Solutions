import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: '../../databases/identity/prisma/schema.prisma',
  migrations: {
    path: '../../databases/identity/prisma/migrations',
  },
  datasource: {
    url: process.env.IDENTITY_DATABASE_URL as string,
  },
});
