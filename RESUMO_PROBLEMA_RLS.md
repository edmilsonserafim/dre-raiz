# 🔍 DIAGNÓSTICO: Problema de RLS - Gabriel vê todas as tags

## ❌ PROBLEMA IDENTIFICADO

O usuário Gabriel deveria ver apenas algumas tags (tag01), mas está vendo TODAS as transações.

## 🔎 ANÁLISE TÉCNICA

### 1. **Políticas RLS desabilitadas**
- **Arquivo**: `schema-rls.sql` linha 136
- **Status**: Todas as políticas RLS estão com `TRUE`
- **Impacto**: TODOS os usuários veem TODOS os dados, independente das permissões

```sql
-- Linha 136 de schema-rls.sql
CREATE POLICY "Users can read transactions based on permissions" ON transactions
  FOR SELECT USING (
    TRUE  -- ❌ PROBLEMA: Permite acesso a tudo!
  );
```

### 2. **Tipo de permissão 'tag01' não suportado**
- **Arquivo**: `schema-users.sql` linha 22
- **Constraint atual**: Só permite 'centro_custo', 'cia', 'filial'
- **Falta**: 'tag01', 'tag02', 'tag03'

```sql
-- Linha 22 de schema-users.sql
CHECK (permission_type IN ('centro_custo', 'cia', 'filial'))
-- ❌ Não inclui 'tag01', 'tag02', 'tag03'!
```

### 3. **Frontend precisa ser atualizado**
- **Arquivo**: `services/supabaseService.ts` linha 1054
- **Função**: `addUserPermission` só aceita tipos antigos
- **Status**: Precisa incluir 'tag01', 'tag02', 'tag03'

```typescript
// Linha 1054 de supabaseService.ts
export const addUserPermission = async (
  userId: string,
  permissionType: 'centro_custo' | 'cia' | 'filial',  // ❌ Falta tag01!
  permissionValue: string
) => { ... }
```

## ✅ SOLUÇÃO COMPLETA

### PASSO 1: Corrigir o Banco de Dados

Execute os scripts nesta ordem:

1. **`diagnostico_rls_gabriel.sql`** - Para verificar o estado atual
2. **`fix_rls_tag01.sql`** - Para corrigir as políticas RLS e adicionar suporte a tag01
3. **`configurar_permissoes_gabriel.sql`** - Para configurar as permissões do Gabriel
4. **`testar_rls_gabriel.sql`** - Para validar que está funcionando

### PASSO 2: Atualizar o Frontend

Editar `services/supabaseService.ts`:

**Localização**: Linha 1054
**Alterar de:**
```typescript
export const addUserPermission = async (
  userId: string,
  permissionType: 'centro_custo' | 'cia' | 'filial',
  permissionValue: string
) => { ... }
```

**Para:**
```typescript
export const addUserPermission = async (
  userId: string,
  permissionType: 'centro_custo' | 'cia' | 'filial' | 'tag01' | 'tag02' | 'tag03',
  permissionValue: string
) => { ... }
```

## 📋 CHECKLIST DE EXECUÇÃO

### No Banco de Dados (Supabase SQL Editor):

- [ ] 1. Executar `diagnostico_rls_gabriel.sql` para ver estado atual
- [ ] 2. Anotar o email correto do Gabriel
- [ ] 3. Anotar os valores de tag01 que ele deve ver
- [ ] 4. Executar `fix_rls_tag01.sql` para corrigir as políticas
- [ ] 5. Ajustar `configurar_permissoes_gabriel.sql` com:
  - Email correto do Gabriel (linha 8)
  - Valores corretos de tag01 que ele pode ver (linhas 42, 48, etc)
- [ ] 6. Executar `configurar_permissoes_gabriel.sql`
- [ ] 7. Executar `testar_rls_gabriel.sql` para validar

### No Código (Frontend):

- [ ] 1. Abrir `services/supabaseService.ts`
- [ ] 2. Encontrar função `addUserPermission` (linha 1054)
- [ ] 3. Adicionar 'tag01' | 'tag02' | 'tag03' ao tipo permissionType
- [ ] 4. Salvar o arquivo
- [ ] 5. Rebuild da aplicação

### Teste Final:

- [ ] 1. Fazer login como Gabriel
- [ ] 2. Verificar que ele vê apenas as transações com tag01 permitidas
- [ ] 3. Verificar o console do navegador (F12) para logs

## 🎯 RESULTADO ESPERADO

Após executar todos os passos:

1. ✅ Gabriel verá apenas transações com tag01 permitidas
2. ✅ Admins continuarão vendo tudo
3. ✅ Usuários sem permissões específicas verão tudo
4. ✅ Outros usuários com permissões específicas terão seus dados filtrados

## ⚠️ IMPORTANTE

### Configuração Atual da Aplicação:
- ✅ Usa `VITE_SUPABASE_ANON_KEY` (correto para RLS)
- ✅ O RLS funciona automaticamente nas queries
- ❌ Mas as políticas estão abertas (TRUE)

### Após Correção:
- 🔒 RLS ativo e filtrando por permissões
- 🔐 Acesso controlado por tag01, filial, CIA, etc.
- 🛡️ Segurança em nível de banco de dados

## 📞 PRÓXIMOS PASSOS

1. Execute os scripts SQL no Supabase
2. Atualize o código TypeScript
3. Teste com o usuário Gabriel
4. Verifique no painel admin se está funcionando

## 🐛 TROUBLESHOOTING

### Se Gabriel ainda vê tudo:

1. Verificar se as políticas RLS foram aplicadas:
```sql
SELECT * FROM pg_policies WHERE tablename = 'transactions';
```

2. Verificar permissões do Gabriel:
```sql
SELECT * FROM user_permissions up
JOIN users u ON u.id = up.user_id
WHERE u.email ILIKE '%gabriel%';
```

3. Verificar se o frontend está usando a ANON key:
- Nunca use `VITE_SUPABASE_SERVICE_ROLE_KEY` no frontend
- Service role bypassa o RLS!

### Se ninguém consegue ver nada:

1. Verificar se as funções foram criadas:
```sql
SELECT proname FROM pg_proc WHERE proname LIKE '%can_access%';
```

2. Conceder permissões de execução:
```sql
GRANT EXECUTE ON FUNCTION can_access_transaction_with_tags TO anon, authenticated;
```

## 📚 ARQUIVOS CRIADOS

1. **diagnostico_rls_gabriel.sql** - Diagnóstico completo
2. **fix_rls_tag01.sql** - Correção das políticas RLS
3. **configurar_permissoes_gabriel.sql** - Configurar permissões do Gabriel
4. **testar_rls_gabriel.sql** - Validar configuração
5. **RESUMO_PROBLEMA_RLS.md** - Este arquivo (documentação)

---

**Data**: 2026-02-10
**Autor**: Claude Code
**Status**: Solução Pronta para Execução
