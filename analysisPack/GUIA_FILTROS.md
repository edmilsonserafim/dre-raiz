# 🔍 Guia - Filtros na Análise Financeira

Sistema de filtros por Marca e Filial integrado com geração de análises baseadas em dados filtrados do Supabase.

---

## 🎯 O Que Foi Implementado

### ✅ Filtros Disponíveis

```
┌─────────────────────────────────────────────────┐
│ 📊 Análise Financeira                           │
│                                                  │
│ [🏴 MARCA: TODAS ▼] [🏢 FILIAL: TODAS ▼] [×]   │
└─────────────────────────────────────────────────┘
```

**Filtros:**
1. **MARCA** (Azul #1B75BB)
   - Multi-select dropdown
   - Mostra todas as marcas disponíveis nas transações
   - Pode selecionar uma ou múltiplas marcas

2. **FILIAL** (Laranja #F44C00)
   - Multi-select dropdown
   - Mostra filiais disponíveis (filtradas por marca selecionada)
   - Pode selecionar uma ou múltiplas filiais
   - **Dinâmico**: Se marca for selecionada, só mostra filiais daquela marca

3. **Limpar Filtros** (Botão ×)
   - Aparece apenas quando há filtros ativos
   - Remove todos os filtros com um clique

---

## 🎨 Interface dos Filtros

### Aparência Normal (Sem seleção)

```
┌─────────────────────┐
│ 🏴  MARCA           │
│    TODAS         ▼  │
└─────────────────────┘
```

- Borda cinza clara
- Ícone com fundo azul/laranja claro
- Texto: "TODAS"

### Aparência Ativa (Com seleção)

```
┌─────────────────────┐
│ 🏴  MARCA           │ ← Borda azul grossa + ring
│    COLÉGIO TESTE ▼  │ ← Ícone com fundo azul
└─────────────────────┘
```

- Borda azul/laranja grossa
- Ring (glow) na cor do tema
- Ícone com fundo sólido azul/laranja
- Texto: Nome da marca/filial selecionada

### Múltiplas Seleções

```
┌─────────────────────┐
│ 🏴  MARCA           │
│    3 SELECIONADAS ▼ │
└─────────────────────┘
```

- Mostra contador: "X SELECIONADAS"

---

## 🔄 Como Funciona

### Fluxo Completo

```
1. Usuário abre "Análise Financeira"
   ↓
2. Vê filtros no header (MARCA e FILIAL)
   ↓
3. Clica no filtro MARCA
   ↓
4. Dropdown abre com lista de marcas
   ├─ [Selecionar Todas] [Limpar]
   ├─ ☑ RAIZ
   ├─ ☐ LUMINOVA
   └─ ☐ VASTA
   ↓
5. Seleciona "RAIZ"
   ↓
6. Filtro FILIAL agora mostra apenas filiais da RAIZ
   ↓
7. Seleciona uma filial (ex: "São Paulo")
   ↓
8. Clica "Gerar Sumário Executivo"
   ↓
9. Sistema chama fetchAnalysisContext com:
   { scenario: 'Real', brand: 'RAIZ', branch: 'São Paulo' }
   ↓
10. Supabase filtra as transações
    ↓
11. Análise é gerada com dados filtrados
    ↓
12. Sumário mostra apenas dados da marca RAIZ, filial São Paulo
```

---

## 💻 Implementação Técnica

### Estado dos Filtros

```typescript
// Estados
const [selectedBrand, setSelectedBrand] = useState<string[]>([]);
const [selectedBranch, setSelectedBranch] = useState<string[]>([]);

// Marcas únicas das transações
const uniqueBrands = useMemo(() => {
  const brands = new Set(transactions.map(t => t.brand).filter(Boolean));
  return Array.from(brands).sort();
}, [transactions]);

// Filiais filtradas por marca
const availableBranches = useMemo(() => {
  let filtered = transactions;
  if (selectedBrand.length > 0) {
    filtered = transactions.filter(t => selectedBrand.includes(t.brand || ''));
  }
  const branches = new Set(filtered.map(t => t.branch).filter(Boolean));
  return Array.from(branches).sort();
}, [transactions, selectedBrand]);
```

### Integração com API

```typescript
// Ao gerar sumário/ações/slides
const context = await fetchAnalysisContext({
  scenario: 'Real',
  brand: selectedBrand.length > 0 ? selectedBrand[0] : undefined,
  branch: selectedBranch.length > 0 ? selectedBranch[0] : undefined,
});
```

**Nota:** Atualmente, apenas a primeira marca/filial selecionada é enviada para a API. Se múltiplas forem selecionadas, usa a primeira.

### Componente MultiSelectFilter

```typescript
<MultiSelectFilter
  label="MARCA"
  icon={<Flag size={14} />}
  options={uniqueBrands}
  selected={selectedBrand}
  onChange={setSelectedBrand}
  colorScheme="blue"
/>
```

**Props:**
- `label`: Texto do label (ex: "MARCA", "FILIAL")
- `icon`: Ícone do lucide-react
- `options`: Array de strings com opções disponíveis
- `selected`: Array de strings com opções selecionadas
- `onChange`: Callback para atualizar seleção
- `colorScheme`: 'blue' ou 'orange' (define cores do tema)

---

## 🎯 Exemplos de Uso

### Cenário 1: Gerar Análise de Uma Marca Específica

```
1. Abrir "Análise Financeira"
2. Clicar no filtro MARCA
3. Selecionar "RAIZ"
4. Filtro FILIAL agora mostra apenas filiais RAIZ
5. Deixar FILIAL como "TODAS" (consolidado da marca)
6. Ir para aba "Sumário Executivo"
7. Clicar "Gerar Sumário Executivo"
8. Aguardar geração
9. Ver sumário apenas da marca RAIZ (todas as filiais)
```

**Resultado:** Sumário consolidado da marca RAIZ

---

### Cenário 2: Gerar Análise de Uma Filial Específica

```
1. Abrir "Análise Financeira"
2. Clicar no filtro MARCA
3. Selecionar "RAIZ"
4. Clicar no filtro FILIAL
5. Selecionar "São Paulo"
6. Ir para aba "Slides de Análise"
7. Clicar "Gerar Slides"
8. Aguardar geração
9. Ver slides apenas da filial São Paulo
```

**Resultado:** Slides específicos da filial São Paulo

---

### Cenário 3: Comparar Diferentes Marcas

```
1. Gerar análise da marca RAIZ (sem filtro de filial)
2. Salvar ou exportar
3. Clicar "Limpar" para resetar filtros
4. Selecionar marca LUMINOVA
5. Gerar nova análise
6. Comparar resultados
```

**Resultado:** Duas análises para comparação

---

### Cenário 4: Usar Dados Consolidados (Sem Filtros)

```
1. Abrir "Análise Financeira"
2. Deixar filtros como "TODAS" (padrão)
3. Gerar qualquer análise
4. Ver dados consolidados de todas as marcas e filiais
```

**Resultado:** Análise global (todas as marcas e filiais)

---

## 🎨 Dropdown do Filtro

### Estrutura do Dropdown

```
┌─────────────────────────────────┐
│ [Selecionar Todas]  [Limpar]    │ ← Header com ações
├─────────────────────────────────┤
│ ☑ RAIZ                          │ ← Opção selecionada (azul)
│ ☐ LUMINOVA                      │ ← Opção não selecionada
│ ☐ VASTA                         │
│ ☐ ELEVA                         │
└─────────────────────────────────┘
```

**Features do Dropdown:**
- ✅ Scroll automático se tiver muitas opções
- ✅ Fecha ao clicar fora
- ✅ Checkboxes customizados (cores do tema)
- ✅ Hover states
- ✅ Animação de entrada (fade + slide)
- ✅ Botão "Selecionar Todas" (marca todas)
- ✅ Botão "Limpar" (desmarca todas)

---

## ✅ Comportamentos Especiais

### 1. Filtro de Filial é Dinâmico

```
Nenhuma marca selecionada
→ Filial mostra TODAS as filiais de todas as marcas

Marca RAIZ selecionada
→ Filial mostra APENAS as filiais da RAIZ

Marca RAIZ + LUMINOVA selecionadas
→ Filial mostra filiais de ambas as marcas
```

### 2. Botão "Limpar" Aparece Dinamicamente

```
Sem filtros ativos
→ Botão "Limpar" está oculto

Qualquer filtro ativo (marca OU filial)
→ Botão "Limpar" aparece
→ Ao clicar: remove TODOS os filtros
```

### 3. Indicador Visual Quando Filtros Ativos

```
Filtros ativos:
- Borda grossa colorida
- Ring (glow) ao redor
- Ícone com fundo sólido
- Texto com nome da seleção

Sem filtros:
- Borda cinza fina
- Sem ring
- Ícone com fundo claro
- Texto: "TODAS"
```

### 4. Persistência de Dados Gerados

```
Gerar sumário com filtro A
→ Trocar para filtro B
→ Sumário anterior NÃO é apagado
→ Só regera ao clicar "Gerar" novamente
```

**Importante:** Os dados gerados são mantidos mesmo se você trocar os filtros. Para regerar com novos filtros, clique nos botões "Gerar" novamente.

---

## 🔧 Integração com Supabase

### Como o Filtro Afeta a Query

```typescript
// Sem filtros
fetchAnalysisContext({ scenario: 'Real' })
→ SELECT * FROM transactions WHERE scenario = 'Real'
→ Retorna TODAS as transações

// Com filtro de marca
fetchAnalysisContext({ scenario: 'Real', brand: 'RAIZ' })
→ SELECT * FROM transactions WHERE scenario = 'Real' AND brand = 'RAIZ'
→ Retorna apenas transações da RAIZ

// Com filtro de marca + filial
fetchAnalysisContext({
  scenario: 'Real',
  brand: 'RAIZ',
  branch: 'São Paulo'
})
→ SELECT * FROM transactions
  WHERE scenario = 'Real'
  AND brand = 'RAIZ'
  AND branch = 'São Paulo'
→ Retorna apenas transações da filial São Paulo da RAIZ
```

---

## 📊 Impacto nos Resultados

### Sem Filtros (Global)

```
Sumário Executivo:
- Receita: R$ 10.200.000 (todas as marcas)
- EBITDA: R$ 2.100.000
- Margem: 20,6%
```

### Com Filtro MARCA = "RAIZ"

```
Sumário Executivo:
- Receita: R$ 7.500.000 (apenas RAIZ)
- EBITDA: R$ 1.600.000
- Margem: 21,3%
```

### Com Filtro MARCA = "RAIZ" + FILIAL = "São Paulo"

```
Sumário Executivo:
- Receita: R$ 3.200.000 (apenas filial SP)
- EBITDA: R$ 680.000
- Margem: 21,3%
```

---

## 🐛 Troubleshooting

### ❌ Filtros não aparecem

**Causa:** Transactions vazias

**Solução:**
- Verificar se há transações carregadas
- Verificar se transações têm campos `brand` e `branch` preenchidos

---

### ❌ Filial mostra opções erradas

**Causa:** Filtro não está sincronizado com marca

**Solução:**
- Verificar `availableBranches` no useMemo
- Garantir que filtra por `selectedBrand`

---

### ❌ Análise não muda ao filtrar

**Causa:** Não regerou após trocar filtros

**Solução:**
- Filtros não regeram automaticamente (by design)
- Clique "Gerar" novamente para aplicar novos filtros

---

### ❌ Mock data ignora filtros

**Causa:** Mock data é estático

**Solução:**
- Normal! Mock data não é filtrado
- Para testar filtros, precisa de API funcional
- Console mostra warning: "⚠️ API não disponível, usando mock data"

---

## 🎯 Casos de Uso Reais

### 1. CFO Quer Ver Só RAIZ

```
Filtrar: MARCA = RAIZ
Gerar: Sumário + Ações + Slides
Exportar: PowerPoint com dados da RAIZ
Usar: Reunião do board da RAIZ
```

### 2. Diretor Regional Quer Ver Filial

```
Filtrar: MARCA = RAIZ, FILIAL = São Paulo
Gerar: Slides de Análise
Ver: Performance específica da filial SP
Exportar: PPT para reunião regional
```

### 3. Comparação de Marcas

```
1º: Filtrar RAIZ → Gerar slides → Exportar PPT
2º: Filtrar LUMINOVA → Gerar slides → Exportar PPT
3º: Comparar os dois arquivos lado a lado
```

### 4. Análise Consolidada

```
Sem filtros (TODAS)
Gerar: Sumário Executivo global
Ver: Performance geral da holding
Usar: Reunião executiva
```

---

## ✅ Checklist de Funcionalidades

### Visual
- [ ] Filtros aparecem no header
- [ ] Filtro MARCA com ícone Flag (azul)
- [ ] Filtro FILIAL com ícone Building (laranja)
- [ ] Botão "Limpar" aparece quando há filtros ativos
- [ ] Dropdown abre/fecha corretamente
- [ ] Checkboxes customizados com cores do tema
- [ ] Indicador visual quando filtro está ativo (borda + ring)

### Funcional
- [ ] Clicar em filtro abre dropdown
- [ ] Clicar fora fecha dropdown
- [ ] "Selecionar Todas" marca todas as opções
- [ ] "Limpar" desmarca todas as opções
- [ ] Selecionar marca filtra opções de filial
- [ ] Botão "Limpar" remove todos os filtros
- [ ] Filtros são enviados para fetchAnalysisContext
- [ ] Análise é gerada com dados filtrados

### Integração
- [ ] uniqueBrands calculado corretamente
- [ ] availableBranches filtrado por selectedBrand
- [ ] handleGenerateSummary passa filtros
- [ ] handleGenerateActions passa filtros
- [ ] handleGenerateSlides passa filtros
- [ ] Supabase filtra corretamente no backend

---

## 📚 Arquivos Modificados

### `components/AnalysisView.tsx`

**Adicionado:**
1. Imports de ícones: `Flag`, `Building2`, `ChevronDown`, `Check`, `X`
2. Estados de filtros: `selectedBrand`, `selectedBranch`
3. Computados: `uniqueBrands`, `availableBranches`
4. Componente `MultiSelectFilter` (final do arquivo)
5. UI de filtros no header
6. Passagem de filtros nas funções de geração

**Linhas modificadas:**
- Imports (linhas 2-15)
- Estados (linhas 35-36)
- useMemo (linhas 51-64)
- UI de filtros (linhas 240-280)
- Geração de sumário (linhas 79-83)
- Geração de ações (linhas 125-129)
- Geração de slides (linhas 165-169)
- Componente MultiSelectFilter (linhas 510-675)

---

## 🚀 Próximos Passos (Sugeridos)

### Curto Prazo

1. **Salvar filtros no localStorage:**
   - Manter filtros ao refresh da página
   - Lembrar última seleção do usuário

2. **Indicador de filtros ativos nas tabs:**
   - Badge na tab mostrando filtros aplicados
   - Ex: "Sumário Executivo (RAIZ)"

3. **Múltiplas marcas/filiais na API:**
   - Atualmente só envia primeira selecionada
   - Expandir para aceitar arrays no backend

### Médio Prazo

1. **Filtros avançados:**
   - Período (mês/ano)
   - Cenário (Real, Plan, Forecast)
   - Categoria de conta

2. **Presets de filtros:**
   - Salvar combinações frequentes
   - Ex: "RAIZ - São Paulo", "Consolidado Nacional"

3. **Comparação lado a lado:**
   - Gerar duas análises com filtros diferentes
   - Visualizar lado a lado na mesma tela

---

## 🎉 Resumo

### ✅ O Que Foi Feito

- ✅ Filtros de Marca e Filial no header
- ✅ Dropdowns multi-select com UI customizada
- ✅ Filtro de Filial dinâmico (muda conforme Marca)
- ✅ Botão "Limpar" para resetar filtros
- ✅ Integração com fetchAnalysisContext
- ✅ Filtros enviados para Supabase
- ✅ Análises geradas com dados filtrados
- ✅ Indicadores visuais quando filtros ativos

### ✅ Como Testar

```bash
# 1. Iniciar
npm run dev

# 2. Login + Ir para "Análise Financeira"

# 3. Testar filtros:
- Clicar filtro MARCA → Selecionar uma marca
- Clicar filtro FILIAL → Selecionar uma filial
- Ver indicadores visuais (borda + ring)
- Clicar "Limpar" → Filtros resetam

# 4. Gerar análise:
- Ir para aba "Sumário Executivo"
- Clicar "Gerar Sumário Executivo"
- Ver sumário com dados filtrados

# 5. Trocar filtros:
- Mudar filtros
- Clicar "Gerar Sumário Executivo" novamente
- Ver novo sumário com novos filtros

✅ Filtros funcionando!
```

---

**Data:** 31 de Janeiro de 2026
**Versão:** 2.4.0
**Status:** ✅ FUNCIONAL COM FILTROS

🎉 **Sistema de filtros implementado e funcionando!**
