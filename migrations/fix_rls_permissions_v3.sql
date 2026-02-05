-- ═══════════════════════════════════════════════════════════════
-- FIX V3: Políticas RLS mais permissivas (authenticated + anon)
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- DRE_HIERARCHY - Políticas super permissivas
-- ═══════════════════════════════════════════════════════════════

-- Remover políticas antigas
DROP POLICY IF EXISTS "Permitir SELECT para usuários autenticados" ON dre_hierarchy;
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON dre_hierarchy;
DROP POLICY IF EXISTS "Permitir UPDATE para usuários autenticados" ON dre_hierarchy;
DROP POLICY IF EXISTS "Permitir DELETE para usuários autenticados" ON dre_hierarchy;

-- OPÇÃO 1: Desabilitar RLS temporariamente (mais fácil para desenvolvimento)
-- Descomente a linha abaixo se quiser desabilitar RLS:
-- ALTER TABLE dre_hierarchy DISABLE ROW LEVEL SECURITY;

-- OPÇÃO 2: Habilitar RLS com políticas super permissivas
ALTER TABLE dre_hierarchy ENABLE ROW LEVEL SECURITY;

-- Política SELECT: Permitir para TODOS (authenticated + anon)
CREATE POLICY "Allow SELECT for all users"
ON dre_hierarchy
FOR SELECT
USING (true);  -- Permite ler qualquer linha

-- Política INSERT: Permitir para authenticated + anon
CREATE POLICY "Allow INSERT for all users"
ON dre_hierarchy
FOR INSERT
WITH CHECK (true);  -- Permite inserir qualquer dado

-- Política UPDATE: Permitir para authenticated + anon
CREATE POLICY "Allow UPDATE for all users"
ON dre_hierarchy
FOR UPDATE
USING (true)  -- Permite atualizar qualquer linha
WITH CHECK (true);  -- Permite atualizar para qualquer valor

-- Política DELETE: Permitir para authenticated + anon
CREATE POLICY "Allow DELETE for all users"
ON dre_hierarchy
FOR DELETE
USING (true);  -- Permite deletar qualquer linha

-- ═══════════════════════════════════════════════════════════════
-- TRANSACTIONS_ORCADO - Mesmas políticas permissivas
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Permitir SELECT para usuários autenticados" ON transactions_orcado;
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON transactions_orcado;
DROP POLICY IF EXISTS "Permitir UPDATE para usuários autenticados" ON transactions_orcado;
DROP POLICY IF EXISTS "Permitir DELETE para usuários autenticados" ON transactions_orcado;

ALTER TABLE transactions_orcado ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow SELECT for all users"
ON transactions_orcado
FOR SELECT
USING (true);

CREATE POLICY "Allow INSERT for all users"
ON transactions_orcado
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow UPDATE for all users"
ON transactions_orcado
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow DELETE for all users"
ON transactions_orcado
FOR DELETE
USING (true);

-- ═══════════════════════════════════════════════════════════════
-- TRANSACTIONS_ANO_ANTERIOR - Mesmas políticas permissivas
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Permitir SELECT para usuários autenticados" ON transactions_ano_anterior;
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON transactions_ano_anterior;
DROP POLICY IF EXISTS "Permitir UPDATE para usuários autenticados" ON transactions_ano_anterior;
DROP POLICY IF EXISTS "Permitir DELETE para usuários autenticados" ON transactions_ano_anterior;

ALTER TABLE transactions_ano_anterior ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow SELECT for all users"
ON transactions_ano_anterior
FOR SELECT
USING (true);

CREATE POLICY "Allow INSERT for all users"
ON transactions_ano_anterior
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow UPDATE for all users"
ON transactions_ano_anterior
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow DELETE for all users"
ON transactions_ano_anterior
FOR DELETE
USING (true);

-- ═══════════════════════════════════════════════════════════════
-- VERIFICAÇÃO: Confirmar políticas
-- ═══════════════════════════════════════════════════════════════

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('transactions_orcado', 'transactions_ano_anterior', 'dre_hierarchy')
ORDER BY tablename, policyname;

-- Verificar se RLS está habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('transactions_orcado', 'transactions_ano_anterior', 'dre_hierarchy');
