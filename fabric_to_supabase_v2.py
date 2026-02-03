# -*- coding: utf-8 -*-
"""
Pipeline ETL: Microsoft Fabric Data Warehouse -> Supabase
Versão com múltiplos métodos de autenticação Microsoft Entra ID
"""

import os
import sys
import pandas as pd
from azure.identity import DefaultAzureCredential, InteractiveBrowserCredential, AzureCliCredential
import pyodbc
from supabase import create_client, Client
import struct

# Configurar encoding para Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# ==================== CONFIGURAÇÕES ====================
FABRIC_SERVER = "brexl7eomxoerljqiapyaul67i-tscdkva6temu3gn4zp67tlafl4.datawarehouse.fabric.microsoft.com"
FABRIC_DATABASE = "DRE"

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://vafmufhlompwsdrlhkfz.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhZm11Zmhsb21wd3Nkcmxoa2Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQzMjI5MSwiZXhwIjoyMDg1MDA4MjkxfQ.m0viLArNl57ExdNlRoEuNNZH0n_0iKSaa81Fyj2ekpA")
SUPABASE_TABLE = "dre_fabric"

SQL_QUERY = """
SELECT
    CONCAT(F.IDLANCAMENTO, F.IDPARTIDA) AS CHAVE,
    F.CODLOTE,
    FIL.CIA,
    FIL.FILIAL,
    F.INTEGRAAPLICACAO,
    F.IDLANCAMENTO,
    F.IDPARTIDA,
    F.FLUIG AS TICKET,
    F.DATA,
    CASE
        WHEN F.CODIGOFORNECEDOR = '' AND (F.COMPLEMENTO LIKE '%N/ MES%' OR F.COMPLEMENTO LIKE '%N/ MÊS%' OR F.COMPLEMENTO LIKE '%N/MÊS%') THEN F.COMPLEMENTO
        WHEN F.CODIGOFORNECEDOR = '' AND (F.COMPLEMENTO LIKE 'EV____ -%' OR F.COMPLEMENTO LIKE 'EN____ -%') THEN F.COMPLEMENTO
        WHEN F.CODIGOFORNECEDOR = '' THEN F.FORNECEDOR_TRATADO
        WHEN FORN_TAG.[Fornecedor Novo] IS NOT NULL THEN FORN_TAG.[Fornecedor Novo]
        ELSE F.NOMEFORNECEDOR
    END AS 'FORNECEDOR_PADRAO',
    F.NOMEFORNECEDOR AS 'FORNECEDOR_ORIGINAL',
    FORMAT(F.DATA,'yyyyMM') AS 'ANOMES',
    F.VALOR,
    F.COMPLEMENTO,
    F.CONTA,
    F.CC,
    F.CODCOLIGADA,
    F.CODFILIAL,
    F.USUARIO,
    F.CODIGOFORNECEDOR,
    F.INTEGRACHAVE_TRATADA,
    F.[STATUS LANC. FINANCEIRO]
FROM DRE F
LEFT JOIN Filial FIL ON FIL.CODCOLIGADA = F.CODCOLIGADA AND FIL.CODFILIAL = F.CODFILIAL
LEFT JOIN Fornecedor_Tags FORN_TAG ON TRIM(FORN_TAG.[Fornecedor Original]) = TRIM(F.NOMEFORNECEDOR)
WHERE F.DATA >= '2026-01-01' AND F.DATA <= GETDATE()
ORDER BY F.CODCOLIGADA, F.IDLANCAMENTO, F.IDPARTIDA
"""

# ==================== FUNÇÕES ====================

def conectar_fabric_metodo_1():
    """Método 1: InteractiveBrowserCredential com ODBC 17"""
    print("[>] Tentando Metodo 1: InteractiveBrowserCredential + ODBC 17...")

    credential = InteractiveBrowserCredential()
    token = credential.get_token("https://database.windows.net/.default")

    connection_string = (
        f"Driver={{ODBC Driver 17 for SQL Server}};"
        f"Server={FABRIC_SERVER};"
        f"Database={FABRIC_DATABASE};"
        f"Encrypt=yes;"
        f"TrustServerCertificate=no;"
        f"Connection Timeout=30"
    )

    token_bytes = token.token.encode("UTF-16-LE")
    token_struct = struct.pack(f"<I{len(token_bytes)}s", len(token_bytes), token_bytes)

    conn = pyodbc.connect(connection_string, attrs_before={1256: token_struct})
    print("[OK] Conectado com Metodo 1!")
    return conn


