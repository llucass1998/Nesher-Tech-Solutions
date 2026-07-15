'use client';

import { useState } from 'react';
import { StatusBadge } from '@logipeople/ui';

const API_URL = process.env.NEXT_PUBLIC_PAYROLL_API_URL ?? 'http://localhost:3733/api/v1';

export default function PayrollPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // ID de demonstracao
  const employeeId = '123e4567-e89b-12d3-a456-426614174000';

  const addLog = (message: string) => {
    setLogs((prev) => [message, ...prev].slice(0, 10));
  };

  const baterPonto = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/payroll/time-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          kind: 'CLOCK_IN',
          timestamp: new Date().toISOString(),
        }),
      });
      if (res.ok) addLog('✅ Ponto registrado com sucesso!');
      else addLog(`❌ Erro ao registrar ponto: ${await res.text()}`);
    } catch (e) {
      addLog(`❌ Falha na conexão: ${e}`);
    }
    setLoading(false);
  };

  const pedirFerias = async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 10);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 15);

      const res = await fetch(`${API_URL}/payroll/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          category: 'VACATION',
          reason: 'Férias anuais obrigatórias',
        }),
      });
      if (res.ok) {
        const leave = await res.json();
        addLog(`✅ Férias solicitadas! ID: ${leave.id}`);
        await aprovarFerias(leave.id);
      } else {
        addLog(`❌ Erro ao solicitar férias: ${await res.text()}`);
      }
    } catch (e) {
      addLog(`❌ Falha na conexão: ${e}`);
    }
    setLoading(false);
  };

  const aprovarFerias = async (id: string) => {
    try {
      addLog(`⏳ Aprovando férias ${id}...`);
      const res = await fetch(`${API_URL}/payroll/leaves/${id}/approve`, {
        method: 'PATCH',
      });
      if (res.ok) addLog(`🎉 Férias aprovadas e evento logipayroll.leave.approved despachado!`);
      else addLog(`❌ Erro ao aprovar: ${await res.text()}`);
    } catch (e) {
      addLog(`❌ Falha: ${e}`);
    }
  };

  const fecharFolha = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/payroll/runs/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceMonth: new Date().getMonth() + 1,
          referenceYear: new Date().getFullYear(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        addLog(`💰 Folha Fechada (ID: ${data.runId}) - Funcionários processados: ${data.totalEmployees}`);
        addLog(`📤 Evento EDA logipayroll.payroll.closed despachado!`);
      } else {
        addLog(`❌ Erro fechamento: ${await res.text()}`);
      }
    } catch (e) {
      addLog(`❌ Falha na conexão: ${e}`);
    }
    setLoading(false);
  };

  return (
    <main style={{ minHeight: '100vh', padding: 24 }}>
      <section style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={eyebrowStyle}>Logi Platform</p>
            <h1 style={titleStyle}>LogiPayroll RH</h1>
            <p style={mutedStyle}>
              Operações de Ponto, Férias e Folha baseadas em Eventos.
            </p>
          </div>
          <StatusBadge status="ACTIVE" className="mt-2" />
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 20, alignItems: 'start' }}>
        <section style={gridStyle}>
          <article style={cardStyle}>
            <h2 style={cardTitleStyle}>Jornada e Ponto</h2>
            <p style={mutedStyle}>Registre sua entrada diária no sistema de ponto central.</p>
            <button style={buttonStyle} onClick={baterPonto} disabled={loading}>Bater Ponto</button>
          </article>

          <article style={cardStyle}>
            <h2 style={cardTitleStyle}>Férias</h2>
            <p style={mutedStyle}>Solicite um período de afastamento e inicie o fluxo de aprovação RH.</p>
            <button style={buttonStyle} onClick={pedirFerias} disabled={loading}>Solicitar Férias</button>
          </article>

          <article style={cardStyle}>
            <h2 style={cardTitleStyle}>Folha de Pagamento</h2>
            <p style={mutedStyle}>Simule o fechamento do mês, consolidação e geração de Holerites.</p>
            <button style={buttonStyle} onClick={fecharFolha} disabled={loading}>Fechar Folha</button>
          </article>
        </section>

        <aside style={panelStyle}>
          <h3 style={cardTitleStyle}>Terminal de Eventos</h3>
          <p style={{ ...mutedStyle, marginBottom: 12 }}>Ações realizadas e eventos despachados.</p>
          {logs.map((l, i) => (
            <div key={i} style={logStyle}>{l}</div>
          ))}
          {logs.length === 0 && <div style={logStyle}>Nenhuma ação realizada...</div>}
        </aside>
      </div>
    </main>
  );
}

const panelStyle = { border: '1px solid var(--payroll-border)', borderRadius: 8, background: 'var(--payroll-surface)', padding: 24, marginBottom: 20 };
const eyebrowStyle = { margin: 0, color: 'var(--payroll-brand)', fontSize: 13, fontWeight: 800, textTransform: 'uppercase' as const };
const titleStyle = { margin: '8px 0 0', fontSize: 32 };
const mutedStyle = { margin: '8px 0 0', color: 'var(--payroll-muted)', fontSize: 14, lineHeight: 1.6 };
const gridStyle = { display: 'grid', gap: 14 };
const cardStyle = { border: '1px solid var(--payroll-border)', borderRadius: 8, background: 'var(--payroll-surface)', padding: 18 };
const cardTitleStyle = { margin: 0, fontSize: 18, marginBottom: 8 };
const logStyle = { padding: 8, background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: 4, fontSize: 12, marginBottom: 6, fontFamily: 'monospace', color: '#343a40' };
const buttonStyle = {
  marginTop: 14,
  background: 'var(--payroll-brand)',
  color: 'white',
  border: 'none',
  padding: '8px 16px',
  borderRadius: 6,
  fontWeight: 'bold',
  cursor: 'pointer',
};