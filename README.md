<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 📊 DRE - RAIZ 2.0

Sistema avançado de Demonstração de Resultados do Exercício (DRE) com sincronização bidirecional, análise gerencial, IA e exportação de relatórios.

**Versão:** 2.0 | **Última atualização:** 10/02/2026

---

## 🚀 Funcionalidades Principais

### ✅ Gestão de Transações
- **Visualização de Lançamentos**: Tabela com 114k+ registros
- **Paginação Server-Side**: 1000 registros por página com navegação otimizada
- **Filtros Avançados**: 14 filtros enviados ao servidor (período, cenário, marca, filial, tags, vendor, ticket, etc.)
- **Edição em Tempo Real**: Sincronização bidirecional com Supabase Realtime
- **Busca Inteligente**: Filtros case-insensitive com `ilike`

### 📈 DRE Gerencial
- **Agregação no Servidor**: RPC PostgreSQL retorna ~2000 linhas agregadas (vs 119k brutas)
- **Hierarquia de 3 Níveis**: tag0 → tag01 → conta_contabil
- **Drill-Down Dinâmico**: Expansão sob demanda via `get_dre_dimension()`
- **Filtros Cascata**: Marca, Filial, Tags com opções dinâmicas do banco
- **Cálculos Automáticos**: MARGEM e EBITDA por tipo predominante

### 📊 Dashboards Executivos
- **KPIs em Tempo Real**: Cards com métricas principais
- **Gráficos Interativos**: ECharts, Recharts, Nivo, Plotly
- **Forecasting**: Previsões com Machine Learning
- **Visualizações Customizadas**: Heatmaps, line charts, bar charts, pie charts

### 📄 Exportação de Relatórios
- **PowerPoint Avançado**: 12 layouts + 9 temas via pptxgenjs
- **PowerPoint Simples**: Slides básicos com dados
- **PDF**: Exportação via pdfmake (dashboard + lançamentos)
- **DOCX**: Exportação via docx (dashboard + lançamentos)
- **Excel**: Exportação de transações via xlsx

### 🔐 Segurança e Permissões
- **RLS (Row-Level Security)**: Controle por marca, filial e tags
- **Autenticação Firebase**: Login seguro com Google/Email
- **Aprovação de Mudanças**: Workflow para alterações manuais
- **Auditoria Completa**: Log de todas as operações

### 🤖 IA e Automação
- **Relatórios com IA**: Claude AI (Anthropic) para análises narrativas
- **Google Gemini**: Insights e previsões
- **Pipeline de Dados**: Microsoft Fabric → Supabase (sync automático)
- **Circuit Breaker**: Resiliência em operações de sincronização
- **Retry Logic**: Tentativas automáticas com jitter

