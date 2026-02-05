# -*- coding: utf-8 -*-
"""
⚠️ ⚠️ ⚠️ ARQUIVO DESCONTINUADO - NÃO UTILIZAR ⚠️ ⚠️ ⚠️

Este arquivo foi SUBSTITUÍDO por: Sincronizacao_manual_banco.py

MOTIVO DA DESCONTINUAÇÃO:
- Múltiplos métodos de autenticação (desnecessário)
- Não possui progress bar visual
- Não possui validação automática completa
- Não possui logs de erro em arquivo JSON
- Não gera chave_id única
- Não usa SQL Function otimizada

PODE SER DELETADO NO FUTURO.
Mantido apenas para consulta histórica se necessário.

Data de descontinuação: 05/02/2026
Substituído por: Sincronizacao_manual_banco.py
"""

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
    FORMAT(F.DATA,'yyyyMM') AS 'anomes',
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


def desabilitar_trigger(supabase):
    """Desabilita o trigger de sincronização automática"""
    print("[>] Desabilitando trigger de sincronização...")
    try:
        supabase.rpc('desabilitar_trigger_sincronizacao').execute()
        print("[OK] Trigger desabilitado")
        return True
    except Exception as e:
        print(f"[AVISO] Não foi possível desabilitar trigger: {e}")
        return False


def habilitar_trigger(supabase):
    """Habilita o trigger de sincronização automática"""
    print("[>] Habilitando trigger de sincronização...")
    try:
        supabase.rpc('habilitar_trigger_sincronizacao').execute()
        print("[OK] Trigger habilitado")
        return True
    except Exception as e:
        print(f"[AVISO] Não foi possível habilitar trigger: {e}")
        return False


def executar_comparacao_manual(supabase):
    """Executa a comparação e sincronização manualmente"""
    print("[>] Executando comparação e sincronização...")
    try:
        result = supabase.rpc('executar_comparacao_e_sincronizacao').execute()
        if result.data:
            dados = result.data[0] if isinstance(result.data, list) else result.data
            print(f"[OK] Comparação executada com sucesso!")
            print(f"  - Registros comparados: {dados.get('registros_comparados', 'N/A')}")
            print(f"  - Registros sincronizados: {dados.get('registros_sincronizados', 'N/A')}")
            print(f"  - Tempo: {dados.get('tempo_ms', 'N/A')} ms")
        return True
    except Exception as e:
        print(f"[ERRO] Falha ao executar comparação: {e}")
        return False


def carregar_dados_supabase(supabase, df, table_name, mode="replace"):
    """Carrega dados no Supabase"""
    print(f"[>] Carregando dados na tabela '{table_name}'...")

    # Converter nomes de colunas para minúsculas
    df.columns = df.columns.str.lower()

    # Obter colunas da tabela Supabase
    try:
        result = supabase.table(table_name).select('*').limit(1).execute()
        if result.data:
            supabase_columns = set(result.data[0].keys())
            # Remover colunas que não existem no Supabase
            df_columns = set(df.columns)
            colunas_para_remover = df_columns - supabase_columns
            if colunas_para_remover:
                print(f"[INFO] Removendo colunas não existentes no Supabase: {colunas_para_remover}")
                df = df.drop(columns=list(colunas_para_remover))
    except Exception as e:
        print(f"[AVISO] Não foi possível verificar colunas da tabela: {e}")

    # Converter valores numéricos com vírgula para ponto
    for col in df.columns:
        if df[col].dtype == 'object':
            # Tentar converter strings numéricas com vírgula para float
            try:
                # Se for string e contém vírgula, pode ser número brasileiro
                if df[col].astype(str).str.contains(',', na=False).any():
                    df[col] = df[col].astype(str).str.replace(',', '.', regex=False)
                    # Tentar converter para numérico
                    try:
                        df[col] = pd.to_numeric(df[col], errors='ignore')
                    except:
                        pass
            except:
                pass

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
        try:
            # Deletar em lotes para evitar timeout
            while True:
                result = supabase.table(table_name).delete().limit(5000).execute()
                if not result.data or len(result.data) < 5000:
                    break
            print("[OK] Dados antigos removidos")
        except Exception as e:
            print(f"[AVISO] Erro ao remover dados: {e}")

    batch_size = 500
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

        # 5. Desabilitar trigger antes da carga
        desabilitar_trigger(supabase)

        # 6. Carregar dados
        carregar_dados_supabase(supabase, df, SUPABASE_TABLE, mode="replace")

        # 7. Habilitar trigger novamente
        habilitar_trigger(supabase)

        # 8. Executar comparação e sincronização manual
        executar_comparacao_manual(supabase)

        print("\n" + "="*60)
        print("[SUCESSO] Pipeline concluido com sucesso!")
        print("="*60 + "\n")

    except Exception as e:
        print("\n" + "="*60)
        print(f"[ERRO] {e}")
        print("="*60 + "\n")
        # Tentar reabilitar trigger mesmo em caso de erro
        try:
            supabase = conectar_supabase()
            habilitar_trigger(supabase)
        except:
            pass
        raise


if __name__ == "__main__":
    main()
