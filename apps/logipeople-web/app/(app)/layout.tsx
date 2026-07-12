import Link from 'next/link';

const navigation = [
  { href: '/people', label: 'Pessoas' },
  { href: '/organization', label: 'Organização' },
  { href: '/time-attendance', label: 'Ponto' },
  { href: '/payroll', label: 'Folha' },
  { href: '/settings', label: 'Configurações' },
];

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-[var(--color-background-secondary)] text-[var(--color-text-primary)]">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-[var(--color-border-secondary)] bg-[var(--color-brand-secondary)] p-6 text-white lg:block">
        <Link href="/" className="block">
          <p className="text-xs uppercase tracking-[0.2em] text-[#85b7eb]">Logi Platform</p>
          <h1 className="mt-2 text-2xl font-bold">LogiPeople</h1>
        </Link>
        <nav className="mt-10 space-y-2" aria-label="Navegação principal do LogiPeople">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="block rounded-lg px-4 py-3 text-sm font-semibold text-[#e6f1fb] hover:bg-white/10">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-6 left-6 right-6 rounded-xl bg-white/10 p-4 text-sm text-[#e6f1fb]">
          RH e DP são domínios separados dentro do mesmo produto nesta fase.
        </div>
      </aside>
      <div className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-[var(--color-border-secondary)] bg-[var(--color-background-primary)]/95 px-6 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-brand-primary)]">Fase 8</p>
              <p className="text-sm text-[var(--color-text-secondary)]">Fundação, Core People, permissões, ponto e folha preliminar</p>
            </div>
            <Link href="/settings" className="rounded-lg border border-[var(--color-border-secondary)] px-3 py-2 text-sm font-semibold hover:bg-[var(--color-background-tertiary)]">
              Permissões
            </Link>
          </div>
        </header>
        <main className="p-6 md:p-10">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
