# API Endpoints - DRE RAIZ

## 📋 Visão Geral

Esta pasta contém os endpoints de API para o sistema DRE RAIZ.

## 🔧 Configuração

### Opção 1: Vercel/Next.js (Recomendado)

Se estiver usando Vercel ou Next.js, os arquivos nesta pasta funcionam automaticamente como API Routes.

```bash
# Deploy para Vercel
vercel deploy
```

### Opção 2: Express.js (Manual)

Se quiser usar Express localmente:

```bash
npm install express cors
```

Crie `server.js`:

```javascript
const express = require('express');
const cors = require('cors');
const generateAiHandler = require('./api/analysis/generate-ai').default;

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint de geração com IA
app.post('/api/analysis/generate-ai', generateAiHandler);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
```

Execute:

```bash
node server.js
```

### Opção 3: Vite Proxy (Desenvolvimento)

Configure proxy no `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
```

## 📡 Endpoints

### POST /api/analysis/generate-ai

Gera um AnalysisPack usando Claude (Anthropic) com JSON Schema nativo.

#### Request

```typescript
POST /api/analysis/generate-ai
Content-Type: application/json

{
  "context": {
    "org_name": "RAIZ EDUCAÇÃO",
    "currency": "BRL",
    "period_label": "Janeiro/2026",
    "scope_label": "Consolidado",
    "kpis": [
      {
        "code": "revenue",
        "name": "Receita Total",
        "unit": "currency",
        "actual": 74500000,
        "plan": 72200000,
        "delta_vs_plan": 3.18
      }
    ],
    "datasets": {
      "r12": { ... },
      "ebitda_bridge_vs_plan_ytd": { ... }
    },
    "analysis_rules": {
      "prefer_pareto": true,
      "highlight_threshold_currency": 100000
    }
  }
}
```

#### Response - Sucesso (200)

```typescript
{
  "success": true,
  "data": {
    "meta": { ... },
    "executive_summary": { ... },
    "actions": [ ... ],
    "charts": [ ... ],
    "slides": [ ... ]
  }
}
```

#### Response - Erros

**400 - Bad Request**
```json
{
  "error": "context obrigatório",
  "message": "O body deve conter um objeto \"context\" do tipo AnalysisContext"
}
```

**422 - Validation Error**
```json
{
  "error": "IA retornou JSON inválido (Zod)",
  "issues": [
    {
      "code": "invalid_type",
      "path": ["slides", 0, "title"],
      "message": "Expected string, received undefined"
    }
  ]
}
```

**500 - API Key Error**
```json
{
  "error": "API key não configurada",
  "message": "Configure ANTHROPIC_API_KEY no .env"
}
```

**502 - Claude API Error**
```json
{
  "error": "Erro ao comunicar com Claude API",
  "message": "Claude API erro 429: Rate limit exceeded"
}
```

## 🧪 Teste no Frontend

```typescript
import { buildDatasets, buildKPIs } from '@/services/analysisService';

async function generateAnalysis() {
  // 1. Preparar contexto
  const datasets = buildDatasets(transactions);
  const kpis = buildKPIs(schoolKPIs, transactions);

  const context = {
    org_name: "RAIZ EDUCAÇÃO",
    currency: "BRL",
    period_label: "Janeiro/2026",
    scope_label: "Consolidado",
    kpis,
    datasets
  };

  // 2. Chamar API
  const response = await fetch('/api/analysis/generate-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context })
  });

  // 3. Processar resposta
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const { data } = await response.json();
  return data; // AnalysisPack validado
}
```

## 🔐 Segurança

### Variáveis de Ambiente

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
```

### Rate Limiting (Recomendado)

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10 // 10 requests por IP
});

app.post('/api/analysis/generate-ai', limiter, generateAiHandler);
```

### Autenticação (Produção)

```typescript
// Middleware de auth
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token || !validateToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

app.post('/api/analysis/generate-ai', requireAuth, generateAiHandler);
```

## 📊 Custos Estimados

| Volume | Custo/Mês (USD) |
|--------|-----------------|
| 10 análises/dia | ~$15 |
| 50 análises/dia | ~$75 |
| 100 análises/dia | ~$150 |

*Baseado em Claude Sonnet 4.5 (~$0.05/análise)

## 🛠️ Troubleshooting

### Erro: "ANTHROPIC_API_KEY não configurado"

```bash
# Adicione no .env
ANTHROPIC_API_KEY=sua_chave_aqui
```

### Erro: "CORS blocked"

```typescript
// server.js
app.use(cors({
  origin: 'http://localhost:3002',
  credentials: true
}));
```

### Timeout na geração

```typescript
// Aumente maxTokens ou reduza complexidade
jsonSchema: analysisPackJsonSchema(),
maxTokens: 8000 // Aumentado de 5000
```

## 📚 Referências

- [Anthropic API Docs](https://docs.anthropic.com/)
- [Claude JSON Mode](https://docs.anthropic.com/en/docs/build-with-claude/json-mode)
- [Zod Validation](https://zod.dev/)

---

**Desenvolvido por:** Claude Code (Anthropic)
