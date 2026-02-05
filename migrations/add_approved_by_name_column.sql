-- Migração: Adicionar coluna approved_by_name à tabela manual_changes
-- Data: 2026-02-05
-- Descrição: O código estava tentando inserir o campo approved_by_name, mas a coluna não existia no banco

-- Adicionar a coluna approved_by_name (permitir NULL pois registros antigos não terão esse valor)
ALTER TABLE manual_changes
ADD COLUMN IF NOT EXISTS approved_by_name TEXT;

-- Comentário explicativo
COMMENT ON COLUMN manual_changes.approved_by_name IS 'Nome completo do usuário que aprovou a mudança';
