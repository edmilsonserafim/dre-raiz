# 🎨 Guia - Identidade Visual do PowerPoint

O PowerPoint exportado agora possui a mesma identidade visual do site DRE RAIZ.

---

## 🎯 O Que Foi Melhorado

### ✅ Antes (Versão Antiga)
```
- Slides simples com fundo branco
- Texto preto básico (Arial)
- Sem cores da marca
- Layout genérico
- Sem elementos visuais
- Sem capa profissional
```

### ✅ Depois (Nova Versão)
```
✅ Slide de capa profissional com background azul
✅ Headers coloridos em todos os slides (laranja + azul)
✅ Paleta de cores do site aplicada
✅ Callouts coloridos (verde/vermelho/azul)
✅ Footers com informações do relatório
✅ Slide especial de sumário executivo
✅ Slide final de plano de ação formatado
✅ Bordas e elementos visuais modernos
✅ Ícones e emojis para melhor comunicação
✅ Layout profissional e consistente
```

---

## 🎨 Paleta de Cores

### Cores Principais (mesmo do site)

```css
Azul Primário:    #1B75BB  /* Headers, títulos, elementos principais */
Laranja Destaque: #F44C00  /* Ênfase, destaques importantes */
Verde Água:       #7AC5BF  /* Elementos secundários, footer */
Cinza Escuro:     #1F2937  /* Texto principal */
Cinza Médio:      #6B7280  /* Subtítulos, texto secundário */
Cinza Claro:      #F3F4F6  /* Backgrounds, separadores */
Branco:           #FFFFFF  /* Fundos principais */
```

### Cores Semânticas

```css
Verde (Sucesso):  #10B981  /* Destaques positivos, callouts positivos */
Vermelho (Perigo): #EF4444  /* Riscos, alertas, callouts negativos */
Amarelo (Aviso):  #F59E0B  /* Avisos, atenções */
```

---

## 📊 Estrutura dos Slides

### Slide 1: CAPA

```
┌────────────────────────────────────────┐
│ [Barra laranja no topo]                │
│                                         │
│                                         │
│      📊 Análise Financeira             │
│         (branco, grande, bold)         │
│                                         │
│         RAIZ Educação                  │
│         Jan/2026                       │
│         Consolidado                    │
│                                         │
│      Gerado em 31 de janeiro de 2026   │
│      Powered by IA • DRE RAIZ          │
│                                         │
│ [Barra verde água no rodapé]           │
└────────────────────────────────────────┘
```

