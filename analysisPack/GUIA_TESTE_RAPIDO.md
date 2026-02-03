# 🚀 Guia Rápido - Página de Teste

Como acessar e testar todas as funcionalidades do AnalysisPack.

---

## 📍 Como Acessar

### 1. Iniciar o Servidor
```bash
cd "C:\Users\edmilson.serafim\OneDrive - Raiz Educação S A\Área de Trabalho\Ap proposta"
npm run dev
```

### 2. Fazer Login
- Abrir: `http://localhost:3000`
- Fazer login com usuário **Admin** (necessário para ver a guia)

### 3. Acessar a Guia de Teste
- No sidebar, procurar: **"🧪 Teste AnalysisPack"**
- Está logo abaixo da guia **"Admin"**
- Ícone: 🧪 (Frasco de laboratório)

---

## 🎯 O Que Você Vai Ver

### Painel Principal

```
┌─────────────────────────────────────────────────────┐
│ 🧪 Teste - AnalysisPack                            │
│ Sistema completo de análise financeira com IA       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  📊 Stats: 5 slides • 4 gráficos • 8 KPIs • 5 DS   │
│                                                      │
│  🎯 Funcionalidades Implementadas                   │
│  ├─ 1. Integração Supabase         [Testar]       │
│  ├─ 2. Gerar Relatório              [Testar]       │
│  ├─ 3. Exportar PNGs                [Testar]       │
│  └─ 4. Exportar PowerPoint          [Testar]       │
│                                                      │
│  ⚡ Ações Rápidas                                   │
│  [Gerar Relatório] [Exportar PNGs] [Exportar PPT]  │
│                                                      │
│  📊 Resumo Executivo                                │
│  📈 SlideDeck Completo (abaixo)                     │
│  📚 Documentação                                    │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Testes Rápidos (5 minutos)

### Teste 1: Gerar Relatório (Mock)
1. ✅ Marcar "Usar dados Mock"
2. Clicar **"Gerar Relatório"**
3. **Resultado esperado:**
   - Loading por < 1s
   - Slides aparecem abaixo
   - Stats atualizadas no topo
   - Status: ✅ OK (verde)

### Teste 2: Exportar PNGs
1. Clicar **"Exportar PNGs"**
2. **Resultado esperado:**
   - Console mostra: "✅ Gráficos exportados: [...]"
   - Alert: "✅ 4 gráficos exportados com sucesso!"
   - Status: ✅ OK (verde)

### Teste 3: Exportar PowerPoint
1. Clicar **"Exportar PowerPoint"**
2. **Resultado esperado:**
   - Download inicia automaticamente
   - Arquivo: `Teste-AnalysisPack-{timestamp}.pptx`
   - Alert: "✅ PowerPoint exportado com sucesso!"
   - Status: ✅ OK (verde)
   - **Abrir o arquivo:**
     - Deve ter 5 slides
     - Texto formatado com bullets
     - Gráficos como imagens
     - Layout 16:9

### Teste 4: Testar Context
1. Clicar **"Testar Context"**
2. **Resultado esperado:**
   - Console mostra contexto completo
   - Alert mostra: Org, KPIs, Datasets
   - Status: ✅ OK (verde)

---

## 🎨 O Que Está na Página

### 1. Header com Stats
```
┌──────────┬──────────┬──────────┬──────────┐
│ Slides   │ Gráficos │ KPIs     │ Datasets │
│ 5        │ 4        │ 8        │ 5        │
└──────────┴──────────┴──────────┴──────────┘
```

### 2. Painel de Testes
Cada funcionalidade com:
- ✅ Título e descrição
- 🟢 Status (OK/Falhou)
- 🔘 Botão "Testar"

### 3. Toggle Mock/Real
```
☑️ Usar dados Mock (desenvolvimento)
   ✅ Usando dados fictícios (rápido, sem API)
