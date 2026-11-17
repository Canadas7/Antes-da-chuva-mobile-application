import AsyncStorage from '@react-native-async-storage/async-storage';
import { categories, statuses, type IncidentStatus, type Incident, type IncidentInput, type Session } from '../types/incident';

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
  return { id: item.id as string, title: item.title as string, description: (item.description as string).replace(/^Exemplo demonstrativo: /, ''), category: item.category as Incident['category'], address: address as string, neighborhood: neighborhood as string, status: status as IncidentStatus, createdAt: item.createdAt as string };
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
  if (input.title.trim().length < 3 || input.address.trim().length < 5 || input.neighborhood.trim().length < 2 || input.description.trim().length < 10 || !categories.includes(input.category)) throw new Error('Preencha os campos corretamente.');
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
  const session = await getSession();
  if (session?.role !== 'GESTOR') throw new Error('Acesso restrito ao gestor.');
  if (!statuses.includes(status)) throw new Error('Status inválido.');
  const items = await getIncidents();
  const index = items.findIndex(item => item.id === id);
  if (index === -1) throw new Error('Ocorrência não encontrada.');
  const updated = { ...items[index], status };
  items[index] = updated;
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
  return updated;
}
