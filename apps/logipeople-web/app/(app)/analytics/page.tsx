import type { ReactNode } from 'react';
import { AnalyticsMetricRow, AnalyticsOverview, fetchLogiPeople } from '@/src/lib/api';

export default async function AnalyticsPage() {
  const overview = await fetchLogiPeople<AnalyticsOverview>('/analytics/overview');
  const unauthorized = overview.unauthorized;
  const error = overview.error;
  const data = overview.data;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-primary)]">Fase 14</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Analytics agregados</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
          Visao preliminar de indicadores agregados de RH/DP por status e governanca. Esta tela nao exibe salario,
          documentos, dados medicos, dados bancarios, biometria, atributos sensiveis ou registros individuais.
        </p>
      </section>

      {unauthorized && (
        <StateCard title="Sem credencial do LogiIdentity" message={error ?? 'Faca login para visualizar analytics agregados.'} tone="warning" />
      )}
      {error && !unauthorized && <StateCard title="Erro ao carregar analytics" message={error} tone="danger" />}

      {!unauthorized && !error && data && (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Colaboradores" value={sumRows(data.people.employeesByStatus)} helper="Contagem agregada por status" />
            <MetricCard label="Candidaturas" value={sumRows(data.hiring.applicationsByStatus)} helper="Sem dados pessoais de candidatos" />
            <MetricCard label="Tarefas onboarding" value={sumRows(data.hiring.onboardingTasksByStatus)} helper="Checklist interno agregado" />
            <MetricCard label="Validacao pendente" value={data.governance.pendingLegalValidation.total} helper="Registros preliminares" />
          </section>

          <StateCard
            title="Privacidade aplicada"
            message="Este painel consome apenas contagens agregadas. Ele nao deve ser usado para decisao legal, folha, beneficios, contratacao, desligamento ou eSocial sem validacao especializada."
            tone="warning"
          />

          <section className="grid gap-4 xl:grid-cols-2">
            <Panel title="Pessoas e estrutura" helper="Contagens por status operacional, sem historico funcional individual.">
              <MetricList title="Colaboradores por status" rows={data.people.employeesByStatus} />
              <MetricList title="Posicoes por status" rows={data.people.positionsByStatus} />
            </Panel>

            <Panel title="Contratacao e onboarding" helper="Funil preliminar agregado sem oferta, admissao ou provisionamento externo.">
              <MetricList title="Candidaturas por status" rows={data.hiring.applicationsByStatus} />
              <MetricList title="Tarefas de onboarding por status" rows={data.hiring.onboardingTasksByStatus} />
            </Panel>

            <Panel title="Operacoes de DP" helper="Ponto, ausencias e ferias sem calculo legal ou reflexo em folha.">
              <MetricList title="Periodos de ponto" rows={data.operations.attendancePeriodsByStatus} />
              <MetricList title="Ausencias" rows={data.operations.absenceRequestsByStatus} />
              <MetricList title="Ferias" rows={data.operations.vacationPeriodsByStatus} />
            </Panel>

            <Panel title="Administracao preliminar" helper="Folha, holerites e beneficios agregados sem valores monetarios ou dados sensiveis.">
              <MetricList title="Ciclos de folha" rows={data.administration.payrollCyclesByStatus} />
              <MetricList title="Holerites demonstrativos" rows={data.administration.payslipsByStatus} />
              <MetricList title="Beneficios" rows={data.administration.benefitEnrollmentsByStatus} />
            </Panel>
          </section>

          <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
            <h3 className="text-xl font-bold">Governanca de validacao pendente</h3>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Totalizacao por dominio de registros preliminares que ainda dependem de revisao humana, DP/juridica ou governanca
              antes de qualquer uso decisorio.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {Object.entries(data.governance.pendingLegalValidation)
                .filter(([key]) => key !== 'total')
                .map(([key, value]) => (
                  <TextMetric key={key} label={formatGovernanceLabel(key)} value={String(value)} />
                ))}
            </div>
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

function Panel({ title, helper, children }: { title: string; helper: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{helper}</p>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function MetricList({ title, rows }: { title: string; rows: AnalyticsMetricRow[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">{title}</h4>
      {rows.length === 0 ? (
        <EmptyState message="Nenhum registro agregado retornado pela API." />
      ) : (
        <div className="mt-3 space-y-2">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-xl border border-[var(--color-border-secondary)] px-4 py-3 text-sm">
              <span className="font-medium">{row.label}</span>
              <span className="rounded-full bg-[var(--color-background-tertiary)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]">{row.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
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
  return <p className="mt-3 rounded-xl border border-dashed border-[var(--color-border-secondary)] p-4 text-sm text-[var(--color-text-secondary)]">{message}</p>;
}

function TextMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border-secondary)] p-4 text-sm">
      <dt className="text-[var(--color-text-tertiary)]">{label}</dt>
      <dd className="mt-1 text-lg font-semibold">{value}</dd>
    </div>
  );
}

function sumRows(rows: AnalyticsMetricRow[]) {
  return rows.reduce((total, row) => total + row.count, 0);
}

function formatGovernanceLabel(key: string) {
  const labels: Record<string, string> = {
    attendancePeriods: 'Periodos de ponto',
    payrollCycles: 'Ciclos de folha',
    payrollRuns: 'Demonstrativos de folha',
    payrollItems: 'Itens de folha',
    payslips: 'Holerites demonstrativos',
    payslipLines: 'Linhas de holerite',
    benefitPlans: 'Planos de beneficio',
    benefitEnrollments: 'Adesoes a beneficio',
    absenceRequests: 'Ausencias',
    vacationPeriods: 'Ferias',
    jobOpenings: 'Vagas',
    jobApplications: 'Candidaturas',
    onboardingPlans: 'Planos de onboarding',
    onboardingTasks: 'Tarefas de onboarding',
  };

  return labels[key] ?? key;
}
