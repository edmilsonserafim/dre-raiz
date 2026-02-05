-- ═══════════════════════════════════════════════════════════════════════════
-- OTIMIZAÇÃO DE QUERIES - FASE 5
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Objetivo: Reduzir latência de queries para < 200ms com 100k+ registros
--
-- Índices criados:
-- 1. Índice composto para filtros comuns (date, marca, filial, scenario)
-- 2. Índice para Realtime (updated_at DESC)
-- 3. Índice para busca por categoria + tipo
-- 4. Índice para busca por filial + período
--
-- Execute no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Índice composto para filtros principais
-- Usado em: getFilteredTransactions (90% das queries)
-- Colunas ordenadas por seletividade: scenario → marca → filial → date
CREATE INDEX IF NOT EXISTS idx_transactions_main_filters
  ON transactions(scenario, marca, filial, date DESC)
  WHERE scenario = 'Real';  -- Partial index: apenas cenário Real

COMMENT ON INDEX idx_transactions_main_filters IS
  'Índice composto para filtros principais (scenario, marca, filial, date).
   Partial index para scenario=Real (90% das queries).';

-- 2. Índice para Realtime e sincronização (updated_at)
-- Usado em: Conflict detection, Realtime events, Audit log
CREATE INDEX IF NOT EXISTS idx_transactions_updated_at
  ON transactions(updated_at DESC);

COMMENT ON INDEX idx_transactions_updated_at IS
  'Índice para Realtime events e conflict detection (ORDER BY updated_at DESC).';

-- 3. Índice composto para filtros de categoria + tipo
-- Usado em: Análises por categoria, relatórios DRE
CREATE INDEX IF NOT EXISTS idx_transactions_category_type
  ON transactions(category, type, date DESC)
  WHERE scenario = 'Real';

COMMENT ON INDEX idx_transactions_category_type IS
  'Índice para filtros por categoria e tipo de transação.';

-- 4. Índice composto para filtros de filial + período
-- Usado em: Relatórios por filial, comparações periódicas
CREATE INDEX IF NOT EXISTS idx_transactions_filial_period
  ON transactions(filial, date DESC, marca)
  WHERE scenario = 'Real';

COMMENT ON INDEX idx_transactions_filial_period IS
  'Índice para queries por filial e período (relatórios).';

-- 5. Índice para busca por texto (tags, description)
-- Usado em: Busca full-text (se implementado no futuro)
CREATE INDEX IF NOT EXISTS idx_transactions_fulltext
  ON transactions USING GIN (
    to_tsvector('portuguese',
      COALESCE(description, '') || ' ' ||
      COALESCE(tag01, '') || ' ' ||
      COALESCE(tag02, '') || ' ' ||
      COALESCE(tag03, '')
    )
  );

COMMENT ON INDEX idx_transactions_fulltext IS
  'Índice full-text para busca em description e tags (português).';

-- ═══════════════════════════════════════════════════════════════════════════
-- ANALYZE: Atualizar estatísticas do PostgreSQL
-- ═══════════════════════════════════════════════════════════════════════════

ANALYZE transactions;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICAÇÃO: Confirmar índices criados
-- ═══════════════════════════════════════════════════════════════════════════

SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'transactions'
ORDER BY indexname;

-- ═══════════════════════════════════════════════════════════════════════════
-- PERFORMANCE TEST: Testar query típica
-- ═══════════════════════════════════════════════════════════════════════════

-- Query típica (deve usar idx_transactions_main_filters)
EXPLAIN ANALYZE
SELECT *
FROM transactions
WHERE scenario = 'Real'
  AND marca = 'Cogna'
  AND filial IN ('Filial A', 'Filial B')
  AND date >= '2025-01-01'
  AND date <= '2025-12-31'
ORDER BY date DESC
LIMIT 1000;

-- Esperado:
-- Execution Time: < 200ms
-- Planning Time: < 5ms
-- Index Scan using idx_transactions_main_filters

-- ═══════════════════════════════════════════════════════════════════════════
-- MANUTENÇÃO: Comandos úteis
-- ═══════════════════════════════════════════════════════════════════════════

-- Ver tamanho dos índices
SELECT
  indexrelname AS index_name,
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND relname = 'transactions'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Ver uso dos índices (após algumas semanas)
SELECT
  schemaname,
  tablename,
  indexrelname AS index_name,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND tablename = 'transactions'
ORDER BY idx_scan DESC;

-- Reindexar se necessário (raramente)
-- REINDEX INDEX CONCURRENTLY idx_transactions_main_filters;

-- ═══════════════════════════════════════════════════════════════════════════
-- NOTAS:
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 1. Partial indexes (WHERE scenario = 'Real'):
--    - Reduzem tamanho do índice (~50%)
--    - Mais rápidos para 90% das queries
--    - Não usados para scenario != 'Real' (fallback para seq scan ou outro índice)
--
-- 2. Ordem das colunas no índice:
--    - Mais seletiva primeiro (scenario, marca)
--    - Menos seletiva depois (filial, date)
--    - DESC para colunas de ordenação
--
-- 3. Manutenção:
--    - Índices atualizam automaticamente (INSERT/UPDATE/DELETE)
--    - VACUUM e ANALYZE executam automaticamente no Supabase
--    - Verificar uso periodicamente (pg_stat_user_indexes)
--
-- 4. Trade-offs:
--    - Índices aceleram SELECT mas tornam INSERT/UPDATE/DELETE ligeiramente mais lentos
--    - Ocupam espaço em disco (estimar ~20-30% do tamanho da tabela)
--    - Benefício muito maior do que custo para tabelas de leitura intensa
--
-- ═══════════════════════════════════════════════════════════════════════════
