-- =====================================================
-- Migration: Adicionar coluna conta_contabil em transactions
-- =====================================================

-- 1. Adicionar coluna conta_contabil
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS conta_contabil TEXT;

-- 2. Criar índice para performance no JOIN
CREATE INDEX IF NOT EXISTS idx_transactions_conta_contabil
ON transactions(conta_contabil);

-- 3. Comentário na coluna
COMMENT ON COLUMN transactions.conta_contabil
IS 'Código da conta contábil do plano de contas (join com conta_contabil.cod_conta)';

-- =====================================================
-- Criar tabela conta_contabil (se ainda não existir)
-- =====================================================

CREATE TABLE IF NOT EXISTS conta_contabil (
  -- Chave primária
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Código da conta (chave natural)
  cod_conta TEXT NOT NULL UNIQUE,

  -- Tags de categorização
  tag1 TEXT,
  tag2 TEXT,
  tag3 TEXT,
  tag4 TEXT,
  tag_orc TEXT,

  -- Classificação gerencial
  ger TEXT,
  bp_dre TEXT, -- Balanço Patrimonial ou DRE

  -- Natureza Orçamentária
  nat_orc TEXT,
  nome_nat_orc TEXT,

  -- Responsável
  responsavel TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ, -- Última sincronização com Google Sheets

  CONSTRAINT cod_conta_not_empty CHECK (cod_conta <> '')
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_conta_contabil_cod_conta ON conta_contabil(cod_conta);
CREATE INDEX IF NOT EXISTS idx_conta_contabil_tag1 ON conta_contabil(tag1);
CREATE INDEX IF NOT EXISTS idx_conta_contabil_bp_dre ON conta_contabil(bp_dre);
CREATE INDEX IF NOT EXISTS idx_conta_contabil_tags ON conta_contabil(tag1, tag2, bp_dre);

-- =====================================================
-- Trigger para atualizar updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_conta_contabil_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS conta_contabil_updated_at ON conta_contabil;

CREATE TRIGGER conta_contabil_updated_at
  BEFORE UPDATE ON conta_contabil
  FOR EACH ROW
  EXECUTE FUNCTION update_conta_contabil_updated_at();

-- =====================================================
-- RLS (Row Level Security)
-- =====================================================

ALTER TABLE conta_contabil ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conta_contabil_select_policy" ON conta_contabil;
DROP POLICY IF EXISTS "conta_contabil_insert_policy" ON conta_contabil;
DROP POLICY IF EXISTS "conta_contabil_update_policy" ON conta_contabil;
DROP POLICY IF EXISTS "conta_contabil_service_role_policy" ON conta_contabil;

-- Policies
CREATE POLICY "conta_contabil_select_policy"
  ON conta_contabil FOR SELECT TO authenticated USING (true);

CREATE POLICY "conta_contabil_insert_policy"
  ON conta_contabil FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "conta_contabil_update_policy"
  ON conta_contabil FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "conta_contabil_service_role_policy"
  ON conta_contabil FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =====================================================
-- View atualizada com JOIN correto
-- =====================================================

DROP VIEW IF EXISTS vw_transactions_with_conta;

CREATE OR REPLACE VIEW vw_transactions_with_conta AS
SELECT
  t.*,
  c.tag1 as conta_tag1,
  c.tag2 as conta_tag2,
  c.tag3 as conta_tag3,
  c.tag4 as conta_tag4,
  c.tag_orc as conta_tag_orc,
  c.ger as conta_ger,
  c.bp_dre as conta_bp_dre,
  c.nat_orc as conta_nat_orc,
  c.nome_nat_orc as conta_nome_nat_orc,
  c.responsavel as conta_responsavel
FROM transactions t
LEFT JOIN conta_contabil c ON t.conta_contabil = c.cod_conta;

COMMENT ON VIEW vw_transactions_with_conta
IS 'View que junta transactions com informações do plano de contas. Usa transactions.conta_contabil = conta_contabil.cod_conta';

-- =====================================================
-- Função para sincronizar do Google Sheets
-- =====================================================

CREATE OR REPLACE FUNCTION upsert_conta_contabil(
  p_cod_conta TEXT,
  p_tag1 TEXT DEFAULT NULL,
  p_tag2 TEXT DEFAULT NULL,
  p_tag3 TEXT DEFAULT NULL,
  p_tag4 TEXT DEFAULT NULL,
  p_tag_orc TEXT DEFAULT NULL,
  p_ger TEXT DEFAULT NULL,
  p_bp_dre TEXT DEFAULT NULL,
  p_nat_orc TEXT DEFAULT NULL,
  p_nome_nat_orc TEXT DEFAULT NULL,
  p_responsavel TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO conta_contabil (
    cod_conta, tag1, tag2, tag3, tag4, tag_orc,
    ger, bp_dre, nat_orc, nome_nat_orc, responsavel,
    synced_at
  )
  VALUES (
    p_cod_conta, p_tag1, p_tag2, p_tag3, p_tag4, p_tag_orc,
    p_ger, p_bp_dre, p_nat_orc, p_nome_nat_orc, p_responsavel,
    NOW()
  )
  ON CONFLICT (cod_conta)
  DO UPDATE SET
    tag1 = EXCLUDED.tag1,
    tag2 = EXCLUDED.tag2,
    tag3 = EXCLUDED.tag3,
    tag4 = EXCLUDED.tag4,
    tag_orc = EXCLUDED.tag_orc,
    ger = EXCLUDED.ger,
    bp_dre = EXCLUDED.bp_dre,
    nat_orc = EXCLUDED.nat_orc,
    nome_nat_orc = EXCLUDED.nome_nat_orc,
    responsavel = EXCLUDED.responsavel,
    synced_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Função auxiliar: Popular conta_contabil nas transactions existentes
-- =====================================================

CREATE OR REPLACE FUNCTION popular_conta_contabil_transactions()
RETURNS TABLE(
  total_processadas BIGINT,
  total_atualizadas BIGINT,
  total_sem_match BIGINT
) AS $$
DECLARE
  v_total_processadas BIGINT := 0;
  v_total_atualizadas BIGINT := 0;
  v_total_sem_match BIGINT := 0;
BEGIN
  -- Contar total de transações
  SELECT COUNT(*) INTO v_total_processadas FROM transactions;

  -- Atualizar transactions que têm match com conta_contabil
  -- Usando category como base para o match inicial
  WITH matched AS (
    UPDATE transactions t
    SET conta_contabil = c.cod_conta
    FROM conta_contabil c
    WHERE t.category = c.cod_conta
      AND (t.conta_contabil IS NULL OR t.conta_contabil != c.cod_conta)
    RETURNING t.id
  )
  SELECT COUNT(*) INTO v_total_atualizadas FROM matched;

  -- Contar quantas ficaram sem match
  SELECT COUNT(*) INTO v_total_sem_match
  FROM transactions
  WHERE conta_contabil IS NULL;

  RETURN QUERY SELECT v_total_processadas, v_total_atualizadas, v_total_sem_match;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION popular_conta_contabil_transactions
IS 'Popula a coluna conta_contabil nas transactions usando category como base. Retorna estatísticas.';

-- =====================================================
-- Verificações e Testes
-- =====================================================

-- Verificar se coluna foi criada
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'transactions'
  AND column_name = 'conta_contabil';

-- Verificar índice
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'transactions'
  AND indexname = 'idx_transactions_conta_contabil';

-- Estatísticas iniciais
SELECT
  COUNT(*) as total_transactions,
  COUNT(conta_contabil) as com_conta_contabil,
  COUNT(*) - COUNT(conta_contabil) as sem_conta_contabil,
  ROUND(COUNT(conta_contabil) * 100.0 / COUNT(*), 2) as percentual_preenchido
FROM transactions;

-- =====================================================
-- Sucesso!
-- =====================================================

SELECT
  '✅ Coluna conta_contabil adicionada com sucesso!' as status,
  'Agora você pode popular manualmente ou usar popular_conta_contabil_transactions()' as proximos_passos;
