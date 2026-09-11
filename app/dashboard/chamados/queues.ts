import { ServiceQueue, Message } from './types';

export const serviceQueues: ServiceQueue[] = [
  {
    id: 'queue-n1',
    name: 'N1 - Suporte Ágil & Service Desk',
    code: 'N1-DESK',
    description: 'Atendimento de primeiro nível para dúvidas, acessos, permissões e apoio imediato ao usuário.',
    slaResponseHours: 1,
    slaResolutionHours: 8,
    requiresTriage: false,
    color: 'emerald',
    manager: 'Rafael Lima',
    technicians: ['Rafael Lima', 'Lucas Silva', 'Mariana Costa'],
  },
  {
    id: 'queue-n2-net',
    name: 'N2 - Infraestrutura & Redes',
    code: 'N2-NET',
    description: 'Roteadores, switches, links dedicados, VPN, firewall, DNS e cabeamento estruturado.',
    slaResponseHours: 2,
    slaResolutionHours: 12,
    requiresTriage: true,
    color: 'blue',
    manager: 'Carlos Eduardo',
    technicians: ['Carlos Eduardo', 'André Santos', 'Felipe Castro'],
  },
  {
    id: 'queue-n2-srv',
    name: 'N2 - Servidores & Nuvem',
    code: 'N2-SRV',
    description: 'Ambientes virtualizados, Proxmox, AWS, Azure, Active Directory, storage e rotinas de backup.',
    slaResponseHours: 2,
    slaResolutionHours: 16,
    requiresTriage: true,
    color: 'purple',
    manager: 'Carlos Eduardo',
    technicians: ['Carlos Eduardo', 'Mateus Rocha'],
  },
  {
    id: 'queue-lab',
    name: 'Laboratório & Manutenção de Hardware',
    code: 'LAB-HW',
    description: 'Bancada técnica especializada para reparos físicos, troca de componentes, placas e testes sob carga.',
    slaResponseHours: 4,
    slaResolutionHours: 48,
    requiresTriage: true,
    color: 'amber',
    manager: 'Rodrigo Alves',
    technicians: ['Rodrigo Alves', 'Diego Ferreira'],
  },
  {
    id: 'queue-field',
    name: 'Atendimento de Campo (On-Site)',
    code: 'FIELD-NOC',
    description: 'Visitas presenciais para implantação, entrega de equipamentos e suporte físico direto nas unidades.',
    slaResponseHours: 4,
    slaResolutionHours: 24,
    requiresTriage: true,
    color: 'orange',
    manager: 'Rafael Lima',
    technicians: ['Lucas Silva', 'Mariana Costa', 'Diego Ferreira'],
  },
];

export function getQueueById(id?: string): ServiceQueue {
  return (
    serviceQueues.find((q) => q.id === id) || serviceQueues[0]
  );
}

export function createSystemLog(
  author: string,
  actionText: string,
  metadata?: Message['metadata']
): Message {
  const now = new Date();
  const timeFormatted = now.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    author: author || 'Sistema LogiFlow',
    text: actionText,
    time: `Hoje às ${timeFormatted}`,
    type: 'system',
    metadata,
  };
}
