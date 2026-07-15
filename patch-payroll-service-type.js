const fs = require('fs');
const file = 'apps/logipayroll-api/src/modules/payroll/payroll.service.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/import \{ PrismaService \} from '\.\.\/\.\.\/prisma\/prisma\.service';/, "import { PrismaService } from '../../prisma/prisma.service';\nimport { Prisma } from '../../generated/prisma';");

code = code.replace(/payload: eventPayload,/g, 'payload: eventPayload as unknown as Prisma.InputJsonValue,');

fs.writeFileSync(file, code);
