import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from '../context/AppContext';
import { Brand, colors } from '../components/incident-ui';
function Navigation() {
  const { signedIn, sessionLoading, role } = useApp();
  if (sessionLoading) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator accessibilityLabel="Restaurando sessão" color={colors.primary} /></View>;
  return <><StatusBar style="dark" /><Stack screenOptions={{ headerTitle: () => <Brand />, headerTitleAlign: 'left', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.ink, contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Protected guard={!signedIn}><Stack.Screen name="cadastro" options={{ title: 'Criar conta' }} /><Stack.Screen name="login" options={{ title: 'Antes da Chuva' }} /></Stack.Protected>
    <Stack.Protected guard={signedIn}>
      <Stack.Screen name="index" options={{ title: 'Antes da Chuva' }} />
      <Stack.Screen name="detalhe/[id]" options={{ title: 'Detalhes da ocorrência' }} />
    </Stack.Protected>
    <Stack.Protected guard={signedIn && role === 'CIDADAO'}>
      <Stack.Screen name="nova-ocorrencia" options={{ title: 'Nova ocorrência' }} />
      <Stack.Screen name="editar/[id]" options={{ title: 'Editar ocorrência' }} />
    </Stack.Protected>
    <Stack.Protected guard={signedIn && role === 'GESTOR'}>
      <Stack.Screen name="gestor" options={{ title: 'Painel do gestor' }} />
    </Stack.Protected>
  </Stack></>;
}
export default function RootLayout() { return <AppProvider><Navigation /></AppProvider>; }
