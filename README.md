<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# 📊 DRE RAIZ - Sistema Financeiro Escolar

Sistema de gestão financeira com IA para instituições educacionais do Grupo Raiz.

View your app in AI Studio: https://ai.studio/apps/drive/1aquLSjsf9qgTlslV3gYQQ6HVc7JPypK7

## 🚀 Deploy Rápido

**Leia o [QUICK_START.md](QUICK_START.md) para instruções em 5 passos (~12 minutos)**

## 🛠️ Tecnologias

- **Frontend**: React 19 + TypeScript + Vite
- **Autenticação**: Firebase Auth (Google)
- **Banco de Dados**: Supabase (PostgreSQL)
- **IA**: Google Gemini
- **Gráficos**: Recharts
- **Deploy**: Vercel
- **Estilo**: TailwindCSS

## 💻 Rodar Localmente

**Pré-requisitos:** Node.js 18+

1. Clone o repositório
2. Instale dependências:
   ```bash
   npm install
   ```
3. Copie `.env.example` para `.env` e preencha as credenciais:
   ```bash
   cp .env.example .env
   ```
4. Configure o Supabase (veja [QUICK_START.md](QUICK_START.md))
5. Execute o projeto:
   ```bash
   npm run dev
   ```
6. Acesse: http://localhost:3002

## 📦 Deploy para Produção

### Opção 1: Vercel (Recomendado)

1. Faça push para GitHub
2. Importe o projeto na [Vercel](https://vercel.com)
3. Configure as variáveis de ambiente
4. Deploy automático! ✅

### Opção 2: Build Manual

```bash
npm run build
npm run preview
```

## 📚 Documentação

- **[QUICK_START.md](QUICK_START.md)** - Configuração rápida em 5 passos
- **[DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)** - Guia completo de deploy
- **[schema.sql](schema.sql)** - Estrutura do banco de dados

## 🔐 Variáveis de Ambiente

```env
API_KEY=                    # Firebase API Key
VITE_SUPABASE_URL=          # URL do projeto Supabase
VITE_SUPABASE_ANON_KEY=     # Anon key do Supabase
VITE_GEMINI_API_KEY=        # API key do Google Gemini
```

## 📊 Funcionalidades

- ✅ Dashboard financeiro com KPIs
- ✅ Gestão de transações (receitas/despesas)
- ✅ DRE (Demonstrativo de Resultados)
- ✅ Sistema de aprovações de mudanças
- ✅ Insights com IA (Google Gemini)
- ✅ Análise preditiva e forecasting
- ✅ Filtros por marca e unidade
- ✅ Importação de planilhas Excel
- ✅ Autenticação com Google

## 🗄️ Estrutura do Banco

O sistema usa Supabase (PostgreSQL) com duas tabelas principais:
- `transactions` - Transações financeiras
- `manual_changes` - Histórico de aprovações

Execute o script `schema.sql` no SQL Editor do Supabase para criar as tabelas.

## 🔄 Migração de Dados

Se você tem dados no localStorage, use o componente `MigrationHelper`:

1. Importe no `App.tsx`
2. Adicione na view desejada
3. Execute a migração UMA vez
4. Remova o componente

## 🔄 Duplicação do Projeto

Precisa criar múltiplas instâncias? Veja:
- **[RESUMO_DUPLICACAO.md](RESUMO_DUPLICACAO.md)** - Resumo visual e rápido
- **[DUPLICACAO_GUIA.md](DUPLICACAO_GUIA.md)** - Guia completo de duplicação

### Scripts de Duplicação Automática:
```bash
# Windows
duplicar-projeto.bat

# Mac/Linux
bash duplicar-projeto.sh
```

## 📚 Índice da Documentação

| Arquivo | Descrição | Tempo |
|---------|-----------|-------|
| [README.md](README.md) | Visão geral do projeto | 5 min |
| [QUICK_START.md](QUICK_START.md) | Deploy rápido em 5 passos | 12 min |
| [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md) | Guia detalhado de deploy | 20 min |
| [DUPLICACAO_GUIA.md](DUPLICACAO_GUIA.md) | Guia completo de duplicação | 15 min |
| [RESUMO_DUPLICACAO.md](RESUMO_DUPLICACAO.md) | Resumo visual de duplicação | 3 min |
| [CHECKLIST.md](CHECKLIST.md) | Checklist de deploy | 5 min |
| [schema.sql](schema.sql) | Estrutura do banco de dados | - |

## 📝 Licença

Propriedade do Grupo Raiz Educação
