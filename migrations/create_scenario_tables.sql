-- ═══════════════════════════════════════════════════════════════
-- TABELAS PARA CENÁRIOS: ORÇADO E ANO ANTERIOR
-- ═══════════════════════════════════════════════════════════════

-- Tabela: transactions_orcado
-- Estrutura idêntica a transactions
CREATE TABLE IF NOT EXISTS transactions_orcado (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  conta_contabil TEXT NOT NULL,
  category TEXT,  -- Centro de Custo (CC)
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  scenario TEXT DEFAULT 'Orçado',
  status TEXT DEFAULT 'Normal',
  filial TEXT NOT NULL,
  marca TEXT,
  tag01 TEXT,
  tag02 TEXT,
  tag03 TEXT,
  recurring TEXT,
  ticket TEXT,
  vendor TEXT,
  nat_orc TEXT,
  chave_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: transactions_ano_anterior
-- Estrutura idêntica a transactions
CREATE TABLE IF NOT EXISTS transactions_ano_anterior (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  conta_contabil TEXT NOT NULL,
  category TEXT,  -- Centro de Custo (CC)
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL,
  scenario TEXT DEFAULT 'A-1',
  status TEXT DEFAULT 'Normal',
  filial TEXT NOT NULL,
  marca TEXT,
  tag01 TEXT,
  tag02 TEXT,
  tag03 TEXT,
  recurring TEXT,
  ticket TEXT,
  vendor TEXT,
  nat_orc TEXT,
  chave_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para transactions_orcado
CREATE INDEX IF NOT EXISTS idx_transactions_orcado_date ON transactions_orcado(date);
CREATE INDEX IF NOT EXISTS idx_transactions_orcado_conta ON transactions_orcado(conta_contabil);
CREATE INDEX IF NOT EXISTS idx_transactions_orcado_marca ON transactions_orcado(marca);
CREATE INDEX IF NOT EXISTS idx_transactions_orcado_filial ON transactions_orcado(filial);
CREATE INDEX IF NOT EXISTS idx_transactions_orcado_category ON transactions_orcado(category);
CREATE INDEX IF NOT EXISTS idx_transactions_orcado_scenario ON transactions_orcado(scenario);

-- Índices para transactions_ano_anterior
CREATE INDEX IF NOT EXISTS idx_transactions_ano_anterior_date ON transactions_ano_anterior(date);
CREATE INDEX IF NOT EXISTS idx_transactions_ano_anterior_conta ON transactions_ano_anterior(conta_contabil);
CREATE INDEX IF NOT EXISTS idx_transactions_ano_anterior_marca ON transactions_ano_anterior(marca);
CREATE INDEX IF NOT EXISTS idx_transactions_ano_anterior_filial ON transactions_ano_anterior(filial);
CREATE INDEX IF NOT EXISTS idx_transactions_ano_anterior_category ON transactions_ano_anterior(category);
CREATE INDEX IF NOT EXISTS idx_transactions_ano_anterior_scenario ON transactions_ano_anterior(scenario);

-- Triggers para updated_at
CREATE TRIGGER update_transactions_orcado_updated_at
  BEFORE UPDATE ON transactions_orcado
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_ano_anterior_updated_at
  BEFORE UPDATE ON transactions_ano_anterior
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════
-- MOCK DATA: 100 linhas em transactions_orcado
-- ═══════════════════════════════════════════════════════════════

INSERT INTO transactions_orcado (date, description, conta_contabil, category, amount, type, scenario, filial, marca, tag01) VALUES
  -- RECEITAS (30 linhas)
  ('2025-01-01', 'Mensalidade Janeiro - Orçado', 'Mensalidades', 'CC Comercial', 150000, 'REVENUE', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-02-01', 'Mensalidade Fevereiro - Orçado', 'Mensalidades', 'CC Comercial', 155000, 'REVENUE', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-03-01', 'Mensalidade Março - Orçado', 'Mensalidades', 'CC Comercial', 160000, 'REVENUE', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-04-01', 'Mensalidade Abril - Orçado', 'Mensalidades', 'CC Comercial', 158000, 'REVENUE', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-05-01', 'Mensalidade Maio - Orçado', 'Mensalidades', 'CC Comercial', 162000, 'REVENUE', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-06-01', 'Mensalidade Junho - Orçado', 'Mensalidades', 'CC Comercial', 165000, 'REVENUE', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-07-01', 'Mensalidade Julho - Orçado', 'Mensalidades', 'CC Comercial', 170000, 'REVENUE', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-08-01', 'Mensalidade Agosto - Orçado', 'Mensalidades', 'CC Comercial', 168000, 'REVENUE', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-09-01', 'Mensalidade Setembro - Orçado', 'Mensalidades', 'CC Comercial', 172000, 'REVENUE', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-10-01', 'Mensalidade Outubro - Orçado', 'Mensalidades', 'CC Comercial', 175000, 'REVENUE', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-11-01', 'Mensalidade Novembro - Orçado', 'Mensalidades', 'CC Comercial', 178000, 'REVENUE', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-12-01', 'Mensalidade Dezembro - Orçado', 'Mensalidades', 'CC Comercial', 180000, 'REVENUE', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_comercial'),

  ('2025-01-15', 'Matrículas Janeiro - Orçado', 'Matrículas', 'CC Comercial', 25000, 'REVENUE', 'Orçado', 'Unidade RJ Norte', 'CGS', 'tag01_comercial'),
  ('2025-02-15', 'Matrículas Fevereiro - Orçado', 'Matrículas', 'CC Comercial', 28000, 'REVENUE', 'Orçado', 'Unidade RJ Norte', 'CGS', 'tag01_comercial'),
  ('2025-03-15', 'Matrículas Março - Orçado', 'Matrículas', 'CC Comercial', 30000, 'REVENUE', 'Orçado', 'Unidade RJ Norte', 'CGS', 'tag01_comercial'),
  ('2025-07-15', 'Matrículas Julho - Orçado', 'Matrículas', 'CC Comercial', 35000, 'REVENUE', 'Orçado', 'Unidade RJ Norte', 'CGS', 'tag01_comercial'),

  ('2025-01-20', 'Cursos Livres Janeiro - Orçado', 'Cursos Livres', 'CC Pedagógico', 8000, 'REVENUE', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_pedagogico'),
  ('2025-02-20', 'Cursos Livres Fevereiro - Orçado', 'Cursos Livres', 'CC Pedagógico', 9000, 'REVENUE', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_pedagogico'),
  ('2025-03-20', 'Cursos Livres Março - Orçado', 'Cursos Livres', 'CC Pedagógico', 9500, 'REVENUE', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_pedagogico'),
  ('2025-04-20', 'Cursos Livres Abril - Orçado', 'Cursos Livres', 'CC Pedagógico', 10000, 'REVENUE', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_pedagogico'),
  ('2025-05-20', 'Cursos Livres Maio - Orçado', 'Cursos Livres', 'CC Pedagógico', 10500, 'REVENUE', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_pedagogico'),
  ('2025-06-20', 'Cursos Livres Junho - Orçado', 'Cursos Livres', 'CC Pedagógico', 11000, 'REVENUE', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_pedagogico'),

  ('2025-04-10', 'Eventos Pedagógicos Q2 - Orçado', 'Eventos Pedagógicos', 'CC Pedagógico', 15000, 'REVENUE', 'Orçado', 'Unidade MG Belo Horizonte', 'CLV', 'tag01_pedagogico'),
  ('2025-10-10', 'Eventos Pedagógicos Q4 - Orçado', 'Eventos Pedagógicos', 'CC Pedagógico', 18000, 'REVENUE', 'Orçado', 'Unidade MG Belo Horizonte', 'CLV', 'tag01_pedagogico'),

  ('2025-01-25', 'Venda Uniformes Janeiro - Orçado', 'Venda de Uniformes', 'CC Comercial', 3000, 'REVENUE', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-02-25', 'Venda Uniformes Fevereiro - Orçado', 'Venda de Uniformes', 'CC Comercial', 3200, 'REVENUE', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-03-25', 'Venda Uniformes Março - Orçado', 'Venda de Uniformes', 'CC Comercial', 3500, 'REVENUE', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-07-25', 'Venda Uniformes Julho - Orçado', 'Venda de Uniformes', 'CC Comercial', 4000, 'REVENUE', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-08-25', 'Venda Uniformes Agosto - Orçado', 'Venda de Uniformes', 'CC Comercial', 4200, 'REVENUE', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-12-25', 'Venda Uniformes Dezembro - Orçado', 'Venda de Uniformes', 'CC Comercial', 5000, 'REVENUE', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_comercial'),

  -- CUSTOS VARIÁVEIS (30 linhas)
  ('2025-01-05', 'Salários Professores Janeiro - Orçado', 'Salários Professores', 'CC RH', 80000, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-02-05', 'Salários Professores Fevereiro - Orçado', 'Salários Professores', 'CC RH', 82000, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-03-05', 'Salários Professores Março - Orçado', 'Salários Professores', 'CC RH', 85000, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-04-05', 'Salários Professores Abril - Orçado', 'Salários Professores', 'CC RH', 83000, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-05-05', 'Salários Professores Maio - Orçado', 'Salários Professores', 'CC RH', 86000, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-06-05', 'Salários Professores Junho - Orçado', 'Salários Professores', 'CC RH', 87000, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-07-05', 'Salários Professores Julho - Orçado', 'Salários Professores', 'CC RH', 90000, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-08-05', 'Salários Professores Agosto - Orçado', 'Salários Professores', 'CC RH', 88000, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-09-05', 'Salários Professores Setembro - Orçado', 'Salários Professores', 'CC RH', 91000, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-10-05', 'Salários Professores Outubro - Orçado', 'Salários Professores', 'CC RH', 92000, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-11-05', 'Salários Professores Novembro - Orçado', 'Salários Professores', 'CC RH', 93000, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-12-05', 'Salários Professores Dezembro - Orçado', 'Salários Professores', 'CC RH', 95000, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_rh'),

  ('2025-01-10', 'Encargos Profs Janeiro - Orçado', 'Encargos Profs', 'CC RH', 32000, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-02-10', 'Encargos Profs Fevereiro - Orçado', 'Encargos Profs', 'CC RH', 32800, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-03-10', 'Encargos Profs Março - Orçado', 'Encargos Profs', 'CC RH', 34000, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-07-10', 'Encargos Profs Julho - Orçado', 'Encargos Profs', 'CC RH', 36000, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_rh'),

  ('2025-01-12', 'Energia Janeiro - Orçado', 'Energia', 'CC Operacional', 12000, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_operacional'),
  ('2025-02-12', 'Energia Fevereiro - Orçado', 'Energia', 'CC Operacional', 11500, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_operacional'),
  ('2025-03-12', 'Energia Março - Orçado', 'Energia', 'CC Operacional', 11000, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_operacional'),
  ('2025-04-12', 'Energia Abril - Orçado', 'Energia', 'CC Operacional', 10500, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_operacional'),
  ('2025-05-12', 'Energia Maio - Orçado', 'Energia', 'CC Operacional', 10000, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_operacional'),
  ('2025-06-12', 'Energia Junho - Orçado', 'Energia', 'CC Operacional', 12500, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_operacional'),
  ('2025-07-12', 'Energia Julho - Orçado', 'Energia', 'CC Operacional', 13000, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_operacional'),
  ('2025-08-12', 'Energia Agosto - Orçado', 'Energia', 'CC Operacional', 13500, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_operacional'),
  ('2025-09-12', 'Energia Setembro - Orçado', 'Energia', 'CC Operacional', 12800, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_operacional'),
  ('2025-10-12', 'Energia Outubro - Orçado', 'Energia', 'CC Operacional', 12200, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_operacional'),
  ('2025-11-12', 'Energia Novembro - Orçado', 'Energia', 'CC Operacional', 11800, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_operacional'),
  ('2025-12-12', 'Energia Dezembro - Orçado', 'Energia', 'CC Operacional', 14000, 'VARIABLE_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_operacional'),

  ('2025-02-14', 'Água & Gás Fevereiro - Orçado', 'Água & Gás', 'CC Operacional', 3500, 'VARIABLE_COST', 'Orçado', 'Unidade RJ Norte', 'CGS', 'tag01_operacional'),
  ('2025-05-14', 'Água & Gás Maio - Orçado', 'Água & Gás', 'CC Operacional', 3800, 'VARIABLE_COST', 'Orçado', 'Unidade RJ Norte', 'CGS', 'tag01_operacional'),

  -- CUSTOS FIXOS (20 linhas)
  ('2025-01-03', 'Aluguel Imóveis Janeiro - Orçado', 'Aluguel Imóveis', 'CC Administrativo', 45000, 'FIXED_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-02-03', 'Aluguel Imóveis Fevereiro - Orçado', 'Aluguel Imóveis', 'CC Administrativo', 45000, 'FIXED_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-03-03', 'Aluguel Imóveis Março - Orçado', 'Aluguel Imóveis', 'CC Administrativo', 45000, 'FIXED_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-04-03', 'Aluguel Imóveis Abril - Orçado', 'Aluguel Imóveis', 'CC Administrativo', 45000, 'FIXED_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-05-03', 'Aluguel Imóveis Maio - Orçado', 'Aluguel Imóveis', 'CC Administrativo', 45000, 'FIXED_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-06-03', 'Aluguel Imóveis Junho - Orçado', 'Aluguel Imóveis', 'CC Administrativo', 45000, 'FIXED_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-07-03', 'Aluguel Imóveis Julho - Orçado', 'Aluguel Imóveis', 'CC Administrativo', 45000, 'FIXED_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-08-03', 'Aluguel Imóveis Agosto - Orçado', 'Aluguel Imóveis', 'CC Administrativo', 45000, 'FIXED_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-09-03', 'Aluguel Imóveis Setembro - Orçado', 'Aluguel Imóveis', 'CC Administrativo', 45000, 'FIXED_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-10-03', 'Aluguel Imóveis Outubro - Orçado', 'Aluguel Imóveis', 'CC Administrativo', 45000, 'FIXED_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-11-03', 'Aluguel Imóveis Novembro - Orçado', 'Aluguel Imóveis', 'CC Administrativo', 45000, 'FIXED_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-12-03', 'Aluguel Imóveis Dezembro - Orçado', 'Aluguel Imóveis', 'CC Administrativo', 45000, 'FIXED_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),

  ('2025-01-08', 'IPTU Janeiro - Orçado', 'IPTU', 'CC Administrativo', 8000, 'FIXED_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-03-08', 'Seguros Patrimoniais Q1 - Orçado', 'Seguros Patrimoniais', 'CC Administrativo', 12000, 'FIXED_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-06-08', 'Seguros Patrimoniais Q2 - Orçado', 'Seguros Patrimoniais', 'CC Administrativo', 12000, 'FIXED_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-09-08', 'Seguros Patrimoniais Q3 - Orçado', 'Seguros Patrimoniais', 'CC Administrativo', 12000, 'FIXED_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-12-08', 'Seguros Patrimoniais Q4 - Orçado', 'Seguros Patrimoniais', 'CC Administrativo', 12000, 'FIXED_COST', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),

  ('2025-02-18', 'Limpeza Fevereiro - Orçado', 'Limpeza', 'CC Operacional', 5500, 'FIXED_COST', 'Orçado', 'Unidade MG Belo Horizonte', 'CLV', 'tag01_operacional'),
  ('2025-05-18', 'Limpeza Maio - Orçado', 'Limpeza', 'CC Operacional', 5800, 'FIXED_COST', 'Orçado', 'Unidade MG Belo Horizonte', 'CLV', 'tag01_operacional'),
  ('2025-08-18', 'Limpeza Agosto - Orçado', 'Limpeza', 'CC Operacional', 6000, 'FIXED_COST', 'Orçado', 'Unidade MG Belo Horizonte', 'CLV', 'tag01_operacional'),

  -- DESPESAS ADM (20 linhas)
  ('2025-01-06', 'Google Ads Janeiro - Orçado', 'Google Ads', 'CC Marketing', 18000, 'SGA', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_marketing'),
  ('2025-02-06', 'Google Ads Fevereiro - Orçado', 'Google Ads', 'CC Marketing', 19000, 'SGA', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_marketing'),
  ('2025-03-06', 'Google Ads Março - Orçado', 'Google Ads', 'CC Marketing', 20000, 'SGA', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_marketing'),
  ('2025-04-06', 'Google Ads Abril - Orçado', 'Google Ads', 'CC Marketing', 19500, 'SGA', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_marketing'),
  ('2025-05-06', 'Google Ads Maio - Orçado', 'Google Ads', 'CC Marketing', 21000, 'SGA', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_marketing'),
  ('2025-06-06', 'Google Ads Junho - Orçado', 'Google Ads', 'CC Marketing', 22000, 'SGA', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_marketing'),
  ('2025-07-06', 'Google Ads Julho - Orçado', 'Google Ads', 'CC Marketing', 20500, 'SGA', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_marketing'),
  ('2025-08-06', 'Google Ads Agosto - Orçado', 'Google Ads', 'CC Marketing', 21500, 'SGA', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_marketing'),
  ('2025-09-06', 'Google Ads Setembro - Orçado', 'Google Ads', 'CC Marketing', 22500, 'SGA', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_marketing'),
  ('2025-10-06', 'Google Ads Outubro - Orçado', 'Google Ads', 'CC Marketing', 23000, 'SGA', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_marketing'),
  ('2025-11-06', 'Google Ads Novembro - Orçado', 'Google Ads', 'CC Marketing', 23500, 'SGA', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_marketing'),
  ('2025-12-06', 'Google Ads Dezembro - Orçado', 'Google Ads', 'CC Marketing', 25000, 'SGA', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_marketing'),

  ('2025-01-07', 'Redes Sociais Janeiro - Orçado', 'Redes Sociais', 'CC Marketing', 8000, 'SGA', 'Orçado', 'Unidade RJ Norte', 'CGS', 'tag01_marketing'),
  ('2025-04-07', 'Redes Sociais Abril - Orçado', 'Redes Sociais', 'CC Marketing', 8500, 'SGA', 'Orçado', 'Unidade RJ Norte', 'CGS', 'tag01_marketing'),
  ('2025-07-07', 'Redes Sociais Julho - Orçado', 'Redes Sociais', 'CC Marketing', 9000, 'SGA', 'Orçado', 'Unidade RJ Norte', 'CGS', 'tag01_marketing'),
  ('2025-10-07', 'Redes Sociais Outubro - Orçado', 'Redes Sociais', 'CC Marketing', 9500, 'SGA', 'Orçado', 'Unidade RJ Norte', 'CGS', 'tag01_marketing'),

  ('2025-03-09', 'Sistemas ERP Q1 - Orçado', 'Sistemas ERP', 'CC TI', 15000, 'SGA', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_ti'),
  ('2025-06-09', 'Sistemas ERP Q2 - Orçado', 'Sistemas ERP', 'CC TI', 15000, 'SGA', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_ti'),
  ('2025-09-09', 'Sistemas ERP Q3 - Orçado', 'Sistemas ERP', 'CC TI', 15000, 'SGA', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_ti'),
  ('2025-12-09', 'Sistemas ERP Q4 - Orçado', 'Sistemas ERP', 'CC TI', 15000, 'SGA', 'Orçado', 'Unidade SP Centro', 'AP', 'tag01_ti')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- MOCK DATA: 100 linhas em transactions_ano_anterior (ANO 2025)
-- ═══════════════════════════════════════════════════════════════

INSERT INTO transactions_ano_anterior (date, description, conta_contabil, category, amount, type, scenario, filial, marca, tag01) VALUES
  -- RECEITAS (30 linhas) - Valores ~10% menores que Orçado
  ('2025-01-01', 'Mensalidade Janeiro - A-1', 'Mensalidades', 'CC Comercial', 135000, 'REVENUE', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-02-01', 'Mensalidade Fevereiro - A-1', 'Mensalidades', 'CC Comercial', 139500, 'REVENUE', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-03-01', 'Mensalidade Março - A-1', 'Mensalidades', 'CC Comercial', 144000, 'REVENUE', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-04-01', 'Mensalidade Abril - A-1', 'Mensalidades', 'CC Comercial', 142200, 'REVENUE', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-05-01', 'Mensalidade Maio - A-1', 'Mensalidades', 'CC Comercial', 145800, 'REVENUE', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-06-01', 'Mensalidade Junho - A-1', 'Mensalidades', 'CC Comercial', 148500, 'REVENUE', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-07-01', 'Mensalidade Julho - A-1', 'Mensalidades', 'CC Comercial', 153000, 'REVENUE', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-08-01', 'Mensalidade Agosto - A-1', 'Mensalidades', 'CC Comercial', 151200, 'REVENUE', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-09-01', 'Mensalidade Setembro - A-1', 'Mensalidades', 'CC Comercial', 154800, 'REVENUE', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-10-01', 'Mensalidade Outubro - A-1', 'Mensalidades', 'CC Comercial', 157500, 'REVENUE', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-11-01', 'Mensalidade Novembro - A-1', 'Mensalidades', 'CC Comercial', 160200, 'REVENUE', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-12-01', 'Mensalidade Dezembro - A-1', 'Mensalidades', 'CC Comercial', 162000, 'REVENUE', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_comercial'),

  ('2025-01-15', 'Matrículas Janeiro - A-1', 'Matrículas', 'CC Comercial', 22500, 'REVENUE', 'A-1', 'Unidade RJ Norte', 'CGS', 'tag01_comercial'),
  ('2025-02-15', 'Matrículas Fevereiro - A-1', 'Matrículas', 'CC Comercial', 25200, 'REVENUE', 'A-1', 'Unidade RJ Norte', 'CGS', 'tag01_comercial'),
  ('2025-03-15', 'Matrículas Março - A-1', 'Matrículas', 'CC Comercial', 27000, 'REVENUE', 'A-1', 'Unidade RJ Norte', 'CGS', 'tag01_comercial'),
  ('2025-07-15', 'Matrículas Julho - A-1', 'Matrículas', 'CC Comercial', 31500, 'REVENUE', 'A-1', 'Unidade RJ Norte', 'CGS', 'tag01_comercial'),

  ('2025-01-20', 'Cursos Livres Janeiro - A-1', 'Cursos Livres', 'CC Pedagógico', 7200, 'REVENUE', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_pedagogico'),
  ('2025-02-20', 'Cursos Livres Fevereiro - A-1', 'Cursos Livres', 'CC Pedagógico', 8100, 'REVENUE', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_pedagogico'),
  ('2025-03-20', 'Cursos Livres Março - A-1', 'Cursos Livres', 'CC Pedagógico', 8550, 'REVENUE', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_pedagogico'),
  ('2025-04-20', 'Cursos Livres Abril - A-1', 'Cursos Livres', 'CC Pedagógico', 9000, 'REVENUE', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_pedagogico'),
  ('2025-05-20', 'Cursos Livres Maio - A-1', 'Cursos Livres', 'CC Pedagógico', 9450, 'REVENUE', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_pedagogico'),
  ('2025-06-20', 'Cursos Livres Junho - A-1', 'Cursos Livres', 'CC Pedagógico', 9900, 'REVENUE', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_pedagogico'),

  ('2025-04-10', 'Eventos Pedagógicos Q2 - A-1', 'Eventos Pedagógicos', 'CC Pedagógico', 13500, 'REVENUE', 'A-1', 'Unidade MG Belo Horizonte', 'CLV', 'tag01_pedagogico'),
  ('2025-10-10', 'Eventos Pedagógicos Q4 - A-1', 'Eventos Pedagógicos', 'CC Pedagógico', 16200, 'REVENUE', 'A-1', 'Unidade MG Belo Horizonte', 'CLV', 'tag01_pedagogico'),

  ('2025-01-25', 'Venda Uniformes Janeiro - A-1', 'Venda de Uniformes', 'CC Comercial', 2700, 'REVENUE', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-02-25', 'Venda Uniformes Fevereiro - A-1', 'Venda de Uniformes', 'CC Comercial', 2880, 'REVENUE', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-03-25', 'Venda Uniformes Março - A-1', 'Venda de Uniformes', 'CC Comercial', 3150, 'REVENUE', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-07-25', 'Venda Uniformes Julho - A-1', 'Venda de Uniformes', 'CC Comercial', 3600, 'REVENUE', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-08-25', 'Venda Uniformes Agosto - A-1', 'Venda de Uniformes', 'CC Comercial', 3780, 'REVENUE', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_comercial'),
  ('2025-12-25', 'Venda Uniformes Dezembro - A-1', 'Venda de Uniformes', 'CC Comercial', 4500, 'REVENUE', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_comercial'),

  -- CUSTOS VARIÁVEIS (30 linhas) - Valores ~8% menores que Orçado
  ('2025-01-05', 'Salários Professores Janeiro - A-1', 'Salários Professores', 'CC RH', 73600, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-02-05', 'Salários Professores Fevereiro - A-1', 'Salários Professores', 'CC RH', 75440, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-03-05', 'Salários Professores Março - A-1', 'Salários Professores', 'CC RH', 78200, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-04-05', 'Salários Professores Abril - A-1', 'Salários Professores', 'CC RH', 76360, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-05-05', 'Salários Professores Maio - A-1', 'Salários Professores', 'CC RH', 79120, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-06-05', 'Salários Professores Junho - A-1', 'Salários Professores', 'CC RH', 80040, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-07-05', 'Salários Professores Julho - A-1', 'Salários Professores', 'CC RH', 82800, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-08-05', 'Salários Professores Agosto - A-1', 'Salários Professores', 'CC RH', 81040, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-09-05', 'Salários Professores Setembro - A-1', 'Salários Professores', 'CC RH', 83720, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-10-05', 'Salários Professores Outubro - A-1', 'Salários Professores', 'CC RH', 84640, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-11-05', 'Salários Professores Novembro - A-1', 'Salários Professores', 'CC RH', 85560, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-12-05', 'Salários Professores Dezembro - A-1', 'Salários Professores', 'CC RH', 87400, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_rh'),

  ('2025-01-10', 'Encargos Profs Janeiro - A-1', 'Encargos Profs', 'CC RH', 29440, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-02-10', 'Encargos Profs Fevereiro - A-1', 'Encargos Profs', 'CC RH', 30176, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-03-10', 'Encargos Profs Março - A-1', 'Encargos Profs', 'CC RH', 31280, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_rh'),
  ('2025-07-10', 'Encargos Profs Julho - A-1', 'Encargos Profs', 'CC RH', 33120, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_rh'),

  ('2025-01-12', 'Energia Janeiro - A-1', 'Energia', 'CC Operacional', 11040, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_operacional'),
  ('2025-02-12', 'Energia Fevereiro - A-1', 'Energia', 'CC Operacional', 10580, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_operacional'),
  ('2025-03-12', 'Energia Março - A-1', 'Energia', 'CC Operacional', 10120, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_operacional'),
  ('2025-04-12', 'Energia Abril - A-1', 'Energia', 'CC Operacional', 9660, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_operacional'),
  ('2025-05-12', 'Energia Maio - A-1', 'Energia', 'CC Operacional', 9200, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_operacional'),
  ('2025-06-12', 'Energia Junho - A-1', 'Energia', 'CC Operacional', 11500, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_operacional'),
  ('2025-07-12', 'Energia Julho - A-1', 'Energia', 'CC Operacional', 11960, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_operacional'),
  ('2025-08-12', 'Energia Agosto - A-1', 'Energia', 'CC Operacional', 12420, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_operacional'),
  ('2025-09-12', 'Energia Setembro - A-1', 'Energia', 'CC Operacional', 11776, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_operacional'),
  ('2025-10-12', 'Energia Outubro - A-1', 'Energia', 'CC Operacional', 11224, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_operacional'),
  ('2025-11-12', 'Energia Novembro - A-1', 'Energia', 'CC Operacional', 10856, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_operacional'),
  ('2025-12-12', 'Energia Dezembro - A-1', 'Energia', 'CC Operacional', 12880, 'VARIABLE_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_operacional'),

  ('2025-02-14', 'Água & Gás Fevereiro - A-1', 'Água & Gás', 'CC Operacional', 3220, 'VARIABLE_COST', 'A-1', 'Unidade RJ Norte', 'CGS', 'tag01_operacional'),
  ('2025-05-14', 'Água & Gás Maio - A-1', 'Água & Gás', 'CC Operacional', 3496, 'VARIABLE_COST', 'A-1', 'Unidade RJ Norte', 'CGS', 'tag01_operacional'),

  -- CUSTOS FIXOS (20 linhas) - Valores idênticos (custos fixos não variam)
  ('2025-01-03', 'Aluguel Imóveis Janeiro - A-1', 'Aluguel Imóveis', 'CC Administrativo', 45000, 'FIXED_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-02-03', 'Aluguel Imóveis Fevereiro - A-1', 'Aluguel Imóveis', 'CC Administrativo', 45000, 'FIXED_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-03-03', 'Aluguel Imóveis Março - A-1', 'Aluguel Imóveis', 'CC Administrativo', 45000, 'FIXED_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-04-03', 'Aluguel Imóveis Abril - A-1', 'Aluguel Imóveis', 'CC Administrativo', 45000, 'FIXED_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-05-03', 'Aluguel Imóveis Maio - A-1', 'Aluguel Imóveis', 'CC Administrativo', 45000, 'FIXED_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-06-03', 'Aluguel Imóveis Junho - A-1', 'Aluguel Imóveis', 'CC Administrativo', 45000, 'FIXED_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-07-03', 'Aluguel Imóveis Julho - A-1', 'Aluguel Imóveis', 'CC Administrativo', 45000, 'FIXED_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-08-03', 'Aluguel Imóveis Agosto - A-1', 'Aluguel Imóveis', 'CC Administrativo', 45000, 'FIXED_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-09-03', 'Aluguel Imóveis Setembro - A-1', 'Aluguel Imóveis', 'CC Administrativo', 45000, 'FIXED_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-10-03', 'Aluguel Imóveis Outubro - A-1', 'Aluguel Imóveis', 'CC Administrativo', 45000, 'FIXED_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-11-03', 'Aluguel Imóveis Novembro - A-1', 'Aluguel Imóveis', 'CC Administrativo', 45000, 'FIXED_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-12-03', 'Aluguel Imóveis Dezembro - A-1', 'Aluguel Imóveis', 'CC Administrativo', 45000, 'FIXED_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),

  ('2025-01-08', 'IPTU Janeiro - A-1', 'IPTU', 'CC Administrativo', 8000, 'FIXED_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-03-08', 'Seguros Patrimoniais Q1 - A-1', 'Seguros Patrimoniais', 'CC Administrativo', 12000, 'FIXED_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-06-08', 'Seguros Patrimoniais Q2 - A-1', 'Seguros Patrimoniais', 'CC Administrativo', 12000, 'FIXED_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-09-08', 'Seguros Patrimoniais Q3 - A-1', 'Seguros Patrimoniais', 'CC Administrativo', 12000, 'FIXED_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),
  ('2025-12-08', 'Seguros Patrimoniais Q4 - A-1', 'Seguros Patrimoniais', 'CC Administrativo', 12000, 'FIXED_COST', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_administrativo'),

  ('2025-02-18', 'Limpeza Fevereiro - A-1', 'Limpeza', 'CC Operacional', 5500, 'FIXED_COST', 'A-1', 'Unidade MG Belo Horizonte', 'CLV', 'tag01_operacional'),
  ('2025-05-18', 'Limpeza Maio - A-1', 'Limpeza', 'CC Operacional', 5800, 'FIXED_COST', 'A-1', 'Unidade MG Belo Horizonte', 'CLV', 'tag01_operacional'),
  ('2025-08-18', 'Limpeza Agosto - A-1', 'Limpeza', 'CC Operacional', 6000, 'FIXED_COST', 'A-1', 'Unidade MG Belo Horizonte', 'CLV', 'tag01_operacional'),

  -- DESPESAS ADM (20 linhas) - Valores ~12% menores que Orçado
  ('2025-01-06', 'Google Ads Janeiro - A-1', 'Google Ads', 'CC Marketing', 15840, 'SGA', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_marketing'),
  ('2025-02-06', 'Google Ads Fevereiro - A-1', 'Google Ads', 'CC Marketing', 16720, 'SGA', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_marketing'),
  ('2025-03-06', 'Google Ads Março - A-1', 'Google Ads', 'CC Marketing', 17600, 'SGA', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_marketing'),
  ('2025-04-06', 'Google Ads Abril - A-1', 'Google Ads', 'CC Marketing', 17160, 'SGA', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_marketing'),
  ('2025-05-06', 'Google Ads Maio - A-1', 'Google Ads', 'CC Marketing', 18480, 'SGA', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_marketing'),
  ('2025-06-06', 'Google Ads Junho - A-1', 'Google Ads', 'CC Marketing', 19360, 'SGA', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_marketing'),
  ('2025-07-06', 'Google Ads Julho - A-1', 'Google Ads', 'CC Marketing', 18040, 'SGA', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_marketing'),
  ('2025-08-06', 'Google Ads Agosto - A-1', 'Google Ads', 'CC Marketing', 18920, 'SGA', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_marketing'),
  ('2025-09-06', 'Google Ads Setembro - A-1', 'Google Ads', 'CC Marketing', 19800, 'SGA', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_marketing'),
  ('2025-10-06', 'Google Ads Outubro - A-1', 'Google Ads', 'CC Marketing', 20240, 'SGA', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_marketing'),
  ('2025-11-06', 'Google Ads Novembro - A-1', 'Google Ads', 'CC Marketing', 20680, 'SGA', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_marketing'),
  ('2025-12-06', 'Google Ads Dezembro - A-1', 'Google Ads', 'CC Marketing', 22000, 'SGA', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_marketing'),

  ('2025-01-07', 'Redes Sociais Janeiro - A-1', 'Redes Sociais', 'CC Marketing', 7040, 'SGA', 'A-1', 'Unidade RJ Norte', 'CGS', 'tag01_marketing'),
  ('2025-04-07', 'Redes Sociais Abril - A-1', 'Redes Sociais', 'CC Marketing', 7480, 'SGA', 'A-1', 'Unidade RJ Norte', 'CGS', 'tag01_marketing'),
  ('2025-07-07', 'Redes Sociais Julho - A-1', 'Redes Sociais', 'CC Marketing', 7920, 'SGA', 'A-1', 'Unidade RJ Norte', 'CGS', 'tag01_marketing'),
  ('2025-10-07', 'Redes Sociais Outubro - A-1', 'Redes Sociais', 'CC Marketing', 8360, 'SGA', 'A-1', 'Unidade RJ Norte', 'CGS', 'tag01_marketing'),

  ('2025-03-09', 'Sistemas ERP Q1 - A-1', 'Sistemas ERP', 'CC TI', 15000, 'SGA', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_ti'),
  ('2025-06-09', 'Sistemas ERP Q2 - A-1', 'Sistemas ERP', 'CC TI', 15000, 'SGA', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_ti'),
  ('2025-09-09', 'Sistemas ERP Q3 - A-1', 'Sistemas ERP', 'CC TI', 15000, 'SGA', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_ti'),
  ('2025-12-09', 'Sistemas ERP Q4 - A-1', 'Sistemas ERP', 'CC TI', 15000, 'SGA', 'A-1', 'Unidade SP Centro', 'AP', 'tag01_ti')
ON CONFLICT (id) DO NOTHING;

-- Verificar inserções
SELECT 'transactions_orcado' as tabela, COUNT(*) as total FROM transactions_orcado
UNION ALL
SELECT 'transactions_ano_anterior' as tabela, COUNT(*) as total FROM transactions_ano_anterior;
