# -*- coding: utf-8 -*-
"""
Pipeline ETL: Microsoft Fabric Data Warehouse -> Supabase
Extrai dados do Fabric e carrega no Supabase
"""

import os
import sys
import pandas as pd
from azure.identity import InteractiveBrowserCredential
import pyodbc
from supabase import create_client, Client

# Configurar encoding para Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# ==================== CONFIGURAÇÕES ====================
# Microsoft Fabric
FABRIC_SERVER = "brexl7eomxoerljqiapyaul67i-tscdkva6temu3gn4zp67tlafl4.datawarehouse.fabric.microsoft.com"
FABRIC_DATABASE = "DRE"

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://vafmufhlompwsdrlhkfz.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhZm11Zmhsb21wd3Nkcmxoa2Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQzMjI5MSwiZXhwIjoyMDg1MDA4MjkxfQ.m0viLArNl57ExdNlRoEuNNZH0n_0iKSaa81Fyj2ekpA")
SUPABASE_TABLE = "dre_fabric"

# SQL Query para executar no Fabric
SQL_QUERY = """
SELECT
    CONCAT(F.IDLANCAMENTO, F.IDPARTIDA) AS CHAVE,
    CODLOTE,
    FIL.CIA,
    FIL.FILIAL,
    F.INTEGRAAPLICACAO,
    F.IDPARTIDA,
    F.FLUIG AS TICKET,
    CASE
        WHEN F.CODIGOFORNECEDOR = '' AND (COMPLEMENTO LIKE '%N/ MES%' OR COMPLEMENTO LIKE '%N/ MÊS%' OR COMPLEMENTO LIKE '%N/MÊS%') THEN COMPLEMENTO
        WHEN F.CODIGOFORNECEDOR = '' AND (COMPLEMENTO LIKE 'EV____ -%' OR COMPLEMENTO LIKE 'EN____ -%') THEN COMPLEMENTO
        WHEN F.CODIGOFORNECEDOR = '' THEN F.FORNECEDOR_TRATADO
        WHEN FORN_TAG.[Fornecedor Novo] IS NOT NULL THEN FORN_TAG.[Fornecedor Novo]
        ELSE F.NOMEFORNECEDOR
    END AS 'FORNECEDOR_PADRAO',
    FORMAT(F.DATA,'yyyyMM') AS 'ANOMES',
    F.VALOR,
    F.COMPLEMENTO,
    'Sim' AS 'Recorrente?',
    CASE
       WHEN T.Tag1 NOT IN ('CUSTOS', 'DESPESAS') THEN F.CONTA
       ELSE F.CONTA
    END AS 'Conta',
    CASE
       WHEN T.Tag1 NOT IN ('CUSTOS', 'DESPESAS') THEN T.TAG1
       ELSE T.Tag1
    END AS 'Tag1',
    CASE
       WHEN T.Tag1 NOT IN ('CUSTOS', 'DESPESAS') THEN T.TAG2
       ELSE T.Tag2
    END AS 'Tag2',
    CASE
       WHEN T.Tag1 NOT IN ('CUSTOS', 'DESPESAS') THEN T.TAG3
       ELSE T.Tag3
    END AS 'Tag3',
    CASE
       WHEN T.Tag1 NOT IN ('CUSTOS', 'DESPESAS') THEN T.TAG4
       ELSE T.TAG4
    END AS 'Tag4',
    CASE
       WHEN T.TagOrc NOT IN ('CUSTOS', 'DESPESAS') THEN T.TagOrc
       ELSE T.TagOrc
    END AS 'Tag_Orc',
    'Original' AS 'Original?',
    'Real' AS 'R/O',
    F.CC,
    F.CODCOLIGADA,
    F.CODFILIAL,
    F.USUARIO,
    F.CONTA AS 'Conta_Original',
    T.Tag1 AS 'Tag1_Original',
    T.TAG4 AS 'Tag4_Original',
    T.TagOrc AS 'TagOrc_Original',
    F.INTEGRACHAVE_TRATADA,
    [STATUS LANC. FINANCEIRO],
    FORMAT(F.DATA,'yyyyMM') AS 'ANOMES_ORIGINAL'
FROM DRE F
LEFT JOIN Filial FIL ON FIL.CODCOLIGADA = F.CODCOLIGADA AND FIL.CODFILIAL = F.CODFILIAL
LEFT JOIN Tags T ON T.CODCONTA = F.CONTA
LEFT JOIN Fornecedor_Tags FORN_TAG ON TRIM(FORN_TAG.[Fornecedor Original]) = TRIM(F.NOMEFORNECEDOR)
WHERE 1=1
    AND F.DATA >= '2026-01-01' AND F.DATA <= GETDATE()
    AND T.Tag1 != 'N/A'
ORDER BY F.CODCOLIGADA, F.IDLANCAMENTO, F.IDPARTIDA
"""

