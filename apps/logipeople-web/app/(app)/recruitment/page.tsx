import { CandidateSummary, JobApplicationSummary, JobOpeningSummary, fetchLogiPeople } from '@/src/lib/api';

export default async function RecruitmentPage() {
  const [openings, candidates, applications] = await Promise.all([
    fetchLogiPeople<JobOpeningSummary[]>('/recruitment/openings'),
    fetchLogiPeople<CandidateSummary[]>('/recruitment/candidates'),
    fetchLogiPeople<JobApplicationSummary[]>('/recruitment/applications'),
  ]);

  const unauthorized = openings.unauthorized || candidates.unauthorized || applications.unauthorized;
  const error = openings.error ?? candidates.error ?? applications.error;
  const openingData = openings.data ?? [];
  const candidateData = candidates.data ?? [];
  const applicationData = applications.data ?? [];
  const openPositions = openingData.filter((opening) => opening.status === 'OPEN').length;
  const screeningApplications = applicationData.filter((application) => application.status === 'SCREENING' || application.status === 'INTERVIEW').length;
  const pendingLegalValidation = openingData.filter((opening) => opening.legalValidationPending).length + applicationData.filter((application) => application.legalValidationPending).length;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-primary)]">Fase 11</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Recrutamento preliminar</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
          Fundação para vagas, candidatos e candidaturas com auditoria e classificação de dados. Esta tela não publica vagas em job boards, não realiza admissão automática e não transforma candidato em colaborador.
        </p>
      </section>

      {unauthorized && <StateCard title="Sem credencial do LogiIdentity" message={error ?? 'Faça login para visualizar dados de recrutamento.'} tone="warning" />}
      {error && !unauthorized && <StateCard title="Erro ao carregar recrutamento" message={error} tone="danger" />}

      {!unauthorized && !error && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Vagas" value={openingData.length} helper="Requisições preliminares" />
            <MetricCard label="Abertas" value={openPositions} helper="Disponíveis para triagem interna" />
            <MetricCard label="Candidatos" value={candidateData.length} helper="Registros confidenciais" />
            <MetricCard label="Em triagem" value={screeningApplications} helper="Candidaturas em análise" />
          </div>

          {pendingLegalValidation > 0 && (
            <StateCard
              title="Validação e governança pendentes"
              message={`${pendingLegalValidation} registro(s) de recrutamento ainda dependem de validação de RH, consentimento e governança antes de qualquer admissão, comunicação externa ou automação.`}
              tone="warning"
            />
          )}

          <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-bold">Vagas preliminares</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">Requisições internas por empresa, posição, status e vigência.</p>
              </div>
            </div>
            {openingData.length === 0 ? (
              <EmptyState message="Nenhuma vaga cadastrada pela API." />
            ) : (
              <div className="mt-5 overflow-hidden rounded-xl border border-[var(--color-border-secondary)]">
                <table className="min-w-full divide-y divide-[var(--color-border-secondary)] text-sm">
                  <thead className="bg-[var(--color-background-tertiary)] text-left text-[var(--color-text-secondary)]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Vaga</th>
                      <th className="px-4 py-3 font-semibold">Empresa</th>
                      <th className="px-4 py-3 font-semibold">Posição</th>
                      <th className="px-4 py-3 font-semibold">Vigência</th>
                      <th className="px-4 py-3 font-semibold">Candidaturas</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-secondary)]">
                    {openingData.map((opening) => (
                      <tr key={opening.id}>
                        <td className="px-4 py-3 font-medium">{opening.title}</td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{opening.company?.name ?? 'Empresa não informada'}</td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{opening.position?.title ?? 'Sem posição vinculada'}</td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{formatDate(opening.effectiveFrom)} até {opening.effectiveTo ? formatDate(opening.effectiveTo) : 'aberto'}</td>
                        <td className="px-4 py-3">{opening._count?.applications ?? 0}</td>
                        <td className="px-4 py-3"><StatusBadge value={opening.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <Panel title="Candidatos recentes" helper="Dados pessoais mantidos como confidenciais e sem documentos completos nesta fundação.">
              {candidateData.length === 0 ? (
                <EmptyState message="Nenhum candidato cadastrado pela API." />
              ) : (
                <div className="space-y-3">
                  {candidateData.slice(0, 8).map((candidate) => (
                    <article key={candidate.id} className="rounded-xl border border-[var(--color-border-secondary)] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-semibold">{candidate.fullName}</h4>
                          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{candidate.email}</p>
                        </div>
                        <StatusBadge value={candidate.status} />
                      </div>
                      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <TextMetric label="Consentimento" value={candidate.consentRecordedAt ? formatDate(candidate.consentRecordedAt) : 'Não registrado'} />
                        <TextMetric label="Candidaturas" value={String(candidate._count?.applications ?? 0)} />
                      </dl>
                    </article>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Candidaturas recentes" helper="Fluxo preliminar de triagem sem oferta vinculante ou admissão automática.">
              {applicationData.length === 0 ? (
                <EmptyState message="Nenhuma candidatura cadastrada pela API." />
              ) : (
                <div className="space-y-3">
                  {applicationData.slice(0, 8).map((application) => (
                    <article key={application.id} className="rounded-xl border border-[var(--color-border-secondary)] p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-semibold">{application.candidate?.fullName ?? 'Candidato não informado'}</h4>
                          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{application.opening?.title ?? 'Vaga não informada'} · {formatSource(application.source)}</p>
                        </div>
                        <StatusBadge value={application.status} />
                      </div>
                      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <TextMetric label="Aplicado em" value={formatDate(application.appliedAt)} />
                        <TextMetric label="Empresa" value={application.opening?.company?.name ?? 'Não informada'} />
                      </dl>
                      {application.legalValidationPending && <p className="mt-3 text-xs font-semibold text-[var(--color-warning)]">Validação de governança pendente</p>}
                    </article>
                  ))}
                </div>
              )}
            </Panel>
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

function Panel({ title, helper, children }: { title: string; helper: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{helper}</p>
      <div className="mt-5">{children}</div>
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
  return <p className="rounded-xl border border-dashed border-[var(--color-border-secondary)] p-4 text-sm text-[var(--color-text-secondary)]">{message}</p>;
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value));
}

function formatSource(source: string) {
  const labels: Record<string, string> = {
    MANUAL: 'Manual',
    REFERRAL: 'Indicação',
    INTERNAL: 'Interna',
    JOB_BOARD: 'Job board',
    AGENCY: 'Agência',
    OTHER: 'Outro',
  };

  return labels[source] ?? source;
}
