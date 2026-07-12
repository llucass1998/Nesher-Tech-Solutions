import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LogiPeople',
  description: 'Sistema independente de Recursos Humanos e Departamento Pessoal da Logi Platform.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
