-- =====================================================
-- Queries Úteis: Conta Contábil + Transactions
-- =====================================================

-- =====================================================
-- 1. VERIFICAÇÕES BÁSICAS
-- =====================================================

-- Total de contas cadastradas
SELECT COUNT(*) as total_contas
FROM conta_contabil;

-- Últimas contas sincronizadas
SELECT cod_conta, tag1, synced_at
FROM conta_contabil
ORDER BY synced_at DESC
LIMIT 10;

-- Contas por Tag1
SELECT
  tag1,
  COUNT(*) as quantidade
FROM conta_contabil
WHERE tag1 IS NOT NULL
GROUP BY tag1
ORDER BY quantidade DESC;

-- =====================================================
-- 2. JOINS COM TRANSACTIONS
-- =====================================================

-- Transações com informações da conta
SELECT
  t.date,
  t.category,
  c.tag1,
  c.tag2,
  c.bp_dre,
  c.responsavel,
  t.amount,
  t.description
FROM transactions t
LEFT JOIN conta_contabil c ON t.category = c.cod_conta
WHERE t.scenario = 'Real'
  AND t.period = '2026-01'
ORDER BY t.date DESC
LIMIT 100;

-- =====================================================
-- 3. ANÁLISES POR TAG
-- =====================================================

-- Total por Tag1
SELECT
  c.tag1,
  COUNT(t.id) as num_transacoes,
  SUM(t.amount) as valor_total,
  AVG(t.amount) as valor_medio
FROM transactions t
INNER JOIN conta_contabil c ON t.category = c.cod_conta
WHERE t.scenario = 'Real'
  AND t.period >= '2026-01-01'
GROUP BY c.tag1
ORDER BY valor_total DESC;

-- Total por Tag1 e Tag2
SELECT
  c.tag1,
  c.tag2,
  COUNT(t.id) as num_transacoes,
  SUM(t.amount) as valor_total
FROM transactions t
INNER JOIN conta_contabil c ON t.category = c.cod_conta
WHERE t.scenario = 'Real'
  AND t.period >= '2026-01-01'
GROUP BY c.tag1, c.tag2
ORDER BY c.tag1, valor_total DESC;

-- =====================================================
-- 4. ANÁLISES POR BP/DRE
-- =====================================================

-- Balanço Patrimonial vs DRE
SELECT
  c.bp_dre,
  COUNT(t.id) as num_transacoes,
  SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) as entradas,
  SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END) as saidas,
  SUM(t.amount) as saldo
FROM transactions t
INNER JOIN conta_contabil c ON t.category = c.cod_conta
WHERE t.scenario = 'Real'
  AND t.period = '2026-01'
GROUP BY c.bp_dre
ORDER BY c.bp_dre;

-- =====================================================
-- 5. ANÁLISES POR RESPONSÁVEL
-- =====================================================

-- Total por Responsável
SELECT
  c.responsavel,
  c.bp_dre,
  COUNT(t.id) as num_transacoes,
  SUM(t.amount) as valor_total
FROM transactions t
INNER JOIN conta_contabil c ON t.category = c.cod_conta
WHERE t.scenario = 'Real'
  AND t.period = '2026-01'
  AND c.responsavel IS NOT NULL
GROUP BY c.responsavel, c.bp_dre
ORDER BY valor_total DESC;

-- Top 10 responsáveis por valor
SELECT
  c.responsavel,
  SUM(t.amount) as valor_total,
  COUNT(t.id) as num_transacoes
FROM transactions t
INNER JOIN conta_contabil c ON t.category = c.cod_conta
WHERE t.scenario = 'Real'
  AND t.period >= '2026-01-01'
  AND c.responsavel IS NOT NULL
GROUP BY c.responsavel
ORDER BY ABS(valor_total) DESC
LIMIT 10;

-- =====================================================
-- 6. ANÁLISES POR NATUREZA ORÇAMENTÁRIA
-- =====================================================

