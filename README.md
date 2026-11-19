# Antes da Chuva

FIAP · Global Solution 2026/2 · Mobile Application Development

Aplicativo de zeladoria preventiva com React Native, **Expo SDK 58**, TypeScript e Expo Router. Integração real por Fetch com Java Spring Boot / Spring Security JWT / Spring AI. A identidade visual e as telas existentes foram preservadas.

## Telas e funcionalidades

1. Login com autenticação JWT real.
2. Cadastro de cidadão na API.
3. Home com minhas ocorrências, busca e estados de carregamento/erro/vazio.
4. Nova ocorrência com categorias carregadas do servidor.
5. Detalhes com histórico, prioridade, resumo e orientação da triagem de IA; botão para atualizar.
6. Edição de ocorrência aberta do próprio cidadão.
7. Perfil com dados do usuário e logout.
8. Painel do gestor com fila, filtros e transições de status permitidas pelo Java.

A tela **Sobre o App** é adicional e não entra na contagem. Exibe versão e hash completo do commit usado no build.

As ocorrências e o histórico são armazenados e manipulados exclusivamente pela API. AsyncStorage guarda apenas token, dados da sessão e expiração. Não existem mocks nem fallback de ocorrências locais. Os antigos registros locais não são enviados automaticamente ao servidor.

## Executar

Node.js 24 e npm. Preserve o package-lock e o SDK 58; não use `npm audit fix --force`.

```powershell
npm ci
Copy-Item .env.example .env
npm start
```

O exemplo já aponta para `https://app-antesdachuva-561082.azurewebsites.net`. Para outro servidor, altere `EXPO_PUBLIC_API_URL` e reinicie o Metro. Nunca coloque segredos JWT ou da IA no aplicativo.

Abra no Expo Go compatível com SDK 58 ou em um development build compatível. O telefone precisa acessar a URL da API. Para Java local: emulador Android usa `http://10.0.2.2:8080`; telefone físico usa o IP da máquina na rede.

### Limitação atual do navegador

O aplicativo web renderiza, mas o backend Azure respondeu **401 ao OPTIONS de /auth/login**, sem Access-Control-Allow-Origin para `http://localhost:8099`. Isso bloqueia autenticação e demais chamadas web entre origens. O backend deve configurar CORS para as origens de desenvolvimento/produção autorizadas e aceitar o preflight, incluindo métodos GET/POST/PUT/DELETE e cabeçalhos Authorization/Content-Type. Esse ajuste pertence ao Java e não foi incluído neste repositório mobile.

O app nativo não está sujeito ao CORS do navegador. Ainda é necessário executar o fluxo completo em dispositivo/emulador antes da entrega; compilação do bundle e testes dos serviços não substituem essa conferência.

## Backend real

- Código: https://github.com/gugomesx10/Antes-da-Chuva
- API: https://app-antesdachuva-561082.azurewebsites.net
- OpenAPI: https://app-antesdachuva-561082.azurewebsites.net/v3/api-docs
- Saúde: https://app-antesdachuva-561082.azurewebsites.net/actuator/health
- Contrato conferido: [docs/backend-contract.md](docs/backend-contract.md).

Cadastro público cria apenas CIDADAO. O papel vem de `/auth/me`, nunca de um seletor local. Logout remove o token e bloqueia rotas; expiração e respostas 401 encerram a sessão. O servidor valida permissões e propriedade dos registros.

**DELETE é cancelamento lógico**: preserva a ocorrência e o histórico com status CANCELLED. Edição/cancelamento exigem dono e status OPEN. A prioridade é calculada pela IA, não editada pelo gestor. A triagem é assíncrona; use Atualizar detalhes e triagem para consultar o resultado. O app não chama o provedor de IA diretamente.

O backend precisa permanecer ativo durante a avaliação, com PostgreSQL, RabbitMQ, JWT e credenciais de IA configurados. O Azure informado já atende como hospedagem: não é necessário criar um serviço Render adicional.

