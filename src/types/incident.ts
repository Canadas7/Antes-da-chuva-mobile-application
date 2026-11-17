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
  createdAt: string;
}
export type IncidentInput = Omit<Incident, 'id' | 'createdAt' | 'status'>;
export type Role = 'CIDADAO' | 'GESTOR';
export interface Session { email: string; role: Role }