-- Total por Natureza Orçamentária
SELECT
  c.nat_orc,
  c.nome_nat_orc,
  COUNT(t.id) as num_transacoes,
  SUM(t.amount) as valor_total
FROM transactions t
INNER JOIN conta_contabil c ON t.category = c.cod_conta
WHERE t.scenario = 'Real'
  AND t.period = '2026-01'
  AND c.nat_orc IS NOT NULL
GROUP BY c.nat_orc, c.nome_nat_orc
ORDER BY valor_total DESC;

-- =====================================================
-- 7. ANÁLISES POR MARCA/FILIAL
-- =====================================================

-- Total por Marca e Tag1
SELECT
  t.brand,
  c.tag1,
  COUNT(t.id) as num_transacoes,
  SUM(t.amount) as valor_total
FROM transactions t
INNER JOIN conta_contabil c ON t.category = c.cod_conta
WHERE t.scenario = 'Real'
  AND t.period = '2026-01'
GROUP BY t.brand, c.tag1
ORDER BY t.brand, valor_total DESC;

-- Total por Filial e BP/DRE
SELECT
  t.branch,
  c.bp_dre,
  COUNT(t.id) as num_transacoes,
  SUM(t.amount) as valor_total
FROM transactions t
INNER JOIN conta_contabil c ON t.category = c.cod_conta
WHERE t.scenario = 'Real'
  AND t.period = '2026-01'
  AND t.branch IS NOT NULL
GROUP BY t.branch, c.bp_dre
ORDER BY t.branch, c.bp_dre;

-- =====================================================
-- 8. CONTAS SEM TRANSAÇÕES
-- =====================================================

-- Contas cadastradas mas sem uso
SELECT
  c.cod_conta,
  c.tag1,
  c.tag2,
  c.bp_dre,
  c.responsavel
FROM conta_contabil c
LEFT JOIN transactions t ON c.cod_conta = t.category
WHERE t.id IS NULL
ORDER BY c.cod_conta;

-- =====================================================
-- 9. TRANSAÇÕES SEM CONTA CADASTRADA
-- =====================================================

-- Transações órfãs (sem vínculo com plano de contas)
SELECT DISTINCT
  t.category,
  COUNT(*) as num_transacoes,
  SUM(t.amount) as valor_total
FROM transactions t
LEFT JOIN conta_contabil c ON t.category = c.cod_conta
WHERE c.id IS NULL
  AND t.scenario = 'Real'
  AND t.period = '2026-01'
GROUP BY t.category
ORDER BY num_transacoes DESC;

-- =====================================================
-- 10. ANÁLISES TEMPORAIS
-- =====================================================

-- Evolução mensal por Tag1
SELECT
  TO_CHAR(t.date, 'YYYY-MM') as mes,
  c.tag1,
  COUNT(t.id) as num_transacoes,
  SUM(t.amount) as valor_total
FROM transactions t
INNER JOIN conta_contabil c ON t.category = c.cod_conta
WHERE t.scenario = 'Real'
  AND t.date >= '2025-01-01'
GROUP BY TO_CHAR(t.date, 'YYYY-MM'), c.tag1
ORDER BY mes, c.tag1;

-- Comparativo ano vs ano por BP/DRE
SELECT
  c.bp_dre,
  EXTRACT(YEAR FROM t.date) as ano,
  EXTRACT(MONTH FROM t.date) as mes,
  SUM(t.amount) as valor_total
FROM transactions t
INNER JOIN conta_contabil c ON t.category = c.cod_conta
WHERE t.scenario = 'Real'
  AND t.date >= '2024-01-01'
GROUP BY c.bp_dre, EXTRACT(YEAR FROM t.date), EXTRACT(MONTH FROM t.date)
ORDER BY c.bp_dre, ano, mes;

-- =====================================================
-- 11. CONSOLIDAÇÕES
-- =====================================================

