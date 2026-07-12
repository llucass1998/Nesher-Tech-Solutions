import { fetchLogiPeople, PersonSummary } from '@/src/lib/api';

export default async function PeoplePage() {
  const result = await fetchLogiPeople<PersonSummary[]>('/people/persons');

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-primary)]">Core People</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight">Pessoas</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-secondary)]">
          Fonte central de dados de pessoas, com classificação de dados e vínculo opcional com colaborador.
        </p>
      </section>

      {result.unauthorized && <NoPermissionState message={result.error ?? 'Sem permissão.'} />}
      {result.error && !result.unauthorized && <ErrorState message={result.error} />}
      {result.data && result.data.length === 0 && <EmptyState />}
      {result.data && result.data.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] shadow-sm">
          <table className="min-w-full divide-y divide-[var(--color-border-secondary)] text-sm">
            <thead className="bg-[var(--color-background-tertiary)] text-left text-[var(--color-text-secondary)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">E-mail corporativo</th>
                <th className="px-4 py-3 font-semibold">Classificação</th>
                <th className="px-4 py-3 font-semibold">Colaborador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-secondary)]">
              {result.data.map((person) => (
                <tr key={person.id}>
                  <td className="px-4 py-3 font-medium">{person.preferredName ?? person.fullName}</td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">{person.corporateEmail}</td>
                  <td className="px-4 py-3">{person.dataClassification}</td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">{person.employee?.employeeNumber ?? 'Sem vínculo'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NoPermissionState({ message }: { message: string }) {
  return <StateCard title="Sem credencial" message={message} tone="warning" />;
}

function ErrorState({ message }: { message: string }) {
  return <StateCard title="Erro ao carregar pessoas" message={message} tone="danger" />;
}

function EmptyState() {
  return <StateCard title="Nenhuma pessoa cadastrada" message="Crie pessoas pela API de Core People após configurar LogiIdentity." tone="neutral" />;
}

function StateCard({ title, message, tone }: { title: string; message: string; tone: 'warning' | 'danger' | 'neutral' }) {
  const toneClass = tone === 'danger' ? 'text-[var(--color-danger)]' : tone === 'warning' ? 'text-[var(--color-warning)]' : 'text-[var(--color-text-secondary)]';

  return (
    <section className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] p-6 shadow-sm">
      <h3 className={`text-lg font-semibold ${toneClass}`}>{title}</h3>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{message}</p>
    </section>
  );
}
