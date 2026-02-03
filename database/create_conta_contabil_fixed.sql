-- =====================================================
-- Tabela: conta_contabil (VERSÃO CORRIGIDA)
-- Descrição: Plano de contas contábil sincronizado com Google Sheets
-- Sincronização: Automática via Google Apps Script
-- =====================================================

-- Criar tabela
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

  -- Índices para performance
  CONSTRAINT cod_conta_not_empty CHECK (cod_conta <> '')
);

-- =====================================================
-- Índices
-- =====================================================

-- Índice no código da conta (usado em JOINs)
CREATE INDEX IF NOT EXISTS idx_conta_contabil_cod_conta ON conta_contabil(cod_conta);

-- Índice nas tags principais
CREATE INDEX IF NOT EXISTS idx_conta_contabil_tag1 ON conta_contabil(tag1);
CREATE INDEX IF NOT EXISTS idx_conta_contabil_bp_dre ON conta_contabil(bp_dre);

-- Índice composto para filtros comuns
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
-- RLS (Row Level Security) - SIMPLIFICADO
-- =====================================================

-- Habilitar RLS
ALTER TABLE conta_contabil ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas se existirem
DROP POLICY IF EXISTS "conta_contabil_select_policy" ON conta_contabil;
DROP POLICY IF EXISTS "conta_contabil_modify_policy" ON conta_contabil;

-- Policy: Todos autenticados podem ler
CREATE POLICY "conta_contabil_select_policy"
  ON conta_contabil
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Todos autenticados podem inserir/atualizar
-- (Para sincronização do Google Sheets funcionar)
CREATE POLICY "conta_contabil_insert_policy"
  ON conta_contabil
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "conta_contabil_update_policy"
  ON conta_contabil
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Service role pode fazer tudo (para API)
CREATE POLICY "conta_contabil_service_role_policy"
  ON conta_contabil
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- Comentários na tabela
-- =====================================================

COMMENT ON TABLE conta_contabil IS 'Plano de contas contábil sincronizado automaticamente com Google Sheets';
COMMENT ON COLUMN conta_contabil.cod_conta IS 'Código da conta contábil (chave única)';
COMMENT ON COLUMN conta_contabil.tag1 IS 'Tag de categorização nível 1';
COMMENT ON COLUMN conta_contabil.bp_dre IS 'Classificação: Balanço Patrimonial ou DRE';
COMMENT ON COLUMN conta_contabil.synced_at IS 'Timestamp da última sincronização com Google Sheets';

-- =====================================================
-- View para facilitar consultas com transactions
-- =====================================================

DROP VIEW IF EXISTS vw_transactions_with_conta;

CREATE OR REPLACE VIEW vw_transactions_with_conta AS
SELECT
  t.*,
  c.tag1,
  c.tag2,
  c.tag3,
  c.tag4,
  c.tag_orc,
  c.ger,
  c.bp_dre,
  c.nat_orc,
  c.nome_nat_orc,
  c.responsavel
FROM transactions t
LEFT JOIN conta_contabil c ON t.category = c.cod_conta;

COMMENT ON VIEW vw_transactions_with_conta IS 'View que junta transactions com informações do plano de contas';

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

COMMENT ON FUNCTION upsert_conta_contabil IS 'Insere ou atualiza conta contábil (usado na sincronização)';

-- =====================================================
-- Teste rápido
-- =====================================================

-- Inserir conta de teste
SELECT upsert_conta_contabil(
  'TESTE.001',
  'Tag1 Teste',
  'Tag2 Teste',
  'Tag3 Teste',
  'Tag4 Teste',
  'TagOrc Teste',
  'SIM',
  'DRE',
  'Receita',
  'Receita de Teste',
  'Sistema'
);

-- Verificar se foi inserido
SELECT * FROM conta_contabil WHERE cod_conta = 'TESTE.001';

-- Limpar teste
DELETE FROM conta_contabil WHERE cod_conta = 'TESTE.001';

-- =====================================================
-- Sucesso!
-- =====================================================

SELECT
  '✅ Tabela conta_contabil criada com sucesso!' as status,
  COUNT(*) as total_contas
FROM conta_contabil;
