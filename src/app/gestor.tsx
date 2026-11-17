import { useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { Action, Choices, colors, Field, ui } from '../components/incident-ui';
import { IncidentHistory } from '../components/IncidentHistory';
import { useApp } from '../context/AppContext';
import { categories, priorities, priorityLabels, statuses, statusLabels, type Incident, type IncidentPriority, type IncidentStatus } from '../types/incident';

function Attendance({ item, onClose }: { item: Incident; onClose: () => void }) {
  const { updateStatus } = useApp();
  const [status, setStatus] = useState<IncidentStatus>(item.status);
  const [priority, setPriority] = useState<IncidentPriority | ''>(item.priority ?? '');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const pending = useRef(false);

  async function save() {
    if (pending.current) return;
    setSuccess('');
    if (!priority || note.trim().length < 5) { setError('Selecione a prioridade e descreva o andamento com pelo menos 5 caracteres.'); return; }
    pending.current = true; setBusy(true); setError('');
    try {
      await updateStatus(item.id, { status, priority, note });
      setNote(''); setSuccess('Andamento registrado. O morador já pode consultar a atualização.');
    } catch { setError('Não foi possível registrar o andamento. Os campos foram mantidos para tentar novamente.'); }
    finally { pending.current = false; setBusy(false); }
  }

  return <View style={{ gap: 22, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 22 }}>
    <View style={{ backgroundColor: colors.background, padding: 18, borderRadius: 12, gap: 8 }}>
      <Text style={ui.eyebrow}>RELATO DO MORADOR · SOMENTE CONSULTA</Text>
      <Text selectable style={ui.subtitle}>{item.description}</Text>
      <Text selectable style={ui.subtitle}>{item.address} · {item.neighborhood}</Text>
      <Text style={ui.subtitle}>{item.category} · Recebido em {new Date(item.createdAt).toLocaleString('pt-BR')}</Text>
    </View>
    <Text style={ui.label}>Registrar atendimento</Text>
    <Text style={ui.subtitle}>Defina o encaminhamento e descreva a ação realizada. Este registro ficará no histórico e será visível ao morador.</Text>
    {busy ? <ActivityIndicator color={colors.primary} accessibilityLabel="Salvando andamento" /> : <>
      <Choices label="Status do atendimento" values={statuses.map(value => statusLabels[value])} value={statusLabels[status]} onChange={label => { const value = statuses.find(value => statusLabels[value] === label); if (value) setStatus(value); }} />
      <Choices label="Prioridade de atendimento" values={priorities.map(value => priorityLabels[value])} value={priority ? priorityLabels[priority] : ''} onChange={label => { const value = priorities.find(value => priorityLabels[value] === label); if (value) setPriority(value); }} />
    </>}
    <Field label="Descrição do andamento *" placeholder="Ex.: vistoria realizada; equipe de limpeza acionada para desobstrução." multiline maxLength={1000} value={note} editable={!busy} onChangeText={setNote} />
    <Text style={ui.subtitle}>{note.length}/1000 caracteres · Obrigatório para registrar uma atualização.</Text>
    {error ? <Text accessibilityRole="alert" style={ui.error}>{error}</Text> : null}
    {success ? <Text accessibilityLiveRegion="polite" style={{ color: colors.primary }}>{success}</Text> : null}
    <Action title={busy ? 'Registrando…' : 'Registrar andamento'} disabled={busy} onPress={() => { void save(); }} />
    <Action title="Fechar atendimento" secondary disabled={busy} onPress={onClose} />
    <IncidentHistory item={item} />
  </View>;
}

export default function Manager() {
  const { incidents, loading, error, reload, logout } = useApp();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [selectedId, setSelectedId] = useState(id ?? '');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [status, setStatus] = useState('Todos');
  const [priority, setPriority] = useState('Todas');
  const [sort, setSort] = useState('Prioridade');
  const [logoutError, setLogoutError] = useState('');
  const filtered = incidents.filter(item => (category === 'Todas' || item.category === category)
    && (status === 'Todos' || statusLabels[item.status] === status)
    && (priority === 'Todas' || (item.priority ? priorityLabels[item.priority] : 'Sem triagem') === priority)
    && `${item.id} ${item.title} ${item.address} ${item.neighborhood}`.toLocaleLowerCase('pt-BR').includes(search.trim().toLocaleLowerCase('pt-BR')))
    .sort((a, b) => {
      if (sort === 'Prioridade') {
        const difference = (a.status === 'RESOLVIDA' ? 1 : 0) - (b.status === 'RESOLVIDA' ? 1 : 0);
        if (difference) return difference;
        const rank = (item: Incident) => item.priority ? priorities.indexOf(item.priority) : 3;
        if (rank(a) !== rank(b)) return rank(a) - rank(b);
      }
      return sort === 'Mais recentes' ? Date.parse(b.createdAt) - Date.parse(a.createdAt) : Date.parse(a.createdAt) - Date.parse(b.createdAt);
    });
  function clearFilters() { setSearch(''); setCategory('Todas'); setStatus('Todos'); setPriority('Todas'); }

  return <View style={ui.page}><FlatList data={error || loading ? [] : filtered} contentContainerStyle={ui.content} keyExtractor={item => item.id} keyboardShouldPersistTaps="handled"
    ListHeaderComponent={<View style={{ gap: 22 }}>
      <View style={ui.hero}><Text style={{ color: colors.mint, fontSize: 11, fontWeight: '700', letterSpacing: 2 }}>CENTRAL DE ATENDIMENTO</Text><Text style={ui.heroTitle}>Painel do gestor</Text><Text style={ui.heroCopy}>Faça a triagem, organize as prioridades e registre o atendimento dos chamados da comunidade.</Text></View>
      <View style={ui.row}>{[
        { label: 'Aguardando análise', value: incidents.filter(item => item.status === 'ABERTA').length },
        { label: 'Em atendimento', value: incidents.filter(item => item.status === 'EM_ANALISE' || item.status === 'EM_ANDAMENTO').length },
        { label: 'Alta prioridade em aberto', value: incidents.filter(item => item.priority === 'ALTA' && item.status !== 'RESOLVIDA').length },
        { label: 'Resolvidos', value: incidents.filter(item => item.status === 'RESOLVIDA').length },
      ].map(metric => <View key={metric.label} style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16, flexGrow: 1, flexBasis: 140, gap: 6 }}><Text style={{ color: colors.primary, fontSize: 28, fontWeight: '700' }}>{loading || error ? '—' : metric.value}</Text><Text style={ui.label}>{metric.label}</Text></View>)}</View>
      <Text style={ui.subtitle}>Indicadores do total de chamados. Os filtros abaixo alteram apenas a fila de trabalho.</Text>
      <View style={ui.card}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink }}>Fila de chamados</Text>
        <Field label="Buscar por título, bairro, endereço ou ID" placeholder="Localize um chamado" value={search} onChangeText={setSearch} />
        <Choices label="Categoria" values={['Todas', ...categories]} value={category} onChange={setCategory} />
        <Choices label="Status" values={['Todos', ...statuses.map(value => statusLabels[value])]} value={status} onChange={setStatus} />
        <Choices label="Prioridade" values={['Todas', 'Sem triagem', ...priorities.map(value => priorityLabels[value])]} value={priority} onChange={setPriority} />
        <Choices label="Ordenar por" values={['Prioridade', 'Mais antigos', 'Mais recentes']} value={sort} onChange={setSort} />
        {sort === 'Prioridade' ? <Text style={ui.subtitle}>Chamados não resolvidos primeiro; prioridade alta antes da média e baixa. Empates por ordem de chegada.</Text> : null}
        <Action title="Limpar filtros" secondary onPress={clearFilters} />
      </View>
      <Text style={ui.eyebrow}>{loading || error ? '—' : filtered.length} CHAMADO(S) NA FILA</Text>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <><Text style={ui.error} accessibilityRole="alert">{error}</Text><Action title="Tentar novamente" onPress={() => { void reload(); }} /></> : null}
    </View>}
    renderItem={({ item }) => <View style={ui.card}>
      <View style={ui.row}><View style={ui.badge}><Text style={ui.badgeText}>{statusLabels[item.status]}</Text></View><Text style={ui.label}>{item.priority ? `Prioridade ${priorityLabels[item.priority].toLowerCase()}` : 'Aguardando triagem'}</Text></View>
      <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink }}>{item.title}</Text>
      <Text style={ui.subtitle}>{item.category} · {item.neighborhood}</Text>
      <Text selectable style={ui.subtitle}>ID: {item.id}</Text>
      <Text style={ui.subtitle}>Recebido em {new Date(item.createdAt).toLocaleString('pt-BR')}</Text>
      {selectedId === item.id ? <Attendance key={item.id} item={item} onClose={() => setSelectedId('')} /> : <Action title="Gerenciar chamado →" onPress={() => setSelectedId(item.id)} />}
      <Action title="Consultar detalhes do relato" secondary onPress={() => router.push({ pathname: '/detalhe/[id]', params: { id: item.id } })} />
    </View>}
    ListEmptyComponent={!loading && !error ? <View style={ui.card}><Text style={ui.label}>Nenhum chamado nesta seleção.</Text><Text style={ui.subtitle}>Confira os filtros ou limpe a busca para consultar outros chamados.</Text></View> : undefined}
    ListFooterComponent={<View style={{ gap: 14 }}><Action title="Exibir todos os chamados" secondary onPress={clearFilters} />{logoutError ? <Text style={ui.error} accessibilityRole="alert">{logoutError}</Text> : null}<Action title="Sair da conta" secondary onPress={() => { void logout().catch(() => setLogoutError('Não foi possível sair. Tente novamente.')); }} /></View>}
  /></View>;
}
