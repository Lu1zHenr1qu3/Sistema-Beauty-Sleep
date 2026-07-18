# Beauty Sleep Treatment System

> Sistema de gestão clínica para acompanhamento de tratamentos a laser (Fotona LightWalker) para ronco e apneia do sono.

[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.4-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.7-38bdf8)](https://tailwindcss.com/)

## 📋 Sobre o Projeto

O **Beauty Sleep Treatment System** é uma plataforma web moderna desenvolvida para a clínica Beauty Smile, que consolida dados de exames do sono (Biologix) com registros de sessões de tratamento, permitindo uma visão completa da evolução dos pacientes.

### 🎯 Objetivos Principais

- ✅ **Consolidação de Dados**: Unificar exames Biologix e sessões de tratamento em um único banco de dados
- ✅ **Gestão Completa do Ciclo**: Rastrear pacientes desde Lead até Manutenção
- ✅ **Conversão de Leads**: Identificar e priorizar leads que fizeram exame mas não fecharam tratamento
- ✅ **Controle de Sessões**: Rastrear sessões compradas, adicionadas e disponíveis
- ✅ **Eficiência Operacional**: Reduzir tempo de revisão de paciente de 5 minutos para 30 segundos
- ✅ **Sincronização Automática**: Sincronização diária automática com API Biologix

## 🚀 Tecnologias

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth)
- **Integração**: API Biologix (sincronização automática)
- **UI Components**: Radix UI, Lucide Icons, Recharts

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta Supabase
- Credenciais da API Biologix

### Passos

1. **Clone o repositório**
```bash
git clone https://github.com/fercosnt/Sistema-Beauty-Sleep.git
cd Sistema-Beauty-Sleep
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**

Copie o arquivo de exemplo e preencha com suas credenciais:
```bash
cp env.local.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Biologix API Credentials
BIOLOGIX_USERNAME=seu_username_aqui
BIOLOGIX_PASSWORD=sua_senha_aqui
BIOLOGIX_SOURCE=100
BIOLOGIX_PARTNER_ID=seu_partner_id_aqui
```

4. **Configure o banco de dados**

Execute as migrations no Supabase:
```bash
npx supabase db push
```

5. **Configure os Secrets da Edge Function**

No Supabase Dashboard, vá em Edge Functions → Secrets e configure:
- `BIOLOGIX_USERNAME`
- `BIOLOGIX_PASSWORD`
- `BIOLOGIX_SOURCE`
- `BIOLOGIX_PARTNER_ID`

6. **Execute o projeto**

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 🚀 Deploy

### Vercel (Recomendado)

1. **Conecte o repositório no Vercel**
   - Acesse [vercel.com](https://vercel.com)
   - Importe o repositório `fercosnt/Sistema-Beauty-Sleep`

2. **Configure as variáveis de ambiente**
   - Vá em **Settings** → **Environment Variables**
   - Adicione as seguintes variáveis:
     - `NEXT_PUBLIC_SUPABASE_URL` = `https://qigbblypwkgflwnrrhzg.supabase.co`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (sua anon key do Supabase)
     - `SUPABASE_SERVICE_ROLE_KEY` = (sua service role key do Supabase)
     - `NEXT_PUBLIC_SITE_URL` = `https://beauty-sleep.vercel.app` (opcional)

3. **Deploy automático**
   - Cada push para `main` gera um deploy automático
   - Acesse o site em: `https://beauty-sleep.vercel.app`

**⚠️ Importante**: Configure as variáveis com valores diretos (não como Secrets).

## 📚 Documentação

### Configuração

- [`CONFIGURAR_ENV_LOCAL.md`](./docs/guias/setup/CONFIGURAR_ENV_LOCAL.md) - Como configurar o arquivo `.env.local`
- [`CONFIGURACAO_BIOLOGIX.md`](./docs/guias/setup/CONFIGURACAO_BIOLOGIX.md) - Configuração da API Biologix
- [`SETUP_CRON_SECRETS.md`](./docs/guias/deploy/SETUP_CRON_SECRETS.md) - Configuração dos secrets do cron job

### Deploy e Operação

- [`DEPLOY_EDGE_FUNCTION.md`](./docs/guias/deploy/DEPLOY_EDGE_FUNCTION.md) - Deploy da Edge Function de sincronização
- [`CRON_JOB_MONITORAMENTO.md`](./docs/guias/deploy/CRON_JOB_MONITORAMENTO.md) - Monitoramento do cron job
- [`TROUBLESHOOTING_EDGE_FUNCTION.md`](./docs/guias/troubleshooting/TROUBLESHOOTING_EDGE_FUNCTION.md) - Solução de problemas