-- Consolidado geral com todos os níveis de tags
SELECT
  c.tag1,
  c.tag2,
  c.tag3,
  c.bp_dre,
  c.responsavel,
  COUNT(t.id) as num_transacoes,
  SUM(t.amount) as valor_total
FROM transactions t
INNER JOIN conta_contabil c ON t.category = c.cod_conta
WHERE t.scenario = 'Real'
  AND t.period = '2026-01'
GROUP BY c.tag1, c.tag2, c.tag3, c.bp_dre, c.responsavel
HAVING SUM(t.amount) != 0
ORDER BY ABS(valor_total) DESC;

-- =====================================================
-- 12. TOP N ANÁLISES
-- =====================================================

-- Top 20 contas por volume
SELECT
  t.category,
  c.tag1,
  c.nome_nat_orc,
  COUNT(t.id) as num_transacoes,
  SUM(t.amount) as valor_total
FROM transactions t
LEFT JOIN conta_contabil c ON t.category = c.cod_conta
WHERE t.scenario = 'Real'
  AND t.period = '2026-01'
GROUP BY t.category, c.tag1, c.nome_nat_orc
ORDER BY ABS(valor_total) DESC
LIMIT 20;

-- =====================================================
-- 13. ANÁLISES DE QUALIDADE
-- =====================================================

-- % de transações com conta cadastrada
SELECT
  COUNT(CASE WHEN c.id IS NOT NULL THEN 1 END) * 100.0 / COUNT(*) as perc_com_conta,
  COUNT(CASE WHEN c.id IS NULL THEN 1 END) * 100.0 / COUNT(*) as perc_sem_conta,
  COUNT(*) as total_transacoes
FROM transactions t
LEFT JOIN conta_contabil c ON t.category = c.cod_conta
WHERE t.scenario = 'Real'
  AND t.period = '2026-01';

-- Contas mais usadas
SELECT
  c.cod_conta,
  c.tag1,
  c.tag2,
  c.bp_dre,
  COUNT(t.id) as num_usos
FROM conta_contabil c
INNER JOIN transactions t ON c.cod_conta = t.category
WHERE t.scenario = 'Real'
  AND t.period >= '2025-01-01'
GROUP BY c.cod_conta, c.tag1, c.tag2, c.bp_dre
ORDER BY num_usos DESC
LIMIT 20;

-- =====================================================
-- 14. USANDO A VIEW
-- =====================================================

-- Usar a view criada automaticamente
SELECT
  brand,
  tag1,
  bp_dre,
  COUNT(*) as num_transacoes,
  SUM(amount) as valor_total
FROM vw_transactions_with_conta
WHERE scenario = 'Real'
  AND period = '2026-01'
GROUP BY brand, tag1, bp_dre
ORDER BY brand, valor_total DESC;

-- =====================================================
-- 15. PARA DASHBOARDS
-- =====================================================

-- KPIs para dashboard
SELECT
  COUNT(DISTINCT c.cod_conta) as total_contas_ativas,
  COUNT(t.id) as total_transacoes,
  COUNT(DISTINCT c.tag1) as total_tags,
  SUM(t.amount) as saldo_total,
  AVG(t.amount) as ticket_medio
FROM transactions t
INNER JOIN conta_contabil c ON t.category = c.cod_conta
WHERE t.scenario = 'Real'
  AND t.period = '2026-01';

-- Distribuição por BP/DRE (para gráfico pizza)
SELECT
  c.bp_dre,
  COUNT(t.id) as quantidade,
  SUM(t.amount) as valor,
  SUM(t.amount) * 100.0 / SUM(SUM(t.amount)) OVER () as percentual
FROM transactions t
INNER JOIN conta_contabil c ON t.category = c.cod_conta
WHERE t.scenario = 'Real'
  AND t.period = '2026-01'
GROUP BY c.bp_dre
ORDER BY valor DESC;
