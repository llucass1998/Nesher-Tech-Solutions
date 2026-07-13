import { AbsenceRequestSummary, VacationPeriodSummary, fetchLogiPeople } from '@/src/lib/api';

export default async function AbsenceVacationPage() {
  const [absences, vacations] = await Promise.all([
    fetchLogiPeople<AbsenceRequestSummary[]>('/absence-vacation/absences'),
    fetchLogiPeople<VacationPeriodSummary[]>('/absence-vacation/vacations'),
  ]);

  const unauthorized = absences.unauthorized || vacations.unauthorized;
  const error = absences.error ?? vacations.error;
  const absenceData = absences.data ?? [];
  const vacationData = vacations.data ?? [];
  const requestedAbsences = absenceData.filter((absence) => absence.status === 'REQUESTED').length;
  const plannedVacations = vacationData.filter((vacation) => vacation.status === 'PLANNED').length;
  const pendingLegalValidation = absenceData.filter((absence) => absence.legalValidationPending).length + vacationData.filter((vacation) => vacation.legalValidationPending).length;
  const totalAbsenceDays = absenceData.reduce((total, absence) => total + absence.totalDays, 0);
  const totalVacationDays = vacationData.reduce((total, vacation) => total + vacation.days, 0);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-primary)]">Fase 10</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Ausências e férias preliminares</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
          Fundação para registrar solicitações de ausência e períodos de férias com vigência, auditoria e validação legal pendente. Esta tela não calcula saldos legais, não aprova afastamentos automaticamente e não gera eventos de folha ou eSocial.
        </p>
      </section>

      {unauthorized && <StateCard title="Sem credencial do LogiIdentity" message={error ?? 'Faça login para visualizar dados de ausências e férias.'} tone="warning" />}
      {error && !unauthorized && <StateCard title="Erro ao carregar ausências e férias" message={error} tone="danger" />}

      {!unauthorized && !error && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Ausências" value={absenceData.length} helper="Solicitações registradas" />
            <MetricCard label="Pendentes" value={requestedAbsences} helper="Dependem de revisão" />
            <MetricCard label="Férias" value={vacationData.length} helper="Períodos planejados" />
            <MetricCard label="Planejadas" value={plannedVacations} helper="Sem cálculo legal de saldo" />
          </div>

          {pendingLegalValidation > 0 && (
            <StateCard
              title="Validação legal pendente"
              message={`${pendingLegalValidation} registro(s) de ausências/férias ainda dependem de validação de DP, legislação aplicável e documentos antes de uso em folha, eSocial ou decisões administrativas.`}
              tone="warning"
            />
          )}

          <section className="grid gap-4 md:grid-cols-2">
            <MetricCard label="Dias de ausência" value={totalAbsenceDays} helper="Soma preliminar dos registros retornados" />
            <MetricCard label="Dias de férias" value={totalVacationDays} helper="Não representa saldo legal validado" />
          </section>

          <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-bold">Solicitações de ausência</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">Registros preliminares por colaborador, período, tipo e status.</p>
              </div>
            </div>
            {absenceData.length === 0 ? (
              <EmptyState message="Nenhuma solicitação de ausência cadastrada pela API." />
            ) : (
              <div className="mt-5 overflow-hidden rounded-xl border border-[var(--color-border-secondary)]">
                <table className="min-w-full divide-y divide-[var(--color-border-secondary)] text-sm">
                  <thead className="bg-[var(--color-background-tertiary)] text-left text-[var(--color-text-secondary)]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Colaborador</th>
                      <th className="px-4 py-3 font-semibold">Empresa</th>
                      <th className="px-4 py-3 font-semibold">Tipo</th>
                      <th className="px-4 py-3 font-semibold">Período</th>
                      <th className="px-4 py-3 font-semibold">Dias</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-secondary)]">
                    {absenceData.map((absence) => (
                      <tr key={absence.id}>
                        <td className="px-4 py-3 font-medium">{formatEmployee(absence.employee)}</td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{absence.company?.name ?? 'Empresa não informada'}</td>
                        <td className="px-4 py-3">{formatAbsenceType(absence.type)}</td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{formatDate(absence.startDate)} até {formatDate(absence.endDate)}</td>
                        <td className="px-4 py-3">{absence.totalDays}</td>
                        <td className="px-4 py-3"><StatusBadge value={absence.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
            <h3 className="text-xl font-bold">Períodos de férias</h3>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Planejamento preliminar de férias sem cálculo de direito, dobra, abono, adicionais ou impactos em folha.</p>
            {vacationData.length === 0 ? (
              <EmptyState message="Nenhum período de férias cadastrado pela API." />
            ) : (
              <div className="mt-5 grid gap-3 xl:grid-cols-2">
                {vacationData.slice(0, 10).map((vacation) => (
                  <article key={vacation.id} className="rounded-xl border border-[var(--color-border-secondary)] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold">{formatEmployee(vacation.employee)}</h4>
                        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{vacation.company?.name ?? 'Empresa não informada'} · {vacation.days} dia(s)</p>
                      </div>
                      <StatusBadge value={vacation.status} />
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                      <TextMetric label="Aquisitivo" value={`${formatDate(vacation.accrualStart)} até ${formatDate(vacation.accrualEnd)}`} />
                      <TextMetric label="Gozo" value={`${formatDate(vacation.periodStart)} até ${formatDate(vacation.periodEnd)}`} />
                      <TextMetric label="Dias" value={String(vacation.days)} />
                      <TextMetric label="Validação" value={vacation.legalValidationPending ? 'Pendente' : 'Registrada'} />
                    </dl>
                    {vacation.legalValidationPending && <p className="mt-3 text-xs font-semibold text-[var(--color-warning)]">Validação legal pendente</p>}
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

function formatAbsenceType(type: string) {
  const labels: Record<string, string> = {
    SICK_LEAVE: 'Afastamento médico',
    PERSONAL_LEAVE: 'Licença pessoal',
    UNPAID_LEAVE: 'Licença não remunerada',
    MATERNITY: 'Maternidade',
    PATERNITY: 'Paternidade',
    BEREAVEMENT: 'Luto',
    OTHER: 'Outro',
  };

  return labels[type] ?? type;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value));
}