# ==================== FUNÇÕES ====================

def conectar_fabric():
    """Conecta ao Microsoft Fabric usando Azure AD"""
    print("[>] Autenticando no Azure AD...")

    # Credencial interativa do Azure AD
    credential = InteractiveBrowserCredential()
    token = credential.get_token("https://database.windows.net/.default")

    # String de conexão
    connection_string = (
        f"Driver={{ODBC Driver 18 for SQL Server}};"
        f"Server={FABRIC_SERVER};"
        f"Database={FABRIC_DATABASE};"
        f"Encrypt=yes;"
        f"TrustServerCertificate=no;"
        f"Connection Timeout=30"
    )

    # Conectar com token
    conn = pyodbc.connect(
        connection_string,
        attrs_before={1256: token.token.encode('utf-16-le')}
    )

    print("[OK] Conectado ao Microsoft Fabric")
    return conn


def extrair_dados_fabric(conn, query):
    """Executa query no Fabric e retorna DataFrame"""
    print("[>] Executando query no Fabric...")
    df = pd.read_sql(query, conn)
    print(f"[OK] {len(df)} linhas extraidas")
    return df


def conectar_supabase():
    """Conecta ao Supabase"""
    print("[>] Conectando ao Supabase...")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("[OK] Conectado ao Supabase")
    return supabase


def carregar_dados_supabase(supabase, df, table_name, mode="replace"):
    """
    Carrega dados no Supabase
    mode: 'replace' (apaga e insere) ou 'append' (adiciona)
    """
    print(f"[>] Carregando dados na tabela '{table_name}'...")

    # Converter DataFrame para lista de dicionários
    records = df.to_dict('records')

    if mode == "replace":
        # Deletar dados existentes (opcional)
        print("[>] Removendo dados antigos...")
        # Cuidado: isso apaga TUDO da tabela
        # supabase.table(table_name).delete().neq('id', 0).execute()

    # Inserir dados em lotes
    batch_size = 1000
    total_inserted = 0

    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        response = supabase.table(table_name).insert(batch).execute()
        total_inserted += len(batch)
        print(f"  [INFO] Inseridos {total_inserted}/{len(records)} registros")

    print(f"[OK] {total_inserted} registros carregados com sucesso!")


# ==================== PIPELINE PRINCIPAL ====================

def main():
    """Executa o pipeline completo"""
    try:
        print("\n" + "="*60)
        print("PIPELINE ETL: FABRIC -> SUPABASE")
        print("="*60 + "\n")

        # 1. Conectar ao Fabric
        fabric_conn = conectar_fabric()

        # 2. Extrair dados
        df = extrair_dados_fabric(fabric_conn, SQL_QUERY)

        # 3. Fechar conexão Fabric
        fabric_conn.close()

        # 4. Conectar ao Supabase
        supabase = conectar_supabase()

        # 5. Carregar dados
        carregar_dados_supabase(supabase, df, SUPABASE_TABLE, mode="replace")

        print("\n" + "="*60)
        print("[SUCESSO] Pipeline concluido com sucesso!")
        print("="*60 + "\n")

    except Exception as e:
        print("\n" + "="*60)
        print(f"[ERRO] {e}")
        print("="*60 + "\n")
        raise


if __name__ == "__main__":
    main()