## Organização

```text
src/app/                 rotas Expo Router e telas
src/context/             estado de sessão e ocorrências em memória
src/services/api.ts      Fetch, Bearer, timeout, erros HTTP, paginação
src/services/authService.ts     cadastro, login, me, restauração e limpeza
src/services/incidentService.ts CRUD, categorias, histórico e mapeamento Java
src/types/               modelos da API e da apresentação
src/components/          formulário e componentes visuais reutilizados
app.config.js            hash de referência e configuração Android
eas.json                 perfil preview para APK
scripts/                 validação local e teste de integração opt-in
```

## Validação

Antes de cada commit foi executado TypeScript, ESLint sem avisos e inicialização HTTP do Expo:

```powershell
node scripts/validate.cjs
```

O script usa a porta 8098 e encerra seu próprio servidor. Para compilar o bundle Android:

```powershell
npx expo export --platform android --output-dir dist/android-validation
```

Teste dos **serviços reais do mobile** contra a API (altera dados de teste):

```powershell
$env:EXPO_PUBLIC_API_URL='https://app-antesdachuva-561082.azurewebsites.net'
node scripts/test-api.cjs
```

Esse teste cria um cidadão com e-mail único e uma ocorrência de validação; cancela a ocorrência no final. Não apaga a conta porque não existe endpoint para isso. O teste substitui apenas o armazenamento nativo por memória no processo Node; as requisições HTTP e os serviços usados são reais.

Resultado verificado: acesso sem token bloqueado, cadastro, login, `/auth/me`, categorias, criação/listagem/detalhes/edição/cancelamento, conflito 409 ao editar cancelada e limpeza da sessão. A execução inicial deixou a ocorrência 101 cancelada. Também foram verificados a renderização de login/cadastro, a navegação pública e o erro de conexão web decorrente do CORS. O bundle Android compilou com sucesso. O fluxo completo do gestor e a geração do conteúdo pela IA ainda precisam ser demonstrados no dispositivo com o backend ativo.

## APK e Firebase App Distribution — etapa posterior

**Publicação adiada a pedido do responsável. Nenhum APK foi publicado.**

O perfil preview está preparado para APK, com URL pública da API. Ainda falta vincular o projeto Expo/EAS, conferir a identidade Android `com.antesdachuva.mobile`, configurar assinatura e cadastrar o app correspondente no Firebase.

```powershell
npx eas-cli@latest login
npx eas-cli@latest build:configure
# Se a configuração modificar arquivos, validar, commitar e enviar antes de gerar o APK.
git status --porcelain
npx eas-cli@latest build --platform android --profile preview
```

Gere o APK com a árvore Git limpa. `app.config.js` incorpora `EAS_BUILD_GIT_COMMIT_HASH` ou o HEAD local; em arquivo-fonte sem Git, informe SOURCE_COMMIT com o hash completo. Não use hash manual fixo de um commit antigo. A tela Sobre deve mostrar o mesmo commit enviado para a avaliação.

Após baixar o APK, instalar e testar em dispositivo, distribuir pelo Firebase App Distribution e adicionar o professor como tester. São necessários o projeto, o ID real do app Android e o e-mail do professor. O link da distribuição ainda está pendente.

## Vídeo e entrega

Vídeo de até 5 minutos, no YouTube como público ou não listado; gravação deixada para depois. Roteiro sugerido:

- cadastro e login reais;
- minhas ocorrências, cadastro, detalhe e edição;
- cancelamento com histórico preservado;
- gestor altera status e cidadão acompanha;
- resultado de triagem Spring AI;
- perfil, logout, bloqueio de rotas e Sobre com hash;
- APK instalado via Firebase App Distribution.

Inserir o link real do vídeo e da distribuição aqui e no arquivo texto de entrega quando disponíveis. Confirmar o professor como tester e o acesso ao repositório.
