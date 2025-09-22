// api/test-sheets.js - Teste de conectividade com Google Sheets
const { google } = require('googleapis');

const SPREADSHEET_ID = "1tnWusrOW-UXHFM8GT3o0Du93QDwv5G3Ylvgebof9wfQ";

let auth, sheets;

try {
  if (!process.env.GOOGLE_CREDENTIALS) {
    console.warn('⚠️ GOOGLE_CREDENTIALS não configurado');
  } else {
    auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    sheets = google.sheets({ version: 'v4', auth });
  }
} catch (error) {
  console.error('❌ Erro ao configurar Google Sheets:', error.message);
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🔍 test-sheets: Iniciando teste...');
    
    if (!sheets) {
      return res.status(500).json({
        status: 'error',
        message: 'Google Sheets não configurado',
        error: 'GOOGLE_CREDENTIALS não disponível'
      });
    }

    // Teste 1: Buscar informações da planilha
    console.log('🔍 test-sheets: Testando acesso à planilha...');
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    console.log('✅ test-sheets: Planilha acessada:', spreadsheetInfo.data.properties.title);
    
    // Teste 2: Listar abas
    const sheetsList = spreadsheetInfo.data.sheets.map(sheet => ({
      title: sheet.properties.title,
      sheetId: sheet.properties.sheetId
    }));
    
    console.log('📋 test-sheets: Abas encontradas:', sheetsList);
    
    // Teste 3: Buscar dados da aba FAQ
    console.log('🔍 test-sheets: Testando aba FAQ...');
    const faqData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'FAQ!A:D',
    });
    
    const faqRows = faqData.data.values || [];
    console.log('📊 test-sheets: Dados FAQ obtidos:', faqRows.length, 'linhas');
    
    // Teste 4: Buscar dados da aba Usuarios (se existir)
    let usuariosData = null;
    try {
      console.log('🔍 test-sheets: Testando aba Usuarios...');
      const usuariosResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Usuarios!A:C',
      });
      usuariosData = usuariosResponse.data.values || [];
      console.log('📊 test-sheets: Dados Usuarios obtidos:', usuariosData.length, 'linhas');
    } catch (error) {
      console.log('⚠️ test-sheets: Aba Usuarios não encontrada ou erro:', error.message);
    }
    
    return res.status(200).json({
      status: 'success',
      message: 'Teste de conectividade com Google Sheets realizado',
      spreadsheet: {
        title: spreadsheetInfo.data.properties.title,
        id: SPREADSHEET_ID
      },
      sheets: sheetsList,
      faq: {
        rows: faqRows.length,
        firstRow: faqRows[0] || null,
        sampleData: faqRows.slice(0, 3)
      },
      usuarios: usuariosData ? {
        rows: usuariosData.length,
        firstRow: usuariosData[0] || null,
        sampleData: usuariosData.slice(0, 3)
      } : 'Aba não encontrada',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ test-sheets: Erro no teste:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Erro ao testar Google Sheets',
      error: error.message,
      details: {
        code: error.code,
        status: error.status,
        response: error.response?.data
      }
    });
  }
};
