import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { Action, Brand, Page, ui } from '../../components/incident-ui';
import { useApp } from '../../context/AppContext';
export default function IncidentDetails() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { incidents, loading, error, reload } = useApp();
  const item = incidents.find(value => value.id === id);
  if (loading) return <Page><ActivityIndicator accessibilityLabel="Carregando ocorrência" /></Page>;
  if (error) return <Page><Text style={ui.error}>{error}</Text><Action title="Tentar novamente" onPress={() => { void reload(); }} /></Page>;
  if (!item) return <Page><Text style={ui.heading}>Ocorrência não encontrada</Text><Action title="Voltar aos registros" onPress={() => router.replace('/')} /></Page>;
  return <Page><Brand /><Text style={ui.eyebrow}>REGISTRO DA COMUNIDADE</Text><Text style={ui.heading}>{item.title}</Text><View style={ui.card}><Text style={ui.label}>Endereço</Text><Text selectable style={ui.subtitle}>{item.address}</Text><Text style={ui.label}>Tipo</Text><Text style={ui.subtitle}>{item.category}</Text><Text style={ui.label}>Bairro</Text><Text style={ui.subtitle}>{item.neighborhood}</Text><Text style={ui.label}>Status</Text><View style={ui.badge}><Text style={ui.badgeText}>●  {item.status}</Text></View><Text style={ui.label}>Registrado em</Text><Text style={ui.subtitle}>{new Date(item.createdAt).toLocaleString('pt-BR')}</Text></View><Text style={ui.label}>O que foi observado</Text><Text selectable style={ui.subtitle}>{item.description}</Text><Text style={ui.subtitle}>Registro local para acompanhamento. Este protótipo não envia solicitações aos órgãos públicos.</Text><Action title="Voltar aos registros" onPress={() => router.back()} /></Page>;
}