**Características:**
- Background azul (#1B75BB)
- Barra laranja no topo (0.4 inch)
- Barra verde água no rodapé (0.4 inch)
- Título centralizado branco (60pt)
- Informações do relatório (organização, período, escopo)
- Data de geração
- Marca "Powered by IA"

---

### Slide 2: SUMÁRIO EXECUTIVO

```
┌────────────────────────────────────────┐
│ [Header azul] Sumário Executivo      2 │
├────────────────────────────────────────┤
│                                         │
│ [Box cinza claro]                      │
│ 📌 Receita 12% acima vs plano...       │
│                                         │
│ ✅ Destaques Positivos  ⚠️ Riscos     │
│ • Crescimento de 15%    • Custo sobe   │
│ • Margem melhorou       • Inadimplência│
│ • EBITDA positivo       • Turnover alto│
│                                         │
│ 💡 Oportunidades                       │
│ • Expandir para novos mercados         │
│ • Otimizar custos operacionais         │
│                                         │
├────────────────────────────────────────┤
│ RAIZ • Jan/2026 • Consolidado  DRE RAIZ│
└────────────────────────────────────────┘
```

**Características:**
- Header azul com título e número
- Headline destacado em box cinza claro
- Destaques positivos (verde, esquerda)
- Riscos e atenções (vermelho, direita)
- Oportunidades (azul, inferior)
- Footer com metadata

---

### Slides de Conteúdo (3+)

```
┌────────────────────────────────────────┐
│ [Barra laranja]                         │
│ [Barra azul] Título do Slide         3 │
├────────────────────────────────────────┤
│ Subtítulo (cinza, itálico)             │
│                                         │
│ 💡 Título da Seção                     │
│ • Primeiro ponto                       │
│ • Segundo ponto                        │
│                                         │
│ [Callout azul claro com borda]         │
│ 💡 Insight Importante                  │
│ • Detalhes do insight                  │
│                                         │
│ [Gráfico com borda cinza]              │
│ │                                      ││
│ │   [Gráfico ECharts aqui]            ││
│ │                                      ││
│                                         │
├────────────────────────────────────────┤
│ RAIZ • Jan/2026 • Consolidado  DRE RAIZ│
└────────────────────────────────────────┘
```

**Características:**
- Header com barra laranja (0.15 inch) + barra azul (0.7 inch)
- Título branco (24pt bold)
- Número do slide no canto direito
- Subtítulo cinza itálico
- Blocos de texto com bullets
- Callouts coloridos com bordas
- Gráficos com borda cinza clara
- Footer consistente

---

### Último Slide: PLANO DE AÇÃO

```
┌────────────────────────────────────────┐
│ [Header azul] Plano de Ação         99 │
├────────────────────────────────────────┤
│ Próximos passos recomendados           │
│                                         │
│ [Box 1 - fundo cinza claro]            │
│ 1  Negociar com fornecedores           │
│    👤 CFO  •  📅 Fev/26                │
│    💰 Redução de 5% no custo           │
│                                         │
│ [Box 2 - fundo branco]                 │
│ 2  Implementar controle de despesas    │
│    👤 Diretor Financeiro  •  📅 Mar/26 │
│    💰 Economia de R$ 50k/mês           │
│                                         │
│ [Box 3 - fundo cinza claro]            │
│ ...                                    │
│                                         │
├────────────────────────────────────────┤
│ RAIZ • Jan/2026 • Consolidado  DRE RAIZ│
└────────────────────────────────────────┘
```

**Características:**
- Header azul
- Subtítulo explicativo
- Boxes alternados (cinza claro / branco)
- Borda azul em cada ação
- Número grande da ação (azul, bold)
- Texto da ação (preto, bold)
- Responsável e prazo com ícones
- Impacto esperado (laranja, direita)
- Máximo 5 ações por slide

---

## 🎯 Tipos de Blocos

### 1. Text Block

```
💡 Título da Seção
• Primeiro ponto importante
• Segundo ponto relevante
• Terceiro insight
```

**Estilo:**
- Título: azul (#1B75BB), 14pt, bold
- Bullets: preto (#1F2937), 11pt
- Espaçamento: 1.2 unidades

---

### 2. Callout Block (3 variações)

#### Positivo (Verde)
```
┌────────────────────────────────────┐
│ ✅ Destaque Positivo               │
│ • Receita cresceu 15%              │
│ • Margem melhorou                  │
└────────────────────────────────────┘
```
- Background: #D1FAE5 (verde claro)
- Borda: #10B981 (verde)
- Ícone: ✅

#### Negativo (Vermelho)
```
┌────────────────────────────────────┐
│ ⚠️ Ponto de Atenção                │
│ • Custos aumentaram               │
│ • Inadimplência subiu             │
└────────────────────────────────────┘
```
- Background: #FEE2E2 (vermelho claro)
- Borda: #EF4444 (vermelho)
- Ícone: ⚠️

#### Neutro (Azul)
```
┌────────────────────────────────────┐
│ 💡 Informação Importante           │
│ • Dados para contexto             │
│ • Observações relevantes          │
└────────────────────────────────────┘
```
- Background: #DBEAFE (azul claro)
- Borda: #1B75BB (azul)
- Ícone: 💡

---

### 3. Chart Block

```
┌──────────────────────────────────────┐
│ [Borda cinza clara]                  │
│ │                                   ││
│ │  [Gráfico ECharts PNG]           ││
│ │                                   ││
│ │                                   ││
│ │                                   ││
│ [Nota: Fonte: Sistema DRE RAIZ]     │
└──────────────────────────────────────┘
```

**Características:**
- Borda cinza clara (#F3F4F6) com 2px
- Fundo branco
- Altura adaptativa (sm: 2.2", md: 3.0", lg: 4.0")
- Nota opcional em itálico (9pt, cinza)
- Margem ao redor

---

### 4. KPI Grid Block

```
💡 KPIs Principais
📊 KPIs principais exibidos no dashboard
```

**Nota:** KPIs são renderizados visualmente no site, mas no PPT é uma referência textual.

---

### 5. Table Block

```
💡 Tabela de Drivers
📋 Tabela de dados disponível no sistema
```

**Nota:** Tabelas são renderizadas no site, mas no PPT é uma referência textual.

---

## 🎨 Headers e Footers

### Header Padrão

```
┌────────────────────────────────────────┐
│ [Barra laranja 0.15"]                  │
│ [Barra azul 0.7"]                      │
│   Título do Slide              [Nº]   │
└────────────────────────────────────────┘
```

**Elementos:**
- Barra laranja: #F44C00, altura 0.15"
- Barra azul: #1B75BB, altura 0.7"
- Título: branco, 24pt, bold, Arial
- Número: branco, 18pt, canto direito

### Subtítulo (opcional)

```
Subtítulo explicativo do slide
```
- Cinza (#6B7280), 12pt, itálico
- Posição: abaixo do header (y: 1.0)

### Footer Padrão

```
┌────────────────────────────────────────┐
│ [Linha separadora cinza clara]         │
│ RAIZ • Jan/2026 • Consolidado  DRE RAIZ│
└────────────────────────────────────────┘
```

**Elementos:**
- Linha separadora: #F3F4F6, 0.02" altura
- Metadata: org + período + escopo (esquerda)
- Marca: "DRE RAIZ" azul bold (direita)
- Fonte: 9pt, Arial

---

## 📐 Especificações Técnicas

### Layout
- **Formato:** LAYOUT_WIDE (16:9)
- **Dimensões:** 13.33" x 7.5"
- **Margens:** 0.5" (esquerda/direita/topo/rodapé)

### Tipografia
- **Fonte principal:** Arial
- **Tamanhos:**
  - Capa título: 60pt
  - Slide título: 24pt
  - Seção título: 14pt
  - Corpo: 11pt
  - Footer: 9pt

### Cores Hex (PptxGenJS)
```typescript
COLORS = {
  primary: "1B75BB",   // Azul
  accent: "F44C00",    // Laranja
  teal: "7AC5BF",      // Verde água
  dark: "1F2937",      // Texto
  medium: "6B7280",    // Subtítulo
  light: "F3F4F6",     // Background
  white: "FFFFFF",     // Branco
  success: "10B981",   // Verde
  danger: "EF4444",    // Vermelho
  warning: "F59E0B"    // Amarelo
}
```

### Metadata do Documento
```typescript
pptx.author = "DRE RAIZ - Sistema de Análise Financeira"
pptx.title = "RAIZ Educação" // ou nome da org
pptx.subject = "Análise Financeira - Jan/2026"
```

---

## 🚀 Como Testar

### 1. Gerar Análise Completa

```bash
# 1. Servidor rodando
http://localhost:3000

# 2. Login + Ir para "Análise Financeira"

# 3. Gerar slides:
- Aba "Slides de Análise"
- Clicar "Gerar Slides"
- Aguardar geração (10-15s)
```

### 2. Exportar PowerPoint

```bash
# 4. Exportar:
- Botão "Exportar PowerPoint" (verde)
- Aguardar exportação (5-10s)
- Arquivo baixado: Analise-Financeira-RAIZ.pptx
```

### 3. Verificar Identidade Visual

```bash
# 5. Abrir arquivo .pptx:
- Abrir no PowerPoint
- Verificar:
  ✅ Capa com background azul
  ✅ Barras laranja e azul nos headers
  ✅ Cores do site aplicadas
  ✅ Callouts coloridos
  ✅ Gráficos com bordas
  ✅ Footer em todos os slides
  ✅ Plano de ação formatado
```

---

## 📊 Exemplo de Exportação

### O Que Você Verá

**Slide 1 (Capa):**
- Background azul vibrante
- Logo e marca DRE RAIZ
- Informações do relatório centralizadas
- Design moderno e profissional

**Slide 2 (Sumário):**
- Headline destacado
- Seções coloridas (verde/vermelho/azul)
- Layout em colunas
- Ícones visuais

**Slides 3-N (Conteúdo):**
- Headers coloridos consistentes
- Gráficos grandes e legíveis
- Callouts destacados
- Texto organizado

**Último Slide (Ações):**
- Lista numerada de ações
- Boxes alternados
- Informações completas (owner, prazo, impacto)
- Design limpo e profissional

---

## 🎨 Comparação Visual

### Antes
```
┌────────────────────┐
│ Título             │
│                    │
│ • Item 1           │
│ • Item 2           │
│                    │
│ [Gráfico simples]  │
│                    │
└────────────────────┘
```

### Depois
```
┌────────────────────────────────────┐
│ [🟧 Barra laranja]                 │
│ [🟦 Barra azul] Título         [3] │
├────────────────────────────────────┤
│ Subtítulo (cinza itálico)          │
│                                     │
│ 💡 Seção Importante                │
│ • Item 1                            │
│ • Item 2                            │
│                                     │
│ [┌──────────────────────┐]         │
│  │ [Gráfico com borda]  │          │
│  └──────────────────────┘          │
│  Nota: Fonte do gráfico            │
│                                     │
├────────────────────────────────────┤
│ RAIZ • Jan/26 • Consolidado  RAIZ  │
└────────────────────────────────────┘
```

---

## ✅ Checklist de Qualidade

### Visual
- [ ] Capa profissional com background azul
- [ ] Headers azul + laranja em todos os slides
- [ ] Cores do site aplicadas corretamente
- [ ] Callouts coloridos (verde/vermelho/azul)
- [ ] Gráficos com bordas cinzas
- [ ] Footer consistente em todos os slides
- [ ] Numeração de slides
- [ ] Ícones e emojis apropriados

### Conteúdo
- [ ] Slide de sumário executivo presente
- [ ] Todos os slides de conteúdo renderizados
- [ ] Gráficos exportados como PNG
- [ ] Plano de ação formatado
- [ ] Metadata do documento preenchida

### Técnico
- [ ] Layout WIDE (16:9)
- [ ] Fontes Arial consistentes
- [ ] Tamanhos de fonte adequados
- [ ] Espaçamento apropriado
- [ ] Arquivo .pptx válido
- [ ] Compatível com PowerPoint

---

## 🐛 Troubleshooting

### ❌ Cores não aparecem

**Causa:** Hex colors sem `#`

**Solução:** Código usa hex sem `#` (ex: "1B75BB" não "#1B75BB")

---

### ❌ Gráficos não aparecem

**Causa:** chartImages vazias

**Solução:** Certifique-se que chartRegistry.exportAllPngBase64() foi chamado antes

---

### ❌ Layout quebrado

**Causa:** Tamanhos ou posições incorretas

**Solução:** Verificar valores x, y, w, h em polegadas (inches)

---

### ❌ Arquivo não abre

**Causa:** Erro na geração do pptx

**Solução:** Verificar console do browser, reinstalar pptxgenjs

---

## 🎯 Próximos Passos (Sugeridos)

### Curto Prazo
1. **Logo da empresa:**
   - Adicionar logo RAIZ na capa
   - Logo no header de cada slide

2. **Customização por tema:**
   - Permitir escolher paleta de cores
   - Temas: Azul, Laranja, Verde

### Médio Prazo
1. **Animações:**
   - Transições entre slides
   - Animações de entrada para elementos

2. **Master slides:**
   - Templates reutilizáveis
   - Layouts pré-definidos

3. **Tabelas formatadas:**
   - Renderizar KPI grids como tabelas visuais
   - Renderizar drivers table no PPT

---

## 📚 Referências

### Biblioteca Usada
- **PptxGenJS:** https://gitbrent.github.io/PptxGenJS/
- **Versão:** Latest (npm)
- **Docs:** https://gitbrent.github.io/PptxGenJS/docs/

### Arquivo Modificado
- `analysisPack/services/pptExportService.ts`

### Funções Principais
```typescript
buildPpt()               // Função principal de exportação
addCoverSlide()          // Cria slide de capa
addExecutiveSummarySlide() // Cria sumário executivo
addContentSlide()        // Cria slides de conteúdo
addActionsSlide()        // Cria slide de ações
addSlideHeader()         // Adiciona header colorido
addSlideFooter()         // Adiciona footer com metadata
```

---

## 🎉 Resumo

### ✅ Melhorias Implementadas

- ✅ Identidade visual profissional
- ✅ Cores do site aplicadas (azul, laranja, verde água)
- ✅ Slide de capa com design moderno
- ✅ Headers coloridos consistentes
- ✅ Callouts coloridos por tipo (positivo/negativo/neutro)
- ✅ Gráficos com bordas e notas
- ✅ Slide de sumário executivo estruturado
- ✅ Slide de plano de ação formatado
- ✅ Footers com metadata em todos os slides
- ✅ Numeração de slides
- ✅ Ícones e emojis para melhor comunicação

### ✅ Resultado

PowerPoint exportado agora tem a **mesma identidade visual do site DRE RAIZ**, com design profissional, cores vibrantes, e layout moderno.

---

**Data:** 31 de Janeiro de 2026
**Versão:** 2.5.0
**Status:** ✅ IDENTIDADE VISUAL IMPLEMENTADA

🎨 **PowerPoint com visual profissional!**
