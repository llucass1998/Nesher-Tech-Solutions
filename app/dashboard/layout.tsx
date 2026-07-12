'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Verifica se o usuário já havia escolhido o modo escuro antes
  useEffect(() => {
    const savedTheme = localStorage.getItem('logiflow_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Função para alternar o tema
  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('logiflow_theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('logiflow_theme', 'dark');
      setIsDarkMode(true);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[var(--color-background-primary)] dark:bg-gray-900 font-sans text-[var(--color-text-primary)] overflow-hidden transition-colors duration-300">
      
      <aside className="w-[240px] shrink-0 bg-[#0C447C] dark:bg-gray-900 dark:border-r dark:border-gray-800 flex flex-col h-full z-10 transition-all duration-300">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <i className="ti ti-truck-delivery text-[28px] text-[#85B7EB]"></i>
            <div>
              <div className="text-[15px] font-bold text-[#E6F1FB] leading-snug tracking-wide">LogiFlow</div>
              <div className="text-[11px] text-[#85B7EB] uppercase tracking-wider">PAINEL OPERACIONAL</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 mt-6">
          <ul className="space-y-1">
            <li>
              <Link 
                href="/dashboard"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-[14px] font-medium transition-colors ${
                  pathname === '/dashboard' 
                    ? 'bg-[#185FA5] text-white shadow-md' 
                    : 'text-[#E6F1FB] hover:bg-[#185FA5]/50'
                }`}
              >
                <i className="ti ti-home text-lg"></i>
                Início
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/deliveries"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-[14px] font-medium transition-colors ${
                  pathname.includes('/dashboard/deliveries') 
                    ? 'bg-[#185FA5] text-white shadow-md' 
                    : 'text-[#E6F1FB] hover:bg-[#185FA5]/50'
                }`}
              >
                <i className="ti ti-box text-lg"></i>
                Entregas
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/drivers"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-[14px] font-medium transition-colors ${
                  pathname.includes('/dashboard/drivers') 
                    ? 'bg-[#185FA5] text-white shadow-md' 
                    : 'text-[#E6F1FB] hover:bg-[#185FA5]/50'
                }`}
              >
                <i className="ti ti-steering-wheel text-lg"></i>
                Motociclistas
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/vehicles"
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-[14px] font-medium transition-colors ${
                  pathname.includes('/dashboard/vehicles') 
                    ? 'bg-[#185FA5] text-white shadow-md' 
                    : 'text-[#E6F1FB] hover:bg-[#185FA5]/50'
                }`}
              >
                <i className="ti ti-car text-lg"></i>
                Veículos
              </Link>
            </li>
          </ul>
        </nav>

        {/* Área inferior (Dark Mode e Sair) */}
        <div className="p-4 mt-auto flex flex-col gap-1">
          
          {/* Botão de Modo Escuro */}
          <button 
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-[#85B7EB] hover:text-[#E6F1FB] hover:bg-white/10 transition-colors text-[13px] font-medium"
          >
            <i className={`ti ${isDarkMode ? 'ti-sun' : 'ti-moon'} text-lg`}></i>
            {isDarkMode ? 'Modo Claro' : 'Modo Escuro'}
          </button>

          {/* Botão de Sair */}
          <Link href="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-[#85B7EB] hover:text-[#E6F1FB] hover:bg-red-500/20 hover:text-red-300 transition-colors text-[13px] font-medium">
            <i className="ti ti-logout text-lg"></i>
            Sistema de saída
          </Link>
        </div>
      </aside>

      <main className="flex-1 h-full overflow-y-auto p-6 md:p-10 lg:p-12 relative dark:bg-gray-900 transition-colors duration-300">
        <div className="w-full max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}