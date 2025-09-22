// api/simple-test.js - Teste com Google Sheets
const { google } = require('googleapis');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    console.log('🔍 simple-test: Testando conectividade...');
    
    // Verificar credenciais
    const hasCredentials = !!process.env.GOOGLE_CREDENTIALS;
    console.log('🔍 simple-test: GOOGLE_CREDENTIALS existe:', hasCredentials);
    
    if (!hasCredentials) {
      return res.status(200).json({
        status: 'success',
        message: 'API funcionando',
        timestamp: new Date().toISOString(),
        googleSheets: 'Not configured'
      });
    }

    // Testar Google Sheets
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
      const sheets = google.sheets({ version: 'v4', auth });
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: "1tnWusrOW-UXHFM8GT3o0Du93QDwv5G3Ylvgebof9wfQ",
        range: "FAQ!A:C",
      });
      
      console.log('✅ simple-test: Google Sheets funcionando');
      
      return res.status(200).json({
        status: 'success',
        message: 'API funcionando',
        timestamp: new Date().toISOString(),
        googleSheets: 'Working',
        spreadsheetRows: response.data.values?.length || 0,
        firstRow: response.data.values?.[0] || []
      });
      
    } catch (error) {
      console.error('❌ simple-test: Erro Google Sheets:', error.message);
      return res.status(200).json({
        status: 'success',
        message: 'API funcionando',
        timestamp: new Date().toISOString(),
        googleSheets: 'Error: ' + error.message
      });
    }
    
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
};
