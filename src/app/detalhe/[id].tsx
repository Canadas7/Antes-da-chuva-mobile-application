import { useState, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { Action, Page, ui } from '../../components/incident-ui';
import { statusLabels } from '../../types/incident';
import { useApp } from '../../context/AppContext';
export default function IncidentDetails() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { incidents, loading, error, reload, removeIncident } = useApp();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const pending = useRef(false);
  async function confirmDelete() {
    if (pending.current) return;
    pending.current = true; setDeleting(true); setDeleteError('');
    try { await removeIncident(id); router.replace('/'); }
    catch { setDeleteError('Não foi possível excluir. A ocorrência foi mantida. Tente novamente.'); }
    finally { pending.current = false; setDeleting(false); }
  }
  const item = incidents.find(value => value.id === id);
  if (loading) return <Page><ActivityIndicator accessibilityLabel="Carregando ocorrência" /></Page>;
  if (error) return <Page><Text style={ui.error}>{error}</Text><Action title="Tentar novamente" onPress={() => { void reload(); }} /></Page>;
  if (!item) return <Page><Text style={ui.heading}>Ocorrência não encontrada</Text><Action title="Voltar aos registros" onPress={() => router.replace('/')} /></Page>;
  return <Page><Text style={ui.eyebrow}>REGISTRO DA COMUNIDADE</Text><Text style={ui.heading}>{item.title}</Text><View style={ui.card}><Text style={ui.label}>Endereço</Text><Text selectable style={ui.subtitle}>{item.address}</Text><Text style={ui.label}>Tipo</Text><Text style={ui.subtitle}>{item.category}</Text><Text style={ui.label}>Bairro</Text><Text style={ui.subtitle}>{item.neighborhood}</Text><Text style={ui.label}>Status</Text><View style={ui.badge}><Text style={ui.badgeText}>●  {statusLabels[item.status]}</Text></View><Text style={ui.label}>Registrado em</Text><Text style={ui.subtitle}>{new Date(item.createdAt).toLocaleString('pt-BR')}</Text></View><Text style={ui.label}>O que foi observado</Text><Text selectable style={ui.subtitle}>{item.description}</Text><Action title="Editar ocorrência" disabled={deleting} onPress={() => router.push({ pathname: '/editar/[id]', params: { id: item.id } })} />
    {confirming ? <View style={ui.card}><Text style={ui.label}>Excluir esta ocorrência?</Text><Text style={ui.subtitle}>“{item.title}” será removida dos registros. Esta ação não pode ser desfeita.</Text>{deleteError ? <Text accessibilityRole="alert" style={ui.error}>{deleteError}</Text> : null}<Action title={deleting ? 'Excluindo…' : 'Confirmar exclusão'} disabled={deleting} onPress={() => { void confirmDelete(); }} /><Action title="Cancelar exclusão" secondary disabled={deleting} onPress={() => { setConfirming(false); setDeleteError(''); }} /></View> : <Action title="Excluir ocorrência" secondary onPress={() => setConfirming(true)} />}
    <Action title="Voltar aos registros" secondary disabled={deleting} onPress={() => router.canGoBack() ? router.back() : router.replace('/')} /></Page>;
}
