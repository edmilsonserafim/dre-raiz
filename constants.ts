
import { Transaction } from './types';

export const BRANCHES = [
  'AP - Central', 'AP - Cidade Alta', 'AP - Franquias', 'AP - Global School', 'AP - Santo Antonio 1', 
  'AP - Santo Antonio 2', 'AP - Sudeste', 'AP - Zona Norte', 'CGS - Assunção', 'CGS - Barra', 
  'CGS - Botafogo', 'CGS - Central', 'CGS - Golf', 'CGS - Lucena', 'CGS - Tijuca', 'CLV - ALFA', 
  'CLV - BETA', 'CLV - Central', 'CLV - GAMA', 'GT - Barra', 'GT - Central', 'GT - Golf', 
  'GT - Peninsula', 'GT - Recreio', 'GT - Rio 2', 'MT - Bangu', 'MT - Campo Grande', 'MT - Central', 
  'MT - Duque de Caxias', 'MT - Madureira', 'MT - Nova Iguaçu', 'MT - Retiro dos Artistas', 
  'MT - Rocha Miranda', 'MT - São João de Meriti', 'MT - Taquara', 'MT - Tijuca', 'QI - Botafogo', 
  'QI - Central', 'QI - Freguesia', 'QI - Metropolitano', 'QI - Recreio', 'QI - Rio 2', 'QI - Tijuca', 
  'QI - Valqueire', 'SAP - Barra', 'SD - Juiz de Fora', 'SP - Botafogo', 'UN - Americano', 
  'UN - Central', 'UN - União', 'UN - Zona Sul'
];

export const TAG_STRUCTURE = {
  TAG01: { label: 'Centro de Custo', options: ['Administrativo', 'Pedagógico', 'Comercial', 'Operacional', 'TI'] },
  TAG02: { label: 'Segmento', options: ['Educação Infantil', 'Fundamental I', 'Fundamental II', 'Ensino Médio', 'Integral', 'Geral'] },
  TAG03: { label: 'Projeto', options: ['Operação Regular', 'Reforma Predial', 'Campanha Matrículas', 'Evento Pedagógico', 'Formação Docente'] }
};

// Fixed: Added RATEIO property to CATEGORIES object to resolve "Property 'RATEIO' does not exist" errors in components
export const CATEGORIES = {
  REVENUE: ['Mensalidades', 'Matrículas', 'Integral', 'Cursos Livres', 'Eventos Pedagógicos', 'Venda de Uniformes', 'ISS', 'PIS/COFINS', 'Simples Nacional'],
  VARIABLE_COST: ['Salários Professores', 'Encargos Profs', 'Horas Extras Docentes', 'Energia', 'Água & Gás', 'Alimentação Alunos', 'Material de Consumo'],
  FIXED_COST: ['Aluguel Imóveis', 'IPTU', 'Seguros Patrimoniais', 'Limpeza', 'Conservação Predial', 'Jardinagem'],
  SGA: ['Google Ads', 'Redes Sociais', 'Eventos Comerciais', 'Sistemas ERP', 'Assessoria Jurídica', 'Consultoria'],
  RATEIO: ['Rateio']
};

export const ALL_CATEGORIES = Object.values(CATEGORIES).flat();

export const DRE_STRUCTURE = {
  REVENUE: {
    id: '01',
    label: '01. RECEITA LÍQUIDA',
    children: {
      '01.1': { label: '01.1 RECEITAS ACADÊMICAS', items: ['Mensalidades', 'Matrículas', 'Integral'] },
      '01.2': { label: '01.2 RECEITAS EXTRAS', items: ['Cursos Livres', 'Eventos Pedagógicos', 'Venda de Uniformes'] },
      '01.3': { label: '01.3 DEDUÇÕES (TRIBUTOS)', items: ['ISS', 'PIS/COFINS', 'Simples Nacional'] }
    }
  },
  VARIABLE_COST: {
    id: '02',
    label: '02. CUSTOS VARIÁVEIS',
    children: {
      '02.1': { label: '02.1 PESSOAL DOCENTE', items: ['Salários Professores', 'Encargos Profs', 'Horas Extras Docentes'] },
      '02.2': { label: '02.2 INSUMOS OPERACIONAIS', items: ['Energia', 'Água & Gás', 'Alimentação Alunos', 'Material de Consumo'] }
    }
  },
  FIXED_COST: {
    id: '03',
    label: '03. CUSTOS FIXOS',
    children: {
      '03.1': { label: '03.1 INFRAESTRUTURA', items: ['Aluguel Imóveis', 'IPTU', 'Seguros Patrimoniais'] },
      '03.2': { label: '03.2 MANUTENÇÃO', items: ['Limpeza', 'Conservação Predial', 'Jardinagem'] }
    }
  },
  SGA: {
    id: '04',
    label: '04. DESPESAS ADM (SG&A)',
    children: {
      '04.1': { label: '04.1 COMERCIAL & MKT', items: ['Google Ads', 'Redes Sociais', 'Eventos Comerciais'] },
      '04.2': { label: '04.2 CORPORATIVO', items: ['Sistemas ERP', 'Assessoria Jurídica', 'Consultoria'] }
    }
  }
};

const generateMockData = (): Transaction[] => {
  const transactions: Transaction[] = [];
  const scenarios = ['Real', 'Orçado', 'A-1'];
  const months = Array.from({ length: 12 }, (_, i) => i);
  let idCounter = 1;
  const branchesToGenerate = BRANCHES.slice(0, 10);

  scenarios.forEach(scenario => {
    months.forEach(month => {
      if (scenario === 'Real' && month > 4) return;
      branchesToGenerate.forEach(unit => {
        const brand = unit.split(' - ')[0].trim();
        const date = `2024-${String(month + 1).padStart(2, '0')}-10`;
        
        // Gerar itens para cada categoria da nova estrutura
        ALL_CATEGORIES.forEach(cat => {
          let type: any = 'REVENUE';
          if (CATEGORIES.VARIABLE_COST.includes(cat)) type = 'VARIABLE_COST';
          if (CATEGORIES.FIXED_COST.includes(cat)) type = 'FIXED_COST';
          if (CATEGORIES.SGA.includes(cat)) type = 'SGA';
          // Fixed: Correctly assigning RATEIO type in mock data generation
          if (CATEGORIES.RATEIO.includes(cat)) type = 'RATEIO';

          const baseAmount = type === 'REVENUE' ? 50000 : 15000;
          const factor = scenario === 'Orçado' ? 1.1 : scenario === 'A-1' ? 0.9 : 1.0;
          const isDeduction = cat === 'ISS' || cat === 'PIS/COFINS' || cat === 'Simples Nacional';

          transactions.push({
            id: `tx-${idCounter++}`,
            scenario,
            date,
            category: cat,
            branch: unit,
            brand,
            description: `Lançamento ${cat}`,
            amount: baseAmount * factor * (Math.random() * 0.4 + 0.8) * (isDeduction ? -1 : 1),
            type,
            status: 'Normal',
            tag01: 'Administrativo',
            tag02: 'Geral',
            tag03: 'Operação Regular',
            ticket: `${300000 + idCounter}` // Popula o campo ticket com um número sequencial
          });
        });
      });
    });
  });
  return transactions;
};

export const INITIAL_TRANSACTIONS: Transaction[] = generateMockData();
