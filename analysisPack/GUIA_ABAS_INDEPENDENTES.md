# 🎯 Guia - Abas Independentes na Análise Financeira

Sistema refatorado onde cada aba funciona de forma independente com seu próprio botão "Gerar".

---

## 🎉 O Que Mudou

### ✅ Antes
```
- Tudo dependia da aba "IA Financeira"
- Sumário/Ações/Slides só apareciam se gerado pela IA
- Trocar de aba perdia os dados
```

### ✅ Agora
```
✅ Cada aba tem seu próprio botão "Gerar"
✅ Cada aba funciona independentemente
✅ Trocar de aba NÃO perde os dados
✅ Dados só são regerados ao clicar "Gerar" novamente
✅ Indicador visual (🟢) mostra abas com conteúdo
```

---

## 🎨 Nova Interface

### Estrutura das Abas

```
┌──────────────────────────────────────────────────────┐
│ 📊 Análise Financeira                                │
│                                         [Gerar ✨]    │ ← Botão específico da aba
├──────────────────────────────────────────────────────┤
│ [Sumário🟢] [Ações🟢] [Slides🟢] [IA]               │ ← 🟢 = tem conteúdo
├──────────────────────────────────────────────────────┤
│                                                       │
│  Conteúdo da aba ativa                               │
│                                                       │
│  [Regerar ↻] ← Botão no final para regerar          │
└──────────────────────────────────────────────────────┘
```

---

## ⚡ Funcionalidades por Aba

### 📄 Aba 1: Sumário Executivo

**Botão no header:**
```
[✨ Gerar Sumário Executivo]  ← Laranja
```

**O que faz:**
1. Busca contexto do Supabase
2. Chama `/api/analysis/generate-ai` com `type: 'summary'`
3. Mostra loading (ícone girando)
4. Salva resultado em `summaryData`
5. Renderiza `ExecutiveSummary`

**Quando está vazio:**
- Mostra empty state com ícone
- "Nenhum sumário gerado ainda"
- Dica: "Use o botão laranja no canto superior direito"

**Quando tem conteúdo:**
- Renderiza sumário completo
- Botão "Regerar Sumário" no final

**Indicador:**
- 🟢 Bolinha verde na tab quando tem conteúdo

---

### 📋 Aba 2: Plano de Ação

**Botão no header:**
```
[✨ Gerar Plano de Ação]  ← Laranja
```

**O que faz:**
1. Busca contexto do Supabase
2. Chama `/api/analysis/generate-ai` com `type: 'actions'`
3. Mostra loading
4. Salva resultado em `actionsData`
5. Renderiza `ActionsList`

**Quando está vazio:**
- Empty state com ícone de checklist
- "Nenhum plano de ação gerado"

**Quando tem conteúdo:**
- Lista de ações completa
- Botão "Regerar Plano de Ação" no final

**Indicador:**
- 🟢 Bolinha verde na tab quando tem conteúdo

---

### 🎨 Aba 3: Slides de Análise

**Botões no header:**
```
[✨ Gerar Slides]  [📊 Exportar PowerPoint]
    Laranja              Verde (só aparece se tiver slides)
```

**O que faz:**
1. Busca contexto do Supabase
2. Chama `/api/analysis/generate-ai` com `type: 'full'`
3. Mostra loading
4. Salva resultado em `slidesData` (pack + context)
5. Renderiza `SlideDeck` completo

**Quando está vazio:**
- Empty state com ícone de apresentação
- "Nenhum slide gerado"

**Quando tem conteúdo:**
- SlideDeck completo renderizado
- Gráficos interativos
- Botão "Exportar PowerPoint" aparece
- Botão "Regerar Slides" no final

**Exportar PowerPoint:**
- Só funciona se tiver slides gerados
- Exporta todos os slides + gráficos
- Download automático do .pptx

**Indicador:**
- 🟢 Bolinha verde na tab quando tem conteúdo

---

### 💬 Aba 4: IA Financeira

**Sem botão no header** (chat sempre disponível)

**O que é:**
- Chat interativo com Gemini
- Insights automáticos
- Perguntas e respostas

**Sempre disponível:**
- Não precisa gerar
- Funciona independentemente
- Não tem empty state

---

## 🔄 Como Funciona

### Fluxo de Geração

```
Usuário na aba "Sumário Executivo"
  ↓
Clica "Gerar Sumário Executivo" (botão laranja)
  ↓
Loading aparece (ícone girando)
  ↓
1. fetchAnalysisContext() busca dados do Supabase
  ↓
2. POST /api/analysis/generate-ai
   { context, type: 'summary' }
  ↓
3. API retorna { data: { executive_summary, meta } }
  ↓
4. Salva em summaryData
  ↓
5. Loading desaparece
  ↓
6. Renderiza ExecutiveSummary
  ↓
7. 🟢 Indicador verde aparece na tab
```

### Troca de Aba

```
Usuário tem sumário gerado
  ↓
Clica na aba "Plano de Ação"
  ↓
Tab muda, mas summaryData NÃO é perdido
  ↓
Mostra empty state de ações (ainda não gerou)
  ↓
Clica "Gerar Plano de Ação"
  ↓
Gera ações, salva em actionsData
  ↓
Volta para aba "Sumário"
  ↓
Sumário ainda está lá! (summaryData mantido)
```

---

## 💾 Estado dos Dados

### Estados Separados

```typescript
// Cada aba tem seu próprio estado
const [summaryData, setSummaryData] = useState(null);   // Sumário
const [actionsData, setActionsData] = useState(null);   // Ações
const [slidesData, setSlidesData] = useState(null);     // Slides

// Loadings separados
const [summaryLoading, setSummaryLoading] = useState(false);
const [actionsLoading, setActionsLoading] = useState(false);
const [slidesLoading, setSlidesLoading] = useState(false);
```

