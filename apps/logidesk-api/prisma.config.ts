import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: '../../databases/logidesk/prisma/schema.prisma',
  migrations: {
    path: '../../databases/logidesk/prisma/migrations',
  },
  datasource: {
    url: process.env.LOGIDESK_DATABASE_URL as string,
  },
});
