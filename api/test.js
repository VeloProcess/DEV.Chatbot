// api/test.js - Arquivo de teste para verificar configurações
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Verificar variáveis de ambiente
    const envCheck = {
      GOOGLE_CREDENTIALS: !!process.env.GOOGLE_CREDENTIALS,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL
    };

    // Testar importação do Google Sheets
    let googleSheetsTest = 'not_tested';
    try {
      const { google } = require('googleapis');
      googleSheetsTest = 'imported_successfully';
    } catch (error) {
      googleSheetsTest = `import_error: ${error.message}`;
    }

    // Testar importação do OpenAI
    let openaiTest = 'not_tested';
    try {
      const OpenAI = require('openai');
      openaiTest = 'imported_successfully';
    } catch (error) {
      openaiTest = `import_error: ${error.message}`;
    }

    return res.status(200).json({
      status: 'success',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      imports: {
        googleSheets: googleSheetsTest,
        openai: openaiTest
      },
      message: 'Teste de configuração realizado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro no teste:', error);
    return res.status(500).json({
      status: 'error',
      error: error.message,
      stack: error.stack
    });
  }
};
