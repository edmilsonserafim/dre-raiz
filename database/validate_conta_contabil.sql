-- =====================================================
-- Script de Validação: Migração conta_contabil
-- =====================================================
-- Execute este script após a migração para validar os dados

-- =====================================================
-- 1. VERIFICAR ESTRUTURA
-- =====================================================

-- Verificar se coluna foi criada em transactions
SELECT
  'Coluna conta_contabil' as item,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = 'transactions'
        AND column_name = 'conta_contabil'
    ) THEN '✅ Criada'
    ELSE '❌ Não encontrada'
  END as status;

-- Verificar se tabela conta_contabil existe
SELECT
  'Tabela conta_contabil' as item,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_name = 'conta_contabil'
    ) THEN '✅ Criada'
    ELSE '❌ Não encontrada'
  END as status;

-- Verificar se view existe
SELECT
  'View vw_transactions_with_conta' as item,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM information_schema.views
      WHERE table_name = 'vw_transactions_with_conta'
    ) THEN '✅ Criada'
    ELSE '❌ Não encontrada'
  END as status;

-- =====================================================
-- 2. VERIFICAR ÍNDICES
-- =====================================================

SELECT
  indexname as indice,
  '✅ Criado' as status
FROM pg_indexes
WHERE tablename IN ('transactions', 'conta_contabil')
  AND indexname LIKE '%conta%'
ORDER BY tablename, indexname;

-- =====================================================
-- 3. ESTATÍSTICAS DE DADOS
-- =====================================================

-- Total de contas no Google Sheets
SELECT
  'Contas no plano (Google Sheets)' as metrica,
  COUNT(*) as valor,
  CASE
    WHEN COUNT(*) > 0 THEN '✅'
    ELSE '⚠️ Vazio - Execute sync do Google Sheets'
  END as status
FROM conta_contabil;

-- Total de transactions
SELECT
  'Total de transactions' as metrica,
  COUNT(*) as valor,
  '✅' as status
FROM transactions
WHERE scenario = 'Real';

-- Transactions com conta_contabil preenchida
SELECT
  'Transactions com conta_contabil' as metrica,
  COUNT(*) as valor,
  CASE
    WHEN COUNT(*) > 0 THEN '✅'
    ELSE '⚠️ Nenhuma - Execute popular_conta_contabil_transactions()'
  END as status
FROM transactions
WHERE conta_contabil IS NOT NULL
  AND scenario = 'Real';

-- Percentual de preenchimento
SELECT
  'Percentual preenchido' as metrica,
  ROUND(
    COUNT(*) FILTER (WHERE conta_contabil IS NOT NULL) * 100.0 /
    NULLIF(COUNT(*), 0),
    2
  ) as valor,
  CASE
    WHEN COUNT(*) FILTER (WHERE conta_contabil IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0) >= 80 THEN '✅ Bom'
    WHEN COUNT(*) FILTER (WHERE conta_contabil IS NOT NULL) * 100.0 / NULLIF(COUNT(*), 0) >= 50 THEN '⚠️ Regular'
    ELSE '❌ Baixo - Precisa popular'
  END as status
FROM transactions
WHERE scenario = 'Real';

-- =====================================================
-- 4. VALIDAR JOIN
-- =====================================================

-- Testar JOIN básico
SELECT
  'Teste de JOIN' as teste,
  COUNT(*) as linhas_retornadas,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ JOIN funcionando'
    ELSE '❌ JOIN sem resultados'
  END as status
FROM transactions t
INNER JOIN conta_contabil c ON t.conta_contabil = c.cod_conta
WHERE t.scenario = 'Real'
LIMIT 1;

-- Contas inválidas (não existem no Google Sheets)
SELECT
  'Contas inválidas' as problema,
  COUNT(DISTINCT t.conta_contabil) as quantidade,
  CASE
    WHEN COUNT(DISTINCT t.conta_contabil) = 0 THEN '✅ Nenhuma'
    ELSE '⚠️ Existem contas inválidas'
  END as status
FROM transactions t
LEFT JOIN conta_contabil c ON t.conta_contabil = c.cod_conta
WHERE t.conta_contabil IS NOT NULL
  AND c.id IS NULL
  AND t.scenario = 'Real';

