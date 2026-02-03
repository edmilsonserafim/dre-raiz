// =====================================================
// Google Apps Script - Sincronização Automática
// =====================================================
// Como instalar:
// 1. Abra o Google Sheets
// 2. Extensões → Apps Script
// 3. Cole este código
// 4. Configure SUPABASE_URL e SUPABASE_KEY
// 5. Salve e execute setupTriggers() uma vez
// =====================================================

// =====================================================
// CONFIGURAÇÃO - ALTERE AQUI!
// =====================================================

const CONFIG = {
  // URL do seu Supabase
  SUPABASE_URL: 'https://seu-projeto.supabase.co',

  // Service Role Key (não a anon key!)
  SUPABASE_KEY: 'eyJ...',

  // Nome da aba/guia
  SHEET_NAME: 'Conta Cont',

  // Endpoint da API backend (se usar)
  BACKEND_API: 'http://localhost:3002/api/sync/conta-contabil',

  // Sincronização: 'supabase' ou 'backend'
  SYNC_MODE: 'supabase'
};

// =====================================================
// FUNÇÃO: Sincronizar Tudo (Manual)
// =====================================================

function syncAllData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);

  if (!sheet) {
    throw new Error(`Aba "${CONFIG.SHEET_NAME}" não encontrada`);
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0]; // Primeira linha
  const rows = data.slice(1); // Restante das linhas

  console.log(`📊 Sincronizando ${rows.length} linhas...`);

  let successCount = 0;
  let errorCount = 0;

  rows.forEach((row, index) => {
    try {
      const rowData = rowToObject(headers, row);

      // Pular linhas vazias
      if (!rowData.CODCONTA || rowData.CODCONTA.toString().trim() === '') {
        return;
      }

      if (CONFIG.SYNC_MODE === 'supabase') {
        syncToSupabase(rowData);
      } else {
        syncToBackend(rowData);
      }

      successCount++;
    } catch (error) {
      console.error(`❌ Erro na linha ${index + 2}:`, error);
      errorCount++;
    }
  });

  console.log(`✅ Sincronização completa: ${successCount} sucesso, ${errorCount} erros`);

  SpreadsheetApp.getUi().alert(
    `Sincronização concluída!\n\n` +
    `✅ Sucesso: ${successCount}\n` +
    `❌ Erros: ${errorCount}`
  );
}

// =====================================================
// FUNÇÃO: Converter linha em objeto
// =====================================================

function rowToObject(headers, row) {
  const obj = {};
  headers.forEach((header, index) => {
    obj[header] = row[index];
  });
  return obj;
}

// =====================================================
// FUNÇÃO: Sincronizar com Supabase diretamente
// =====================================================

function syncToSupabase(rowData) {
  const payload = {
    cod_conta: rowData.CODCONTA?.toString() || '',
    tag1: rowData.Tag1?.toString() || null,
    tag2: rowData.Tag2?.toString() || null,
    tag3: rowData.Tag3?.toString() || null,
    tag4: rowData.TAG4?.toString() || null,
    tag_orc: rowData.TagOrc?.toString() || null,
    ger: rowData.GER?.toString() || null,
    bp_dre: rowData['BP/DRE']?.toString() || null,
    nat_orc: rowData['Nat. Orc']?.toString() || null,
    nome_nat_orc: rowData['Nome Nat.Orc']?.toString() || null,
    responsavel: rowData['Responsável']?.toString() || null,
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'apikey': CONFIG.SUPABASE_KEY,
      'Authorization': `Bearer ${CONFIG.SUPABASE_KEY}`,
      'Prefer': 'resolution=merge-duplicates'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const url = `${CONFIG.SUPABASE_URL}/rest/v1/conta_contabil`;
  const response = UrlFetchApp.fetch(url, options);

  if (response.getResponseCode() !== 201 && response.getResponseCode() !== 200) {
    throw new Error(`Supabase erro: ${response.getContentText()}`);
  }

  return response.getContentText();
}

// =====================================================
// FUNÇÃO: Sincronizar via Backend API
// =====================================================

function syncToBackend(rowData) {
  const payload = {
    cod_conta: rowData.CODCONTA?.toString() || '',
    tag1: rowData.Tag1?.toString() || null,
    tag2: rowData.Tag2?.toString() || null,
    tag3: rowData.Tag3?.toString() || null,
    tag4: rowData.TAG4?.toString() || null,
    tag_orc: rowData.TagOrc?.toString() || null,
    ger: rowData.GER?.toString() || null,
    bp_dre: rowData['BP/DRE']?.toString() || null,
    nat_orc: rowData['Nat. Orc']?.toString() || null,
    nome_nat_orc: rowData['Nome Nat.Orc']?.toString() || null,
    responsavel: rowData['Responsável']?.toString() || null,
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(CONFIG.BACKEND_API, options);

  if (response.getResponseCode() !== 200) {
    throw new Error(`Backend erro: ${response.getContentText()}`);
  }

  return response.getContentText();
}

// =====================================================
// FUNÇÃO: Detectar mudanças (onEdit)
// =====================================================

function onEdit(e) {
  // Verificar se é a aba correta
  if (e.source.getActiveSheet().getName() !== CONFIG.SHEET_NAME) {
    return;
  }

  // Pegar linha editada
  const row = e.range.getRow();

  // Pular linha de cabeçalho
  if (row === 1) {
    return;
  }

  // Sincronizar linha específica
  syncRow(row);
}

// =====================================================
// FUNÇÃO: Sincronizar linha específica
// =====================================================

function syncRow(rowNumber) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const rowData = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];

  const dataObject = rowToObject(headers, rowData);

  // Pular se CODCONTA vazio
  if (!dataObject.CODCONTA || dataObject.CODCONTA.toString().trim() === '') {
    console.log(`Linha ${rowNumber} ignorada (CODCONTA vazio)`);
    return;
  }

  try {
    if (CONFIG.SYNC_MODE === 'supabase') {
      syncToSupabase(dataObject);
    } else {
      syncToBackend(dataObject);
    }
    console.log(`✅ Linha ${rowNumber} sincronizada com sucesso`);
  } catch (error) {
    console.error(`❌ Erro ao sincronizar linha ${rowNumber}:`, error);
  }
}