### Migração

- [`GUIA_MIGRACAO_AIRTABLE.md`](./docs/guias/desenvolvimento/GUIA_MIGRACAO_AIRTABLE.md) - Guia de migração do Airtable

### Scripts de Teste

- [`scripts/test/README_TESTE_API.md`](./scripts/test/README_TESTE_API.md) - Scripts para testar a API Biologix

## 🧪 Scripts Disponíveis

### Desenvolvimento

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Cria build de produção
npm run start        # Inicia servidor de produção
npm run lint         # Executa linter
npm test             # Executa testes (se configurado)
```

### Testes E2E (Playwright)

```bash
# Instalar Playwright (primeira vez)
npx playwright install

# Executar todos os testes
npx playwright test

# Executar testes E2E
npx playwright test e2e

# Executar testes de integração
npx playwright test integration

# Executar em modo UI (interativo)
npx playwright test --ui
```

### Testes da API Biologix

```bash
# Node.js
node scripts/test/test-biologix-api.js

# PowerShell (Windows)
powershell -ExecutionPolicy Bypass -File .\scripts\utils\test-biologix-api.ps1

# Bash (Linux/Mac)
bash scripts/utils/test-biologix-api.sh
```

### Validação de Variáveis

```bash
node scripts/test/test-env-loading.js
```

## 🏗️ Estrutura do Projeto

```
.
├── app/                    # Next.js App Router
│   ├── dashboard/         # Dashboard principal
│   ├── pacientes/         # Gestão de pacientes
│   ├── logs/              # Página de logs de auditoria (admin)
│   ├── usuarios/          # Gestão de usuários (admin)
│   └── login/            # Autenticação
├── components/            # Componentes React reutilizáveis
│   ├── ui/               # Componentes de UI (Sidebar, etc)
│   └── ...
├── lib/                   # Bibliotecas e utilitários
│   └── supabase/         # Clientes Supabase (server, client, admin)
├── supabase/
│   ├── migrations/        # Migrations do banco de dados
│   └── functions/        # Edge Functions
│       └── sync-biologix/ # Função de sincronização com Biologix
├── scripts/              # Scripts utilitários
│   ├── migrate-from-airtable.ts
│   ├── test-biologix-connection.ts
│   └── ...
├── __tests__/            # Testes (E2E e integração)
├── PRD/                  # Documentação de requisitos
├── docs/                 # Documentação do projeto
└── tasks/                # Tasks de desenvolvimento
```

## 🔐 Segurança

- ✅ Arquivo `.env.local` está no `.gitignore` (não será commitado)
- ✅ Credenciais armazenadas como Secrets no Supabase
- ✅ Row Level Security (RLS) configurado no banco de dados
- ✅ Autenticação via Supabase Auth
- ✅ Controle de acesso baseado em roles (admin, equipe, recepção)
- ✅ Middleware de autenticação para rotas protegidas
- ✅ Logs de auditoria para rastreabilidade

## 📊 Funcionalidades Principais

### Dashboard
- KPIs principais (total pacientes, exames, sessões)
- Widget de ações pendentes
- Gráficos de tendência temporal
- Filtros por tipo de exame (Ronco/Apneia)

### Gestão de Pacientes
- Lista completa com busca e filtros
- Perfil detalhado do paciente
- Histórico de exames e sessões
- Controle de sessões (compradas/utilizadas/disponíveis)
- Sistema de tags para organização
- Visualização de evolução do tratamento

### Gestão de Usuários (Admin)
- Criação e edição de usuários
- Controle de permissões (admin, equipe, recepção)
- Ativação/desativação de usuários

### Logs de Auditoria (Admin)
- Histórico completo de ações realizadas no sistema
- Filtros por usuário, ação e data
- Exportação de logs

### Sincronização Automática
- Sincronização diária às 10h BRT com API Biologix
- Criação automática de pacientes (quando necessário)
- Link automático de exames pelo ID do Paciente
- Atualização de dados existentes

## 🔄 Sincronização com Biologix

O sistema sincroniza automaticamente os dados da API Biologix através de uma Edge Function que executa diariamente às 10h BRT (13h UTC).

**Fluxo de sincronização:**
1. Autenticação na API Biologix
2. Busca de todos os exames do centro credenciado (status DONE)
3. Extração de CPF do username do paciente (opcional)
4. Criação/atualização de pacientes pelo ID do Paciente (biologix_id)
5. Criação/atualização de exames pelo ID Exame (biologix_exam_id)
6. Link automático de exames aos pacientes pelo ID do Paciente

**Tratamento de Rate Limiting:**
- Delay de 60 segundos para erros 429 (too many requests)
- Delay de 1 segundo entre requisições de paginação
- Retry com backoff exponencial para outros erros

## 📝 Licença

Este projeto é privado e de propriedade da Beauty Smile.

## 👥 Contribuidores

- Desenvolvido para Beauty Smile
- Integração com API Biologix

## 📞 Suporte

Para questões sobre:
- **API Biologix**: Contate o suporte Biologix
- **Supabase**: Consulte a [documentação oficial](https://supabase.com/docs)
- **Projeto**: Consulte a documentação em `/docs` ou `/PRD`

## 🐛 Troubleshooting

### Erro de Build no Vercel

Se encontrar erro relacionado a variáveis de ambiente:
1. Verifique se todas as variáveis estão configuradas no Vercel
2. Certifique-se de que as variáveis usam valores diretos (não Secrets)
3. Faça um redeploy após configurar variáveis

### Erro 404 na página `/logs`

Certifique-se de que:
- O arquivo `app/logs/page.tsx` existe
- A pasta não está sendo ignorada pelo `.gitignore`
- Um deploy foi feito após adicionar a página

### Problemas de autenticação

- Verifique se as URLs de redirecionamento estão configuradas no Supabase
- Confirme que `NEXT_PUBLIC_SUPABASE_URL` está correto
- Verifique os logs do navegador (F12) para erros específicos

---

## 📖 Guia das Páginas

Descrição das telas principais do sistema (com base nas interfaces atuais).

### Dashboard — Aba Geral (`/dashboard`)

<img width="1061" height="949" alt="Dashboard Geral" src="https://github.com/user-attachments/assets/bde3c4d2-9041-4406-8645-0cbd2aace310" />

<img width="1062" height="944" alt="Dashboard Geral - scroll" src="https://github.com/user-attachments/assets/051a102f-f002-44df-bc38-162411327ccd" />

Visão geral operacional do sistema Beauty Sleep.

- **KPIs:** Total de Pacientes, Leads para Converter, Exames Realizados e Taxa de Conversão
- **Ações Pendentes:** quatro colunas — Leads sem Follow-up, Pacientes sem Sessão, Manutenção Atrasada e Completando Tratamento (clique abre o paciente)
- **Exames Recentes:** tabela com paciente, data, tipo (Sono/Ronco), IDO (com badge Leve/Moderado), Score Ronco e “Ver Detalhes”
- **Tempo Médio de Tratamento:** gráfico de barras do tempo médio (em dias) até a conclusão do tratamento, por categoria inicial de IDO (Normal, Leve, Moderado, Acentuado), com filtros de período e categoria

### Dashboard — Aba Ronco

<img width="1065" height="939" alt="Dashboard Ronco" src="https://github.com/user-attachments/assets/824ab59b-098e-44bb-97f2-0d52831a337a" />

Foco em indicadores de ronco da base de pacientes.

- Cards: **Score Médio de Ronco** e **Total de Pacientes com Ronco Alto**
- **Distribuição de Ronco:** gráfico (Alto / Médio / Baixo)
- **Tendência de Score de Ronco:** evolução do score médio ao longo do tempo
- Tabela **Casos Críticos** (score elevado) com botão “Ver Paciente”

### Dashboard — Aba Apneia

<img width="1267" height="957" alt="Dashboard Apneia" src="https://github.com/user-attachments/assets/b126e43b-19c7-47b7-b60c-cb1f9c588915" />

<img width="1268" height="945" alt="Dashboard Apneia - scroll" src="https://github.com/user-attachments/assets/09995723-5b80-425d-ac1c-01d676b06806" />

Visão clínica de apneia, com filtro de período (ex.: últimos 90 dias).

- Cards: **IDO Médio**, **Casos Críticos** e **SpO2 Médio**
- **Distribuição por Categoria IDO** (Normal → Acentuado)
- **Tendência de IDO e SpO2** (gráfico de linhas)
- Tabela **Top 10 Melhorias (IDO):** IDO inicial/final, % de melhora e “Ver Paciente”
- Tabela **Casos Críticos (IDO Acentuado):** IDO, SpO2 mínimo e data do exame

### Pacientes — Lista (`/pacientes`)

<img width="1255" height="952" alt="Lista de Pacientes" src="https://github.com/user-attachments/assets/29c1dd99-dd03-462b-86b4-5b062054240c" />

Tela para gerenciar todos os pacientes do sistema.

- Busca por nome ou CPF
- Botão **+ Novo Paciente** e **Filtros Avançados**
- Tabela: Nome, CPF, Status (Lead / Ativo / Finalizado / Inativo), Adesão %, Último Exame
- Ações: **Ver Detalhes** (abre o perfil) e exclusão (ícone de lixeira)

### Pacientes — Perfil (`/pacientes/[id]`)

<img width="1266" height="956" alt="Visao geral" src="https://github.com/user-attachments/assets/66ee84c7-2df2-4fa5-bfcc-5a6cd3cc7798" />


Prontuário do paciente com dados cadastrais e resumo do tratamento.

- Cabeçalho: nome, status, gênero/idade, CPF, email, telefone, nascimento
- Tags, Observações Gerais e ações: Nova Sessão, Adicionar Nota, Editar Paciente
- **Resumo de Tratamento:** sessões compradas, adicionadas, utilizadas e disponíveis + barra de adesão
- Abas: Exames, Sessões, Evolução, Peso/IMC, Notas e Histórico

### Perfil do Paciente — Aba Exames

<img width="1268" height="948" alt="Aba Exames" src="https://github.com/user-attachments/assets/3d6d4a77-eb07-4f82-8132-4b131b157cf0" />

Histórico de exames Biologix do paciente.

- Filtros por tipo e intervalo de datas
- Tabela: Data (badge “Novo” em exames recentes), Tipo, Status, IDO com classificação (Leve/Moderado/etc.) e Score Ronco
- Ações por exame: visualizar, baixar PDF e excluir

### Perfil do Paciente — Aba Sessões

<img width="1268" height="948" alt="Aba Sessões" src="https://github.com/user-attachments/assets/46f26fdf-8101-4789-9f8f-96372128753f" />

Registro das sessões de tratamento a laser.

- Botão **+ Nova Sessão** e filtro por data
- Tabela: Data, Protocolo (ex.: Combinado), Pulsos, Dentista
- Ações: editar e excluir sessão

### Perfil do Paciente — Aba Evolução

<img width="979" height="956" alt="Aba Evolução" src="https://github.com/user-attachments/assets/c0874b30-3956-493c-9f73-d0c5f7284d1a" />

<img width="979" height="956" alt="Aba Evolução - comparações" src="https://github.com/user-attachments/assets/ea8300a9-0fa6-4aa9-b0fb-29490cafb563" />

Acompanhamento da evolução clínica ao longo dos exames.

- Filtro de período (Todo o Período / 12 meses / 6 meses)
- Seleção de métrica (IDO, SpO2, dessaturações, carga hipóxica, frequência cardíaca, etc.)
- Gráfico de linha da métrica escolhida
- Cards **Pior → Melhor** com percentual de evolução
- Comparações: **Primeiro vs Último Exame** e **Pior vs Melhor Exame (baseado em IDO)**

### Perfil do Paciente — Aba Peso/IMC

<img width="985" height="957" alt="Aba Peso/IMC" src="https://github.com/user-attachments/assets/438c0a89-b00c-4172-90e3-eab69e45a9ac" />

Acompanhamento de peso e índice de massa corporal.

- Gráfico de evolução do peso (kg)
- Gráfico de evolução do IMC
- Comparação **Inicial vs Atual** (mudança absoluta e percentual, com classificação do IMC)

### Alertas (`/alertas`)

<img width="983" height="958" alt="Alertas" src="https://github.com/user-attachments/assets/930765f4-064c-4f6d-90fa-e1e5e16c4726" />

Fila de alertas clínicos e operacionais do sistema.

- Filtros e seleção em lote (“Selecionar todos”)
- Cards com título (ex.: Piora de IDO, Fibrilação Atrial, SpO2 Crítico, IDO Acentuado), status Pendente, tipo, urgência, data e paciente
- Ações: **Ver Paciente** e **Marcar como Resolvido**

### Logs de Auditoria (`/logs`) — Admin

<img width="953" height="949" alt="Logs de Auditoria" src="https://github.com/user-attachments/assets/47f0ec41-b850-4c56-afab-16d3c73f264b" />

<img width="990" height="957" alt="Detalhe do Log" src="https://github.com/user-attachments/assets/14f6e928-5139-415f-8ef2-e7357c97b0c7" />

Histórico de ações realizadas no sistema.

- Filtros (usuário, entidade, ação, data) e botão Atualizar
- Tabela: Data/Hora, Usuário (inclui “Sistema”), Ação (Criar/Atualizar), Entidade, ID e resumo
- **Detalhe do log (`/logs/[id]`):** mostra ação, entidade, usuário e todos os campos criados/alterados (ex.: criação de paciente via Biologix)

---

**Versão**: 1.0.0  
**Última atualização**: Dezembro 2025  
**Repositório**: [https://github.com/fercosnt/Sistema-Beauty-Sleep](https://github.com/fercosnt/Sistema-Beauty-Sleep)
