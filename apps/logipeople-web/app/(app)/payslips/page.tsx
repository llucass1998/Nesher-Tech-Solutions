import { fetchLogiPeople, PayslipLineSummary, PayslipSummary } from '@/src/lib/api';

export default async function PayslipsPage() {
  const [payslips, lines] = await Promise.all([
    fetchLogiPeople<PayslipSummary[]>('/payslips'),
    fetchLogiPeople<PayslipLineSummary[]>('/payslips/lines'),
  ]);

  const unauthorized = payslips.unauthorized || lines.unauthorized;
  const error = payslips.error ?? lines.error;
  const payslipData = payslips.data ?? [];
  const lineData = lines.data ?? [];
  const hiddenFromEmployees = payslipData.filter((payslip) => !payslip.visibleToEmployee).length;
  const pendingLegalValidation =
    payslipData.filter((payslip) => payslip.legalValidationPending).length +
    lineData.filter((line) => line.legalValidationPending).length;
  const totalNetCents = payslipData.reduce((total, payslip) => total + parseMoneyCents(payslip.netAmount), 0);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-primary)]">Fase 14</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Holerites demonstrativos</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
          Fundacao preliminar para registros demonstrativos derivados da folha, com valores restritos, auditoria e validacao legal pendente. Esta tela nao publica holerites ao colaborador, nao gera PDF oficial, nao executa pagamento bancario, nao assina documentos e nao envia eventos ao eSocial.
        </p>
      </section>

      {unauthorized && <StateCard title="Sem credencial do LogiIdentity" message={error ?? 'Faca login para visualizar holerites demonstrativos.'} tone="warning" />}
      {error && !unauthorized && <StateCard title="Erro ao carregar holerites" message={error} tone="danger" />}

      {!unauthorized && !error && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Holerites" value={payslipData.length} helper="Registros demonstrativos preliminares" />
            <MetricCard label="Linhas" value={lineData.length} helper="Verbas copiadas da folha" />
            <MetricCard label="Nao publicados" value={hiddenFromEmployees} helper="Visibilidade ao colaborador bloqueada" />
            <MetricCard label="Validacao pendente" value={pendingLegalValidation} helper="Dependem de revisao especializada" />
          </div>

          <section className="grid gap-4 md:grid-cols-2">
            <MoneyCard label="Total liquido demonstrativo" cents={totalNetCents} helper="Soma preliminar dos registros retornados pela API" />
            <StateCard
              title="Restricao operacional"
              message="Os holerites desta fase sao evidencia restrita de DP. Eles nao representam recibo homologado, ordem bancaria, assinatura formal ou calculo legal validado."
              tone="warning"
            />
          </section>

          <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-bold">Registros demonstrativos</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">Holerites derivados de demonstrativos de folha, sem publicacao ao colaborador.</p>
              </div>
            </div>
            {payslipData.length === 0 ? (
              <EmptyState message="Nenhum holerite demonstrativo retornado pela API." />
            ) : (
              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                {payslipData.slice(0, 8).map((payslip) => (
                  <article key={payslip.id} className="rounded-xl border border-[var(--color-border-secondary)] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold">{formatEmployee(payslip.employee)}</h4>
                        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                          {formatReference(payslip.referenceMonth, payslip.referenceYear)} - {payslip.company?.name ?? 'Empresa nao informada'}
                        </p>
                      </div>
                      <StatusBadge value={payslip.status} />
                    </div>
                    <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      <MoneyMetric label="Bruto" value={payslip.grossAmount} currency={payslip.currency} />
                      <MoneyMetric label="Descontos" value={payslip.deductionAmount} currency={payslip.currency} />
                      <MoneyMetric label="Liquido" value={payslip.netAmount} currency={payslip.currency} />
                    </dl>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-[var(--color-background-tertiary)] px-3 py-1 text-[var(--color-text-secondary)]">{payslip._count?.lines ?? 0} linha(s)</span>
                      {!payslip.visibleToEmployee && <span className="rounded-full bg-[var(--color-background-tertiary)] px-3 py-1 text-[var(--color-warning)]">Nao publicado ao colaborador</span>}
                      {payslip.legalValidationPending && <span className="rounded-full bg-[var(--color-background-tertiary)] px-3 py-1 text-[var(--color-warning)]">Validacao legal pendente</span>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
            <h3 className="text-xl font-bold">Linhas demonstrativas</h3>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Verbas e descontos copiados da folha preliminar para conferencia restrita.</p>
            {lineData.length === 0 ? (
              <EmptyState message="Nenhuma linha de holerite retornada pela API." />
            ) : (
              <div className="mt-5 overflow-hidden rounded-xl border border-[var(--color-border-secondary)]">
                <table className="min-w-full divide-y divide-[var(--color-border-secondary)] text-sm">
                  <thead className="bg-[var(--color-background-tertiary)] text-left text-[var(--color-text-secondary)]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Codigo</th>
                      <th className="px-4 py-3 font-semibold">Descricao</th>
                      <th className="px-4 py-3 font-semibold">Colaborador</th>
                      <th className="px-4 py-3 font-semibold">Tipo</th>
                      <th className="px-4 py-3 font-semibold">Quantidade</th>
                      <th className="px-4 py-3 font-semibold">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-secondary)]">
                    {lineData.slice(0, 12).map((line) => (
                      <tr key={line.id}>
                        <td className="px-4 py-3 font-medium">{line.code}</td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{line.description}</td>
                        <td className="px-4 py-3">{formatEmployee(line.employee)}</td>
                        <td className="px-4 py-3"><StatusBadge value={line.type} /></td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{line.quantity ?? '-'}</td>
                        <td className="px-4 py-3 font-semibold">{formatMoneyCents(parseMoneyCents(line.amount), line.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

function formatEmployee(employee?: { employeeNumber: string; person?: { fullName: string; preferredName?: string | null } | null } | null) {
  if (!employee) return 'Colaborador nao informado';

  const name = employee.person?.preferredName ?? employee.person?.fullName;
  return name ? `${employee.employeeNumber} - ${name}` : employee.employeeNumber;
}

function formatReference(month: number, year: number) {
  return `${String(month).padStart(2, '0')}/${year}`;
}

function parseMoneyCents(value: string) {
  const [whole = '0', decimal = ''] = value.split('.');
  return Number.parseInt(whole, 10) * 100 + Number.parseInt(decimal.padEnd(2, '0').slice(0, 2), 10);
}

function formatMoneyCents(cents: number, currency: string) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(cents / 100);
}
