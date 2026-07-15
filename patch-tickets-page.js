const fs = require('fs');
const file = 'apps/logidesk-web/app/tickets/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace the Kanban component with KanbanBoard
code = code.replace(/function Kanban\(\{[\s\S]*?\}\) \{[\s\S]*?\n\}/, '');

// Import KanbanBoard
const importReplacement = `import Link from 'next/link';
import { fetchLogiDesk, TicketSummary } from '@/src/lib/api';
import { KanbanBoard } from '@/src/components/KanbanBoard';
import { TicketStatusBadge, PriorityBadge } from '@logipeople/ui';`;
code = code.replace(/import Link from 'next\/link';\nimport \{ fetchLogiDesk, TicketSummary \} from '@\/src\/lib\/api';/, importReplacement);

// Use KanbanBoard instead of Kanban
code = code.replace(/<Kanban tickets=\{tickets\} \{\.\.\.\(result\.error \? \{ error: result\.error \} : \{\}\)\} \/>/, 
  `<KanbanBoard initialTickets={tickets} />\n      {result.error && <StateCard title="API indisponivel" message={result.error} />}`);

// Update the list view rendering to use TicketStatusBadge
code = code.replace(/<Badge value=\{ticket\.status\} \/>/g, '<TicketStatusBadge status={ticket.status} />');
code = code.replace(/<Badge value=\{ticket\.priority\} \/>/g, '<PriorityBadge priority={ticket.priority} />');

// Remove the local Badge component
code = code.replace(/function Badge\(\{[\s\S]*?\n\}/, '');

// Add Filters Form to the page
const filtersReplacement = `
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={titleStyle}>Chamados</h2>
            <p style={mutedStyle}>Busca, filtros e leitura operacional dos tickets.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/tickets?view=list" style={buttonStyle(searchParams.view !== 'kanban')}>Lista</Link>
            <Link href="/tickets?view=kanban" style={buttonStyle(searchParams.view === 'kanban')}>Kanban</Link>
          </div>
        </div>
        
        <form action="/tickets" method="GET" style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          {searchParams.view === 'kanban' && <input type="hidden" name="view" value="kanban" />}
          <input 
            type="text" 
            name="search" 
            placeholder="Buscar chamado..." 
            defaultValue={searchParams.search}
            style={inputStyle}
          />
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
`;

code = code.replace(/return \([\s\S]*?<section style=\{panelStyle\}>[\s\S]*?<p style=\{mutedStyle\}>Busca, filtros e leitura operacional dos tickets\.<\/p>[\s\S]*?<\/section>/, filtersReplacement);

const extraStyles = `
const inputStyle = {
  border: '1px solid var(--desk-border)',
  borderRadius: 6,
  padding: '8px 12px',
  fontSize: 14,
  outline: 'none',
  minWidth: 150
};
const submitStyle = {
  background: 'var(--desk-brand)',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  padding: '8px 16px',
  fontWeight: 600,
  cursor: 'pointer'
};
const buttonStyle = (active: boolean) => ({
  background: active ? 'var(--desk-brand)' : 'var(--desk-surface-muted)',
  color: active ? 'white' : 'var(--desk-muted)',
  padding: '6px 12px',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  textDecoration: 'none'
});
`;

code = code.replace(/const panelStyle = \{/, extraStyles + '\nconst panelStyle = {');

fs.writeFileSync(file, code);
