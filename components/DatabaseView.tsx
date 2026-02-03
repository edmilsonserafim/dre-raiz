import React, { useState } from 'react';
import { Database, Copy, Check, ExternalLink, Code, ShieldCheck, Table, ArrowRightLeft, Download, FileSpreadsheet } from 'lucide-react';

const APPS_SCRIPT_CODE = `/**
 * BACKEND EDUFINANCE PRO - ESCOLA SAP
 * Versão Sincronização Ativa v6 (16 Colunas: A-P)
 * Inclui: Fornecedor (J), Recorrente (M), Justificativa (P). ID movido para (N).
 */

function doGet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Lancamentos") || ss.getSheets()[0];
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return returnJSON([]);
  
  var keys = ["scenario", "date", "tag01", "tag02", "tag03", "category", "filial", "marca", "ticket", "vendor", "description", "amount", "recurring", "id", "status", "justification"];
  var json = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < keys.length; j++) {
      var val = data[i][j];
      if (val instanceof Date) val = Utilities.formatDate(val, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
      obj[keys[j]] = val;
    }
    json.push(obj);
  }
  return returnJSON(json);
}

function doPost(e) {
  try {
    var request = JSON.parse(e.postData.contents);
    var action = request.action; 
    var data = request.data;
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Lancamentos") || ss.getSheets()[0];
    
    var keys = ["scenario", "date", "tag01", "tag02", "tag03", "category", "filial", "marca", "ticket", "vendor", "description", "amount", "recurring", "id", "status", "justification"];
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(keys);
    }
    
    if (action === "REPLACE") {
      var deleteId = data.deleteId;
      var upsertItems = data.upsertItems;
      
      var rowIdx = findRowById(sheet, deleteId);
      if (rowIdx > -1) sheet.deleteRow(rowIdx);
      
      upsertItems.forEach(function(item) {
        var values = keys.map(function(k) { 
          var v = item[k];
          return (v !== undefined && v !== null) ? v : ""; 
        });
        sheet.appendRow(values);
      });
    } 
    else if (action === "UPSERT") {
      var items = Array.isArray(data) ? data : [data];
      items.forEach(function(item) {
        if (!item.id) return;
        var rowIdx = findRowById(sheet, item.id);
        var values = keys.map(function(k) { 
          var v = item[k];
          return (v !== undefined && v !== null) ? v : ""; 
        });
        
        if (rowIdx > -1) {
          sheet.getRange(rowIdx, 1, 1, keys.length).setValues([values]);
        } else {
          sheet.appendRow(values);
        }
      });
    } 
    else if (action === "DELETE") {
      var idToDelete = data.id || data;
      var rowIdx = findRowById(sheet, idToDelete);
      if (rowIdx > -1) sheet.deleteRow(rowIdx);
    }
    
    return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("Erro: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}

function findRowById(sheet, id) {
  if (!id) return -1;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  // Agora o ID está na coluna N (14)
  var ids = sheet.getRange(1, 14, lastRow, 1).getValues(); 
  var searchId = id.toString();
  for (var i = 1; i < ids.length; i++) {
    if (ids[i][0].toString() === searchId) return i + 1;
  }
  return -1;
}

function returnJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
`;

const DatabaseView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTemplate = () => {
    const headers = ["Cenário", "Data", "Tag 01", "Tag 02", "Tag 03", "Conta", "Unidade", "Marca", "Ticket", "Fornecedor", "Descrição", "Valor", "Recorrente", "ID", "Status", "Justificativa"];
    const csvContent = [headers.join(";")].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Modelo_Sincronizacao_SAP_v6.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const mappingData = [
    { col: 'A', label: 'Cenário', key: 'scenario' },
    { col: 'B', label: 'Data', key: 'date' },
    { col: 'C', label: 'Tag 01', key: 'tag01' },
    { col: 'D', label: 'Tag 02', key: 'tag02' },
    { col: 'E', label: 'Tag 03', key: 'tag03' },
    { col: 'F', label: 'Conta (Categoria)', key: 'category' },
    { col: 'G', label: 'Unidade', key: 'filial' },
    { col: 'H', label: 'Marca', key: 'marca' },
    { col: 'I', label: 'Ticket', key: 'ticket' },
    { col: 'J', label: 'Fornecedor', key: 'vendor' },
    { col: 'K', label: 'Descrição', key: 'description' },
    { col: 'L', label: 'Valor', key: 'amount' },
    { col: 'M', label: 'Recorrente', key: 'recurring' },
    { col: 'N', label: 'ID Único', key: 'id' },
    { col: 'O', label: 'Status Atual', key: 'status' },
    { col: 'P', label: 'Justificativa do Ajuste', key: 'justification' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Database className="text-[#F44C00]" />
            Configuração de Sincronização v6
          </h2>
          <p className="text-gray-500 mt-1 font-medium">Mapeamento expandido de 16 colunas incluindo campo Justificativa (P).</p>
        </div>
        
        <button 
          onClick={downloadTemplate}
          className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl border border-emerald-100 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all"
        >
          <FileSpreadsheet size={16} />
          Baixar Template CSV v6
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Mapeamento de Colunas (A-P)</h3>
            <div className="space-y-1.5 overflow-y-auto max-h-[500px] pr-2">
              {mappingData.map((item) => (
                <div key={item.col} className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-transparent hover:border-[#F44C00]/20 transition-all">
                  <div className="w-6 h-6 bg-white text-[#F44C00] font-black text-[10px] rounded flex items-center justify-center border border-gray-100">
                    {item.col}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-800">{item.label}</p>
                    <p className="text-[8px] text-gray-400 font-bold">{item.key}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <Code className="text-[#F44C00]" />
              Implementação Sincronizada v6
            </h3>
            
            <div className="space-y-4 mb-8 text-sm text-gray-600 font-medium">
              <p>Esta versão v6 introduz a separação entre Descrição e Justificativa:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Justificativa (Coluna P):</strong> Recebe a explicação do usuário no modal de ajuste sem afetar a descrição original do ERP.</li>
                <li><strong>Preservação de Dados:</strong> O campo 'Descrição' permanece com o valor original vindo do SAP/Zeev.</li>
                <li><strong>Auditoria:</strong> Ao aprovar uma mudança, a justificativa é gravada permanentemente na base de dados para conformidade.</li>
              </ul>
            </div>

            <div className="relative group">
              <div className="absolute right-4 top-4 flex gap-2 z-10">
                <button 
                  onClick={handleCopy}
                  className="bg-white/90 backdrop-blur shadow-md px-4 py-2 rounded-xl text-[#1B75BB] hover:bg-white transition-all flex items-center gap-2 text-[10px] font-black uppercase"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  Copiar Código v6
                </button>
              </div>
              <pre className="bg-gray-900 text-blue-300 p-8 rounded-3xl overflow-x-auto text-xs font-mono leading-relaxed max-h-[400px] border-4 border-gray-800">
                {APPS_SCRIPT_CODE}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseView;