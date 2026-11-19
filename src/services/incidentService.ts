import { allPages, api } from './api';
import { statusFromApi, urgencyFromApi, type Category, type IncidentResponse, type UpdateResponse } from '../types/backend';
import type { Incident, Role } from '../types/incident';
export const getCategories = () => allPages<Category>('/categories');
function mapIncident(item: IncidentResponse, categories: Category[]): Incident {
  return { ...item, id: String(item.id), category: categories.find(category => category.id === item.categoryId)?.name ?? `Categoria ${item.categoryId}`, status: statusFromApi[item.status], priority: item.urgency ? urgencyFromApi[item.urgency] : undefined };
}
export async function getIncidents(role: Role, categories: Category[]) {
  return (await allPages<IncidentResponse>(role === 'CIDADAO' ? '/incidents/mine' : '/incidents')).map(item => mapIncident(item, categories));
}
export async function getIncidentById(id: string, categories: Category[]) {
  const item = await api<IncidentResponse>(`/incidents/${encodeURIComponent(id)}`);
  const updates = await api<UpdateResponse[]>(`/incidents/${encodeURIComponent(id)}/updates`);
  return { ...mapIncident(item, categories), updates: updates.map(update => ({ ...update, id: String(update.id), status: statusFromApi[update.newStatus] })) };
}
