'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginInput, loginSchema } from './lib/auth-validation';

const IDENTITY_API_URL = process.env.NEXT_PUBLIC_IDENTITY_API_URL || 'http://localhost:3633';

function RegistrationNotice() {
  const searchParams = useSearchParams();
  const registration = searchParams.get('registration');

  if (!registration) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        background: '#eafff7',
        border: '1px solid #b8ecd9',
        color: '#116c51',
        fontSize: 13.5,
        padding: '12px 14px',
        borderRadius: 10,
        marginBottom: 20,
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, flexShrink: 0 }}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
      <span>Cadastro realizado com sucesso! Sua conta está liberada. Digite seus dados para entrar.</span>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get('email');
      const passwordParam = params.get('password');

      if (emailParam && passwordParam) {
        setValue('email', emailParam);
        setValue('password', passwordParam);
        submitLogin({ email: emailParam, password: passwordParam });
        return;
      }

      if (emailParam) {
        setValue('email', emailParam);
        setRememberMe(true);
        return;
      }
    } catch {}

    const savedEmail = window.localStorage.getItem('logiflow_email');
    if (savedEmail) {
      setValue('email', savedEmail);
      setRememberMe(true);
    }
  }, [setValue]);

  async function submitLogin(values: LoginInput) {
    setIsLoading(true);
    try {
      const normalizedEmail = values.email.toLowerCase().trim();

      // 1. Verificação oficial de credenciais do Administrador Global
      if (normalizedEmail === 'llucas.ab@gmail.com') {
        if (values.password === 'Opex@0722') {
          const globalAdminUser = {
            id: 'admin-global-lucas',
            name: 'Lucas Silva',
            email: 'llucas.ab@gmail.com',
            roles: ['SUPER_ADMIN', 'GLOBAL_ADMIN', 'ADMIN'],
            permissions: ['*'],
            status: 'ACTIVE',
          };
          const mockToken =
            'jwt_token_' +
            (typeof window !== 'undefined'
              ? btoa(JSON.stringify(globalAdminUser))
              : 'admin_global');

          window.localStorage.setItem('logiflow_token', mockToken);
          window.localStorage.setItem('logiflow_user', JSON.stringify(globalAdminUser));
          window.localStorage.removeItem('nesher_simulated_role'); // Garante que nenhuma simulação de cliente restrinja o acesso

          if (rememberMe) {
            window.localStorage.setItem('logiflow_email', values.email);
          } else {
            window.localStorage.removeItem('logiflow_email');
          }

          // Redireciona diretamente para o dashboard
          if (typeof window !== 'undefined') {
            window.location.href = '/dashboard';
          } else {
            router.push('/dashboard');
          }
          return;
        } else {
          setError('password', {
            message: 'Senha incorreta para o Administrador Global.',
          });
          setIsLoading(false);
          return;
        }
      }

      // 2. Tentativa de autenticação via API Identity (caso o microserviço esteja ativo)
      try {
        const response = await axios.post(
          IDENTITY_API_URL + '/api/v1/auth/login',
          values,
          { withCredentials: true, timeout: 2500 }
        );
        if (response.data.accessToken) {
          window.localStorage.setItem('logiflow_token', response.data.accessToken);
        }
        if (rememberMe) {
          window.localStorage.setItem('logiflow_email', values.email);
        } else {
          window.localStorage.removeItem('logiflow_email');
        }
        if (response.data.user) {
          window.localStorage.setItem('logiflow_user', JSON.stringify(response.data.user));
        }
        router.push('/dashboard');
        return;
      } catch (apiError: unknown) {
        // 3. Fallback para outros usuários cadastrados no navegador
        const rawRegistered = typeof window !== 'undefined' ? window.localStorage.getItem('logiflow_registered_users') : null;
        if (rawRegistered) {
          const users = JSON.parse(rawRegistered);
          const found = users.find((u: any) => u.email?.toLowerCase().trim() === normalizedEmail);
          if (found && found.password === values.password) {
            const clientUser = {
              id: found.id || 'client-user-' + Date.now(),
              name: found.name || 'Cliente Conectado',
              email: found.email,
              companyName: found.companyName || 'LogiFlow Transportes',
              roles: ['ROLE_CLIENT', 'CUSTOMER'],
              status: 'ACTIVE',
            };
            window.localStorage.setItem('logiflow_token', 'mock_token_' + Date.now());
            window.localStorage.setItem('logiflow_user', JSON.stringify(clientUser));
            window.localStorage.setItem('nesher_simulated_role', 'client');
            router.push('/dashboard');
            return;
          }
        }

        const message = axios.isAxiosError(apiError)
          ? apiError.response?.data?.message ?? apiError.response?.data?.error
          : undefined;
        setError('root', {
          message: message || 'Não foi possível entrar. Confira seu e-mail e senha.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  const errorMessage = errors.root?.message || errors.email?.message || errors.password?.message;

  return (
    <main className="login-page-wrapper">
      <div className="stage">
        {/* LEFT BRAND PANEL */}
        <div className="brand-side">
          <svg className="circuit-bg" viewBox="0 0 500 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <g fill="none" stroke="#5A93F0" strokeWidth="1.2">
              <path d="M -20 90 L 90 90 L 140 140 L 260 140" />
              <path d="M -20 260 L 60 260 L 100 300 L 100 420 L 40 480" />
              <path d="M 520 60 L 380 60 L 330 110 L 330 220" />
              <path d="M 520 400 L 420 400 L 380 440 L 260 440 L 220 480 L 220 600" />
              <path d="M -20 560 L 140 560 L 190 610" />
              <path d="M 520 560 L 440 560 L 400 600" />
            </g>
            <g fill="#8FB6F7">
              <circle cx="90" cy="90" r="4" />
              <circle cx="260" cy="140" r="4" />
              <circle cx="60" cy="260" r="4" />
              <circle cx="40" cy="480" r="4" />
              <circle cx="380" cy="60" r="4" />
              <circle cx="330" cy="220" r="4" />
              <circle cx="420" cy="400" r="4" />
              <circle cx="220" cy="600" r="4" />
              <circle cx="140" cy="560" r="4" />
              <circle cx="440" cy="560" r="4" />
            </g>
            <circle r="3.2" fill="#FFFFFF">
              <animateMotion
                dur="7s"
                repeatCount="indefinite"
                path="M -20 90 L 90 90 L 140 140 L 260 140 L 330 140 L 330 220"
              />
              <animate attributeName="opacity" values="0;1;1;0" dur="7s" repeatCount="indefinite" />
            </circle>
          </svg>

          <div className="brand-top">
            <div className="logo-badge">
              <Image
                src="/nesher-icon.png"
                alt="Nesher Tech Solutions"
                width={64}
                height={64}
                priority
              />
            </div>
            <div className="brand-name">
              NESHER<span> TECH SOLUTIONS</span>
            </div>
            <div className="brand-tagline">Inovar · Conectar · Transformar</div>
          </div>

          <div className="brand-mid">
            <p className="eyebrow">Suporte que move o seu negócio</p>
            <h1 className="headline">
              Seu time técnico <em>sempre por perto</em>
            </h1>
            <p className="sub">
              Abra chamados, acompanhe atendimentos e mantenha sua operação funcionando sem surpresas.
            </p>
          </div>

          <div className="brand-bottom">
            <div className="pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
              </svg>
              Ambiente seguro
            </div>
            <div className="pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
              </svg>
              Atendimento ágil
            </div>
            <div className="pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
              Suporte contínuo
            </div>
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className="form-side">
          <p className="form-eyebrow">Área do cliente</p>
          <h2 className="form-title">Bem-vindo de volta</h2>
          <p className="form-desc">Entre para acompanhar seus chamados e falar com nosso suporte.</p>

          <Suspense fallback={null}>
            <RegistrationNotice />
          </Suspense>

          {errorMessage && (
            <div className="alert" id="errorAlert" style={{ display: 'flex' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5" />
                <path d="M12 16h.01" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Global Admin Helper */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f5f3ff',
              border: '1px solid #ddd6fe',
              borderRadius: '8px',
              padding: '8px 12px',
              marginBottom: '16px',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#7c3aed', fontWeight: 700 }}>👑 Admin Global:</span>
              <code style={{ fontSize: '11px', color: '#6d28d9', background: '#ede9fe', padding: '2px 6px', borderRadius: '4px' }}>
                llucas.ab@gmail.com
              </code>
            </div>
            <button
              type="button"
              onClick={() => {
                setValue('email', 'llucas.ab@gmail.com');
                setValue('password', 'Opex@0722');
              }}
              style={{
                background: '#7c3aed',
                color: '#fff',
                border: 0,
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Preencher login do Administrador Global"
            >
              Preencher Acesso
            </button>
          </div>

          <form
            id="loginForm"
            method="post"
            action="#"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(submitLogin)(e);
            }}
            noValidate
          >
            <div className="field">
              <label htmlFor="email">E-mail corporativo</label>
              <div className="input-wrap">
                <svg className="leading" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
                <input
                  type="email"
                  id="email"
                  placeholder="nome@empresa.com"
                  autoComplete="email"
                  disabled={isLoading}
                  {...register('email')}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Senha</label>
              <div className="input-wrap">
                <svg className="leading" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="11" width="16" height="9" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  id="toggleBtn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="row-between">
              <label className="remember">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Lembrar de mim</span>
              </label>
              <Link href="/register" className="link">
                Esqueci minha senha
              </Link>
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading}>
              <span>{isLoading ? 'Entrando...' : 'Entrar na plataforma'}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </button>
          </form>

          <div className="divider">ou</div>
          <p className="signup">
            Sua empresa ainda não está cadastrada? <Link href="/register">Cadastre sua empresa</Link>
          </p>

          <div className="footer-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="11" width="16" height="9" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            <span>Seus dados são protegidos com criptografia de ponta a ponta.</span>
          </div>
        </div>
      </div>
    </main>
  );
}
