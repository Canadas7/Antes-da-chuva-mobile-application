# Antes da Chuva

Protótipo acadêmico mobile de registro preventivo de riscos relacionados à chuva. Desenvolvido com Expo SDK 58, React Native, TypeScript, Expo Router e AsyncStorage.

## Executar

Na pasta do projeto, execute `npm install` se necessário e `npm start`. Use `npm run web` para navegador ou abra o QR code no Expo Go compatível com SDK 58.

## Conta demonstrativa

- E-mail: `aluno@antesdachuva.com`
- Senha: `Chuva123!`

O login é simulado e a sessão fica somente em memória. Não há autenticação de servidor. Nenhuma senha é armazenada no AsyncStorage.

## Funcionalidades

- Login com validação e saída da conta; rotas internas protegidas pela sessão.
- Lista de ocorrências com busca por título, local e categoria.
- Cadastro com título, endereço, categoria, prioridade e descrição; validação de campos e indicação de salvamento.
- Consulta dos detalhes com data e hora do registro.
- Persistência local na chave `@antes-da-chuva/incidents:v1` com um exemplo demonstrativo no primeiro uso.
- Estados de carregamento, busca vazia, falha de leitura/gravação e registro inexistente.

Dados persistem após recarregar ou fechar o app. No navegador, são específicos da origem e do perfil utilizado. Limpar os dados do aplicativo/navegador remove os registros. Não há sincronização, envio a órgãos públicos, fotos ou geolocalização nesta etapa.

## Organização

```text
src/app/                  # Login e navegação raiz
src/app/(app)/            # Lista, cadastro e detalhe protegidos
src/components/incident-ui.tsx # Componentes e estilos compartilhados
src/context/AppContext.tsx # Sessão e estado das ocorrências
src/services/storage.ts   # Leitura, validação e gravação local
src/types/incident.ts     # Tipos e opções dos formulários
```

## Verificação manual

1. Tente entrar com credenciais inválidas e depois use a conta demonstrativa.
2. Consulte o registro de exemplo e volte à lista.
3. Tente salvar o formulário vazio; preencha todos os campos e salve.
4. Busque o novo registro por título, local ou categoria e consulte seus detalhes.
5. Recarregue o aplicativo, faça login e confirme que o cadastro permanece.
6. Saia da conta e confirme que o botão voltar não permite acessar as telas internas.
7. Repita no navegador e em um dispositivo Android/iOS disponível.

## Validação e commits

Execute `npx tsc --noEmit`, `npm run lint` e `npx expo-doctor`. Evite `npm audit fix --force`, que pode alterar o SDK.

Revise `git status` e `git diff` antes de versionar. Sugestão de commit após validar:

```bash
git add src app.json README.md .gitignore package.json package-lock.json eslint.config.js
git commit -m "feat: implementa estrutura inicial do Antes da Chuva"
git push origin main
```


