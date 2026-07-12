'use client';

import { useState } from 'react';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const registerSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  email: z.string().email({ message: 'Por favor, digite um e-mail válido.' }),
  phone: z.string().min(10, { message: 'Digite um telefone válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = registerSchema.safeParse({ name, email, phone, password });

    if (!result.success) {
      setErrorMsg(result.error.issues[0]?.message || 'Erro de validação.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      await axios.post(`${API_URL}/drivers`, {
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone,
        password: result.data.password,
      });

      router.push('/');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMsg(error.response?.data?.error || 'Erro ao criar conta.');
      } else {
        setErrorMsg('Erro inesperado ao criar conta.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl flex min-h-[580px] bg-white rounded-lg overflow-hidden border border-[var(--color-border-secondary)] shadow-xl">
      
      {/* Lado Esquerdo (Branding) */}
      <div className="w-[240px] shrink-0 bg-[#0C447C] p-8 flex flex-col justify-between">
        <div className="flex items-center gap-3">
          <i className="ti ti-truck-delivery text-[28px] text-[#85B7EB]"></i>
          <span className="text-[15px] font-bold text-[#E6F1FB] leading-snug tracking-wide">
            LogiFlow
          </span>
        </div>
        <div className="text-[12px] text-[#378ADD]">© 2026 LogiFlow</div>
      </div>

      {/* Lado Direito (Formulário) */}
      <div className="flex-1 bg-[var(--color-background-primary)] p-10 flex flex-col justify-center">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">Criar nova conta</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">Preencha os dados para se cadastrar.</p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 text-[13px] px-3 py-2 rounded-md mb-4 border border-red-200">
            <i className="ti ti-alert-circle"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Nome completo</label>
            <div className="relative">
              <i className="ti ti-user absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-[var(--color-text-secondary)]"></i>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                disabled={isLoading}
                className="w-full h-[40px] pl-10 pr-3 border border-[var(--color-border-secondary)] rounded-md bg-[var(--color-background-primary)] text-[var(--color-text-primary)] text-sm outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">E-mail</label>
            <div className="relative">
              <i className="ti ti-mail absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-[var(--color-text-secondary)]"></i>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                disabled={isLoading}
                className="w-full h-[40px] pl-10 pr-3 border border-[var(--color-border-secondary)] rounded-md bg-[var(--color-background-primary)] text-[var(--color-text-primary)] text-sm outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Telefone</label>
            <div className="relative">
              <i className="ti ti-phone absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-[var(--color-text-secondary)]"></i>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                disabled={isLoading}
                className="w-full h-[40px] pl-10 pr-3 border border-[var(--color-border-secondary)] rounded-md bg-[var(--color-background-primary)] text-[var(--color-text-primary)] text-sm outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[var(--color-text-secondary)] mb-1.5">Senha</label>
            <div className="relative">
              <i className="ti ti-lock absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-[var(--color-text-secondary)]"></i>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                disabled={isLoading}
                className="w-full h-[40px] pl-10 pr-10 border border-[var(--color-border-secondary)] rounded-md bg-[var(--color-background-primary)] text-[var(--color-text-primary)] text-sm outline-none focus:border-[#185FA5] focus:ring-1 focus:ring-[#185FA5] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] text-[17px] hover:text-[var(--color-text-primary)]"
              >
                <i className={showPassword ? 'ti ti-eye-off' : 'ti ti-eye'}></i>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[42px] mt-2 bg-[#185FA5] hover:bg-[#0C447C] text-white font-medium text-[15px] rounded-md flex items-center justify-center gap-2 transition-all disabled:opacity-70"
          >
            {isLoading
              ? <><i className="ti ti-loader-2 animate-spin text-lg"></i> Criando conta...</>
              : <><i className="ti ti-user-plus text-lg"></i> Criar conta</>
            }
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <hr className="flex-1 border-[var(--color-border-secondary)]" />
          <span className="text-[12px] text-[var(--color-text-tertiary)]">ou</span>
          <hr className="flex-1 border-[var(--color-border-secondary)]" />
        </div>

        <Link
          href="/"
          className="w-full h-[40px] border border-[var(--color-border-secondary)] rounded-md flex items-center justify-center gap-2 text-[14px] text-[var(--color-text-primary)] hover:bg-gray-50 transition-colors"
        >
          <i className="ti ti-login"></i>
          Já tenho uma conta
        </Link>
      </div>
    </div>
  );
}