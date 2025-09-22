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

    // Retornar sucesso sem testar Google Sheets para evitar timeout
    console.log('✅ simple-test: Retornando sucesso sem testar Google Sheets');
    
    return res.status(200).json({
      status: 'success',
      message: 'API funcionando',
      timestamp: new Date().toISOString(),
      googleSheets: 'Skipped to avoid timeout'
    });
    
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
};
