# Antes da Chuva

**FIAP · Global Solution 2026/2 · Mobile Application Development**

Antes da Chuva é um aplicativo de zeladoria preventiva para registrar situações que aumentam o risco de alagamento, como bueiros obstruídos, entulho nas vias e problemas em córregos. O morador informa o que encontrou e onde aconteceu. O gestor usa a fila de chamados para priorizar o atendimento e registrar o andamento, que fica disponível no detalhe da ocorrência.

## Funcionalidades

- O **morador** pode entrar na conta de teste, buscar, cadastrar, consultar, editar e excluir ocorrências. O detalhe mostra o status, a prioridade e o histórico de atendimento.
- O **gestor** pode consultar a fila, filtrar chamados pendentes ou resolvidos, definir prioridade e atualizar o status. Cada atualização fica registrada no histórico e pode incluir uma observação ao morador.
- O **AsyncStorage** guarda a sessão, as ocorrências e o histórico localmente. Na versão web, use o mesmo navegador, perfil e endereço para consultar os registros após recarregar a página.

## Tecnologias

| Tecnologia | Uso no projeto |
| --- | --- |
| React Native com Expo SDK 58 | Interface e execução do aplicativo |
| React Native Web | Execução no navegador |
| TypeScript | Tipagem dos dados e componentes |
| Expo Router | Navegação e rotas por perfil |
| AsyncStorage | Armazenamento local da sessão, dos registros e do histórico |

## Como executar

Use Node.js 24.7, npm e Git. No terminal, execute os comandos abaixo.

```bash
git clone https://github.com/Canadas7/Antes-da-chuva-mobile-application.git
cd Antes-da-chuva-mobile-application
npm ci
npx expo start
```

Quando o Expo iniciar, pressione **`w`** no terminal para abrir o app no navegador.

## Contas de teste

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Morador | `teste@antesdachuva.com` | `123456` |
| Gestor | `gestor@antesdachuva.com` | `123456` |

## Demonstração do aplicativo

1. Entre com a conta de **morador** e consulte a lista de ocorrências.
2. Clique em **Registrar uma ocorrência**. Preencha título, categoria, endereço, bairro e descrição. Clique em **Salvar ocorrência**.
3. Abra o novo registro na lista e confira os detalhes. Recarregue a página para verificar que o registro continua disponível.
4. Para demonstrar o atendimento, saia da conta de morador, entre como **gestor** no mesmo navegador e abra o chamado na fila. Ajuste o status ou a prioridade e clique em **Salvar atendimento**. O andamento aparece no histórico.

## Organização do código

| Caminho | Responsabilidade |
| --- | --- |
| `src/app/` | Telas e rotas do morador e do gestor |
| `src/components/` | Formulários, interface compartilhada e histórico |
| `src/context/AppContext.tsx` | Sessão e estado das ocorrências |
| `src/services/storage.ts` | Leitura, validação e gravação dos dados locais |
| `src/types/incident.ts` | Tipos de ocorrência, status, prioridades e perfis |

## Verificações

```bash
npx tsc --noEmit
npm run lint
node scripts/test-manager-storage.cjs
```