// =====================================================
// FUNÇÃO: Configurar gatilhos automáticos
// =====================================================

function setupTriggers() {
  // Remover triggers existentes
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));

  // Criar trigger de edição
  ScriptApp.newTrigger('onEdit')
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onEdit()
    .create();

  // Criar trigger de sincronização periódica (a cada 1 hora)
  ScriptApp.newTrigger('syncAllData')
    .timeBased()
    .everyHours(1)
    .create();

  console.log('✅ Triggers configurados com sucesso!');
  SpreadsheetApp.getUi().alert('✅ Sincronização automática configurada!\n\nAgora qualquer edição será sincronizada automaticamente.');
}

// =====================================================
// FUNÇÃO: Remover gatilhos
// =====================================================

function removeTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));

  console.log('🗑️ Triggers removidos');
  SpreadsheetApp.getUi().alert('🗑️ Sincronização automática desativada.');
}

// =====================================================
// MENU CUSTOMIZADO
// =====================================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🔄 Sincronização')
    .addItem('✅ Sincronizar Tudo Agora', 'syncAllData')
    .addItem('⚙️ Configurar Sincronização Automática', 'setupTriggers')
    .addItem('🗑️ Desativar Sincronização', 'removeTriggers')
    .addSeparator()
    .addItem('ℹ️ Sobre', 'showAbout')
    .addToUi();
}

function showAbout() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Sincronização Google Sheets → Supabase',
    '📊 Sistema de sincronização automática\n\n' +
    'Funcionalidades:\n' +
    '• Sincronização em tempo real ao editar\n' +
    '• Sincronização periódica a cada 1 hora\n' +
    '• Sincronização manual quando necessário\n\n' +
    '🔧 Configure em: Extensões → Apps Script\n' +
    '📚 Documentação completa no projeto',
    ui.ButtonSet.OK
  );
}

// =====================================================
// FUNÇÃO DE TESTE
// =====================================================

function testSync() {
  console.log('🧪 Testando sincronização...');

  const testData = {
    CODCONTA: '1.01.001',
    Tag1: 'Teste',
    Tag2: 'Automático',
    Tag3: null,
    TAG4: null,
    TagOrc: 'Operacional',
    GER: 'Sim',
    'BP/DRE': 'DRE',
    'Nat. Orc': 'Receita',
    'Nome Nat.Orc': 'Receita de Teste',
    'Responsável': 'Sistema'
  };

  try {
    if (CONFIG.SYNC_MODE === 'supabase') {
      const result = syncToSupabase(testData);
      console.log('✅ Teste com Supabase OK:', result);
    } else {
      const result = syncToBackend(testData);
      console.log('✅ Teste com Backend OK:', result);
    }

    SpreadsheetApp.getUi().alert('✅ Teste de sincronização bem-sucedido!');
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    SpreadsheetApp.getUi().alert(`❌ Erro no teste:\n\n${error.message}`);
  }
}
