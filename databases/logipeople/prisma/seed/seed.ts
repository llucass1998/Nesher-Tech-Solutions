import { PrismaClient } from '../../../../apps/logipeople-api/src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const group = await prisma.businessGroup.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      name: 'Logi Platform Demo Group',
    },
  });

  const company = await prisma.company.upsert({
    where: { registrationNumber: 'DEMO-LOGIPEOPLE' },
    update: {},
    create: {
      businessGroupId: group.id,
      name: 'LogiPeople Demo',
      legalName: 'LogiPeople Demonstracao Ltda',
      registrationNumber: 'DEMO-LOGIPEOPLE',
    },
  });

  const department = await prisma.department.upsert({
    where: { companyId_code: { companyId: company.id, code: 'HR' } },
    update: {},
    create: {
      companyId: company.id,
      name: 'Recursos Humanos',
      code: 'HR',
    },
  });

  const position = await prisma.position.create({
    data: {
      companyId: company.id,
      departmentId: department.id,
      title: 'Pessoa Administradora LogiPeople',
      status: 'OCCUPIED',
    },
  });

  const person = await prisma.person.upsert({
    where: { corporateEmail: 'admin.logipeople@example.local' },
    update: {},
    create: {
      fullName: 'Administrador LogiPeople Demo',
      preferredName: 'Admin Demo',
      corporateEmail: 'admin.logipeople@example.local',
      dataClassification: 'CONFIDENTIAL',
    },
  });

  const employee = await prisma.employee.upsert({
    where: { employeeNumber: 'LP-0001' },
    update: {},
    create: {
      personId: person.id,
      companyId: company.id,
      positionId: position.id,
      employeeNumber: 'LP-0001',
      hireDate: new Date('2026-01-01T00:00:00.000Z'),
      status: 'ACTIVE',
    },
  });

  await prisma.roleAssignment.create({
    data: {
      employeeId: employee.id,
      companyId: company.id,
      role: 'PEOPLE_ADMIN',
      assignedBy: 'seed',
    },
  });

  await prisma.accessScope.create({
    data: {
      employeeId: employee.id,
      companyId: company.id,
      type: 'COMPANY',
      scopeId: company.id,
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  });
