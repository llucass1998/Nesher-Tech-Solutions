import { CompanySummary, fetchLogiPeople } from '@/src/lib/api';

export default async function OrganizationPage() {
  const result = await fetchLogiPeople<CompanySummary[]>('/organizations/companies');

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-primary)]">Organização</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Estrutura organizacional</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
          Empresas, departamentos e posições são a base para escopos ABAC, gestão de pessoas e futura separação de DP.
        </p>
      </section>

      {result.unauthorized && <StateCard title="Sem credencial do LogiIdentity" message={result.error ?? 'Faça login para visualizar a organização.'} />}
      {result.error && !result.unauthorized && <StateCard title="Erro ao carregar organização" message={result.error} />}
      {result.data && result.data.length === 0 && <StateCard title="Organização vazia" message="Crie uma empresa e departamentos pela API para iniciar o Core People." />}
      {result.data && result.data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {result.data.map((company) => (
            <article key={company.id} className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
              <h3 className="text-xl font-bold">{company.name}</h3>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{company.legalName}</p>
              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-[var(--color-text-tertiary)]">Registro</dt>
                  <dd className="mt-1 font-semibold">{company.registrationNumber}</dd>
                </div>
                <div>
                  <dt className="text-[var(--color-text-tertiary)]">Departamentos</dt>
                  <dd className="mt-1 font-semibold">{company.departments?.length ?? 0}</dd>
                </div>
                <div>
                  <dt className="text-[var(--color-text-tertiary)]">Posições</dt>
                  <dd className="mt-1 font-semibold">{company.positions?.length ?? 0}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function StateCard({ title, message }: { title: string; message: string }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{message}</p>
    </section>
  );
}
