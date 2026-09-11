export type Priority = 'Urgente' | 'Alta' | 'Média' | 'Baixa';

export type TicketStatus =
  | 'Novo'
  | 'Em Triagem'
  | 'Em Atendimento'
  | 'Aguardando Peças'
  | 'Aguardando Cliente'
  | 'Resolvido'
  | 'Fechado';

export type ServiceType = 'Remoto' | 'Campo' | 'Laboratório';

export type MessageType = 'client' | 'support' | 'note' | 'system';

export type Message = {
  id: number;
  author: string;
  text: string;
  time: string;
  type: MessageType;
  metadata?: {
    action?: string;
    fromQueue?: string;
    toQueue?: string;
    oldStatus?: string;
    newStatus?: string;
  };
};

export type ChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type AssetInfo = {
  tag?: string; // Tombamento / Patrimônio ex: PAT-0142
  type: string;
  brand: string;
  model: string;
  serial: string;
  location?: string;
  accessories?: string;
};

export type Observer = {
  id: string;
  name: string;
  email: string;
  addedAt: string;
};

export type LinkedTicket = {
  id: string;
  code: string;
  relation: 'relacionado' | 'duplicado' | 'causa_raiz';
  subject: string;
};

export type CSATRating = {
  score: number; // 1 a 5 estrelas
  comment?: string;
  ratedAt: string;
};

export type RemoteSessionInfo = {
  tool: 'RustDesk' | 'AnyDesk' | 'TeamViewer' | 'QuickAssist';
  sessionCode: string;
  authorizedBy: string;
  authorizedAt: string;
  technician: string;
  status: 'Conectado' | 'Encerrado' | 'Aguardando Código';
  durationMinutes?: number;
  notes?: string;
};

export type FieldVisitInfo = {
  visitId: string;
  technician: string;
  scheduledDate: string;
  scheduledTime: string;
  address: string;
  status: 'Agendada' | 'A Caminho' | 'Em Atendimento' | 'Concluída';
  partsUsed?: string;
  photosBeforeAfter?: string[];
  notes?: string;
};

export type ClientConfirmation = {
  confirmedBy: string;
  confirmedAt: string;
  method: 'Digital' | 'Assinatura Presencial' | 'Portal do Cliente';
  satisfactionStars?: number;
  comments?: string;
};

export interface ServiceQueue {
  id: string;
  name: string;
  code: string;
  description: string;
  slaResponseHours: number;
  slaResolutionHours: number;
  requiresTriage: boolean;
  color: 'emerald' | 'blue' | 'purple' | 'amber' | 'orange' | 'cyan';
  manager: string;
  technicians: string[];
}

export type Ticket = {
  id: string;
  code: string;
  subject: string;
  description: string;
  company: string;
  requester: string;
  requesterEmail: string;
  requesterPhone: string;
  queueId: string;
  queueName: string;
  category: string;
  serviceType: ServiceType;
  priority: Priority;
  status: TicketStatus;
  slaRemaining: string;
  slaStatus: 'normal' | 'warning' | 'breached';
  technician: string;
  technicianInitials: string;
  asset?: AssetInfo;
  remoteSession?: RemoteSessionInfo;
  fieldVisit?: FieldVisitInfo;
  clientConfirmation?: ClientConfirmation;
  createdAt: string;
  closedAt?: string;
  reopenedAt?: string;
  reopenReason?: string;
  observers?: Observer[];
  linkedTickets?: LinkedTicket[];
  csat?: CSATRating;
  messages: Message[];
  checklist: ChecklistItem[];
  technicalReport?: {
    diagnostic: string;
    solution: string;
    recommendations: string;
  };
};
