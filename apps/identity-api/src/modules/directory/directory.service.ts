import { Injectable, NotFoundException } from '@nestjs/common';
import { IdentityStatus } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DirectoryService {
  constructor(private readonly prisma: PrismaService) {}

  users() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, status: true, createdAt: true },
    });
  }

  async user(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: { include: { role: true } },
        applicationAccess: { include: { application: true } },
        externalReferences: true,
      },
    });
    if (!user) throw new NotFoundException({ error: 'User not found.' });
    return user;
  }

  updateUser(id: string, body: { name?: string; email?: string }) {
    return this.prisma.user.update({
      where: { id },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.email ? { email: body.email } : {}),
      },
    });
  }

  updateStatus(id: string, status: IdentityStatus) {
    return this.prisma.user.update({ where: { id }, data: { status } });
  }

  roles() {
    return this.prisma.role.findMany({ orderBy: { key: 'asc' }, include: { permissions: { include: { permission: true } } } });
  }

  createRole(body: { key: string; name?: string; description?: string }) {
    return this.prisma.role.create({ data: { key: body.key, name: body.name ?? body.key, ...(body.description ? { description: body.description } : {}) } });
  }

  updateRole(id: string, body: { name?: string; description?: string }) {
    return this.prisma.role.update({ where: { id }, data: body });
  }

  permissions() {
    return this.prisma.permission.findMany({ orderBy: { key: 'asc' } });
  }

  applications() {
    return this.prisma.application.findMany({ orderBy: { key: 'asc' } });
  }

  createApplication(body: { key: string; name?: string; audience?: string }) {
    return this.prisma.application.create({
      data: {
        key: body.key,
        name: body.name ?? body.key,
        audience: body.audience ?? body.key,
      },
    });
  }

  importReference(body: { system: string; legacyUserId: string; identityUserId: string }) {
    return this.prisma.identityExternalReference.upsert({
      where: { system_legacyUserId: { system: body.system, legacyUserId: body.legacyUserId } },
      update: { identityUserId: body.identityUserId },
      create: body,
    });
  }
}