```

### 4. Ações Rápidas
Botões grandes para ações comuns:
- ⚡ Gerar Relatório
- 📥 Exportar PNGs
- 📊 Exportar PowerPoint
- ✅ Testar Context

### 5. Resumo Executivo
Card com:
- Headline do relatório
- Bullets principais
- Visual destacado (azul/roxo)

### 6. SlideDeck Completo
Todos os slides renderizados:
- 📄 Blocos de texto
- 📊 KPIs em grid
- 📈 Gráficos ECharts interativos
- 📋 Tabelas de dados

### 7. Links de Documentação
Cards com links para:
- CHECKLIST_COMPLETO.md
- FUNCIONALIDADES_IMPLEMENTADAS.md
- ECHARTS_GUIDE.md
- PPT_EXPORT_GUIDE.md

---

## 🔍 Verificações Visuais

### ✅ O Que Verificar

#### Slides Renderizados
- [ ] Todos os 5 slides aparecem
- [ ] Texto formatado com bullets (•)
- [ ] KPIs em grid (2 ou 4 colunas)
- [ ] Gráficos são interativos (hover mostra tooltip)
- [ ] Tabelas formatadas corretamente

#### Gráficos ECharts
- [ ] Gráfico de linha (R12)
- [ ] Gráfico waterfall (ponte)
- [ ] Gráfico pareto (barras + linha)
- [ ] Heatmap (matriz de cores)
- [ ] Hover mostra valores
- [ ] Valores formatados (K/M)

#### KPIs
- [ ] Cards com bordas arredondadas
- [ ] Nome do KPI no topo
- [ ] Valor grande e formatado
- [ ] Delta vs Orçamento embaixo
- [ ] Grid responsivo

#### Botões
- [ ] Todos os botões respondem ao click
- [ ] Loading states funcionam
- [ ] Disabled quando apropriado
- [ ] Cores corretas (preto, azul, verde, roxo)

---

## 🐛 Problemas Comuns

### ❌ "Guia Teste não aparece"
**Causa:** Não logou como Admin

**Solução:** Fazer login com usuário Admin (role='admin')

---

### ❌ "Gráficos não aparecem"
**Causa:** echarts-for-react não instalado

**Solução:**
```bash
npm install echarts echarts-for-react
```

---

### ❌ "PowerPoint não baixa"
**Causa:** pptxgenjs não instalado

**Solução:**
```bash
npm install pptxgenjs
```

---

### ❌ "Erro ao importar analysisPack"
**Causa:** Caminhos incorretos

**Solução:** Verificar que existe:
```
C:\Users\edmilson.serafim\OneDrive - Raiz Educação S A\
└── Área de Trabalho\
    └── Ap proposta\
        └── analysisPack\
            └── index.ts
```

---

## 📊 O Que Cada Teste Valida

### Teste "Integração Supabase"
✅ Valida:
- fetchAnalysisContext funciona
- Conexão com Supabase (ou fallback)
- buildDatasets constrói datasets
- buildKPIs calcula KPIs
- Retorna AnalysisContext válido

### Teste "Gerar Relatório"
✅ Valida:
- Mock data carrega
- AnalysisPack é válido
- SlideDeck renderiza
- Todos os blocos aparecem
- Gráficos são interativos

### Teste "Exportar PNGs"
✅ Valida:
- useChartRegistry funciona
- Todos os gráficos são capturados
- Formato PNG base64 correto
- Qualidade Retina (2x)

### Teste "Exportar PowerPoint"
✅ Valida:
- buildPpt funciona
- PptxGenJS gera .pptx
- Slides incluem texto e gráficos
- Download automático funciona
- Arquivo abre corretamente

---

## 🎯 Checklist Rápido

Antes de considerar OK:

- [ ] 1. Guia "Teste AnalysisPack" aparece no sidebar
- [ ] 2. Página carrega sem erros
- [ ] 3. Stats mostram números corretos
- [ ] 4. Botão "Gerar Relatório" funciona
- [ ] 5. Slides aparecem renderizados
- [ ] 6. Gráficos são interativos
- [ ] 7. Botão "Exportar PNGs" funciona
- [ ] 8. Botão "Exportar PowerPoint" funciona
- [ ] 9. Arquivo .pptx baixa e abre
- [ ] 10. Todos os testes ficam ✅ verdes

---

## 📈 Próximos Passos

Após validar que tudo funciona na página de teste:

### Usar no Projeto Real
1. Integrar com API real (`/api/analysis/generate-ai`)
2. Conectar com Supabase (dados reais)
3. Adicionar filtros (marca, filial, período)
4. Criar página dedicada (não só teste)

### Melhorias
1. Adicionar mais tipos de gráficos
2. Exportar KPIs e tabelas no PowerPoint
3. Temas customizáveis
4. Histórico de análises
5. Compartilhamento

---

## 📚 Documentação Completa

Para testes mais profundos, seguir:
1. **CHECKLIST_COMPLETO.md** - 90 minutos de testes
2. **FUNCIONALIDADES_IMPLEMENTADAS.md** - Lista completa
3. **ECHARTS_GUIDE.md** - Gráficos detalhados
4. **PPT_EXPORT_GUIDE.md** - PowerPoint avançado

---

## ✅ Resultado Esperado

Se tudo estiver OK:
- ✅ Guia aparece no sidebar
- ✅ Página carrega instantaneamente
- ✅ Todos os 4 testes passam
- ✅ Gráficos são interativos
- ✅ PowerPoint baixa e abre
- ✅ 0 erros no console
- ✅ Sistema pronto para uso!

---

**Tempo estimado:** 5-10 minutos
**Dificuldade:** Fácil
**Pré-requisitos:** Login como Admin

🎉 **Boa sorte com os testes!**
