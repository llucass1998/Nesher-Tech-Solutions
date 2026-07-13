import { BenefitEnrollmentSummary, BenefitPlanSummary, fetchLogiPeople } from '@/src/lib/api';

export default async function BenefitsPage() {
  const [plans, enrollments] = await Promise.all([
    fetchLogiPeople<BenefitPlanSummary[]>('/benefits/plans'),
    fetchLogiPeople<BenefitEnrollmentSummary[]>('/benefits/enrollments'),
  ]);

  const unauthorized = plans.unauthorized || enrollments.unauthorized;
  const error = plans.error ?? enrollments.error;
  const planData = plans.data ?? [];
  const enrollmentData = enrollments.data ?? [];
  const activePlans = planData.filter((plan) => plan.status === 'ACTIVE').length;
  const requestedEnrollments = enrollmentData.filter((enrollment) => enrollment.status === 'REQUESTED').length;
  const pendingLegalValidation = planData.filter((plan) => plan.legalValidationPending).length + enrollmentData.filter((enrollment) => enrollment.legalValidationPending).length;
  const employerCostCents = enrollmentData.reduce((total, enrollment) => total + parseMoneyCents(enrollment.employerCostAmount), 0);
  const employeeCostCents = enrollmentData.reduce((total, enrollment) => total + parseMoneyCents(enrollment.employeeCostAmount), 0);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-primary)]">Fase 9</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Benefícios preliminares</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
          Fundação para planos e adesões de benefícios com valores restritos, vigência e auditoria. Esta tela não integra provedores, não confirma elegibilidade legal e não gera descontos definitivos em folha.
        </p>
      </section>

      {unauthorized && <StateCard title="Sem credencial do LogiIdentity" message={error ?? 'Faça login para visualizar dados de benefícios.'} tone="warning" />}
      {error && !unauthorized && <StateCard title="Erro ao carregar benefícios" message={error} tone="danger" />}

      {!unauthorized && !error && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Planos" value={planData.length} helper="Catálogo preliminar" />
            <MetricCard label="Planos ativos" value={activePlans} helper="Disponíveis para adesão interna" />
            <MetricCard label="Adesões" value={enrollmentData.length} helper="Registros de cobertura" />
            <MetricCard label="Solicitadas" value={requestedEnrollments} helper="Dependem de revisão" />
          </div>

          {pendingLegalValidation > 0 && (
            <StateCard
              title="Validação legal pendente"
              message={`${pendingLegalValidation} registro(s) de benefícios ainda dependem de validação de DP, fornecedor e regras aplicáveis antes de uso em folha ou comunicação externa.`}
              tone="warning"
            />
          )}

          <section className="grid gap-4 md:grid-cols-2">
            <MoneyCard label="Custo empresa preliminar" cents={employerCostCents} helper="Soma das adesões retornadas pela API" />
            <MoneyCard label="Custo colaborador preliminar" cents={employeeCostCents} helper="Não representa desconto definitivo em folha" />
          </section>

          <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-bold">Planos de benefícios</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">Catálogo preliminar por empresa, fornecedor, tipo e vigência.</p>
              </div>
            </div>
            {planData.length === 0 ? (
              <EmptyState message="Nenhum plano de benefício cadastrado pela API." />
            ) : (
              <div className="mt-5 overflow-hidden rounded-xl border border-[var(--color-border-secondary)]">
                <table className="min-w-full divide-y divide-[var(--color-border-secondary)] text-sm">
                  <thead className="bg-[var(--color-background-tertiary)] text-left text-[var(--color-text-secondary)]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Plano</th>
                      <th className="px-4 py-3 font-semibold">Empresa</th>
                      <th className="px-4 py-3 font-semibold">Tipo</th>
                      <th className="px-4 py-3 font-semibold">Fornecedor</th>
                      <th className="px-4 py-3 font-semibold">Vigência</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-secondary)]">
                    {planData.map((plan) => (
                      <tr key={plan.id}>
                        <td className="px-4 py-3 font-medium">{plan.name}</td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{plan.company?.name ?? 'Empresa não informada'}</td>
                        <td className="px-4 py-3">{formatBenefitType(plan.type)}</td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{plan.providerName}</td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{formatDate(plan.effectiveFrom)} até {plan.effectiveTo ? formatDate(plan.effectiveTo) : 'aberto'}</td>
                        <td className="px-4 py-3"><StatusBadge value={plan.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
            <h3 className="text-xl font-bold">Adesões recentes</h3>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Registros preliminares de cobertura por colaborador, sem comunicação real a fornecedores.</p>
            {enrollmentData.length === 0 ? (
              <EmptyState message="Nenhuma adesão de benefício cadastrada pela API." />
            ) : (
              <div className="mt-5 grid gap-3 xl:grid-cols-2">
                {enrollmentData.slice(0, 10).map((enrollment) => (
                  <article key={enrollment.id} className="rounded-xl border border-[var(--color-border-secondary)] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold">{formatEmployee(enrollment.employee)}</h4>
                        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{formatPlan(enrollment.plan)} · {enrollment.coverageLevel}</p>
                      </div>
                      <StatusBadge value={enrollment.status} />
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                      <MoneyMetric label="Empresa" value={enrollment.employerCostAmount} currency={enrollment.currency} />
                      <MoneyMetric label="Colaborador" value={enrollment.employeeCostAmount} currency={enrollment.currency} />
                      <TextMetric label="Início" value={formatDate(enrollment.effectiveFrom)} />
                      <TextMetric label="Fim" value={enrollment.effectiveTo ? formatDate(enrollment.effectiveTo) : 'Aberto'} />
                    </dl>
                    {enrollment.legalValidationPending && <p className="mt-3 text-xs font-semibold text-[var(--color-warning)]">Validação legal pendente</p>}
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-5 shadow-sm">
      <p className="text-sm font-semibold text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{helper}</p>
    </section>
  );
}

function MoneyCard({ label, cents, helper }: { label: string; cents: number; helper: string }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-5 shadow-sm">
      <p className="text-sm font-semibold text-[var(--color-text-secondary)]">{label}</p>
      <p className="mt-2 text-3xl font-bold">{formatMoneyCents(cents, 'BRL')}</p>
      <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{helper}</p>
    </section>
  );
}

function StateCard({ title, message, tone }: { title: string; message: string; tone: 'warning' | 'danger' }) {
  const toneClass = tone === 'danger' ? 'text-[var(--color-danger)]' : 'text-[var(--color-warning)]';

  return (
    <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
      <h3 className={`text-lg font-semibold ${toneClass}`}>{title}</h3>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{message}</p>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="mt-5 rounded-xl border border-dashed border-[var(--color-border-secondary)] p-4 text-sm text-[var(--color-text-secondary)]">{message}</p>;
}

function StatusBadge({ value }: { value: string }) {
  return <span className="rounded-full bg-[var(--color-background-tertiary)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]">{value}</span>;
}

function MoneyMetric({ label, value, currency }: { label: string; value: string; currency: string }) {
  return (
    <div>
      <dt className="text-[var(--color-text-tertiary)]">{label}</dt>
      <dd className="mt-1 font-semibold">{formatMoneyCents(parseMoneyCents(value), currency)}</dd>
    </div>
  );
}

function TextMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--color-text-tertiary)]">{label}</dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}

function formatEmployee(employee?: { employeeNumber: string; person?: { fullName: string; preferredName?: string | null } | null } | null) {
  if (!employee) return 'Colaborador não informado';

  const name = employee.person?.preferredName ?? employee.person?.fullName;
  return name ? `${employee.employeeNumber} · ${name}` : employee.employeeNumber;
}

function formatPlan(plan?: { name: string; providerName: string; type: string } | null) {
  if (!plan) return 'Plano não informado';
  return `${plan.name} · ${formatBenefitType(plan.type)} · ${plan.providerName}`;
}

function formatBenefitType(type: string) {
  const labels: Record<string, string> = {
    HEALTH: 'Saúde',
    DENTAL: 'Odonto',
    MEAL: 'Refeição',
    FOOD: 'Alimentação',
    TRANSPORT: 'Transporte',
    LIFE_INSURANCE: 'Seguro de vida',
    WELLNESS: 'Bem-estar',
    OTHER: 'Outro',
  };

  return labels[type] ?? type;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value));
}

function parseMoneyCents(value: string) {
  const [whole = '0', decimal = ''] = value.split('.');
  return Number.parseInt(whole, 10) * 100 + Number.parseInt(decimal.padEnd(2, '0').slice(0, 2), 10);
}

function formatMoneyCents(cents: number, currency: string) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(cents / 100);
}
