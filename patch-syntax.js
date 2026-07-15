const fs = require('fs');
const file = 'apps/logidesk-web/app/tickets/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// Fix the syntax error around return <KanbanBoard ... />
const badSyntax = `  if (searchParams.view === 'kanban') {
    return <KanbanBoard initialTickets={tickets} />
      {result.error && <StateCard title="API indisponivel" message={result.error} />};
  }`;

const fixedSyntax = `  if (searchParams.view === 'kanban') {
    return (
      <div style={{ display: 'grid', gap: 20 }}>
        <section style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={titleStyle}>Kanban</h2>
              <p style={mutedStyle}>Chamados por status com contexto de prioridade e origem.</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/tickets?view=list" style={buttonStyle(false)}>Lista</Link>
              <Link href="/tickets?view=kanban" style={buttonStyle(true)}>Kanban</Link>
            </div>
          </div>
          <form action="/tickets" method="GET" style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <input type="hidden" name="view" value="kanban" />
            <input type="text" name="search" placeholder="Buscar chamado..." defaultValue={searchParams.search} style={inputStyle} />
            <select name="status" defaultValue={searchParams.status} style={inputStyle}>
              <option value="">Todos os status</option>
              <option value="OPEN">Aberto</option>
              <option value="IN_PROGRESS">Em andamento</option>
              <option value="WAITING_CUSTOMER">Aguardando cliente</option>
              <option value="WAITING_INTERNAL">Aguardando equipe</option>
              <option value="RESOLVED">Resolvido</option>
              <option value="CLOSED">Fechado</option>
              <option value="CANCELED">Cancelado</option>
            </select>
            <select name="priority" defaultValue={searchParams.priority} style={inputStyle}>
              <option value="">Qualquer prioridade</option>
              <option value="LOW">Baixa</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
            </select>
            <button type="submit" style={submitStyle}>Filtrar</button>
          </form>
        </section>
        {result.error && <StateCard title="API indisponivel" message={result.error} />}
        <KanbanBoard initialTickets={tickets} />
      </div>
    );
  }`;

code = code.replace(badSyntax, fixedSyntax);

fs.writeFileSync(file, code);
