import { useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { Action, Choices, colors, Field, ui } from '../components/incident-ui';
import { useApp } from '../context/AppContext';
import { categories, statuses, statusLabels, type Incident, type IncidentStatus } from '../types/incident';

function ManagedIncident({ item }: { item: Incident }) {
  const { updateStatus } = useApp();
  const [selected, setSelected] = useState<IncidentStatus>(item.status);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [failed, setFailed] = useState(false);
  async function save() {
    if (busy || selected === item.status) return;
    setBusy(true); setFeedback('');
    try { await updateStatus(item.id, selected); setFailed(false); setFeedback('Status atualizado com sucesso.'); }
    catch { setFailed(true); setFeedback('Não foi possível atualizar. Tente novamente.'); }
    finally { setBusy(false); }
  }
  return <View style={ui.card}>
    <View style={ui.row}><Text style={ui.eyebrow}>{item.category.toLocaleUpperCase('pt-BR')}</Text><View style={ui.badge}><Text style={ui.badgeText}>{statusLabels[item.status]}</Text></View></View>
    <Text style={{ fontSize: 21, fontWeight: '600', color: colors.ink }}>{item.title}</Text>
    <Text style={ui.subtitle}>{item.neighborhood} · {item.address}</Text>
    <Text style={ui.subtitle}>{item.description}</Text>
    <Text style={ui.label}>Atualizar andamento</Text>
    <View style={ui.row}>{statuses.map(status => <Pressable key={status} disabled={busy} accessibilityRole="radio" accessibilityState={{ checked: selected === status, disabled: busy }} onPress={() => { setSelected(status); setFeedback(''); }} style={{ padding: 12, minHeight: 44, borderRadius: 10, backgroundColor: selected === status ? colors.primary : '#EAF0F3' }}><Text style={{ color: selected === status ? '#FFFFFF' : colors.ink }}>{statusLabels[status]}</Text></Pressable>)}</View>
    {feedback ? <Text accessibilityRole={failed ? 'alert' : undefined} accessibilityLiveRegion="polite" style={failed ? ui.error : { color: colors.primary }}>{feedback}</Text> : null}
    <Action title={busy ? 'Salvando…' : 'Salvar status'} disabled={busy || selected === item.status} onPress={() => { void save(); }} />
    <Action title="Consultar detalhes →" secondary onPress={() => router.push({ pathname: '/detalhe/[id]', params: { id: item.id } })} />
  </View>;
}

export default function Manager() {
  const { incidents, loading, error, reload } = useApp();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [status, setStatus] = useState('Todos');
  const filtered = incidents.filter(item => (category === 'Todas' || item.category === category) && (status === 'Todos' || statusLabels[item.status] === status) && `${item.title} ${item.address} ${item.neighborhood}`.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR')));
  return <View style={ui.page}><FlatList data={error ? [] : filtered} contentContainerStyle={ui.content} keyExtractor={item => item.id} keyboardShouldPersistTaps="handled"
    ListHeaderComponent={<View style={{ gap: 20 }}>
      <View style={ui.hero}><Text style={{ color: colors.mint, fontSize: 11, fontWeight: '700', letterSpacing: 2 }}>ÁREA DE GESTÃO</Text><Text style={ui.heroTitle}>Cuidado que vira ação.</Text><Text style={ui.heroCopy}>Acompanhe os pontos de atenção e mantenha o andamento das ocorrências atualizado.</Text></View>
      <View style={ui.row}>{statuses.map(value => <View key={value} style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16, flexGrow: 1, flexBasis: 140, gap: 6 }}><Text style={{ color: colors.primary, fontSize: 28, fontWeight: '700' }}>{loading || error ? '—' : incidents.filter(item => item.status === value).length}</Text><Text style={ui.label}>{statusLabels[value]}</Text></View>)}</View>
      <Field label="Buscar por título, bairro ou endereço" placeholder="Encontre uma ocorrência" value={search} onChangeText={setSearch} />
      <Choices label="Categoria" values={['Todas', ...categories]} value={category} onChange={setCategory} />
      <Choices label="Status" values={['Todos', ...statuses.map(value => statusLabels[value])]} value={status} onChange={setStatus} />
      <Text style={ui.eyebrow}>{filtered.length} OCORRÊNCIA(S) ENCONTRADA(S)</Text>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <><Text style={ui.error} accessibilityRole="alert">{error}</Text><Action title="Tentar novamente" onPress={() => { void reload(); }} /></> : null}
    </View>}
    renderItem={({ item }) => <ManagedIncident key={`${item.id}-${item.status}`} item={item} />}
    ListEmptyComponent={!loading && !error ? <View style={ui.card}><Text style={ui.label}>Nenhuma ocorrência encontrada.</Text><Text style={ui.subtitle}>Altere os filtros para consultar outros registros.</Text></View> : undefined}
    ListFooterComponent={<Action title="Voltar às ocorrências" secondary onPress={() => router.replace('/')} />}
  /></View>;
}
