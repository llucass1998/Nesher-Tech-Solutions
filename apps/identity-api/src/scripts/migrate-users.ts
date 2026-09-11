import { PrismaClient as IdentityPrisma } from '../generated/prisma';
import { PrismaClient as LogiflowPrisma } from '../../../../src/generated/prisma';
import 'dotenv/config';
import { PrismaPg as IdentityPrismaPg } from '@prisma/adapter-pg';
import { PrismaPg as LogiflowPrismaPg } from '@prisma/adapter-pg';

async function main() {
  const identityPrisma = new IdentityPrisma({
    adapter: new IdentityPrismaPg({ connectionString: process.env.IDENTITY_DATABASE_URL })
  });

  const logiflowPrisma = new LogiflowPrisma({
    adapter: new LogiflowPrismaPg({ connectionString: process.env.DATABASE_URL })
  });

  console.log('Iniciando migracao de usuarios...');

  try {
    const legacyUsers = await logiflowPrisma.user.findMany({
      include: {
        driverProfile: true,
      },
    });

    console.log(`Encontrados ${legacyUsers.length} usuarios no LogiFlow.`);

    // Garantir que as roles existem
    const rolesToEnsure = ['ADMIN', 'OPERATOR', 'DRIVER', 'SUPPORT', 'CUSTOMER'];
    for (const roleKey of rolesToEnsure) {
      await identityPrisma.role.upsert({
        where: { key: roleKey },
        update: {},
        create: {
          key: roleKey,
          name: roleKey,
        },
      });
    }

    let migrated = 0;
    let skipped = 0;

    for (const legacyUser of legacyUsers) {
      // Verifica se ja migrou
      const existingRef = await identityPrisma.identityExternalReference.findFirst({
        where: {
          system: 'LOGIFLOW',
          legacyUserId: legacyUser.id,
        },
      });

      if (existingRef) {
        skipped++;
        continue;
      }

      // Procura se tem user pelo mesmo email no identity
      let identityUser = await identityPrisma.user.findUnique({
        where: { email: legacyUser.email },
      });

      if (!identityUser) {
        // Criar no Identity
        const roleRecord = await identityPrisma.role.findUnique({ where: { key: legacyUser.role } });

        identityUser = await identityPrisma.user.create({
          data: {
            name: legacyUser.name,
            email: legacyUser.email,
            status: legacyUser.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
            credentials: {
              create: {
                type: 'PASSWORD',
                secretHash: legacyUser.passwordHash,
                active: true,
              },
            },
            ...(roleRecord ? {
              roles: {
                create: {
                  roleId: roleRecord.id,
                },
              },
            } : {}),
          },
        });
      } else {
        // Assegurar a role se ele ja existir (ex: logidesk ja usava)
        const roleRecord = await identityPrisma.role.findUnique({ where: { key: legacyUser.role } });
        if (roleRecord) {
          const hasRole = await identityPrisma.userRole.findFirst({
            where: { userId: identityUser.id, roleId: roleRecord.id },
          });
          if (!hasRole) {
            await identityPrisma.userRole.create({
              data: { userId: identityUser.id, roleId: roleRecord.id },
            });
          }
        }
      }

      // Registrar o mapeamento
      await identityPrisma.identityExternalReference.create({
        data: {
          system: 'LOGIFLOW',
          legacyUserId: legacyUser.id,
          identityUserId: identityUser.id,
        },
      });

      migrated++;
    }

    console.log(`Migracao finalizada: ${migrated} migrados, ${skipped} ignorados (ja migrados).`);
  } catch (error) {
    console.error('Erro durante migracao:', error);
    process.exit(1);
  } finally {
    await identityPrisma.$disconnect();
    await logiflowPrisma.$disconnect();
  }
}

main().catch(console.error);
