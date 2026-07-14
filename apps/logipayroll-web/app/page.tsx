const modules = [
  'Contratos',
  'Jornada e ponto',
  'Ferias',
  'Beneficios',
  'Folha',
  'Holerites',
  'eSocial',
  'Desligamentos',
];

export default function PayrollPage() {
  return (
    <main style={{ minHeight: '100vh', padding: 24 }}>
      <section style={panelStyle}>
        <p style={eyebrowStyle}>Logi Platform</p>
        <h1 style={titleStyle}>LogiPayroll</h1>
        <p style={mutedStyle}>
          Fundacao separada para Departamento Pessoal e folha, mantendo dados restritos fora do LogiPeople.
        </p>
      </section>
      <section style={gridStyle}>
        {modules.map((module) => (
          <article key={module} style={cardStyle}>
            <h2 style={cardTitleStyle}>{module}</h2>
            <p style={mutedStyle}>Fronteira pronta para evolucao incremental com contratos e eventos versionados.</p>
          </article>
        ))}
      </section>
    </main>
  );
}

const panelStyle = { border: '1px solid var(--payroll-border)', borderRadius: 8, background: 'var(--payroll-surface)', padding: 24, marginBottom: 20 };
const eyebrowStyle = { margin: 0, color: 'var(--payroll-brand)', fontSize: 13, fontWeight: 800, textTransform: 'uppercase' as const };
const titleStyle = { margin: '8px 0 0', fontSize: 32 };
const mutedStyle = { margin: '8px 0 0', color: 'var(--payroll-muted)', fontSize: 14, lineHeight: 1.6 };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 };
const cardStyle = { border: '1px solid var(--payroll-border)', borderRadius: 8, background: 'var(--payroll-surface)', padding: 18 };
const cardTitleStyle = { margin: 0, fontSize: 18 };
