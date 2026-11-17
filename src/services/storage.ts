import AsyncStorage from '@react-native-async-storage/async-storage';
import { categories, priorities, statuses, type ManagementInput, type IncidentUpdate, type IncidentStatus, type Incident, type IncidentInput, type Session } from '../types/incident';

const KEY = '@antes-da-chuva/incidents:v1';
const SESSION_KEY = '@antes-da-chuva/session:v1';
const TEST_EMAIL = 'teste@antesdachuva.com';
const MANAGER_EMAIL = 'gestor@antesdachuva.com';
function normalize(value: unknown): Incident {
  if (!value || typeof value !== 'object') throw new Error('Registro inválido.');
  const item = value as Record<string, unknown>;
  // Preserve records created by the first prototype without erasing local data.
  const address = item.address ?? item.location;
  const neighborhood = item.neighborhood ?? 'Não informado';
  const status = item.status ?? 'ABERTA';
  if (![item.id, item.title, item.description, address, neighborhood, item.createdAt].every(v => typeof v === 'string' && v.trim())
    || !categories.includes(item.category as Incident['category']) || !statuses.includes(status as IncidentStatus) || Number.isNaN(Date.parse(item.createdAt as string))) throw new Error('Registro inválido.');
  const updates = item.updates ?? [];
  if (!Array.isArray(updates) || !updates.every((entry: IncidentUpdate) => entry && typeof entry.id === 'string' && typeof entry.note === 'string' && typeof entry.createdAt === 'string' && !Number.isNaN(Date.parse(entry.createdAt)) && statuses.includes(entry.status) && (entry.priority === undefined || priorities.includes(entry.priority)))) throw new Error('Histórico inválido.');
  if (item.priority !== undefined && !priorities.includes(item.priority as NonNullable<ManagementInput['priority']>)) throw new Error('Prioridade inválida.');
  return { priority: item.priority as ManagementInput['priority'] | undefined, updates, id: item.id as string, title: item.title as string, description: (item.description as string).replace(/^Exemplo demonstrativo: /, ''), category: item.category as Incident['category'], address: address as string, neighborhood: neighborhood as string, status: status as IncidentStatus, createdAt: item.createdAt as string };
}
export async function initializeIncidents(): Promise<Incident[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (raw === null) {
    const samples: Incident[] = [
      { id: 'example-1', title: 'Bueiro com acúmulo de folhas', description: 'Folhas impedem o escoamento de água na esquina.', address: 'Rua das Flores, 120', neighborhood: 'Centro', category: 'Bueiro obstruído', status: 'ABERTA', createdAt: new Date().toISOString() },
      { id: 'example-2', title: 'Entulho próximo ao córrego', description: 'Resíduos de obra acumulados na margem do córrego.', address: 'Rua do Lago, 45', neighborhood: 'Jardim das Águas', category: 'Entulho', status: 'ABERTA', createdAt: new Date().toISOString() },
    ];
    await AsyncStorage.setItem(KEY, JSON.stringify(samples));
    return samples;
  }
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Dados locais inválidos.');
  return parsed.map(normalize);
}
export async function getIncidents() { return initializeIncidents(); }
export async function getIncidentById(id: string) { return (await getIncidents()).find(item => item.id === id); }
export async function saveIncident(input: IncidentInput): Promise<Incident> {
  if ((await getSession())?.role !== 'CIDADAO') throw new Error('Cadastro disponível ao cidadão.');
  validateInput(input);
  const item: Incident = { ...input, title: input.title.trim(), address: input.address.trim(), neighborhood: input.neighborhood.trim(), description: input.description.trim(), id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`, status: 'ABERTA', createdAt: new Date().toISOString() };
  const items = await getIncidents();
  await AsyncStorage.setItem(KEY, JSON.stringify([item, ...items]));
  return item;
}
export async function saveSession(session: Session) {
  if (![TEST_EMAIL, MANAGER_EMAIL].includes(session.email) || session.role !== (session.email === MANAGER_EMAIL ? 'GESTOR' : 'CIDADAO')) throw new Error('Sessão inválida.');
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
export async function getSession(): Promise<Session | null> {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try { const session = JSON.parse(raw); return [TEST_EMAIL, MANAGER_EMAIL].includes(session?.email) ? { email: session.email, role: session.email === MANAGER_EMAIL ? 'GESTOR' : 'CIDADAO' } : null; }
  catch { return null; }
}
export async function clearSession() { await AsyncStorage.removeItem(SESSION_KEY); }

export async function updateIncidentStatus(id: string, status: IncidentStatus): Promise<Incident> {
  const item = await getIncidentById(id);
  return manageIncident(id, { status, priority: item?.priority ?? 'MEDIA', note: 'Status atualizado pelo gestor.' });
}
export async function manageIncident(id: string, input: ManagementInput): Promise<Incident> {
  if ((await getSession())?.role !== 'GESTOR') throw new Error('Acesso restrito ao gestor.');
  const { status, priority } = input;
  const note = input.note?.trim() ?? '';
  if (!statuses.includes(status) || (priority !== undefined && !priorities.includes(priority))) {
    throw new Error('Selecione um status e uma prioridade válidos.');
  }
  const items = await getIncidents();
  const index = items.findIndex(item => item.id === id);
  if (index === -1) throw new Error('Ocorrência não encontrada.');
  const current = items[index];
  if (status === current.status && priority === current.priority && !note) {
    return current;
  }
  const update: IncidentUpdate = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    status,
    priority,
    note,
    createdAt: new Date().toISOString(),
  };
  const updated: Incident = { ...current, status, priority, updates: [update, ...(current.updates ?? [])] };
  items[index] = updated;
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
  return updated;
}

function validateInput(input: IncidentInput) {
  if (input.title.trim().length < 3 || input.title.trim().length > 80 || input.address.trim().length < 5 || input.address.trim().length > 180 || input.neighborhood.trim().length < 2 || input.neighborhood.trim().length > 100 || input.description.trim().length < 10 || input.description.trim().length > 1500 || !categories.includes(input.category)) throw new Error('Preencha os campos corretamente.');
}
export async function updateIncident(id: string, input: IncidentInput): Promise<Incident> {
  if ((await getSession())?.role !== 'CIDADAO') throw new Error('O gestor não altera os dados do relato.');
  validateInput(input);
  const items = await getIncidents();
  const index = items.findIndex(item => item.id === id);
  if (index === -1) throw new Error('Ocorrência não encontrada.');
  const updated: Incident = { ...items[index], title: input.title.trim(), address: input.address.trim(), neighborhood: input.neighborhood.trim(), description: input.description.trim(), category: input.category };
  items[index] = updated;
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
  return updated;
}
export async function deleteIncident(id: string): Promise<void> {
  if ((await getSession())?.role !== 'CIDADAO') throw new Error('O gestor não exclui relatos.');
  const items = await getIncidents();
  if (!items.some(item => item.id === id)) throw new Error('Ocorrência não encontrada.');
  await AsyncStorage.setItem(KEY, JSON.stringify(items.filter(item => item.id !== id)));
}
