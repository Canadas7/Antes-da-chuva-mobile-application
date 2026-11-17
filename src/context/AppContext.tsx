import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { getIncidents, updateIncident, deleteIncident, updateIncidentStatus, saveIncident, saveSession, getSession, clearSession } from '../services/storage';
import type { Incident, IncidentInput, IncidentStatus, Role } from '../types/incident';

type AppState = {
  role: Role | null; updateStatus: (id: string, status: IncidentStatus) => Promise<void>; signedIn: boolean; incidents: Incident[]; loading: boolean; error: string;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>; sessionLoading: boolean; reload: () => Promise<void>;
  editIncident: (id: string, input: IncidentInput) => Promise<void>;
  removeIncident: (id: string) => Promise<void>;
  addIncident: (input: IncidentInput) => Promise<string>;
};
const Context = createContext<AppState | null>(null);
export function AppProvider({ children }: PropsWithChildren) {
  const [role, setRole] = useState<Role | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const saving = useRef(false);
  async function reload() {
    setLoading(true); setError('');
    try { setIncidents(await getIncidents()); }
    catch { setError('Não foi possível ler os registros. Tente novamente. Os dados existentes foram preservados.'); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    let active = true;
    getIncidents().then(items => { if (active) setIncidents(items); })
      .catch(() => { if (active) setError('Não foi possível ler os registros. Tente novamente. Os dados existentes foram preservados.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    getSession().then(session => { if (active) { setSignedIn(!!session); setRole(session?.role ?? null); } })
      .catch(() => { if (active) setSignedIn(false); })
      .finally(() => { if (active) setSessionLoading(false); });
    return () => { active = false; };
  }, []);
  async function login(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    if (!['teste@antesdachuva.com', 'gestor@antesdachuva.com'].includes(normalized) || password !== '123456') return false;
    const nextRole: Role = normalized === 'gestor@antesdachuva.com' ? 'GESTOR' : 'CIDADAO';
    await saveSession({ email: normalized, role: nextRole });
    setRole(nextRole);
    setSignedIn(true); return true;
  }
  async function logout() { await clearSession(); setSignedIn(false); setRole(null); }
  async function addIncident(input: IncidentInput) {
    if (!signedIn || loading || error || saving.current) throw new Error('Cadastro indisponível.');
    saving.current = true;
    try {
      const item = await saveIncident(input);
      setIncidents(previous => [item, ...previous]);
      return item.id;
    } finally { saving.current = false; }
  }
  async function updateStatus(id: string, status: IncidentStatus) {
    if (role !== 'GESTOR' || saving.current || loading || error) throw new Error('Atualização indisponível.');
    saving.current = true;
    try {
      const updated = await updateIncidentStatus(id, status);
      setIncidents(previous => previous.map(item => item.id === id ? updated : item));
    } finally { saving.current = false; }
  }
  async function editIncident(id: string, input: IncidentInput) {
    if (!signedIn || saving.current || loading || error) throw new Error('Edição indisponível.');
    saving.current = true;
    try {
      const updated = await updateIncident(id, input);
      setIncidents(previous => previous.map(item => item.id === id ? updated : item));
    } finally { saving.current = false; }
  }
  async function removeIncident(id: string) {
    if (!signedIn || saving.current || loading || error) throw new Error('Exclusão indisponível.');
    saving.current = true;
    try {
      await deleteIncident(id);
      setIncidents(previous => previous.filter(item => item.id !== id));
    } finally { saving.current = false; }
  }
  return <Context.Provider value={{ editIncident, removeIncident, role, updateStatus, signedIn, incidents, loading, error, login, logout, sessionLoading, reload, addIncident }}>{children}</Context.Provider>;
}
export function useApp() {
  const context = useContext(Context);
  if (!context) throw new Error('AppProvider ausente.');
  return context;
}
