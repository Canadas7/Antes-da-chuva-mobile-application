import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from '../context/AppContext';
import { colors } from '../components/incident-ui';
function Navigation() {
  const { signedIn, sessionLoading } = useApp();
  if (sessionLoading) return <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}><ActivityIndicator accessibilityLabel="Restaurando sessão" color={colors.primary} /></View>;
  return <><StatusBar style="dark" /><Stack screenOptions={{ headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.ink, contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Protected guard={!signedIn}><Stack.Screen name="login" options={{ title: 'Antes da Chuva' }} /></Stack.Protected>
    <Stack.Protected guard={signedIn}>
      <Stack.Screen name="index" options={{ title: 'Antes da Chuva' }} />
      <Stack.Screen name="nova-ocorrencia" options={{ title: 'Nova ocorrência' }} />
      <Stack.Screen name="detalhe/[id]" options={{ title: 'Detalhes da ocorrência' }} />
    </Stack.Protected>
  </Stack></>;
}
export default function RootLayout() { return <AppProvider><Navigation /></AppProvider>; }
