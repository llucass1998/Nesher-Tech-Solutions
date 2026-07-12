const roles = [
  'SUPER_ADMIN',
  'PEOPLE_ADMIN',
  'HR_MANAGER',
  'HR_ANALYST',
  'RECRUITER',
  'PAYROLL_MANAGER',
  'PAYROLL_ANALYST',
  'TIME_MANAGER',
  'BENEFITS_ANALYST',
  'MANAGER',
  'EMPLOYEE',
  'AUDITOR',
  'DPO',
];

const sensitiveFields = [
  'salário',
  'dados bancários',
  'documentos',
  'dependentes',
  'informações médicas',
  'biometria',
  'avaliações confidenciais',
  'medidas disciplinares',
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-primary)]">Segurança</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Permissões e dados sensíveis</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
          O LogiPeople usa RBAC, ABAC e controle de campo para separar RH, DP, gestores, colaboradores, auditoria e DPO.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Papéis iniciais</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {roles.map((role) => (
              <span key={role} className="rounded-full bg-[var(--color-background-tertiary)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]">
                {role}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Campos controlados</h3>
          <ul className="mt-4 space-y-2 text-sm text-[var(--color-text-secondary)]">
            {sensitiveFields.map((field) => (
              <li key={field} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[var(--color-brand-primary)]" aria-hidden="true" />
                {field}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
