import { fetchLogiPeople, PayrollCycleSummary, PayrollItemSummary, PayrollRunSummary } from '@/src/lib/api';

export default async function PayrollPage() {
  const [cycles, runs, items] = await Promise.all([
    fetchLogiPeople<PayrollCycleSummary[]>('/payroll/cycles'),
    fetchLogiPeople<PayrollRunSummary[]>('/payroll/runs'),
    fetchLogiPeople<PayrollItemSummary[]>('/payroll/items'),
  ]);

  const unauthorized = cycles.unauthorized || runs.unauthorized || items.unauthorized;
  const error = cycles.error ?? runs.error ?? items.error;
  const cycleData = cycles.data ?? [];
  const runData = runs.data ?? [];
  const itemData = items.data ?? [];
  const closedCycles = cycleData.filter((cycle) => cycle.status === 'CLOSED').length;
  const pendingLegalValidation = cycleData.filter((cycle) => cycle.legalValidationPending).length + runData.filter((run) => run.legalValidationPending).length + itemData.filter((item) => item.legalValidationPending).length;
  const totalGrossCents = runData.reduce((total, run) => total + parseMoneyCents(run.grossAmount), 0);
  const totalNetCents = runData.reduce((total, run) => total + parseMoneyCents(run.netAmount), 0);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-primary)]">Fase 8</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Folha preliminar</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
          Fundação para ciclos, demonstrativos e itens de folha com valores restritos, reabertura auditada e validação legal pendente. Esta tela não executa pagamento bancário, cálculo trabalhista homologado ou envio real ao eSocial.
        </p>
      </section>

      {unauthorized && <StateCard title="Sem credencial do LogiIdentity" message={error ?? 'Faça login para visualizar dados de folha.'} tone="warning" />}
      {error && !unauthorized && <StateCard title="Erro ao carregar folha" message={error} tone="danger" />}

      {!unauthorized && !error && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Ciclos" value={cycleData.length} helper="Competências cadastradas" />
            <MetricCard label="Demonstrativos" value={runData.length} helper="Registros preliminares" />
            <MetricCard label="Itens" value={itemData.length} helper="Verbas e descontos evidenciais" />
            <MetricCard label="Fechados" value={closedCycles} helper="Exigem reabertura auditada" />
          </div>

          {pendingLegalValidation > 0 && (
            <StateCard
              title="Validação legal pendente"
              message={`${pendingLegalValidation} registro(s) de folha ainda dependem de validação especializada de DP/jurídico antes de uso operacional, pagamento ou obrigação legal.`}
              tone="warning"
            />
          )}

          <section className="grid gap-4 md:grid-cols-2">
            <MoneyCard label="Total bruto preliminar" cents={totalGrossCents} helper="Soma dos demonstrativos retornados pela API" />
            <MoneyCard label="Total líquido preliminar" cents={totalNetCents} helper="Não representa ordem bancária nem folha homologada" />
          </section>

          <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-bold">Ciclos de folha</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">Competências com status controlado e reabertura separada.</p>
              </div>
            </div>
            {cycleData.length === 0 ? (
              <EmptyState message="Nenhum ciclo de folha cadastrado pela API." />
            ) : (
              <div className="mt-5 overflow-hidden rounded-xl border border-[var(--color-border-secondary)]">
                <table className="min-w-full divide-y divide-[var(--color-border-secondary)] text-sm">
                  <thead className="bg-[var(--color-background-tertiary)] text-left text-[var(--color-text-secondary)]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Nome</th>
                      <th className="px-4 py-3 font-semibold">Empresa</th>
                      <th className="px-4 py-3 font-semibold">Competência</th>
                      <th className="px-4 py-3 font-semibold">Período</th>
                      <th className="px-4 py-3 font-semibold">Demonstrativos</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-secondary)]">
                    {cycleData.map((cycle) => (
                      <tr key={cycle.id}>
                        <td className="px-4 py-3 font-medium">{cycle.name}</td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{cycle.company?.name ?? 'Empresa não informada'}</td>
                        <td className="px-4 py-3">{formatReference(cycle.referenceMonth, cycle.referenceYear)}</td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{formatDate(cycle.periodStart)} até {formatDate(cycle.periodEnd)}</td>
                        <td className="px-4 py-3">{cycle._count?.runs ?? 0}</td>
                        <td className="px-4 py-3"><StatusBadge value={cycle.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
              <h3 className="text-xl font-bold">Demonstrativos preliminares</h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Valores restritos para conferência; não são recibos homologados.</p>
              {runData.length === 0 ? (
                <EmptyState message="Nenhum demonstrativo cadastrado pela API." />
              ) : (
                <div className="mt-5 space-y-3">
                  {runData.slice(0, 8).map((run) => (
                    <article key={run.id} className="rounded-xl border border-[var(--color-border-secondary)] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-semibold">{formatEmployee(run.employee)}</h4>
                          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{formatCycle(run.cycle)}</p>
                        </div>
                        <StatusBadge value={run.status} />
                      </div>
                      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                        <MoneyMetric label="Bruto" value={run.grossAmount} currency={run.currency} />
                        <MoneyMetric label="Descontos" value={run.deductionAmount} currency={run.currency} />
                        <MoneyMetric label="Líquido" value={run.netAmount} currency={run.currency} />
                      </dl>
                      {run.legalValidationPending && <p className="mt-3 text-xs font-semibold text-[var(--color-warning)]">Validação legal pendente</p>}
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
              <h3 className="text-xl font-bold">Itens de folha</h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Verbas, descontos e encargos registrados como evidência preliminar.</p>
              {itemData.length === 0 ? (
                <EmptyState message="Nenhum item de folha cadastrado pela API." />
              ) : (
                <div className="mt-5 space-y-3">
                  {itemData.slice(0, 8).map((item) => (
                    <article key={item.id} className="rounded-xl border border-[var(--color-border-secondary)] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-semibold">{item.code} · {item.description}</h4>
                          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{formatEmployee(item.employee)}</p>
                        </div>
                        <StatusBadge value={item.type} />
                      </div>
                      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                        <MoneyMetric label="Valor" value={item.amount} currency={item.currency} />
                        <TextMetric label="Origem" value={item.source} />
                        <TextMetric label="Tributável" value={item.taxable ? 'Sim' : 'Não'} />
                      </dl>
                      {item.legalValidationPending && <p className="mt-3 text-xs font-semibold text-[var(--color-warning)]">Validação legal pendente</p>}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value));
}

function formatReference(month: number, year: number) {
  return `${String(month).padStart(2, '0')}/${year}`;
}

function formatCycle(cycle?: { name: string; referenceMonth: number; referenceYear: number } | null) {
  if (!cycle) return 'Ciclo não informado';
  return `${cycle.name} · ${formatReference(cycle.referenceMonth, cycle.referenceYear)}`;
}

function parseMoneyCents(value: string) {
  const [whole = '0', decimal = ''] = value.split('.');
  return Number.parseInt(whole, 10) * 100 + Number.parseInt(decimal.padEnd(2, '0').slice(0, 2), 10);
}

function formatMoneyCents(cents: number, currency: string) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(cents / 100);
}
