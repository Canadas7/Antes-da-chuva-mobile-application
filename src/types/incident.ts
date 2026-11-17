export const categories = ['Alagamento', 'Bueiro obstruído', 'Entulho', 'Córrego com problema', 'Deslizamento', 'Outro'] as const;
export interface Incident {
  id: string;
  title: string;
  description: string;
  category: typeof categories[number];
  address: string;
  neighborhood: string;
  status: 'ABERTA';
  createdAt: string;
}
export type IncidentInput = Omit<Incident, 'id' | 'createdAt' | 'status'>;
export interface Session { email: string }
