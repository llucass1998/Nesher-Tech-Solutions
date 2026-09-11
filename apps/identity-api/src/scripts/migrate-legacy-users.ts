// @ts-nocheck
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma';

async function main() {
  console.log('Starting legacy users migration...');
  
  const connectionString = process.env.IDENTITY_DATABASE_URL;
  if (!connectionString) throw new Error("IDENTITY_DATABASE_URL is not set");
  
  const identityPrisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
    }) as any,
  });
  
  const logiflowPool = new Pool({ 
    connectionString: process.env.LOGIFLOW_DATABASE_URL || process.env.DATABASE_URL
  });

  try {
    const { rows: users } = await logiflowPool.query('SELECT * FROM "User"');
    const { rows: drivers } = await logiflowPool.query('SELECT * FROM "Driver"');
    
    console.log(`Found ${users.length} users and ${drivers.length} drivers in LogiFlow.`);

    for (const u of users) {
      await identityPrisma.$transaction(async (tx) => {
        const existing = await tx.identityExternalReference.findFirst({
          where: { system: 'LOGIFLOW', legacyUserId: u.id }
        });

        if (!existing) {
          const newUser = await tx.user.create({
            data: {
              name: u.name,
              email: u.email,
              status: u.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
              roles: {
                create: { role: u.role }
              },
              credentials: {
                create: { type: 'PASSWORD', secretHash: u.passwordHash }
              },
              externalReferences: {
                create: { system: 'LOGIFLOW', legacyUserId: u.id }
              }
            }
          });
          console.log(`Migrated User: ${newUser.email}`);
        }
      });
    }

    for (const d of drivers) {
      await identityPrisma.$transaction(async (tx) => {
        const existing = await tx.identityExternalReference.findFirst({
          where: { system: 'LOGIFLOW', legacyUserId: d.id }
        });

        if (!existing) {
          const newUser = await tx.user.create({
            data: {
              name: d.name,
              email: d.email,
              status: d.status === 'AVAILABLE' ? 'ACTIVE' : 'INACTIVE',
              roles: {
                create: { role: 'DRIVER' }
              },
              credentials: {
                create: { type: 'PASSWORD', secretHash: d.password }
              },
              externalReferences: {
                create: { system: 'LOGIFLOW', legacyUserId: d.id }
              }
            }
          });
          console.log(`Migrated Driver: ${newUser.email}`);
        }
      });
    }
    
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await logiflowPool.end();
    await identityPrisma.$disconnect();
  }
}

main().catch(console.error);
