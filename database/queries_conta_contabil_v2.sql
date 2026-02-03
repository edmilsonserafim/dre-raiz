-- =====================================================
-- Queries Úteis: transactions.conta_contabil + conta_contabil (Google Sheets)
-- =====================================================
-- IMPORTANTE: Usa transactions.conta_contabil = conta_contabil.cod_conta
-- =====================================================

-- =====================================================
-- 1. VERIFICAÇÕES BÁSICAS
-- =====================================================

-- Total de contas cadastradas (do Google Sheets)
SELECT COUNT(*) as total_contas_sheets
FROM conta_contabil;

-- Total de transactions com conta_contabil preenchida
SELECT
  COUNT(*) as total_transactions,
  COUNT(conta_contabil) as com_conta_preenchida,
  COUNT(*) - COUNT(conta_contabil) as sem_conta,
  ROUND(COUNT(conta_contabil) * 100.0 / COUNT(*), 2) || '%' as percentual_preenchido
FROM transactions;

-- Transações sem conta_contabil (precisam ser corrigidas)
SELECT
  id,
  date,
  description,
  category,
  amount,
  'sem conta_contabil' as alerta
FROM transactions
WHERE conta_contabil IS NULL
LIMIT 50;

-- =====================================================
-- 2. JOINS BÁSICOS
-- =====================================================

-- Transações com informações da conta contábil
SELECT
  t.date,
  t.conta_contabil,
  t.description,
  t.amount,
  c.tag1,
  c.tag2,
  c.bp_dre,
  c.responsavel
FROM transactions t
LEFT JOIN conta_contabil c ON t.conta_contabil = c.cod_conta
WHERE t.scenario = 'Real'
ORDER BY t.date DESC
LIMIT 100;

-- Usar a view pronta
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
ORDER BY date DESC
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
INNER JOIN conta_contabil c ON t.conta_contabil = c.cod_conta
WHERE t.scenario = 'Real'
GROUP BY c.tag1
ORDER BY valor_total DESC;

-- Total por Tag1 e Tag2
SELECT
  c.tag1,
  c.tag2,
  COUNT(t.id) as num_transacoes,
  SUM(t.amount) as valor_total
FROM transactions t
INNER JOIN conta_contabil c ON t.conta_contabil = c.cod_conta
WHERE t.scenario = 'Real'
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
INNER JOIN conta_contabil c ON t.conta_contabil = c.cod_conta
WHERE t.scenario = 'Real'
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
INNER JOIN conta_contabil c ON t.conta_contabil = c.cod_conta
WHERE t.scenario = 'Real'
  AND c.responsavel IS NOT NULL
GROUP BY c.responsavel, c.bp_dre
ORDER BY valor_total DESC;

-- =====================================================
-- 6. ANÁLISES POR MARCA/FILIAL
-- =====================================================

-- Total por Marca e Tag1
SELECT
  t.brand,
  c.tag1,
  COUNT(t.id) as num_transacoes,
  SUM(t.amount) as valor_total
FROM transactions t
INNER JOIN conta_contabil c ON t.conta_contabil = c.cod_conta
WHERE t.scenario = 'Real'
  AND t.brand IS NOT NULL
GROUP BY t.brand, c.tag1
ORDER BY t.brand, valor_total DESC;

-- Total por Filial e BP/DRE
SELECT
  t.branch,
  c.bp_dre,
  COUNT(t.id) as num_transacoes,
  SUM(t.amount) as valor_total
FROM transactions t
INNER JOIN conta_contabil c ON t.conta_contabil = c.cod_conta
WHERE t.scenario = 'Real'
  AND t.branch IS NOT NULL
GROUP BY t.branch, c.bp_dre
ORDER BY t.branch, c.bp_dre;

-- =====================================================
-- 7. CONTAS SEM USO
-- =====================================================

-- Contas do Google Sheets que não têm transações
SELECT
  c.cod_conta,
  c.tag1,
  c.tag2,
  c.bp_dre,
  c.responsavel,
  'Conta sem uso' as status
FROM conta_contabil c
LEFT JOIN transactions t ON c.cod_conta = t.conta_contabil
WHERE t.id IS NULL
ORDER BY c.cod_conta;

-- =====================================================
-- 8. TRANSAÇÕES SEM MATCH
-- =====================================================

-- Transações sem conta_contabil preenchida
SELECT
  t.id,
  t.date,
  t.description,
  t.category,
  t.amount,
  t.scenario,
  'Precisa preencher conta_contabil' as acao
FROM transactions t
WHERE t.conta_contabil IS NULL
  AND t.scenario = 'Real'
ORDER BY t.date DESC
LIMIT 100;

-- Transações com conta_contabil preenchida mas sem match
SELECT
  t.id,
  t.date,
  t.conta_contabil,
  t.description,
  t.amount,
  'Conta não existe no Google Sheets' as acao
FROM transactions t
LEFT JOIN conta_contabil c ON t.conta_contabil = c.cod_conta
WHERE t.conta_contabil IS NOT NULL
  AND c.id IS NULL
  AND t.scenario = 'Real'
ORDER BY t.date DESC
LIMIT 100;

-- =====================================================
-- 9. POPULAR CONTA_CONTABIL (AUTOMÁTICO)
-- =====================================================

-- Opção 1: Popular usando category como base
-- (Execute UMA VEZ para tentar match automático)
UPDATE transactions t
SET conta_contabil = c.cod_conta
FROM conta_contabil c
WHERE t.category = c.cod_conta
  AND t.conta_contabil IS NULL;

-- Verificar resultado
SELECT
  'Atualização concluída' as status,
  COUNT(*) as total_atualizadas
