import './globals.css';

export const metadata = {
  title: 'LogiPayroll',
  description: 'Departamento Pessoal e folha da Logi Platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