---

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** v18 ou superior ([Download](https://nodejs.org/))
- **npm** ou **yarn** (vem com Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Conta Supabase** ([Criar conta](https://supabase.com/))
- **Conta Firebase** (opcional, para autenticação - [Criar conta](https://firebase.google.com/))
- **Chave API Anthropic Claude** (opcional, para relatórios com IA - [Obter chave](https://console.anthropic.com/))

---

## 🛠️ Instalação Local

### 1. Clone o Repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd "Ap proposta"
```

### 2. Instale as Dependências

```bash
npm install
```

Isso instalará todas as dependências listadas em `package.json`, incluindo:
- React 19 + TypeScript
- Supabase JS
- Firebase
- ECharts, Recharts, Nivo, Plotly
- pptxgenjs, pdfmake, docx
- Vite
- E muito mais...

**Tempo estimado:** 2-5 minutos (dependendo da conexão)

---

## ⚙️ Configuração

### 3. Configure as Variáveis de Ambiente

Copie o arquivo de exemplo e preencha com suas credenciais:

```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais:

```env
# ===== SUPABASE (OBRIGATÓRIO) =====
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ===== FIREBASE (OPCIONAL - para autenticação) =====
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-projeto-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# ===== CLAUDE AI (OPCIONAL - para relatórios com IA) =====
VITE_ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_API_KEY=sk-ant-api03-...
VITE_ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929

# ===== GOOGLE GEMINI (OPCIONAL - para insights IA) =====
VITE_GEMINI_API_KEY=AIzaSyC...

# ===== DEVELOPMENT MODE =====
# 0 = usar API real | 1 = usar dados mock
VITE_AI_REPORT_USE_MOCK=0
AI_REPORT_USE_MOCK=0

# ===== PIPELINE (OPCIONAL - para sync Microsoft Fabric) =====
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-service-role-aqui
```

**📌 Como obter as credenciais:**

#### Supabase (OBRIGATÓRIO)
1. Acesse [https://app.supabase.com/](https://app.supabase.com/)
2. Crie ou selecione seu projeto
3. Vá em **Settings → API**
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`

#### Firebase (Opcional - para autenticação)
1. Acesse [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Crie ou selecione seu projeto
3. Vá em **Project Settings → General**
4. Em **Your apps**, adicione um **Web app**
5. Copie o objeto `firebaseConfig` para as variáveis correspondentes

#### Claude AI (Opcional - para relatórios com IA)
1. Acesse [https://console.anthropic.com/](https://console.anthropic.com/)
2. Vá em **API Keys**
3. Clique em **Create Key**
4. Copie a chave gerada

#### Google Gemini (Opcional - para insights)
1. Acesse [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Crie uma API key
3. Copie a chave gerada

---

## 🗄️ Configuração do Banco de Dados Supabase

### 4. Crie as Tabelas no Supabase

Execute os scripts SQL no **SQL Editor** do Supabase na seguinte ordem:

#### 4.1. Criar Tabela Principal `transactions`

```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  description TEXT,
  conta_contabil TEXT,
  category TEXT,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  scenario TEXT NOT NULL DEFAULT 'REAL',
  status TEXT NOT NULL DEFAULT 'active',
  filial TEXT,
  marca TEXT,
  tag0 TEXT,
  tag01 TEXT,
  tag02 TEXT,
  tag03 TEXT,
  recurring TEXT,
  ticket TEXT,
  vendor TEXT,
  nat_orc TEXT,
  chave_id TEXT,
  nome_filial TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_scenario ON transactions(scenario);
CREATE INDEX idx_transactions_marca ON transactions(marca);
CREATE INDEX idx_transactions_filial ON transactions(filial);
CREATE INDEX idx_transactions_tag01 ON transactions(tag01);
CREATE INDEX idx_transactions_conta_contabil ON transactions(conta_contabil);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_date_id ON transactions(date DESC, id ASC);
```

#### 4.2. Criar Tabela `manual_changes`

```sql
CREATE TABLE manual_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES transactions(id),
  type TEXT NOT NULL,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT NOT NULL,
  justification TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  requested_by TEXT NOT NULL,
  requested_by_name TEXT NOT NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by TEXT,
  approved_by_name TEXT,
  original_transaction JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_manual_changes_status ON manual_changes(status);
CREATE INDEX idx_manual_changes_transaction_id ON manual_changes(transaction_id);
```

#### 4.3. Criar Funções RPC para DRE

Execute o conteúdo do arquivo `create_dre_rpc_functions.sql`:

```bash
# No Windows (PowerShell):
Get-Content create_dre_rpc_functions.sql | Set-Clipboard

# No Mac/Linux:
cat create_dre_rpc_functions.sql | pbcopy
```

Cole o conteúdo no **SQL Editor** do Supabase e execute.

As funções criadas:
- `get_dre_summary()` - Retorna dados agregados para DRE
- `get_dre_dimension()` - Drill-down por dimensão
- `get_dre_filter_options()` - Opções de filtros dinâmicos

#### 4.4. Configurar RLS (Row-Level Security)

Execute o conteúdo do arquivo `SCRIPT_COMPLETO_RLS.sql`:

```bash
# No Windows (PowerShell):
Get-Content SCRIPT_COMPLETO_RLS.sql | Set-Clipboard

# No Mac/Linux:
cat SCRIPT_COMPLETO_RLS.sql | pbcopy
```

Cole o conteúdo no **SQL Editor** do Supabase e execute.

Isso configurará:
- Políticas de acesso por marca
- Políticas de acesso por filial
- Políticas de acesso por tags (tag01, tag02, tag03)
- Permissões para usuários específicos

---

## 🏃 Executando o Projeto

### 5. Inicie o Servidor de Desenvolvimento

```bash
npm run dev
```

O projeto estará rodando em: **http://localhost:5173**

### Scripts Disponíveis

```bash
# Desenvolvimento (apenas frontend)
npm run dev

# Desenvolvimento completo (backend + frontend)
npm run dev:full

# Backend (API proxy para Claude AI)
npm run backend

# Proxy server
npm run proxy

# Build para produção
npm run build

# Preview da build de produção
npm run preview
```

---

## 📁 Estrutura do Projeto

```
Ap proposta/
├── components/              # Componentes React
│   ├── TransactionsView.tsx      # Guia Lançamentos
│   ├── DREView.tsx               # DRE Gerencial
│   ├── Dashboard.tsx             # Dashboard Principal
│   ├── DashboardEnhanced.tsx     # Dashboard Avançado
│   ├── ExecutiveDashboard.tsx    # Dashboard Executivo
│   ├── KPIsView.tsx              # KPIs
│   ├── ForecastingView.tsx       # Previsões
│   ├── ManualChangesView.tsx     # Aprovação de Mudanças
│   ├── AdminPanel.tsx            # Painel Admin
│   ├── Sidebar.tsx               # Menu Lateral
│   └── ContaContabilSelector.tsx # Seletor de Conta
├── services/                # Serviços
│   ├── supabaseService.ts        # Queries Supabase
│   ├── slideTypes.ts             # Types para Slides
│   ├── slidePptxService.ts       # Exportação PPT
│   ├── pdfExportService.ts       # Exportação PDF
│   ├── docxExportService.ts      # Exportação DOCX
│   ├── pptExportService.ts       # Exportação PPT Simples
│   ├── SyncManager.ts            # Circuit Breaker
│   └── OperationQueue.ts         # Retry Logic
├── contexts/                # Contexts React
│   └── TransactionsContext.tsx   # Estado Global + Realtime
├── utils/                   # Utilitários
│   └── chartDataTransformer.ts   # Transformação de dados
├── types.ts                 # Types TypeScript
├── supabase.ts              # Cliente Supabase
├── App.tsx                  # Componente Principal
├── index.tsx                # Entry Point
├── index.html               # HTML Principal
├── vite.config.ts           # Configuração Vite
├── package.json             # Dependências
├── .env.example             # Exemplo de variáveis de ambiente
├── create_dre_rpc_functions.sql  # Funções RPC
├── SCRIPT_COMPLETO_RLS.sql       # Script RLS
├── fabric_to_supabase_v2.py      # Pipeline de dados
└── README.md                # Este arquivo
```

---

## 📊 Populando o Banco de Dados

### Opção 1: Importar dados do Microsoft Fabric

Use o script Python `fabric_to_supabase_v2.py`:

```bash
# Configure as variáveis de ambiente
export SUPABASE_URL="https://seu-projeto.supabase.co"
export SUPABASE_KEY="sua-chave-service-role"

# Execute o pipeline
python fabric_to_supabase_v2.py
```

### Opção 2: Importar dados manualmente via CSV

1. Prepare um arquivo CSV com as colunas:
   - date, description, conta_contabil, amount, type, scenario, status
   - filial, marca, tag0, tag01, tag02, tag03
   - recurring, ticket, vendor, nat_orc, chave_id, nome_filial

2. No Supabase:
   - Vá em **Table Editor**
   - Selecione a tabela `transactions`
   - Clique em **Insert → Import data from CSV**
   - Faça upload do arquivo

### Opção 3: Dados de teste

Use o SQL abaixo para inserir dados de exemplo:

```sql
INSERT INTO transactions (date, description, conta_contabil, amount, type, scenario, status, marca, filial, tag0, tag01)
VALUES
  ('2026-01-01', 'Receita de vendas', '4.1.001', 100000, 'REVENUE', 'REAL', 'active', 'RAIZ', 'SP01', 'RECEITAS', 'Vendas'),
  ('2026-01-01', 'Custo de vendas', '3.1.001', -30000, 'COST', 'REAL', 'active', 'RAIZ', 'SP01', 'CUSTOS', 'CMV'),
  ('2026-01-01', 'Salários', '3.2.001', -20000, 'EXPENSE', 'REAL', 'active', 'RAIZ', 'SP01', 'DESPESAS', 'Pessoal'),
  ('2026-01-01', 'Marketing', '3.2.002', -5000, 'EXPENSE', 'REAL', 'active', 'RAIZ', 'SP01', 'DESPESAS', 'Marketing'),
  ('2026-01-01', 'Aluguel', '3.2.003', -10000, 'EXPENSE', 'REAL', 'active', 'RAIZ', 'SP01', 'DESPESAS', 'Infraestrutura'),
  ('2026-02-01', 'Receita de vendas', '4.1.001', 110000, 'REVENUE', 'REAL', 'active', 'RAIZ', 'SP01', 'RECEITAS', 'Vendas'),
  ('2026-02-01', 'Custo de vendas', '3.1.001', -33000, 'COST', 'REAL', 'active', 'RAIZ', 'SP01', 'CUSTOS', 'CMV');
```

---

## 🔍 Testando o Sistema

### 1. Acesse a aplicação
Abra o navegador em: **http://localhost:5173**

### 2. Navegue pelas guias

#### 🎯 Guia Lançamentos
- Teste os filtros (data, cenário, marca, filial, tags, etc.)
- Clique em "Buscar Dados" para aplicar filtros
- Use a paginação (ANTERIOR/PRÓXIMA)
- Teste a edição inline (clique duas vezes em uma célula)
- Experimente a busca por texto (vendor, ticket, description)
- Exporte para Excel

#### 📊 Guia DRE
- Selecione o período
- Escolha filtros de marca/filial/tags
- Clique em "Atualizar DRE"
- Expanda as linhas (setas à esquerda)
- Observe o drill-down dinâmico
- Visualize MARGEM e EBITDA

#### 📈 Guia Dashboard
- Visualize KPIs em tempo real
- Interaja com os gráficos
- Teste o botão "Exportar" (PPT, PDF, DOCX)
- Filtre por período

#### 📊 Guia KPIs
- Visualize métricas agregadas
- Compare cenários (REAL vs BUDGET)
- Veja variações percentuais
- Analise tendências

#### 🔮 Guia Forecasting
- Visualize previsões
- Ajuste parâmetros
- Compare cenários futuros
- Veja intervalos de confiança

#### ⚙️ Painel Admin
- Aprove/Rejeite mudanças manuais
- Configure permissões
- Gerencie usuários
- Visualize logs de auditoria

---

## 🐛 Troubleshooting

### Erro: "Supabase URL and Anon Key must be set"

**Solução:**
- Verifique se o arquivo `.env.local` existe na raiz do projeto
- Verifique se as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão preenchidas
- Reinicie o servidor (`Ctrl+C` e `npm run dev`)

### Erro: "Failed to fetch"

**Solução:**
- Verifique se o Supabase está acessível
- Verifique se as credenciais estão corretas
- Verifique se o RLS está configurado corretamente
- Tente acessar o Supabase URL no navegador

### Erro: "Function get_dre_summary does not exist"

**Solução:**
- Execute o arquivo `create_dre_rpc_functions.sql` no SQL Editor do Supabase
- Verifique se as funções foram criadas: `SELECT * FROM pg_proc WHERE proname = 'get_dre_summary';`

### Tabela vazia / Sem dados

**Solução:**
- Popule o banco de dados (veja seção "Populando o Banco de Dados")
- Verifique se o RLS não está bloqueando seu acesso
- Execute no SQL Editor: `SELECT * FROM transactions;`
- Se retornar vazio, insira dados de teste

### Performance lenta

**Solução:**
- Verifique se os índices foram criados (script SQL acima)
- Use a paginação server-side (não use "Buscar Tudo" para muitos registros)
- Reduza o número de filtros aplicados simultaneamente
- Verifique o plano de query no Supabase: `EXPLAIN ANALYZE SELECT...`

### Erro ao exportar PPT/PDF/DOCX

**Solução:**
- Verifique se as dependências foram instaladas: `npm install`
- Verifique o console do navegador para erros JavaScript
- Tente com menos dados (use filtros para reduzir o dataset)
- Limpe o cache do navegador (`Ctrl+Shift+Delete`)

### Erro: "Port 5173 is already in use"

**Solução:**
- Mate o processo: `npx kill-port 5173` ou `lsof -ti:5173 | xargs kill -9` (Mac/Linux)
- Use outra porta: `npm run dev -- --port 5174`

---

## 📝 Notas Importantes

### Decisões Técnicas

1. **useRef vs useState em Loops Async**
   - Sempre usar `useRef` para flags em loops assíncronos
   - `useState` cria closure que captura valor inicial
   - `useRef.current` é mutável e sempre tem valor atual

2. **Componentes Internos vs Externos**
   - NUNCA definir componentes com estado dentro de outro componente
   - Função interna = nova referência a cada render = perde estado
   - Componente externo + React.memo = estável, preserva estado

3. **Paginação: Scroll Infinito vs Navegação**
   - Scroll infinito tem race conditions com React state
   - Paginação com navegação é mais simples, sem duplicatas

4. **Supabase Realtime**
   - Filtros complexos não suportados → filtrar no cliente
   - Subscription apenas após busca (evita overhead)
   - Merge inteligente verifica pendingOperations

### Mapeamento de Colunas

- `conta_contabil` → coluna "Conta" na UI
- `category` → existe no banco mas não é usada (reservado para futuro)
- Ver arquivo `MAPEAMENTO_COLUNAS.md` para DE-PARA completo

### Performance

- Sistema suporta 114k+ registros
- Paginação: 1000 registros/página
- DRE: ~2000 linhas agregadas (vs 119k brutas)
- Ordenação estável: `date DESC, id ASC`
- Índices otimizados para queries frequentes

---

## 🚀 Deploy em Produção

### Vercel (Recomendado)

1. Instale a Vercel CLI:
```bash
npm i -g vercel
```

2. Faça login:
```bash
vercel login
```

3. Configure as variáveis de ambiente:
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_FIREBASE_API_KEY
# ... adicione todas as variáveis do .env.local
```

4. Deploy:
```bash
vercel --prod
```

### Outras Plataformas

- **Netlify**: `npm run build` → deploy da pasta `dist/`
- **GitHub Pages**: Configure o workflow `.github/workflows/deploy.yml`
- **AWS Amplify**: Conecte o repositório e configure as variáveis de ambiente

---

## 📚 Documentação Adicional

| Arquivo | Descrição |
|---------|-----------|
| `MEMORY.md` | Histórico de decisões técnicas |
| `MAPEAMENTO_COLUNAS.md` | DE-PARA banco ↔ UI |
| `PAGINACAO_SERVER_SIDE.md` | Documentação da paginação |
| `guia-slides-graficos-raiz.md` | Sistema de slides e exportação |
| `fases-sync.md` | Fases 1-5 da sincronização |
| `ajustes-06-02-2026.md` | Ajustes recentes |
| `create_dre_rpc_functions.sql` | Funções RPC PostgreSQL |
| `SCRIPT_COMPLETO_RLS.sql` | Row-Level Security |
| `fabric_to_supabase_v2.py` | Pipeline de dados |

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é proprietário da **Raiz Educação S.A.**

---

## 📞 Suporte

Para dúvidas ou problemas:
- Abra uma issue no repositório
- Entre em contato com o time de desenvolvimento
- Consulte a documentação no diretório do projeto

---

## 🎯 Roadmap

### ✅ Concluído (v2.0)
- [x] Sincronização bidirecional com Supabase
- [x] Paginação server-side (1000 registros/página)
- [x] DRE com agregação no servidor (RPC)
- [x] Drill-down dinâmico
- [x] Filtros cascata (Marca, Filial, Tags)
- [x] Sistema de slides (12 layouts + 9 temas)
- [x] Exportação PDF/DOCX
- [x] RLS por marca, filial e tags
- [x] Circuit breaker + Retry logic
- [x] Realtime com merge inteligente

### 🔜 Próximas Features (v2.1)
- [ ] Relatórios agendados (email automático)
- [ ] Dashboard customizável (drag & drop)
- [ ] Integração com Power BI
- [ ] Mobile app (React Native)
- [ ] Alertas inteligentes (webhooks)
- [ ] Análise preditiva avançada (ML)
- [ ] Otimização de performance (cache Redis)
- [ ] Testes automatizados (Playwright/Cypress)

---

**Desenvolvido com ❤️ pela equipe da Raiz Educação**

**Versão:** 2.0 | **Última atualização:** 10/02/2026
