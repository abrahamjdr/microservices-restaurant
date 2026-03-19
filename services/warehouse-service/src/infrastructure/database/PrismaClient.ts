import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.WAREHOUSE_DATABASE_URL,
    },
  },
});

export default prisma;
