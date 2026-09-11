'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/configuracoes');
  }, [router]);

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <p>Redirecionando para Configurações do Sistema...</p>
    </div>
  );
}
