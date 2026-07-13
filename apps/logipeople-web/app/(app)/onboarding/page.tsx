import { OnboardingPlanSummary, OnboardingTaskSummary, fetchLogiPeople } from '@/src/lib/api';

export default async function OnboardingPage() {
  const [plans, tasks] = await Promise.all([
    fetchLogiPeople<OnboardingPlanSummary[]>('/onboarding/plans'),
    fetchLogiPeople<OnboardingTaskSummary[]>('/onboarding/tasks'),
  ]);

  const unauthorized = plans.unauthorized || tasks.unauthorized;
  const error = plans.error ?? tasks.error;
  const planData = plans.data ?? [];
  const taskData = tasks.data ?? [];
  const activePlans = planData.filter((plan) => plan.status === 'ACTIVE' || plan.status === 'DRAFT').length;
  const pendingTasks = taskData.filter((task) => task.status === 'PENDING' || task.status === 'IN_PROGRESS').length;
  const blockedTasks = taskData.filter((task) => task.status === 'BLOCKED').length;
  const pendingLegalValidation = planData.filter((plan) => plan.legalValidationPending).length + taskData.filter((task) => task.legalValidationPending).length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-primary)]">Fase 12</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Onboarding preliminar</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
          Fundação para planos e tarefas internas de onboarding com auditoria e validação pendente. Esta tela não converte candidatos em colaboradores, não aprova admissões, não provisiona acessos externos e não dispara integrações reais.
        </p>
      </section>

      {unauthorized && <StateCard title="Sem credencial do LogiIdentity" message={error ?? 'Faça login para visualizar dados de onboarding.'} tone="warning" />}
      {error && !unauthorized && <StateCard title="Erro ao carregar onboarding" message={error} tone="danger" />}

      {!unauthorized && !error && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Planos" value={planData.length} helper="Registros preliminares" />
            <MetricCard label="Ativos" value={activePlans} helper="Draft ou em andamento" />
            <MetricCard label="Tarefas pendentes" value={pendingTasks} helper="Sem automação externa" />
            <MetricCard label="Bloqueadas" value={blockedTasks} helper="Dependem de revisão humana" />
          </div>

          {pendingLegalValidation > 0 && (
            <StateCard
              title="Validação de RH pendente"
              message={`${pendingLegalValidation} registro(s) de onboarding ainda dependem de validação de RH/DP antes de qualquer uso em admissão, provisionamento, comunicação externa ou auditoria legal.`}
              tone="warning"
            />
          )}

          <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-bold">Planos de onboarding</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">Checklists internos por colaborador, empresa, vigência e status.</p>
              </div>
            </div>
            {planData.length === 0 ? (
              <EmptyState message="Nenhum plano de onboarding cadastrado pela API." />
            ) : (
              <div className="mt-5 overflow-hidden rounded-xl border border-[var(--color-border-secondary)]">
                <table className="min-w-full divide-y divide-[var(--color-border-secondary)] text-sm">
                  <thead className="bg-[var(--color-background-tertiary)] text-left text-[var(--color-text-secondary)]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Plano</th>
                      <th className="px-4 py-3 font-semibold">Colaborador</th>
                      <th className="px-4 py-3 font-semibold">Empresa</th>
                      <th className="px-4 py-3 font-semibold">Período</th>
                      <th className="px-4 py-3 font-semibold">Tarefas</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-secondary)]">
                    {planData.map((plan) => (
                      <tr key={plan.id}>
                        <td className="px-4 py-3 font-medium">{plan.name}</td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{formatEmployee(plan.employee)}</td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{plan.company?.name ?? 'Empresa não informada'}</td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{formatDate(plan.startDate)} até {plan.targetEndDate ? formatDate(plan.targetEndDate) : 'aberto'}</td>
                        <td className="px-4 py-3">{plan._count?.tasks ?? 0}</td>
                        <td className="px-4 py-3"><StatusBadge value={plan.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
            <h3 className="text-xl font-bold">Tarefas de onboarding</h3>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Pendências internas sem provisionamento automático de sistemas, benefícios, folha ou comunicação externa.</p>
            {taskData.length === 0 ? (
              <EmptyState message="Nenhuma tarefa de onboarding cadastrada pela API." />
            ) : (
              <div className="mt-5 grid gap-3 xl:grid-cols-2">
                {taskData.slice(0, 12).map((task) => (
                  <article key={task.id} className="rounded-xl border border-[var(--color-border-secondary)] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold">{task.title}</h4>
                        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{task.plan?.name ?? 'Plano não informado'} · {formatOwner(task.owner)}</p>
                      </div>
                      <StatusBadge value={task.status} />
                    </div>
                    {task.description && <p className="mt-3 text-sm text-[var(--color-text-secondary)]">{task.description}</p>}
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                      <TextMetric label="Colaborador" value={formatEmployee(task.employee)} />
                      <TextMetric label="Empresa" value={task.plan?.company?.name ?? 'Não informada'} />
                      <TextMetric label="Prazo" value={task.dueDate ? formatDate(task.dueDate) : 'Sem prazo'} />
                      <TextMetric label="Validação" value={task.legalValidationPending ? 'Pendente' : 'Registrada'} />
                    </dl>
                    {task.legalValidationPending && <p className="mt-3 text-xs font-semibold text-[var(--color-warning)]">Validação de RH/DP pendente</p>}
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

function formatOwner(owner: string) {
  const labels: Record<string, string> = {
    HR: 'RH',
    MANAGER: 'Gestor',
    EMPLOYEE: 'Colaborador',
    IT: 'TI',
    FACILITIES: 'Facilities',
    OTHER: 'Outro',
  };

  return labels[owner] ?? owner;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value));
}
