import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { getIncidents, saveIncident, saveSession, getSession, clearSession } from '../services/storage';
import type { Incident, IncidentInput } from '../types/incident';

type AppState = {
  signedIn: boolean; incidents: Incident[]; loading: boolean; error: string;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>; sessionLoading: boolean; reload: () => Promise<void>;
  addIncident: (input: IncidentInput) => Promise<string>;
};
const Context = createContext<AppState | null>(null);
export function AppProvider({ children }: PropsWithChildren) {
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
    getSession().then(session => { if (active) setSignedIn(!!session); })
      .catch(() => { if (active) setSignedIn(false); })
      .finally(() => { if (active) setSessionLoading(false); });
    return () => { active = false; };
  }, []);
  async function login(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    if (normalized !== 'teste@antesdachuva.com' || password !== '123456') return false;
    await saveSession({ email: normalized });
    setSignedIn(true); return true;
  }
  async function logout() { await clearSession(); setSignedIn(false); }
  async function addIncident(input: IncidentInput) {
    if (!signedIn || loading || error || saving.current) throw new Error('Cadastro indisponível.');
    saving.current = true;
    try {
      const item = await saveIncident(input);
      setIncidents(previous => [item, ...previous]);
      return item.id;
    } finally { saving.current = false; }
  }
  return <Context.Provider value={{ signedIn, incidents, loading, error, login, logout, sessionLoading, reload, addIncident }}>{children}</Context.Provider>;
}
export function useApp() {
  const context = useContext(Context);
  if (!context) throw new Error('AppProvider ausente.');
  return context;
}
