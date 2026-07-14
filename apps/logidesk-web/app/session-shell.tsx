'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { IdentityUser, logoutIdentitySession, readStoredUser, refreshIdentitySession } from '@/src/lib/session';

const publicPaths = new Set(['/login']);

export function SessionShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<IdentityUser | null>(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    return readStoredUser();
  });
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let active = true;

    async function refresh() {
      if (readStoredUser()) {
        if (active) setChecked(true);
        return;
      }

      const session = await refreshIdentitySession();

      if (!active) {
        return;
      }

      setUser(session?.user ?? null);
      setChecked(true);
    }

    void refresh();

    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    await logoutIdentitySession();
    setUser(null);
    router.push('/login');
    router.refresh();
  }

  if (!publicPaths.has(pathname) && checked && !user) {
    return (
      <div style={{ display: 'grid', gap: 20 }}>
        <section style={panelStyle}>
          <h2 style={{ margin: 0, fontSize: 28 }}>Sessao necessaria</h2>
          <p style={mutedStyle}>Entre com sua identidade central para acessar o LogiDesk.</p>
          <Link href="/login" style={buttonLinkStyle}>Entrar</Link>
        </section>
      </div>
    );
  }

  return (
    <>
      {user ? (
        <div style={sessionBarStyle}>
          <span>{user.name}</span>
          <button type="button" onClick={logout} style={logoutButtonStyle}>Sair</button>
        </div>
      ) : null}
      {children}
    </>
  );
}

const panelStyle: CSSProperties = { border: '1px solid var(--desk-border)', borderRadius: 8, background: 'var(--desk-surface)', padding: 20 };
const mutedStyle: CSSProperties = { margin: '6px 0 0', color: 'var(--desk-muted)', fontSize: 14 };
const buttonLinkStyle: CSSProperties = { display: 'inline-block', marginTop: 16, borderRadius: 8, background: 'var(--desk-brand)', color: 'white', padding: '10px 14px', fontSize: 14, fontWeight: 800 };
const sessionBarStyle: CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center', marginBottom: 16, color: 'var(--desk-muted)', fontSize: 13, fontWeight: 800 };
const logoutButtonStyle: CSSProperties = { border: '1px solid var(--desk-border)', borderRadius: 8, background: 'var(--desk-surface)', color: 'var(--desk-text)', padding: '7px 10px', cursor: 'pointer', fontWeight: 800 };
