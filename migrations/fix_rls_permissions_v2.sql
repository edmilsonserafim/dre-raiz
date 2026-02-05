-- ═══════════════════════════════════════════════════════════════
-- FIX V2: Limpar e recriar políticas RLS (resolve conflitos)
-- ═══════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════
-- 1. TRANSACTIONS_ORCADO - Limpar e recriar
-- ═══════════════════════════════════════════════════════════════

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Permitir SELECT para usuários autenticados" ON transactions_orcado;
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON transactions_orcado;
DROP POLICY IF EXISTS "Permitir UPDATE para usuários autenticados" ON transactions_orcado;
DROP POLICY IF EXISTS "Permitir DELETE para usuários autenticados" ON transactions_orcado;

-- Habilitar RLS
ALTER TABLE transactions_orcado ENABLE ROW LEVEL SECURITY;

-- Recriar políticas
CREATE POLICY "Permitir SELECT para usuários autenticados"
ON transactions_orcado
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir INSERT para usuários autenticados"
ON transactions_orcado
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Permitir UPDATE para usuários autenticados"
ON transactions_orcado
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir DELETE para usuários autenticados"
ON transactions_orcado
FOR DELETE
TO authenticated
USING (true);

-- ═══════════════════════════════════════════════════════════════
-- 2. TRANSACTIONS_ANO_ANTERIOR - Limpar e recriar
-- ═══════════════════════════════════════════════════════════════

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Permitir SELECT para usuários autenticados" ON transactions_ano_anterior;
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON transactions_ano_anterior;
DROP POLICY IF EXISTS "Permitir UPDATE para usuários autenticados" ON transactions_ano_anterior;
DROP POLICY IF EXISTS "Permitir DELETE para usuários autenticados" ON transactions_ano_anterior;

-- Habilitar RLS
ALTER TABLE transactions_ano_anterior ENABLE ROW LEVEL SECURITY;

-- Recriar políticas
CREATE POLICY "Permitir SELECT para usuários autenticados"
ON transactions_ano_anterior
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir INSERT para usuários autenticados"
ON transactions_ano_anterior
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Permitir UPDATE para usuários autenticados"
ON transactions_ano_anterior
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir DELETE para usuários autenticados"
ON transactions_ano_anterior
FOR DELETE
TO authenticated
USING (true);

-- ═══════════════════════════════════════════════════════════════
-- 3. DRE_HIERARCHY - Limpar e recriar
-- ═══════════════════════════════════════════════════════════════

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Permitir SELECT para usuários autenticados" ON dre_hierarchy;
DROP POLICY IF EXISTS "Permitir INSERT para usuários autenticados" ON dre_hierarchy;
DROP POLICY IF EXISTS "Permitir UPDATE para usuários autenticados" ON dre_hierarchy;
DROP POLICY IF EXISTS "Permitir DELETE para usuários autenticados" ON dre_hierarchy;

-- Habilitar RLS
ALTER TABLE dre_hierarchy ENABLE ROW LEVEL SECURITY;

-- Recriar políticas
CREATE POLICY "Permitir SELECT para usuários autenticados"
ON dre_hierarchy
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir INSERT para usuários autenticados"
ON dre_hierarchy
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Permitir UPDATE para usuários autenticados"
ON dre_hierarchy
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir DELETE para usuários autenticados"
ON dre_hierarchy
FOR DELETE
TO authenticated
USING (true);

-- ═══════════════════════════════════════════════════════════════
-- VERIFICAÇÃO: Confirmar que as políticas foram criadas
-- ═══════════════════════════════════════════════════════════════

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('transactions_orcado', 'transactions_ano_anterior', 'dre_hierarchy')
ORDER BY tablename, policyname;
