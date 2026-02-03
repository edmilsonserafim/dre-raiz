import type { AnalysisPack } from '../../types';

export const mockAnalysisPack: AnalysisPack = {
  meta: {
    org_name: "RAIZ EDUCAÇÃO",
    period_label: "Janeiro/2026",
    scope_label: "Consolidado - Todas as Marcas",
    currency: "BRL",
    generated_at_iso: "2026-01-30T14:30:00Z"
  },
  executive_summary: {
    headline: "Performance financeira sólida com oportunidades de otimização de custos operacionais",
    bullets: [
      "Receita acima do planejado em R$ 2.3M (3.2%), demonstrando forte captação de alunos",
      "EBITDA de R$ 18.5M representa margem de 25.3%, superando o target de 22%",
      "Custos variáveis sob controle, com destaque para redução de 8% em material didático",
      "Inadimplência em 4.2%, dentro do patamar aceitável para o setor educacional"
    ],
    risks: [
      "Despesas com energia elétrica 15% acima do orçado devido ao aumento tarifário",
      "Turnover de professores aumentou para 12%, impactando qualidade e custos de treinamento",
      "Investimento em infraestrutura tecnológica atrasado, pode comprometer diferenciação competitiva"
    ],
    opportunities: [
      "Renegociação de contratos de fornecedores pode gerar economia anual de R$ 800K",
      "Expansão de turmas noturnas tem demanda reprimida e pode adicionar R$ 1.2M em receita",
      "Digitalização de processos administrativos pode reduzir custos SG&A em até 10%"
    ]
  },
  actions: [
    {
      owner: "CFO",
      action: "Iniciar processo de RFP para renegociação de contratos de energia e limpeza",
      eta: "15/Fev/2026",
      expected_impact: "Redução de R$ 650K/ano em custos fixos"
    },
    {
      owner: "RH",
      action: "Implementar programa de retenção de talentos com foco em professores-chave",
      eta: "28/Fev/2026",
      expected_impact: "Redução de turnover para 8% e economia de R$ 200K em recrutamento"
    },
    {
      owner: "Operações",
      action: "Viabilizar abertura de 3 turmas noturnas piloto nas unidades de maior demanda",
      eta: "01/Mar/2026",
      expected_impact: "Receita adicional de R$ 400K no Q2/2026"
    },
    {
      owner: "TI",
      action: "Acelerar projeto de automação de processos administrativos (RPA)",
      eta: "31/Mar/2026",
      expected_impact: "Redução de 15 FTEs e economia de R$ 900K/ano"
    }
  ],
  charts: [
    {
      id: "revenue_ebitda_r12",
      kind: "line",
      dataset_key: "r12",
      title: "Evolução de Receita e EBITDA (R12M)",
      series_keys: ["revenue", "ebitda"]
    },
    {
      id: "ebitda_bridge",
      kind: "waterfall",
      dataset_key: "ebitda_bridge_vs_plan_ytd",
      title: "Ponte de EBITDA vs Orçamento (YTD)"
    },
    {
      id: "cost_variance_pareto",
      kind: "pareto",
      dataset_key: "pareto_cost_variance_ytd",
      title: "Principais Variações de Custo (Pareto)",
      top_n: 10
    },
    {
      id: "variance_heatmap",
      kind: "heatmap",
      dataset_key: "heatmap_variance",
      title: "Mapa de Calor: Variações por Categoria e Marca"
    }
  ],
  slides: [
    {
      title: "Visão Geral - Performance Financeira",
      subtitle: "Janeiro/2026 - Consolidado",
      blocks: [
        {
          type: "kpi_grid",
          title: "Principais Indicadores",
          kpi_codes: ["revenue", "ebitda", "net_margin", "cost_per_student"]
        },
        {
          type: "callout",
          intent: "positive",
          title: "Destaques Positivos",
          bullets: [
            "Receita 3.2% acima do planejado",
            "Margem EBITDA de 25.3% vs target de 22%",
            "Captação de alunos superou meta em 180 matrículas"
          ]
        },
        {
          type: "callout",
          intent: "negative",
          title: "Pontos de Atenção",
          bullets: [
            "Energia elétrica 15% acima do orçado",
            "Turnover de professores em alta (12%)",
            "Inadimplência subiu 0.3pp vs mês anterior"
          ]
        }
      ]
    },
    {
      title: "Análise de Receita",
      subtitle: "Comparativo Real vs Planejado",
      blocks: [
        {
          type: "text",
          title: "Drivers de Performance",
          bullets: [
            "Mensalidades: R$ 68.5M (101.2% do plano) - crescimento orgânico forte",
            "Matrículas: R$ 4.2M (98.5% do plano) - campanha de captação efetiva",
            "Serviços extras: R$ 1.8M (105% do plano) - adesão acima do esperado"
          ]
        },
        {
          type: "chart",
          chart_id: "revenue_ebitda_r12",
          height: "lg",
          note: "Receita apresenta tendência de crescimento consistente nos últimos 12 meses"
        }
      ]
    },
    {
      title: "Análise de EBITDA",
      subtitle: "Ponte vs Orçamento YTD",
      blocks: [
        {
          type: "chart",
          chart_id: "ebitda_bridge",
          height: "lg",
          note: "EBITDA superou orçamento principalmente por ganho de receita e eficiência em custos variáveis"
        },
        {
          type: "text",
          bullets: [
            "Variação positiva de receita adicionou R$ 2.3M ao EBITDA",
            "Custos variáveis ficaram R$ 800K abaixo do orçado",
            "Custos fixos pressionaram resultado em R$ 1.1M (principalmente energia)",
            "SG&A dentro do esperado com pequena economia de R$ 200K"
          ]
        }
      ]
    },
    {
      title: "Análise de Custos",
      subtitle: "Principais Variações (Pareto)",
      blocks: [
        {
          type: "chart",
          chart_id: "cost_variance_pareto",
          height: "md"
        },
        {
          type: "callout",
          intent: "neutral",
          title: "Top 3 Variações Explicam 78% do Total",
          bullets: [
            "Energia Elétrica: +R$ 450K (aumento tarifário de 18% não previsto)",
            "Material Didático: -R$ 320K (renegociação de fornecedor bem-sucedida)",
            "Pessoal Temporário: +R$ 280K (cobertura de licenças e afastamentos)"
          ]
        }
      ]
    },
    {
      title: "Análise por Marca e Categoria",
      subtitle: "Mapa de Calor de Variações",
      blocks: [
        {
          type: "chart",
          chart_id: "variance_heatmap",
          height: "lg",
          note: "Cores mais quentes indicam variações negativas (acima do orçado), cores frias indicam economia"
        }
      ]
    },
    {
      title: "Drivers Operacionais",
      subtitle: "Indicadores por Aluno",
      blocks: [
        {
          type: "table",
          title: "KPIs Operacionais Detalhados",
          dataset_key: "drivers_table"
        },
        {
          type: "text",
          bullets: [
            "Custo por aluno de R$ 4.850 está 2% abaixo do benchmark do setor",
            "Receita por aluno de R$ 6.500 mantém-se estável vs ano anterior",
            "Oportunidade de expandir serviços extras para aumentar ticket médio"
          ]
        }
      ]
    }
  ],
  datasets: {
    r12: {
      x: ["Fev/25", "Mar/25", "Abr/25", "Mai/25", "Jun/25", "Jul/25", "Ago/25", "Set/25", "Out/25", "Nov/25", "Dez/25", "Jan/26"],
      series: [
        {
          key: "revenue",
          name: "Receita",
          unit: "currency",
          data: [68.2, 69.5, 70.1, 71.8, 72.5, 73.2, 73.8, 74.1, 74.5, 73.9, 73.2, 74.5]
        },
        {
          key: "ebitda",
          name: "EBITDA",
          unit: "currency",
          data: [15.2, 15.8, 16.1, 16.9, 17.2, 17.5, 17.8, 18.0, 18.2, 18.1, 17.8, 18.5]
        }
      ]
    },
    ebitda_bridge_vs_plan_ytd: {
      start_label: "EBITDA Orçado",
      end_label: "EBITDA Real",
      start_value: 16.3,
      end_value: 18.5,
      steps: [
        { label: "Variação Receita", value: 2.3 },
        { label: "Custos Variáveis", value: 0.8 },
        { label: "Custos Fixos", value: -1.1 },
        { label: "SG&A", value: 0.2 }
      ]
    },
    pareto_cost_variance_ytd: {
      items: [
        { name: "Energia Elétrica", value: 450 },
        { name: "Material Didático", value: -320 },
        { name: "Pessoal Temporário", value: 280 },
        { name: "Manutenção Predial", value: 180 },
        { name: "Limpeza e Conservação", value: 150 },
        { name: "Segurança", value: 120 },
        { name: "Tecnologia", value: -95 },
        { name: "Marketing", value: 85 },
        { name: "Alimentação", value: 75 },
        { name: "Transporte", value: -60 }
      ]
    },
    heatmap_variance: {
      x: ["Marca A", "Marca B", "Marca C", "Marca D", "Marca E"],
      y: ["Receita", "Custos Variáveis", "Custos Fixos", "SG&A", "EBITDA"],
      values: [
        [0, 0, 3.2], [0, 1, 2.8], [0, 2, 3.5], [0, 3, 2.1], [0, 4, 4.2],
        [1, 0, -2.1], [1, 1, -1.5], [1, 2, -3.2], [1, 3, -2.8], [1, 4, -1.2],
        [2, 0, 8.5], [2, 1, 12.2], [2, 2, 15.1], [2, 3, 9.8], [2, 4, 7.5],
        [3, 0, -1.2], [3, 1, 0.5], [3, 2, -0.8], [3, 3, 1.2], [3, 4, -2.1],
        [4, 0, 5.2], [4, 1, 4.8], [4, 2, 6.5], [4, 3, 3.9], [4, 4, 7.2]
      ],
      unit: "percent"
    },
    drivers_table: {
      columns: ["Indicador", "Real", "Plano", "Var %", "Prior Year", "YoY %"],
      rows: [
        ["Alunos Ativos", 11450, 11200, "2.2%", 10980, "4.3%"],
        ["Receita por Aluno (R$)", 6500, 6450, "0.8%", 6420, "1.2%"],
        ["Custo por Aluno (R$)", 4850, 4950, "-2.0%", 4920, "-1.4%"],
        ["Margem por Aluno (R$)", 1650, 1500, "10.0%", 1500, "10.0%"],
        ["Taxa de Inadimplência", "4.2%", "4.0%", "5.0%", "3.9%", "7.7%"],
        ["Ticket Médio (R$)", 685, 680, "0.7%", 675, "1.5%"]
      ]
    }
  }
};

export const mockKPIs = [
  {
    code: "revenue",
    name: "Receita Total",
    unit: "currency" as const,
    actual: 74500000,
    plan: 72200000,
    prior: 73200000,
    delta_vs_plan: 3.18,
    delta_vs_prior: 1.78
  },
  {
    code: "ebitda",
    name: "EBITDA",
    unit: "currency" as const,
    actual: 18500000,
    plan: 16300000,
    prior: 17800000,
    delta_vs_plan: 13.50,
    delta_vs_prior: 3.93
  },
  {
    code: "net_margin",
    name: "Margem Líquida",
    unit: "percent" as const,
    actual: 25.3,
    plan: 22.0,
    prior: 24.3,
    delta_vs_plan: 3.3,
    delta_vs_prior: 1.0
  },
  {
    code: "cost_per_student",
    name: "Custo por Aluno",
    unit: "currency" as const,
    actual: 4850,
    plan: 4950,
    prior: 4920,
    delta_vs_plan: -2.02,
    delta_vs_prior: -1.42
  }
];
