'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function IndicadoresPage() {
  const [activeRange, setActiveRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [approvedCompanies, setApprovedCompanies] = useState<any[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('nesher_companies');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setApprovedCompanies(
            parsed.filter((c: any) => c.status === 'Aprovada' && !c.id?.startsWith('comp-'))
          );
        }
      }
    } catch {}
  }, []);

  return (
    <div className="nesher-dashboard">
      <div className="nesher-welcome-row">
        <div>
          <p className="nesher-eyebrow">INTELIGÊNCIA &amp; DESEMPENHO OPERACIONAL</p>
          <h1>Indicadores de SLA &amp; Atendimento</h1>
          <p className="nesher-welcome-copy">
            Métricas consolidadas de tempo de resposta, resolução em 1º contato (FCR) e conformidade contratual.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '8px', padding: '3px' }}>
            <button
              type="button"
              className={'nesher-select ' + (activeRange === '7d' ? 'is-active' : '')}
              style={{
                border: 'none',
                background: activeRange === '7d' ? '#fff' : 'transparent',
                fontWeight: 700,
                padding: '6px 12px',
              }}
              onClick={() => setActiveRange('7d')}
            >
              7 dias
            </button>
            <button
              type="button"
              className={'nesher-select ' + (activeRange === '30d' ? 'is-active' : '')}
              style={{
                border: 'none',
                background: activeRange === '30d' ? '#fff' : 'transparent',
                fontWeight: 700,
                padding: '6px 12px',
              }}
              onClick={() => setActiveRange('30d')}
            >
              30 dias
            </button>
            <button
              type="button"
              className={'nesher-select ' + (activeRange === '90d' ? 'is-active' : '')}
              style={{
                border: 'none',
                background: activeRange === '90d' ? '#fff' : 'transparent',
                fontWeight: 700,
                padding: '6px 12px',
              }}
              onClick={() => setActiveRange('90d')}
            >
              Trimestre
            </button>
          </div>

          <Link href="/dashboard/chamados" className="nesher-primary-button">
            <i className="ti ti-arrow-up-right" /> Central de Chamados
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="nesher-metric-grid">
        <div className="nesher-metric-card">
          <div className="nesher-metric-icon green">
            <i className="ti ti-shield-check" />
          </div>
          <div className="nesher-metric-main">
            <span>CONFORMIDADE SLA GLOBAL</span>
            <strong>98.6%</strong>
            <small>
              <b>+1.2%</b> vs. mês anterior
            </small>
          </div>
        </div>

        <div className="nesher-metric-card">
          <div className="nesher-metric-icon blue">
            <i className="ti ti-clock-bolt" />
          </div>
          <div className="nesher-metric-main">
            <span>TEMPO MÉDIO DE 1ª RESPOSTA</span>
            <strong>18 min</strong>
            <small>Meta contratual: 1 hora</small>
          </div>
        </div>

        <div className="nesher-metric-card">
          <div className="nesher-metric-icon orange">
            <i className="ti ti-hourglass-low" />
          </div>
          <div className="nesher-metric-main">
            <span>TEMPO MÉDIO DE SOLUÇÃO (MTTR)</span>
            <strong>3h 45m</strong>
            <small>Meta média: 8 horas</small>
          </div>
        </div>

        <div className="nesher-metric-card">
          <div className="nesher-metric-icon purple">
            <i className="ti ti-star" />
          </div>
          <div className="nesher-metric-main">
            <span>SATISFAÇÃO DOS CLIENTES (CSAT)</span>
            <strong>4.9 / 5.0</strong>
            <small>96% de avaliações 5 estrelas</small>
          </div>
        </div>
      </div>

      {/* Charts & Breakdown */}
      <div className="nesher-dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="nesher-panel">
          <div className="nesher-panel-header">
            <div>
              <h2>Distribuição de Chamados por Categoria</h2>
              <p>Ocorrências mais frequentes tratadas pela equipe técnica</p>
            </div>
            <i className="ti ti-chart-bar" style={{ color: '#0b68d1', fontSize: '18px' }} />
          </div>

          <div style={{ padding: '16px 22px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                  <span style={{ fontWeight: 600 }}>Redes, Roteadores &amp; Wi-Fi</span>
                  <strong>38% (42 chamados)</strong>
                </div>
                <div style={{ height: '8px', background: '#edf2f7', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '38%', height: '100%', background: '#0b68d1' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                  <span style={{ fontWeight: 600 }}>Hardware &amp; Estações de Trabalho</span>
                  <strong>27% (30 chamados)</strong>
                </div>
                <div style={{ height: '8px', background: '#edf2f7', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '27%', height: '100%', background: '#0d9488' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                  <span style={{ fontWeight: 600 }}>Software &amp; Sistemas Operacionais</span>
                  <strong>19% (21 chamados)</strong>
                </div>
                <div style={{ height: '8px', background: '#edf2f7', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '19%', height: '100%', background: '#7c3aed' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                  <span style={{ fontWeight: 600 }}>CFTV, Câmeras &amp; Segurança</span>
                  <strong>11% (12 chamados)</strong>
                </div>
                <div style={{ height: '8px', background: '#edf2f7', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '11%', height: '100%', background: '#f59e0b' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '5px' }}>
                  <span style={{ fontWeight: 600 }}>Acessos &amp; Redefinição de Senhas</span>
                  <strong>5% (6 chamados)</strong>
                </div>
                <div style={{ height: '8px', background: '#edf2f7', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: '5%', height: '100%', background: '#10b981' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="nesher-panel">
          <div className="nesher-panel-header">
            <div>
              <h2>Eficiência por Técnico / Analista</h2>
              <p>Desempenho individual em resolução e cumprimento de prazo</p>
            </div>
            <i className="ti ti-users" style={{ color: '#0b68d1', fontSize: '18px' }} />
          </div>

          <div style={{ padding: '10px 22px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #edf2f7' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dbeafe', color: '#1d4ed8', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '11px' }}>
                    TL
                  </span>
                  <div>
                    <strong style={{ fontSize: '12px', display: 'block' }}>Técnico Líder N3</strong>
                    <small style={{ color: '#64748b' }}>NOC &amp; Infraestrutura</small>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a' }}>99.2% SLA</span>
                  <small style={{ display: 'block', color: '#64748b' }}>48 atendimentos</small>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #edf2f7' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#b45309', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '11px' }}>
                    TC
                  </span>
                  <div>
                    <strong style={{ fontSize: '12px', display: 'block' }}>Técnico de Campo N2</strong>
                    <small style={{ color: '#64748b' }}>Visitas &amp; Cabeamento</small>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a' }}>98.0% SLA</span>
                  <small style={{ display: 'block', color: '#64748b' }}>34 atendimentos</small>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ede9fe', color: '#6d28d9', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '11px' }}>
                    TS
                  </span>
                  <div>
                    <strong style={{ fontSize: '12px', display: 'block' }}>Analista de Suporte N1</strong>
                    <small style={{ color: '#64748b' }}>Helpdesk &amp; Remoto</small>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a' }}>97.8% SLA</span>
                  <small style={{ display: 'block', color: '#64748b' }}>52 atendimentos</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