-- Listar contas inválidas (se existirem)
SELECT
  t.conta_contabil,
  COUNT(*) as num_transactions,
  SUM(t.amount) as valor_total,
  '❌ Conta não existe no Google Sheets' as problema
FROM transactions t
LEFT JOIN conta_contabil c ON t.conta_contabil = c.cod_conta
WHERE t.conta_contabil IS NOT NULL
  AND c.id IS NULL
  AND t.scenario = 'Real'
GROUP BY t.conta_contabil
ORDER BY num_transactions DESC
LIMIT 10;

-- =====================================================
-- 5. TESTAR VIEW
-- =====================================================

-- Verificar se view retorna dados
SELECT
  'View vw_transactions_with_conta' as teste,
  COUNT(*) as linhas,
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Funcionando'
    ELSE '⚠️ Sem dados'
  END as status
FROM vw_transactions_with_conta
WHERE scenario = 'Real'
LIMIT 1;

-- Amostra de dados da view
SELECT
  'Amostra da view (5 linhas)' as titulo;

SELECT
  date,
  conta_contabil,
  description,
  amount,
  conta_tag1,
  conta_bp_dre,
  conta_responsavel
FROM vw_transactions_with_conta
WHERE scenario = 'Real'
  AND conta_contabil IS NOT NULL
ORDER BY date DESC
LIMIT 5;

-- =====================================================
-- 6. QUALIDADE DOS DADOS
-- =====================================================

-- Top 10 contas mais usadas
SELECT
  'Top 10 contas mais usadas' as titulo;

SELECT
  t.conta_contabil,
  c.tag1,
  c.bp_dre,
  COUNT(*) as num_usos,
  SUM(t.amount) as valor_total
FROM transactions t
INNER JOIN conta_contabil c ON t.conta_contabil = c.cod_conta
WHERE t.scenario = 'Real'
GROUP BY t.conta_contabil, c.tag1, c.bp_dre
ORDER BY num_usos DESC
LIMIT 10;

-- Contas do Google Sheets sem uso
SELECT
  'Contas sem uso (do Google Sheets)' as titulo;

SELECT
  c.cod_conta,
  c.tag1,
  c.bp_dre,
  '⚠️ Sem transações' as status
FROM conta_contabil c
LEFT JOIN transactions t ON c.cod_conta = t.conta_contabil
WHERE t.id IS NULL
ORDER BY c.cod_conta
LIMIT 10;

-- =====================================================
-- 7. DASHBOARD FINAL
-- =====================================================

SELECT
  '═══════════════════════════════════════' as separador,
  'RESUMO DA VALIDAÇÃO' as titulo,
  '═══════════════════════════════════════' as separador2;

WITH stats AS (
  SELECT
    COUNT(*) as total_transactions,
    COUNT(conta_contabil) as com_conta,
    (SELECT COUNT(*) FROM conta_contabil) as total_contas_sheets,
    COUNT(DISTINCT conta_contabil) as contas_usadas,
    ROUND(COUNT(conta_contabil) * 100.0 / NULLIF(COUNT(*), 0), 2) as perc_preenchido
  FROM transactions
  WHERE scenario = 'Real'
)
SELECT
  '📊 Total Transactions (Real)' as metrica,
  total_transactions::TEXT as valor
FROM stats
UNION ALL
SELECT
  '📋 Contas no Google Sheets',
  total_contas_sheets::TEXT
FROM stats
UNION ALL
SELECT
  '✅ Transactions com conta',
  com_conta::TEXT || ' (' || perc_preenchido || '%)'
FROM stats
UNION ALL
SELECT
  '🔗 Contas sendo usadas',
  contas_usadas::TEXT
FROM stats
UNION ALL
SELECT
  '📈 Status geral',
  CASE
    WHEN perc_preenchido >= 80 THEN '✅ EXCELENTE'
    WHEN perc_preenchido >= 50 THEN '⚠️ BOM - Melhorar preenchimento'
    ELSE '❌ BAIXO - Popular conta_contabil urgente'
  END
FROM stats;

SELECT
  '═══════════════════════════════════════' as separador;

-- =====================================================
-- FIM DA VALIDAÇÃO
-- =====================================================

SELECT
  '✅ Validação concluída!' as status,
  'Revise os resultados acima' as proximos_passos;
