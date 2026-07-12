import { AttendancePeriodSummary, fetchLogiPeople, TimeEntrySummary, WorkScheduleSummary } from '@/src/lib/api';

export default async function TimeAttendancePage() {
  const [schedules, entries, periods] = await Promise.all([
    fetchLogiPeople<WorkScheduleSummary[]>('/time-attendance/work-schedules'),
    fetchLogiPeople<TimeEntrySummary[]>('/time-attendance/entries'),
    fetchLogiPeople<AttendancePeriodSummary[]>('/time-attendance/periods'),
  ]);

  const unauthorized = schedules.unauthorized || entries.unauthorized || periods.unauthorized;
  const error = schedules.error ?? entries.error ?? periods.error;
  const scheduleData = schedules.data ?? [];
  const entryData = entries.data ?? [];
  const periodData = periods.data ?? [];
  const pendingEntries = entryData.filter((entry) => entry.approvalStatus === 'PENDING').length;
  const openPeriods = periodData.filter((period) => period.status === 'OPEN').length;
  const pendingLegalValidation = periodData.filter((period) => period.legalValidationPending).length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-primary)]">Fase 7</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Ponto e frequência</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
          Fundação para jornadas planejadas, marcações de ponto e apuração preliminar sem cálculo de folha, pagamento bancário ou envio real ao eSocial.
        </p>
      </section>

      {unauthorized && <StateCard title="Sem credencial do LogiIdentity" message={error ?? 'Faça login para visualizar dados de ponto.'} tone="warning" />}
      {error && !unauthorized && <StateCard title="Erro ao carregar ponto" message={error} tone="danger" />}

      {!unauthorized && !error && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Jornadas" value={scheduleData.length} helper="Configurações ativas ou históricas" />
            <MetricCard label="Marcações" value={entryData.length} helper="Últimas evidências registradas" />
            <MetricCard label="Pendentes" value={pendingEntries} helper="Marcações aguardando análise" />
            <MetricCard label="Períodos abertos" value={openPeriods} helper="Apurações preliminares" />
          </div>

          {pendingLegalValidation > 0 && (
            <StateCard
              title="Validação legal pendente"
              message={`${pendingLegalValidation} período(s) ainda dependem de validação trabalhista especializada antes de uso em folha.`}
              tone="warning"
            />
          )}

          <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-bold">Jornadas planejadas</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">Registros com vigência para empresa ou colaborador.</p>
              </div>
            </div>
            {scheduleData.length === 0 ? (
              <EmptyState message="Nenhuma jornada planejada cadastrada pela API." />
            ) : (
              <div className="mt-5 overflow-hidden rounded-xl border border-[var(--color-border-secondary)]">
                <table className="min-w-full divide-y divide-[var(--color-border-secondary)] text-sm">
                  <thead className="bg-[var(--color-background-tertiary)] text-left text-[var(--color-text-secondary)]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Nome</th>
                      <th className="px-4 py-3 font-semibold">Empresa</th>
                      <th className="px-4 py-3 font-semibold">Colaborador</th>
                      <th className="px-4 py-3 font-semibold">Semanal</th>
                      <th className="px-4 py-3 font-semibold">Vigência</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-secondary)]">
                    {scheduleData.map((schedule) => (
                      <tr key={schedule.id}>
                        <td className="px-4 py-3 font-medium">{schedule.name}</td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{schedule.company?.name ?? 'Empresa não informada'}</td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{formatEmployee(schedule.employee)}</td>
                        <td className="px-4 py-3">{formatMinutes(schedule.weeklyMinutes)} / {schedule.workDays} dias</td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{formatDate(schedule.effectiveFrom)} até {schedule.effectiveTo ? formatDate(schedule.effectiveTo) : 'aberto'}</td>
                        <td className="px-4 py-3"><StatusBadge value={schedule.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
              <h3 className="text-xl font-bold">Marcações recentes</h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Evidências de entrada, saída e intervalo, ainda sem cálculo de folha.</p>
              {entryData.length === 0 ? (
                <EmptyState message="Nenhuma marcação registrada pela API." />
              ) : (
                <div className="mt-5 space-y-3">
                  {entryData.slice(0, 8).map((entry) => (
                    <article key={entry.id} className="rounded-xl border border-[var(--color-border-secondary)] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-semibold">{formatKind(entry.kind)}</h4>
                          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{formatEmployee(entry.employee)}</p>
                        </div>
                        <StatusBadge value={entry.approvalStatus} />
                      </div>
                      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <dt className="text-[var(--color-text-tertiary)]">Quando</dt>
                          <dd className="mt-1 font-medium">{formatDateTime(entry.occurredAt)}</dd>
                        </div>
                        <div>
                          <dt className="text-[var(--color-text-tertiary)]">Origem</dt>
                          <dd className="mt-1 font-medium">{entry.source}</dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
              <h3 className="text-xl font-bold">Períodos de apuração</h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Resumo operacional preliminar com bloqueio para validação legal posterior.</p>
              {periodData.length === 0 ? (
                <EmptyState message="Nenhum período preliminar cadastrado pela API." />
              ) : (
                <div className="mt-5 space-y-3">
                  {periodData.slice(0, 8).map((period) => (
                    <article key={period.id} className="rounded-xl border border-[var(--color-border-secondary)] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-semibold">{formatEmployee(period.employee)}</h4>
                          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{formatDate(period.periodStart)} até {formatDate(period.periodEnd)}</p>
                        </div>
                        <StatusBadge value={period.status} />
                      </div>
                      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                        <PeriodMetric label="Planejado" value={period.plannedMinutes} />
                        <PeriodMetric label="Trabalhado" value={period.workedMinutes} />
                        <PeriodMetric label="Ausência" value={period.absenceMinutes} />
                        <PeriodMetric label="Extra" value={period.extraMinutes} />
                      </dl>
                      {period.legalValidationPending && <p className="mt-3 text-xs font-semibold text-[var(--color-warning)]">Validação legal pendente</p>}
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

function PeriodMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-[var(--color-text-tertiary)]">{label}</dt>
      <dd className="mt-1 font-semibold">{formatMinutes(value)}</dd>
    </div>
  );
}

function formatEmployee(employee?: { employeeNumber: string; person?: { fullName: string; preferredName?: string | null } | null } | null) {
  if (!employee) return 'Escopo geral';

  const name = employee.person?.preferredName ?? employee.person?.fullName;
  return name ? `${employee.employeeNumber} · ${name}` : employee.employeeNumber;
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours}h` : `${hours}h${String(remainder).padStart(2, '0')}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value));
}

function formatKind(kind: string) {
  const labels: Record<string, string> = {
    CLOCK_IN: 'Entrada',
    CLOCK_OUT: 'Saída',
    BREAK_START: 'Início de intervalo',
    BREAK_END: 'Fim de intervalo',
    ADJUSTMENT: 'Ajuste manual',
  };

  return labels[kind] ?? kind;
}
