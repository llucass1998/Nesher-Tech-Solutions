'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CompanyRegistrationInput, companyRegistrationSchema } from '../lib/auth-validation';

const IDENTITY_API_URL = process.env.NEXT_PUBLIC_IDENTITY_API_URL || 'http://localhost:3633';

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    setError,
  } = useForm<CompanyRegistrationInput>({
    resolver: zodResolver(companyRegistrationSchema),
    defaultValues: { company: '', name: '', email: '', phone: '', password: '' },
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    if (val.length > 6) {
      val = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
    } else if (val.length > 2) {
      val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
    } else if (val.length > 0) {
      val = `(${val}`;
    }
    setValue('phone', val, { shouldValidate: true });
  };

  async function submitRegistration(values: CompanyRegistrationInput) {
    setIsLoading(true);
    try {
      await axios.post(IDENTITY_API_URL + '/api/v1/auth/registration-requests', values);
      router.push(`/?registration=success&email=${encodeURIComponent(values.email)}`);
    } catch (requestError: unknown) {
      let friendlyMessage = 'Não foi possível concluir o cadastro. Verifique os dados.';
      if (axios.isAxiosError(requestError)) {
        if (!requestError.response) {
          friendlyMessage = 'Não foi possível conectar ao servidor de autenticação. Verifique se o serviço está ativo.';
        } else if (
          requestError.response.status === 409 ||
          requestError.response.data?.code === 'EMAIL_ALREADY_REGISTERED' ||
          (typeof requestError.response.data?.error === 'string' && requestError.response.data.error.includes('already uses this email'))
        ) {
          friendlyMessage = 'Já existe uma conta ou solicitação de cadastro pendente para este e-mail.';
        } else if (requestError.response.data?.message) {
          const msg = requestError.response.data.message;
          friendlyMessage = Array.isArray(msg) ? msg.join(', ') : msg;
        }
      }
      setError('root', {
        message: friendlyMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const rootError = errors.root?.message;

  return (
    <main className="login-page-wrapper">
      <div className="stage stage-register">
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
            <p className="eyebrow">COMECE COM A NESHER</p>
            <h1 className="headline">
              Uma operação mais <em>inteligente começa aqui.</em>
            </h1>
            <p className="sub">
              Centralize chamados, conecte sua equipe e conte com suporte técnico que entende o ritmo do seu negócio.
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
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              Atendimento humanizado
            </div>
            <div className="pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2 4 14h6l-1 8 9-12h-6z" />
              </svg>
              Suporte dedicado
            </div>
          </div>
        </div>

        {/* RIGHT FORM PANEL */}
        <div className="form-side">
          <div className="form-header-row">
            <p className="form-eyebrow">CADASTRO DA EMPRESA</p>
            <Link href="/" className="link-back">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Voltar ao login</span>
            </Link>
          </div>

          <h2 className="form-title">Crie seu acesso</h2>
          <p className="form-desc">Preencha os dados iniciais. Depois, seu vínculo será confirmado pela nossa equipe.</p>

          {rootError && (
            <div className="alert" style={{ display: 'flex' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5" />
                <path d="M12 16h.01" />
              </svg>
              <span>{rootError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(submitRegistration)} noValidate>
            <div className="form-grid-2">
              <div className="field">
                <label htmlFor="company">Razão social</label>
                <div className="input-wrap">
                  <svg className="leading" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="2" width="16" height="20" rx="2" />
                    <path d="M9 22v-4h6v4" />
                    <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
                  </svg>
                  <input
                    type="text"
                    id="company"
                    placeholder="Nome da empresa"
                    disabled={isLoading}
                    {...register('company')}
                  />
                </div>
                {errors.company?.message && <small className="field-error">{errors.company.message}</small>}
              </div>

              <div className="field">
                <label htmlFor="name">Responsável</label>
                <div className="input-wrap">
                  <svg className="leading" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    type="text"
                    id="name"
                    placeholder="Nome completo"
                    disabled={isLoading}
                    {...register('name')}
                  />
                </div>
                {errors.name?.message && <small className="field-error">{errors.name.message}</small>}
              </div>
            </div>

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
                  placeholder="voce@empresa.com.br"
                  autoComplete="email"
                  disabled={isLoading}
                  {...register('email')}
                />
              </div>
              {errors.email?.message && <small className="field-error">{errors.email.message}</small>}
            </div>

            <div className="field">
              <label htmlFor="phone">Celular com DDD</label>
              <div className="input-wrap">
                <svg className="leading" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <input
                  type="tel"
                  id="phone"
                  placeholder="(11) 99999-9999"
                  disabled={isLoading}
                  {...register('phone')}
                  onChange={handlePhoneChange}
                />
              </div>
              {errors.phone?.message && <small className="field-error">{errors.phone.message}</small>}
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
                  placeholder="Ex.: Nesher@2026"
                  autoComplete="new-password"
                  disabled={isLoading}
                  {...register('password')}
                />
                <button
                  type="button"
                  className="toggle-visibility"
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
              <small className="field-hint">8+ caracteres, maiúscula, minúscula, número e símbolo.</small>
              {errors.password?.message && <small className="field-error">{errors.password.message}</small>}
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading} style={{ marginTop: 24 }}>
              <span>{isLoading ? 'Criando acesso...' : 'Criar acesso da empresa'}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </button>
          </form>

          <p className="terms-note">
            Ao continuar, você concorda com nossos <Link href="/">Termos de uso</Link> e{' '}
            <Link href="/">Política de privacidade</Link>.
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