def conectar_fabric_metodo_2():
    """Método 2: DefaultAzureCredential"""
    print("[>] Tentando Metodo 2: DefaultAzureCredential...")

    credential = DefaultAzureCredential()
    token = credential.get_token("https://database.windows.net/.default")

    connection_string = (
        f"Driver={{ODBC Driver 18 for SQL Server}};"
        f"Server={FABRIC_SERVER};"
        f"Database={FABRIC_DATABASE};"
        f"Encrypt=yes;"
        f"TrustServerCertificate=no;"
        f"Connection Timeout=30"
    )

    token_bytes = token.token.encode("UTF-16-LE")
    token_struct = struct.pack(f"<I{len(token_bytes)}s", len(token_bytes), token_bytes)

    conn = pyodbc.connect(connection_string, attrs_before={1256: token_struct})
    print("[OK] Conectado com Metodo 2!")
    return conn


def conectar_fabric_metodo_3():
    """Método 3: AzureCliCredential (requer az login)"""
    print("[>] Tentando Metodo 3: AzureCliCredential...")

    credential = AzureCliCredential()
    token = credential.get_token("https://database.windows.net/.default")

    connection_string = (
        f"Driver={{ODBC Driver 18 for SQL Server}};"
        f"Server={FABRIC_SERVER};"
        f"Database={FABRIC_DATABASE};"
        f"Encrypt=yes;"
        f"TrustServerCertificate=no;"
        f"Connection Timeout=30"
    )

    token_bytes = token.token.encode("UTF-16-LE")
    token_struct = struct.pack(f"<I{len(token_bytes)}s", len(token_bytes), token_bytes)

    conn = pyodbc.connect(connection_string, attrs_before={1256: token_struct})
    print("[OK] Conectado com Metodo 3!")
    return conn


def conectar_fabric_metodo_4():
    """Método 4: ActiveDirectoryInteractive (autenticação interativa nativa)"""
    print("[>] Tentando Metodo 4: ActiveDirectoryInteractive...")

    connection_string = (
        f"Driver={{ODBC Driver 18 for SQL Server}};"
        f"Server={FABRIC_SERVER};"
        f"Database={FABRIC_DATABASE};"
        f"Authentication=ActiveDirectoryInteractive;"
        f"Encrypt=yes;"
        f"TrustServerCertificate=no;"
        f"Connection Timeout=30"
    )

    conn = pyodbc.connect(connection_string)
    print("[OK] Conectado com Metodo 4!")
    return conn


def conectar_fabric():
    """Tenta conectar usando múltiplos métodos"""
    metodos = [
        conectar_fabric_metodo_4,  # Mais provável de funcionar
        conectar_fabric_metodo_2,
        conectar_fabric_metodo_1,
        conectar_fabric_metodo_3,
    ]

    for metodo in metodos:
        try:
            return metodo()
        except Exception as e:
            print(f"[FALHOU] {metodo.__name__}: {str(e)[:100]}")
            continue

    raise Exception("Nenhum metodo de autenticacao funcionou!")


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
    """Carrega dados no Supabase"""
    print(f"[>] Carregando dados na tabela '{table_name}'...")

    # Converter colunas de data para string
    for col in df.columns:
        if df[col].dtype == 'object':
            # Tentar converter datetime/date para string
            try:
                if hasattr(df[col].iloc[0], 'isoformat'):
                    df[col] = df[col].apply(lambda x: x.isoformat() if pd.notna(x) else None)
            except:
                pass
        elif 'datetime' in str(df[col].dtype):
            df[col] = df[col].dt.strftime('%Y-%m-%d %H:%M:%S')
        elif 'date' in str(df[col].dtype):
            df[col] = df[col].astype(str)

    records = df.to_dict('records')

    if mode == "replace":
        print("[>] Removendo dados antigos...")
        # supabase.table(table_name).delete().neq('id', 0).execute()

    batch_size = 1000
    total_inserted = 0

    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        response = supabase.table(table_name).insert(batch).execute()
        total_inserted += len(batch)
        print(f"  [INFO] Inseridos {total_inserted}/{len(records)} registros")

    print(f"[OK] {total_inserted} registros carregados com sucesso!")


def main():
    """Executa o pipeline completo"""
    try:
        print("\n" + "="*60)
        print("PIPELINE ETL: FABRIC -> SUPABASE (Multi-Auth)")
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
