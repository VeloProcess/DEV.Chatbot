// api/test-sheets-access.js - Teste específico de acesso ao Google Sheets
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
    console.log('🔍 test-sheets-access: Iniciando teste...');
    
    if (!sheets) {
      return res.status(500).json({
        status: 'error',
        message: 'Google Sheets não configurado',
        error: 'GOOGLE_CREDENTIALS não disponível'
      });
    }

    // Teste 1: Informações básicas da planilha
    console.log('🔍 test-sheets-access: Testando acesso básico...');
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });
    
    console.log('✅ test-sheets-access: Planilha acessada:', spreadsheetInfo.data.properties.title);
    
    // Teste 2: Buscar dados da aba FAQ
    console.log('🔍 test-sheets-access: Testando aba FAQ...');
    const faqData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'FAQ!A:D',
    });
    
    const faqRows = faqData.data.values || [];
    console.log('📊 test-sheets-access: Dados FAQ obtidos:', faqRows.length, 'linhas');
    
    // Teste 3: Verificar estrutura dos dados
    if (faqRows.length > 0) {
      const header = faqRows[0];
      console.log('📋 test-sheets-access: Cabeçalho:', header);
      
      // Verificar se as colunas esperadas existem
      const hasPergunta = header.includes('Pergunta');
      const hasResposta = header.includes('Resposta');
      const hasPalavrasChave = header.includes('Palavras-chave');
      
      console.log('🔍 test-sheets-access: Estrutura:', {
        hasPergunta,
        hasResposta,
        hasPalavrasChave,
        header
      });
    }
    
    return res.status(200).json({
      status: 'success',
      message: 'Acesso ao Google Sheets funcionando',
      spreadsheet: {
        title: spreadsheetInfo.data.properties.title,
        id: SPREADSHEET_ID
      },
      faq: {
        rows: faqRows.length,
        firstRow: faqRows[0] || null,
        sampleData: faqRows.slice(0, 3)
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ test-sheets-access: Erro no teste:', error);
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