### Persistência

- ✅ Trocar de aba **não** apaga dados
- ✅ Dados são mantidos até:
  - Clicar "Regerar" novamente
  - Refresh da página
  - Sair e voltar para "Análise Financeira"

---

## 🎯 Exemplos de Uso

### Cenário 1: Gerar Tudo

```
1. Entrar em "Análise Financeira"
2. Aba "Sumário" está ativa (padrão)
3. Clicar "Gerar Sumário Executivo"
4. Aguardar 5-10s → Sumário aparece
5. Clicar na aba "Plano de Ação"
6. Clicar "Gerar Plano de Ação"
7. Aguardar 5-10s → Ações aparecem
8. Clicar na aba "Slides de Análise"
9. Clicar "Gerar Slides"
10. Aguardar 10-15s → Slides aparecem
11. Clicar "Exportar PowerPoint" → Download .pptx

Resultado: Todas as 3 abas com 🟢 verde
```

### Cenário 2: Gerar Apenas Slides

```
1. Entrar em "Análise Financeira"
2. Ir direto para aba "Slides de Análise"
3. Clicar "Gerar Slides"
4. Aguardar 10-15s → Slides aparecem
5. Trocar para "Sumário" → Empty state (não gerou)
6. Trocar de volta para "Slides" → Slides ainda estão lá!

Resultado: Só aba "Slides" com 🟢 verde
```

### Cenário 3: Regerar Conteúdo

```
1. Já tem sumário gerado
2. Na aba "Sumário", rolar até o final
3. Clicar "Regerar Sumário"
4. Aguardar 5-10s → Novo sumário aparece
5. Sumário antigo foi substituído

Resultado: Sumário atualizado
```

---

## 🔧 Integração com API

### Endpoint Único

Todas as abas usam o mesmo endpoint:
```
POST /api/analysis/generate-ai
```

### Parâmetro `type`

```typescript
// Sumário Executivo
{ context, type: 'summary' }

// Plano de Ação
{ context, type: 'actions' }

// Slides Completos
{ context, type: 'full' }
```

### Resposta Esperada

**Para `type: 'summary'`:**
```json
{
  "data": {
    "executive_summary": {
      "headline": "...",
      "bullets": [...],
      "risks": [...],
      "opportunities": [...]
    },
    "meta": {
      "org_name": "RAIZ",
      "period_label": "Jan/2026",
      ...
    }
  }
}
```

**Para `type: 'actions'`:**
```json
{
  "data": {
    "actions": [
      { "owner": "...", "action": "...", "eta": "...", ... },
      ...
    ]
  }
}
```

**Para `type: 'full'`:**
```json
{
  "data": {
    "meta": {...},
    "executive_summary": {...},
    "actions": [...],
    "charts": [...],
    "slides": [...]
  }
}
```

---

## ✅ Checklist de Funcionalidades

### Visual
- [ ] Cada aba tem botão "Gerar" no header
- [ ] Botão laranja (#F44C00)
- [ ] Loading mostra ícone girando
- [ ] Empty states aparecem quando vazio
- [ ] 🟢 Indicador verde quando tem conteúdo
- [ ] Botão "Exportar PPT" aparece só na aba Slides (se tiver conteúdo)

### Funcional
- [ ] Clicar "Gerar Sumário" → Busca dados + Gera sumário
- [ ] Clicar "Gerar Ações" → Busca dados + Gera ações
- [ ] Clicar "Gerar Slides" → Busca dados + Gera slides
- [ ] Trocar de aba NÃO perde dados
- [ ] Clicar "Regerar" substitui conteúdo
- [ ] Loading states funcionam
- [ ] Botão desabilita durante loading

### API
- [ ] POST /api/analysis/generate-ai com type=summary funciona
- [ ] POST /api/analysis/generate-ai com type=actions funciona
- [ ] POST /api/analysis/generate-ai com type=full funciona
- [ ] fetchAnalysisContext busca dados do Supabase
- [ ] Erros são tratados (alert de erro)

---

## 🐛 Troubleshooting

### ❌ Erro ao gerar

**Causa:** API não existe ou retornou erro

**Solução:**
1. Verificar se `/api/analysis/generate-ai` existe
2. Verificar logs do console (F12)
3. Verificar se Supabase está acessível
4. Testar com dados mock (se disponível)

### ❌ Loading infinito

**Causa:** API não respondeu

**Solução:**
1. Refresh da página (F5)
2. Verificar rede (DevTools → Network)
3. Timeout da API (aumentar limite)

### ❌ Dados desaparecem ao trocar de aba

**Causa:** Bug (não deveria acontecer)

**Solução:**
1. Verificar se estados estão corretos
2. Console.log para debug
3. Reportar bug

---

## 🎯 Benefícios

### ✅ Independência
- Cada aba funciona sozinha
- Não precisa gerar tudo
- Foco no que importa

### ✅ Persistência
- Dados não são perdidos
- Pode alternar entre abas
- Regerar quando quiser

### ✅ Flexibilidade
- Gerar só sumário rápido
- Ou gerar slides completos
- Ou usar chat da IA

### ✅ UX
- Indicador visual de conteúdo (🟢)
- Loading states claros
- Botões contextuais

---

## 📚 Documentação Relacionada

- `analysisPack/CHANGELOG_TABS.md` - Histórico de mudanças
- `analysisPack/FINAL_SUMMARY.md` - Funcionalidades completas
- `analysisPack/FUNCIONALIDADES_IMPLEMENTADAS.md` - Lista de features

---

**Data:** 30 de Janeiro de 2026
**Versão:** 2.2.0
**Status:** ✅ IMPLEMENTADO

🎉 **Abas independentes funcionando!**
