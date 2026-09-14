import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma';

export async function seedGlobalAdmin() {
  console.log('Iniciando seed do Administrador Global...');
  
  const connectionString = process.env.IDENTITY_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.warn('Aviso: IDENTITY_DATABASE_URL / DATABASE_URL não configurado no ambiente.');
    return;
  }

  const identityPrisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }) as any,
  });

  const email = 'llucas.ab@gmail.com';
  const rawPassword = 'Opex@0722';
  const name = 'Lucas Silva';
  const passwordHash = await bcrypt.hash(rawPassword, 12);

  try {
    // 1. Garantir que as roles de Administrador Global existem
    const roles = ['SUPER_ADMIN', 'GLOBAL_ADMIN', 'ADMIN'];
    for (const r of roles) {
      await identityPrisma.role.upsert({
        where: { key: r },
        update: {},
        create: { key: r, name: r },
      }).catch(() => undefined);
    }

    // 2. Localizar ou criar usuário
    let user = await identityPrisma.user.findUnique({
      where: { email },
      include: { credentials: true, roles: true },
    });

    if (!user) {
      user = await identityPrisma.user.create({
        data: {
          name,
          email,
          status: 'ACTIVE',
          credentials: {
            create: {
              type: 'PASSWORD',
              secretHash: passwordHash,
              active: true,
            },
          },
        },
        include: { credentials: true, roles: true },
      });
      console.log(`Usuário Administrador Global criado com sucesso: ${user.email}`);
    } else {
      // Atualizar credencial de senha
      const existingCred = user.credentials.find((c: any) => c.type === 'PASSWORD');
      if (existingCred) {
        await identityPrisma.credential.update({
          where: { id: existingCred.id },
          data: { secretHash: passwordHash, active: true },
        });
      } else {
        await identityPrisma.credential.create({
          data: {
            userId: user.id,
            type: 'PASSWORD',
            secretHash: passwordHash,
            active: true,
          },
        });
      }
      console.log(`Senha atualizada para o Administrador Global: ${user.email}`);
    }

    // 3. Vincular as roles ao usuário
    for (const roleKey of roles) {
      const roleRecord = await identityPrisma.role.findUnique({ where: { key: roleKey } });
      if (roleRecord) {
        const hasRole = user.roles.some((r: any) => r.roleId === roleRecord.id);
        if (!hasRole) {
          await identityPrisma.userRole.create({
            data: {
              userId: user.id,
              roleId: roleRecord.id,
            },
          }).catch(() => undefined);
        }
      }
    }

    console.log('Seed do Administrador Global concluído com sucesso!');
  } catch (error) {
    console.error('Erro ao executar seed do Administrador Global:', error);
  } finally {
    await identityPrisma.$disconnect();
  }
}

if (require.main === module) {
  seedGlobalAdmin();
}
