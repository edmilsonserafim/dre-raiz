-- ═══════════════════════════════════════════════════════════════
-- TABELA: dre_hierarchy
-- Hierarquia configurável da DRE Gerencial (Nível 2)
-- ═══════════════════════════════════════════════════════════════

-- Criar tabela dre_hierarchy
CREATE TABLE IF NOT EXISTS dre_hierarchy (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Nível 1 (fixo, apenas para referência)
  nivel_1_code VARCHAR(2) NOT NULL,
  nivel_1_label TEXT NOT NULL,

  -- Nível 2 (configurável)
  nivel_2_code VARCHAR(5) NOT NULL,
  nivel_2_label TEXT NOT NULL,

  -- Categorias associadas (conta_contabil)
  items JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Ordem e estado
  ordem INTEGER NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(nivel_2_code)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_dre_hierarchy_nivel_1 ON dre_hierarchy(nivel_1_code);
CREATE INDEX IF NOT EXISTS idx_dre_hierarchy_ativo ON dre_hierarchy(ativo);
CREATE INDEX IF NOT EXISTS idx_dre_hierarchy_ordem ON dre_hierarchy(ordem);

-- Trigger para updated_at
CREATE TRIGGER update_dre_hierarchy_updated_at
  BEFORE UPDATE ON dre_hierarchy
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════
-- SEED DATA: Estrutura inicial (atual + RATEIO CSC)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO dre_hierarchy (nivel_1_code, nivel_1_label, nivel_2_code, nivel_2_label, items, ordem, ativo) VALUES
  -- 01. RECEITA LÍQUIDA
  ('01', '01. RECEITA LÍQUIDA', '01.1', '01.1 RECEITAS ACADÊMICAS',
   '["Mensalidades", "Matrículas", "Integral"]'::jsonb, 1, true),

  ('01', '01. RECEITA LÍQUIDA', '01.2', '01.2 RECEITAS EXTRAS',
   '["Cursos Livres", "Eventos Pedagógicos", "Venda de Uniformes"]'::jsonb, 2, true),

  ('01', '01. RECEITA LÍQUIDA', '01.3', '01.3 DEDUÇÕES (TRIBUTOS)',
   '["ISS", "PIS/COFINS", "Simples Nacional"]'::jsonb, 3, true),

  -- 02. CUSTOS VARIÁVEIS
  ('02', '02. CUSTOS VARIÁVEIS', '02.1', '02.1 PESSOAL DOCENTE',
   '["Salários Professores", "Encargos Profs", "Horas Extras Docentes"]'::jsonb, 1, true),

  ('02', '02. CUSTOS VARIÁVEIS', '02.2', '02.2 INSUMOS OPERACIONAIS',
   '["Energia", "Água & Gás", "Alimentação Alunos", "Material de Consumo"]'::jsonb, 2, true),

  -- 03. CUSTOS FIXOS
  ('03', '03. CUSTOS FIXOS', '03.1', '03.1 INFRAESTRUTURA',
   '["Aluguel Imóveis", "IPTU", "Seguros Patrimoniais"]'::jsonb, 1, true),

  ('03', '03. CUSTOS FIXOS', '03.2', '03.2 MANUTENÇÃO',
   '["Limpeza", "Conservação Predial", "Jardinagem"]'::jsonb, 2, true),

  -- 04. DESPESAS ADM (SG&A)
  ('04', '04. DESPESAS ADM (SG&A)', '04.1', '04.1 COMERCIAL & MKT',
   '["Google Ads", "Redes Sociais", "Eventos Comerciais"]'::jsonb, 1, true),

  ('04', '04. DESPESAS ADM (SG&A)', '04.2', '04.2 CORPORATIVO',
   '["Sistemas ERP", "Assessoria Jurídica", "Consultoria"]'::jsonb, 2, true),

  -- 05. RATEIO CSC (NOVO!)
  ('05', '05. RATEIO CSC', '05.1', '05.1 RATEIOS INTERNOS',
   '["Rateio TI", "Rateio RH", "Rateio Financeiro"]'::jsonb, 1, true)
ON CONFLICT (nivel_2_code) DO NOTHING;

-- Verificar inserção
SELECT nivel_1_code, nivel_1_label, nivel_2_code, nivel_2_label,
       jsonb_array_length(items) as num_categorias, ordem, ativo
FROM dre_hierarchy
ORDER BY nivel_1_code, ordem;
