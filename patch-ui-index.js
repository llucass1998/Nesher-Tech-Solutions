const fs = require('fs');
const file = 'packages/ui/src/index.tsx';
let code = fs.readFileSync(file, 'utf8');

const ticketStatusLabels = `
const ticketStatusLabels: Record<string, { label: string; tone: Tone }> = {
  OPEN: { label: 'Aberto', tone: 'red' },
  IN_PROGRESS: { label: 'Em andamento', tone: 'blue' },
  WAITING_CUSTOMER: { label: 'Aguardando cliente', tone: 'yellow' },
  WAITING_INTERNAL: { label: 'Aguardando equipe', tone: 'yellow' },
  RESOLVED: { label: 'Resolvido', tone: 'green' },
  CLOSED: { label: 'Fechado', tone: 'gray' },
  CANCELED: { label: 'Cancelado', tone: 'gray' },
};

export function TicketStatusBadge({ status, className }: { status: string; className?: string }) {
  const config = ticketStatusLabels[status] ?? { label: status, tone: 'gray' as Tone };

  return (
    <span className={joinClasses('inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium whitespace-nowrap', toneClasses[config.tone], className)}>
      {config.label}
    </span>
  );
}
`;

code = code.replace(/export function EmptyState/, ticketStatusLabels + '\nexport function EmptyState');
fs.writeFileSync(file, code);
