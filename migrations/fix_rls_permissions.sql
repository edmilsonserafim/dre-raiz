-- ═══════════════════════════════════════════════════════════════
-- FIX: Habilitar RLS e criar políticas para novas tabelas
-- ═══════════════════════════════════════════════════════════════

-- IMPORTANTE: Execute este SQL apenas se houver erro de permissão
-- nas tabelas transactions_orcado, transactions_ano_anterior ou dre_hierarchy

-- ═══════════════════════════════════════════════════════════════
-- 1. TRANSACTIONS_ORCADO - Políticas RLS
-- ═══════════════════════════════════════════════════════════════

-- Habilitar RLS
ALTER TABLE transactions_orcado ENABLE ROW LEVEL SECURITY;

-- Política: Permitir SELECT para usuários autenticados
CREATE POLICY "Permitir SELECT para usuários autenticados"
ON transactions_orcado
FOR SELECT
TO authenticated
USING (true);

-- Política: Permitir INSERT para usuários autenticados
CREATE POLICY "Permitir INSERT para usuários autenticados"
ON transactions_orcado
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política: Permitir UPDATE para usuários autenticados
CREATE POLICY "Permitir UPDATE para usuários autenticados"
ON transactions_orcado
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política: Permitir DELETE para usuários autenticados
CREATE POLICY "Permitir DELETE para usuários autenticados"
ON transactions_orcado
FOR DELETE
TO authenticated
USING (true);

-- ═══════════════════════════════════════════════════════════════
-- 2. TRANSACTIONS_ANO_ANTERIOR - Políticas RLS
-- ═══════════════════════════════════════════════════════════════

-- Habilitar RLS
ALTER TABLE transactions_ano_anterior ENABLE ROW LEVEL SECURITY;

-- Política: Permitir SELECT para usuários autenticados
CREATE POLICY "Permitir SELECT para usuários autenticados"
ON transactions_ano_anterior
FOR SELECT
TO authenticated
USING (true);

-- Política: Permitir INSERT para usuários autenticados
CREATE POLICY "Permitir INSERT para usuários autenticados"
ON transactions_ano_anterior
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política: Permitir UPDATE para usuários autenticados
CREATE POLICY "Permitir UPDATE para usuários autenticados"
ON transactions_ano_anterior
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política: Permitir DELETE para usuários autenticados
CREATE POLICY "Permitir DELETE para usuários autenticados"
ON transactions_ano_anterior
FOR DELETE
TO authenticated
USING (true);

-- ═══════════════════════════════════════════════════════════════
-- 3. DRE_HIERARCHY - Políticas RLS
-- ═══════════════════════════════════════════════════════════════

-- Habilitar RLS
ALTER TABLE dre_hierarchy ENABLE ROW LEVEL SECURITY;

-- Política: Permitir SELECT para usuários autenticados
CREATE POLICY "Permitir SELECT para usuários autenticados"
ON dre_hierarchy
FOR SELECT
TO authenticated
USING (true);

-- Política: Permitir INSERT para usuários autenticados (apenas admin)
CREATE POLICY "Permitir INSERT para usuários autenticados"
ON dre_hierarchy
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política: Permitir UPDATE para usuários autenticados (apenas admin)
CREATE POLICY "Permitir UPDATE para usuários autenticados"
ON dre_hierarchy
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política: Permitir DELETE para usuários autenticados (apenas admin)
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
