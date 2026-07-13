import type { ReactNode } from 'react';

type Tone = 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';

const toneClasses: Record<Tone, string> = {
  gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  green: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  red: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
};

const deliveryStatusLabels: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: 'Pendente', tone: 'yellow' },
  ASSIGNED: { label: 'Atribuida', tone: 'blue' },
  ACCEPTED: { label: 'Aceita', tone: 'blue' },
  IN_TRANSIT: { label: 'Em transito', tone: 'blue' },
  ARRIVED: { label: 'No destino', tone: 'purple' },
  DELIVERED: { label: 'Entregue', tone: 'green' },
  FAILED: { label: 'Falhou', tone: 'red' },
  CANCELED: { label: 'Cancelada', tone: 'gray' },
};

const priorityLabels: Record<string, { label: string; tone: Tone }> = {
  LOW: { label: 'Baixa', tone: 'gray' },
  MEDIUM: { label: 'Media', tone: 'blue' },
  HIGH: { label: 'Alta', tone: 'yellow' },
  CRITICAL: { label: 'Critica', tone: 'red' },
};

function joinClasses(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(' ');
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = deliveryStatusLabels[status] ?? { label: status, tone: 'gray' as Tone };

  return (
    <span className={joinClasses('inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium whitespace-nowrap', toneClasses[config.tone], className)}>
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  const config = priorityLabels[priority] ?? { label: priority, tone: 'gray' as Tone };

  return (
    <span className={joinClasses('inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium whitespace-nowrap', toneClasses[config.tone], className)}>
      {config.label}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  icon = 'ti-inbox',
}: {
  title: string;
  description?: string;
  icon?: string;
}) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center px-6 py-8 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        <i className={`ti ${icon} text-xl`} />
      </div>
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">{description}</p>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
      {message}
    </div>
  );
}

export function LoadingSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-10 animate-pulse rounded-md bg-gray-100 dark:bg-gray-800" />
      ))}
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  total,
  onPrevious,
  onNext,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 text-sm text-gray-600 dark:text-gray-400 sm:flex-row sm:items-center sm:justify-between">
      <span>
        {total} registro{total === 1 ? '' : 's'} encontrado{total === 1 ? '' : 's'}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={onPrevious}
          className="h-[34px] rounded-md border border-gray-300 px-3 disabled:opacity-50 dark:border-gray-600"
        >
          Anterior
        </button>
        <span>Pagina {page} de {totalPages}</span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={onNext}
          className="h-[34px] rounded-md border border-gray-300 px-3 disabled:opacity-50 dark:border-gray-600"
        >
          Proxima
        </button>
      </div>
    </div>
  );
}

export function ToolbarButton({
  children,
  onClick,
  disabled,
  variant = 'secondary',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const variants: Record<typeof variant, string> = {
    primary: 'border-[#185FA5] bg-[#185FA5] text-white hover:bg-[#0C447C]',
    secondary: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100',
    danger: 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800/50 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={joinClasses('h-[40px] rounded-md border px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60', variants[variant])}
    >
      {children}
    </button>
  );
}
