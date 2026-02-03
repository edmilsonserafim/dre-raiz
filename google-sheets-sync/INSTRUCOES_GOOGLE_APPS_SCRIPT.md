# 📝 Instruções: Configurar Google Apps Script

## 🎯 Objetivo

Configurar sincronização automática entre Google Sheets "Conta Cont" e Supabase.

---

## 📋 Pré-requisitos

✅ Migração executada (coluna `conta_contabil` criada em `transactions`)
✅ Tabela `conta_contabil` criada no Supabase
✅ Acesso ao Google Sheets
✅ Chave de API do Supabase (service_role)

---

## 🔧 Passo a Passo

### PASSO 1: Obter Credenciais do Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em: **Settings** → **API**
4. Copie:
   - **Project URL** (ex: `https://abc123.supabase.co`)
   - **service_role key** (chave secreta - não compartilhar!)

---

### PASSO 2: Abrir Google Apps Script

1. Abra o Google Sheets: [Conta Cont](https://docs.google.com/spreadsheets/d/1j2diM2PR4VUocjY0LJho3rE37fNOrMSoICulPSRhh58/edit?gid=874921918#gid=874921918)
2. Menu: **Extensões** → **Apps Script**
3. Delete o código padrão (se existir)

---

### PASSO 3: Colar o Código

Cole o código do arquivo `google-apps-script.js`:

```javascript
// CONFIG - SUBSTITUA COM SUAS CREDENCIAIS
const CONFIG = {
  SUPABASE_URL: 'https://SEU-PROJETO.supabase.co',  // ← Cole aqui
  SUPABASE_KEY: 'eyJ...sua-chave-service-role...',   // ← Cole aqui
  SHEET_NAME: 'Conta Cont',
  SYNC_MODE: 'supabase', // 'supabase' ou 'sheets'
  SYNC_INTERVAL_HOURS: 1,
  AUTO_SYNC_ON_EDIT: true,
};

// ... resto do código
```

**⚠️ IMPORTANTE:**
- Substitua `SUPABASE_URL` pela URL do seu projeto
- Substitua `SUPABASE_KEY` pela sua service_role key
- Mantenha `SHEET_NAME: 'Conta Cont'` (nome da aba)

---

### PASSO 4: Salvar e Nomear

1. Clique em **Disquete** (salvar)
2. Nome: `Sincronização Conta Contábil`
3. Clique em **OK**

---

### PASSO 5: Autorizar o Script

1. Clique em **▶️ Executar** (função: `syncAll`)
2. Clique em **Revisar permissões**
3. Selecione sua conta Google
4. Clique em **Avançado**
5. Clique em **Ir para Sincronização Conta Contábil (não seguro)**
6. Clique em **Permitir**

**ℹ️ Isso é necessário para o script acessar o Sheets e fazer requisições HTTP**

---

### PASSO 6: Criar Menu Personalizado

1. No Apps Script, clique em **▶️ Executar** (função: `onOpen`)
2. Volte para o Google Sheets
3. Recarregue a página (F5)
4. Deve aparecer um novo menu: **🔄 Sincronização**

---

### PASSO 7: Testar Sincronização

**Opção 1: Menu Personalizado**
1. Google Sheets → Menu **🔄 Sincronização**
2. Clique em **✅ Sincronizar Tudo Agora**
3. Aguarde (pode demorar alguns segundos)
4. Verifique o console do Apps Script para logs

**Opção 2: Apps Script Manual**
1. No Apps Script
2. Selecione função: `syncAll`
3. Clique em **▶️ Executar**
4. Verifique os logs (View → Logs)

---

### PASSO 8: Verificar no Supabase

Execute no Supabase SQL Editor:

```sql
-- Verificar quantas contas foram sincronizadas
SELECT COUNT(*) as total_contas FROM conta_contabil;

-- Ver as últimas 10 contas sincronizadas
SELECT
  cod_conta,
  tag1,
  tag2,
  bp_dre,
  synced_at
FROM conta_contabil
ORDER BY synced_at DESC
LIMIT 10;
```

**✅ Deve retornar as contas do Google Sheets!**

---

### PASSO 9: Configurar Trigger Automático

**Para sincronizar automaticamente a cada 1 hora:**

1. No Apps Script, clique em **⏰ Triggers** (menu esquerdo, ícone de relógio)
2. Clique em **+ Adicionar acionador**
3. Configure:
   - **Função a executar:** `syncAll`
   - **Origem do evento:** `De hora em hora`
   - **Intervalo de tempo:** `A cada hora`
4. Clique em **Salvar**

**Para sincronizar ao editar célula:**

1. Clique em **+ Adicionar acionador**
2. Configure:
   - **Função a executar:** `onEdit`
   - **Origem do evento:** `Do editor`
   - **Tipo de evento:** `Ao editar`
3. Clique em **Salvar**

---

### PASSO 10: Testar Sincronização em Tempo Real

1. No Google Sheets, edite uma célula da tabela (ex: mude uma Tag1)
2. Aguarde 2-3 segundos
3. Verifique no Supabase:

```sql
SELECT cod_conta, tag1, synced_at
FROM conta_contabil
WHERE cod_conta = 'CODIGO-QUE-VOCE-EDITOU'
ORDER BY synced_at DESC
LIMIT 1;
```

**✅ O campo `synced_at` deve ter timestamp recente!**

---

## 🔄 Modos de Sincronização

### Modo 1: Supabase ← Google Sheets (PADRÃO)

```javascript
SYNC_MODE: 'supabase'
```

- **Direção:** Google Sheets é a fonte da verdade
- **Quando usar:** Quando você edita no Google Sheets e quer atualizar o Supabase
- **Comportamento:** Toda edição no Sheets → upsert no Supabase

### Modo 2: Google Sheets ← Supabase

```javascript
SYNC_MODE: 'sheets'
```

- **Direção:** Supabase é a fonte da verdade
- **Quando usar:** Quando você edita no Supabase e quer atualizar o Sheets
- **Comportamento:** Busca dados do Supabase → atualiza Sheets

**⚠️ ATENÇÃO:** Não use ambos ao mesmo tempo, pode causar conflitos!

**💡 RECOMENDAÇÃO:** Use `SYNC_MODE: 'supabase'` (padrão) para editar no Google Sheets

---

## 🎛️ Funções Disponíveis

| Função | Descrição | Usar para |
|--------|-----------|-----------|
| `syncAll()` | Sincroniza todas as linhas | Sincronização completa |
| `syncRow(rowNumber)` | Sincroniza uma linha específica | Automático (onEdit) |
| `clearSupabaseTable()` | Limpa tabela no Supabase | Resetar e re-sincronizar |
| `testConnection()` | Testa conexão com Supabase | Verificar configuração |

---

## 🧪 Testes

### Teste 1: Conexão

```javascript
// No Apps Script, execute:
testConnection()

// Deve logar:
// ✅ Conexão com Supabase OK: X contas encontradas
```

### Teste 2: Sincronização Total

```javascript
syncAll()

// Deve logar:
// ✅ Sincronizadas X de Y linhas
```

### Teste 3: Edição em Tempo Real

1. Edite uma célula no Google Sheets
2. Verifique o log do Apps Script
3. Deve aparecer: `✅ Linha X sincronizada: CODIGO`

---

## ❌ Problemas Comuns

### Erro: "Invalid credentials"

**Causa:** Chave de API incorreta

**Solução:**
- Verifique se copiou a **service_role key** (não a anon key)
- Verifique se não tem espaços extras
- Teste com `testConnection()`

---

### Erro: "403 Forbidden"

**Causa:** RLS bloqueando inserção

**Solução:**
Execute no Supabase:

```sql
-- Verificar policies
SELECT * FROM pg_policies WHERE tablename = 'conta_contabil';

-- Se necessário, recriar policy
CREATE POLICY "conta_contabil_service_role_policy"
  ON conta_contabil FOR ALL TO service_role
  USING (true) WITH CHECK (true);
```

---

### Erro: "404 Not Found"

**Causa:** URL do Supabase incorreta

**Solução:**
- Verifique se a URL termina com `.supabase.co`
- Não inclua `/rest/v1/` no SUPABASE_URL
- Formato: `https://seuprojetoaqui.supabase.co`

---

### Script não executa ao editar

**Causa:** Trigger não configurado

**Solução:**
1. Apps Script → Triggers (⏰)
2. Verificar se existe trigger para `onEdit` → `Do editor` → `Ao editar`
3. Se não existe, criar conforme PASSO 9

---

### Sincronização lenta

**Causa:** Muitas linhas

**Solução:**
- Reduzir `SYNC_INTERVAL_HOURS` para 2 ou 4 horas
- Desativar sync automático: `AUTO_SYNC_ON_EDIT: false`
- Sincronizar manualmente apenas quando necessário

---

## 📊 Monitoramento

### Ver Logs do Apps Script

1. Apps Script → **Execuções** (menu esquerdo)
2. Ver últimas execuções e erros

### Ver Status no Supabase

```sql
-- Dashboard de sincronização
SELECT
  'Total de contas' as metrica,
  COUNT(*) as valor
FROM conta_contabil

UNION ALL

SELECT
  'Última sincronização',
  TO_CHAR(MAX(synced_at), 'DD/MM/YYYY HH24:MI:SS')
FROM conta_contabil

UNION ALL

SELECT
  'Contas sincronizadas hoje',
  COUNT(*)::TEXT
FROM conta_contabil
WHERE synced_at >= CURRENT_DATE;
```

---

## ✅ Checklist Final

- [ ] Credenciais do Supabase copiadas
- [ ] Código do Apps Script colado e salvo
- [ ] Script autorizado (permissões concedidas)
- [ ] Menu **🔄 Sincronização** aparece no Sheets
- [ ] Sincronização manual testada (`syncAll`)
- [ ] Dados verificados no Supabase
- [ ] Trigger automático configurado (horário)
- [ ] Trigger de edição configurado (onEdit)
- [ ] Sincronização em tempo real testada
- [ ] Logs verificados (sem erros)

---

## 🎉 Pronto!

Agora você tem:

✅ Sincronização automática Google Sheets → Supabase
✅ Atualização em tempo real ao editar células
✅ Sincronização periódica (a cada 1 hora)
✅ Menu personalizado no Google Sheets
✅ Monitoramento via logs

**Próximo passo:** Popular `conta_contabil` nas transactions existentes (ver GUIA_MIGRACAO_CONTA_CONTABIL.md)

---

**Data:** 31 de Janeiro de 2026
**Status:** ✅ CONFIGURAÇÃO DOCUMENTADA
