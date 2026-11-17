export const priorities = ['ALTA', 'MEDIA', 'BAIXA'] as const;
export type IncidentPriority = typeof priorities[number];
export const priorityLabels: Record<IncidentPriority, string> = { ALTA: 'Alta', MEDIA: 'Média', BAIXA: 'Baixa' };
export interface IncidentUpdate { id: string; status: IncidentStatus; priority?: IncidentPriority; note: string; createdAt: string }
export interface ManagementInput { status: IncidentStatus; priority?: IncidentPriority; note?: string }
export const statuses = ['ABERTA', 'EM_ANALISE', 'EM_ANDAMENTO', 'RESOLVIDA'] as const;
export type IncidentStatus = typeof statuses[number];
export const statusLabels: Record<IncidentStatus, string> = { ABERTA: 'Aberta', EM_ANALISE: 'Em análise', EM_ANDAMENTO: 'Em andamento', RESOLVIDA: 'Resolvida' };
export const categories = ['Alagamento', 'Bueiro obstruído', 'Entulho', 'Córrego com problema', 'Deslizamento', 'Outro'] as const;
export interface Incident {
  id: string;
  title: string;
  description: string;
  category: typeof categories[number];
  address: string;
  neighborhood: string;
  status: IncidentStatus;
  priority?: IncidentPriority;
  updates?: IncidentUpdate[];
  createdAt: string;
}
export type IncidentInput = Omit<Incident, 'id' | 'createdAt' | 'status' | 'priority' | 'updates'>;
export type Role = 'CIDADAO' | 'GESTOR';
export interface Session { email: string; role: Role }
