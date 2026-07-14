import Link from 'next/link';
import { RealtimeNotifications } from './realtime-notifications';
import './globals.css';

export const metadata = {
  title: 'LogiDesk',
  description: 'Central operacional de suporte integrada ao LogiFlow',
};

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/tickets', label: 'Chamados' },
  { href: '/tickets?view=kanban', label: 'Kanban' },
  { href: '/sla', label: 'SLA' },
  { href: '/reports', label: 'Relatorios' },
  { href: '/notifications', label: 'Notificacoes' },
  { href: '/settings', label: 'Configuracoes' },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <div style={{ display: 'grid', minHeight: '100vh', gridTemplateColumns: '280px 1fr' }}>
          <aside style={{ background: 'var(--desk-brand-strong)', color: 'white', padding: 24 }}>
            <Link href="/">
              <p style={{ margin: 0, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: '#9bd3df' }}>Logi Platform</p>
              <h1 style={{ margin: '8px 0 0', fontSize: 28 }}>LogiDesk</h1>
            </Link>
            <nav aria-label="Navegacao principal do LogiDesk" style={{ display: 'grid', gap: 8, marginTop: 32 }}>
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} style={{ borderRadius: 8, padding: '12px 14px', fontSize: 14, fontWeight: 700, color: '#e9f6f8' }}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div style={{ marginTop: 40, borderRadius: 8, background: 'rgba(255,255,255,0.12)', padding: 16, fontSize: 13, lineHeight: 1.5 }}>
              Suporte acompanha tickets, SLA e contexto minimo do LogiFlow sem acessar o banco logistico.
            </div>
          </aside>
          <div>
            <header style={{ position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid var(--desk-border)', background: 'rgba(255,255,255,0.92)', padding: '18px 28px' }}>
              <p style={{ margin: 0, color: 'var(--desk-brand)', fontSize: 12, fontWeight: 800, letterSpacing: 1.6, textTransform: 'uppercase' }}>Atendimento integrado</p>
              <p style={{ margin: '4px 0 0', color: 'var(--desk-muted)', fontSize: 14 }}>Tickets, mensagens, notas internas, SLA e eventos vindos do LogiFlow.</p>
            </header>
            <main style={{ padding: 28 }}>{children}</main>
          </div>
        </div>
        <RealtimeNotifications />
      </body>
    </html>
  );
}