FROM transactions
WHERE conta_contabil IS NOT NULL;

-- =====================================================
-- 10. POPULAR CONTA_CONTABIL (MANUAL/ESPECÍFICO)
-- =====================================================

-- Template para atualizar manualmente
-- Substitua os valores conforme necessário:

-- Exemplo 1: Atualizar por category específica
UPDATE transactions
SET conta_contabil = '3.01.001'  -- ← código da conta
WHERE category = 'Receita de Mensalidades'
  AND conta_contabil IS NULL;

-- Exemplo 2: Atualizar por description (texto)
UPDATE transactions
SET conta_contabil = '4.01.002'  -- ← código da conta
WHERE description ILIKE '%salário%'
  AND conta_contabil IS NULL;

-- Exemplo 3: Atualizar por range de datas
UPDATE transactions
SET conta_contabil = '1.01.001'  -- ← código da conta
WHERE date BETWEEN '2026-01-01' AND '2026-01-31'
  AND category = 'Caixa'
  AND conta_contabil IS NULL;

-- =====================================================
-- 11. ANÁLISES DE QUALIDADE
-- =====================================================

-- Qualidade do preenchimento
SELECT
  'Resumo do Preenchimento' as metrica,
  COUNT(*) as total_transactions,
  COUNT(conta_contabil) as com_conta,
  COUNT(*) - COUNT(conta_contabil) as sem_conta,
  ROUND(COUNT(conta_contabil) * 100.0 / COUNT(*), 2) || '%' as percentual
FROM transactions
WHERE scenario = 'Real';

-- Contas mais usadas
SELECT
  t.conta_contabil,
  c.tag1,
  c.nome_nat_orc,
  COUNT(t.id) as num_usos,
  SUM(t.amount) as valor_total
FROM transactions t
INNER JOIN conta_contabil c ON t.conta_contabil = c.cod_conta
WHERE t.scenario = 'Real'
GROUP BY t.conta_contabil, c.tag1, c.nome_nat_orc
ORDER BY num_usos DESC
LIMIT 20;

-- =====================================================
-- 12. RELATÓRIOS PARA DASHBOARDS
-- =====================================================

-- KPIs gerais
SELECT
  COUNT(DISTINCT t.conta_contabil) as contas_ativas,
  COUNT(t.id) as total_transacoes,
  SUM(t.amount) as valor_total,
  COUNT(DISTINCT c.tag1) as total_tags,
  COUNT(DISTINCT c.responsavel) as total_responsaveis
FROM transactions t
INNER JOIN conta_contabil c ON t.conta_contabil = c.cod_conta
WHERE t.scenario = 'Real';

-- Distribuição por BP/DRE
SELECT
  c.bp_dre,
  COUNT(t.id) as quantidade,
  SUM(t.amount) as valor,
  ROUND(SUM(t.amount) * 100.0 / SUM(SUM(t.amount)) OVER (), 2) as percentual
FROM transactions t
INNER JOIN conta_contabil c ON t.conta_contabil = c.cod_conta
WHERE t.scenario = 'Real'
GROUP BY c.bp_dre
ORDER BY valor DESC;

-- Top 10 contas por valor
SELECT
  t.conta_contabil,
  c.tag1,
  c.tag2,
  c.bp_dre,
  COUNT(t.id) as num_transacoes,
  SUM(t.amount) as valor_total
FROM transactions t
INNER JOIN conta_contabil c ON t.conta_contabil = c.cod_conta
WHERE t.scenario = 'Real'
GROUP BY t.conta_contabil, c.tag1, c.tag2, c.bp_dre
ORDER BY ABS(valor_total) DESC
LIMIT 10;

-- =====================================================
-- 13. EVOLUTIVO TEMPORAL
-- =====================================================

-- Evolução mensal por Tag1
SELECT
  TO_CHAR(t.date::date, 'YYYY-MM') as mes,
  c.tag1,
  COUNT(t.id) as num_transacoes,
  SUM(t.amount) as valor_total
FROM transactions t
INNER JOIN conta_contabil c ON t.conta_contabil = c.cod_conta
WHERE t.scenario = 'Real'
  AND t.date >= '2025-01-01'
GROUP BY TO_CHAR(t.date::date, 'YYYY-MM'), c.tag1
ORDER BY mes, c.tag1;

-- =====================================================
-- 14. VALIDAÇÕES E ALERTAS
-- =====================================================

-- Alertas: Transações sem conta
SELECT
  'ALERTA: Transações sem conta_contabil' as tipo_alerta,
  COUNT(*) as quantidade,
  SUM(amount) as valor_total
FROM transactions
WHERE conta_contabil IS NULL
  AND scenario = 'Real';

-- Alertas: Contas inválidas (não existem no Google Sheets)
SELECT
  'ALERTA: Contas inválidas (não existem no Sheets)' as tipo_alerta,
  COUNT(*) as quantidade,
  SUM(t.amount) as valor_total
FROM transactions t
LEFT JOIN conta_contabil c ON t.conta_contabil = c.cod_conta
WHERE t.conta_contabil IS NOT NULL
  AND c.id IS NULL
  AND t.scenario = 'Real';

-- Lista de contas inválidas
SELECT DISTINCT
  t.conta_contabil,
  COUNT(*) as num_ocorrencias,
  SUM(t.amount) as valor_total,
  'Conta não existe no Google Sheets' as problema
FROM transactions t
LEFT JOIN conta_contabil c ON t.conta_contabil = c.cod_conta
WHERE t.conta_contabil IS NOT NULL
  AND c.id IS NULL
  AND t.scenario = 'Real'
GROUP BY t.conta_contabil
ORDER BY num_ocorrencias DESC;
