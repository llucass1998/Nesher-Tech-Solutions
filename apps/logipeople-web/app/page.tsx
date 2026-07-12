import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--color-background-secondary)] p-6 flex items-center justify-center">
      <section className="w-full max-w-4xl rounded-2xl bg-[var(--color-background-primary)] border border-[var(--color-border-secondary)] shadow-sm p-8 md:p-12">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-primary)]">Logi Platform</p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">LogiPeople</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
          Fundação independente para Recursos Humanos e Departamento Pessoal, com Core People, estrutura organizacional, permissões e auditoria desde a primeira fase.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/people" className="rounded-lg bg-[var(--color-brand-primary)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--color-brand-secondary)]">
            Acessar pessoas
          </Link>
          <Link href="/organization" className="rounded-lg border border-[var(--color-border-secondary)] px-5 py-3 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-background-tertiary)]">
            Ver organização
          </Link>
        </div>
      </section>
    </main>
  );
}
