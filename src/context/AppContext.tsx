import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { getIncidents, updateIncident, deleteIncident, manageIncident, saveIncident } from '../services/storage';
import { authService } from '../services/authService';
import { configureSession } from '../services/api';
import type { AuthSession, RegisterInput } from '../types/auth';
import type { Incident, IncidentInput, ManagementInput, Role } from '../types/incident';

type AppState = {
  session: AuthSession | null; register: (input: RegisterInput) => Promise<void>;
  role: Role | null; updateStatus: (id: string, input: ManagementInput) => Promise<void>; signedIn: boolean; incidents: Incident[]; loading: boolean; error: string;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>; sessionLoading: boolean; reload: () => Promise<void>;
  editIncident: (id: string, input: IncidentInput) => Promise<void>;
  removeIncident: (id: string) => Promise<void>;
  addIncident: (input: IncidentInput) => Promise<string>;
};
const Context = createContext<AppState | null>(null);
export function AppProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
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
    authService.restore().then(value => { if (active) { setSession(value); setSignedIn(!!value); setRole(value?.user.role ?? null); } })
      .finally(() => { if (active) setSessionLoading(false); });
    return () => { active = false; };
  }, []);
  function acceptSession(value: AuthSession) {
    setSession(value); setRole(value.user.role); setSignedIn(true);
  }
  async function login(email: string, password: string) {
    acceptSession(await authService.login(email, password)); return true;
  }
  async function register(input: RegisterInput) { acceptSession(await authService.register(input)); }
  async function logout() {
    setSession(null); setSignedIn(false); setRole(null); setIncidents([]);
    await authService.clear();
  }
  useEffect(() => {
    configureSession(session?.accessToken ?? null, () => { void logout().catch(() => {}); });
    if (!session) return;
    const timer = setTimeout(() => { void logout().catch(() => {}); }, Math.max(0, session.expiresAt - Date.now()));
    return () => clearTimeout(timer);
  }, [session]);
  async function addIncident(input: IncidentInput) {
    if (role !== 'CIDADAO' || loading || error || saving.current) throw new Error('Cadastro indisponível.');
    saving.current = true;
    try {
      const item = await saveIncident(input);
      setIncidents(previous => [item, ...previous]);
      return item.id;
    } finally { saving.current = false; }
  }
  async function updateStatus(id: string, input: ManagementInput) {
    if (role !== 'GESTOR' || saving.current || loading || error) throw new Error('Atualização indisponível.');
    saving.current = true;
    try {
      const updated = await manageIncident(id, input);
      setIncidents(previous => previous.map(item => item.id === id ? updated : item));
    } finally { saving.current = false; }
  }
  async function editIncident(id: string, input: IncidentInput) {
    if (role !== 'CIDADAO' || saving.current || loading || error) throw new Error('Edição indisponível.');
    saving.current = true;
    try {
      const updated = await updateIncident(id, input);
      setIncidents(previous => previous.map(item => item.id === id ? updated : item));
    } finally { saving.current = false; }
  }
  async function removeIncident(id: string) {
    if (role !== 'CIDADAO' || saving.current || loading || error) throw new Error('Exclusão indisponível.');
    saving.current = true;
    try {
      await deleteIncident(id);
      setIncidents(previous => previous.filter(item => item.id !== id));
    } finally { saving.current = false; }
  }
  return <Context.Provider value={{ session, register, editIncident, removeIncident, role, updateStatus, signedIn, incidents, loading, error, login, logout, sessionLoading, reload, addIncident }}>{children}</Context.Provider>;
}
export function useApp() {
  const context = useContext(Context);
  if (!context) throw new Error('AppProvider ausente.');
  return context;
}
