import { Injectable } from '@nestjs/common';

@Injectable()
export class PayrollService {
  capabilities() {
    return {
      service: 'logipayroll',
      status: 'foundation',
      modules: [
        'contracts',
        'time-attendance',
        'leave',
        'benefits',
        'payroll-runs',
        'payslips',
        'terminations',
        'esocial',
      ],
      boundaries: {
        ownsSensitivePayrollData: true,
        exposesSalaryDetailsToLogiPeople: false,
        directDatabaseAccessFromOtherSystems: false,
      },
    };
  }
}
