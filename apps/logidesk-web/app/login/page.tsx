'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storeIdentitySession } from '@/src/lib/session';

type LoginResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    roles: string[];
  };
  accessToken: string;
};

const IDENTITY_API_URL = process.env.NEXT_PUBLIC_IDENTITY_API_URL ?? 'http://localhost:3633';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${IDENTITY_API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        setError(response.status === 401 ? 'Credenciais invalidas.' : `Identity respondeu ${response.status}.`);
        return;
      }

      const data = (await response.json()) as LoginResponse;
      storeIdentitySession(data);
      router.push('/');
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Falha ao conectar no Identity.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 20, maxWidth: 520 }}>
      <section style={panelStyle}>
        <h2 style={{ margin: 0, fontSize: 28 }}>Entrar no LogiDesk</h2>
        <p style={mutedStyle}>Use a identidade central da Logi Platform. O access token fica apenas na sessao do navegador.</p>
      </section>

      <form onSubmit={onSubmit} style={{ ...panelStyle, display: 'grid', gap: 14 }}>
        <label style={labelStyle}>
          Email
          <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" style={inputStyle} />
        </label>
        <label style={labelStyle}>
          Senha
          <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required autoComplete="current-password" style={inputStyle} />
        </label>
        {error ? <p style={{ margin: 0, color: 'var(--desk-danger)', fontSize: 14, fontWeight: 800 }}>{error}</p> : null}
        <button type="submit" disabled={submitting} style={buttonStyle}>
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

const panelStyle = { border: '1px solid var(--desk-border)', borderRadius: 8, background: 'var(--desk-surface)', padding: 20 };
const mutedStyle = { margin: '6px 0 0', color: 'var(--desk-muted)', fontSize: 14 };
const labelStyle = { display: 'grid', gap: 6, fontSize: 13, fontWeight: 800 };
const inputStyle = { border: '1px solid var(--desk-border)', borderRadius: 8, padding: '11px 12px', fontSize: 14 };
const buttonStyle = { border: 0, borderRadius: 8, background: 'var(--desk-brand)', color: 'white', padding: '12px 14px', fontSize: 14, fontWeight: 800, cursor: 'pointer' };
