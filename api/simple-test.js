// api/simple-test.js - Teste com Google Sheets
const { google } = require('googleapis');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    console.log('🔍 simple-test: Testando conectividade...');
    
    // Verificar todas as variáveis de ambiente
    const envVars = {
      GOOGLE_CREDENTIALS: process.env.GOOGLE_CREDENTIALS ? 'Configured' : 'Not configured',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured',
      NODE_ENV: process.env.NODE_ENV || 'Not set',
      VERCEL: process.env.VERCEL || 'Not set'
    };

    console.log('🔍 simple-test: Variáveis de ambiente:', envVars);

    // Verificar se GOOGLE_CREDENTIALS está configurado
    const hasCredentials = !!process.env.GOOGLE_CREDENTIALS;
    console.log('🔍 simple-test: GOOGLE_CREDENTIALS existe:', hasCredentials);

    if (!hasCredentials) {
      return res.status(200).json({
        status: 'success',
        message: 'API funcionando',
        timestamp: new Date().toISOString(),
        environment: envVars,
        googleSheets: 'Not configured'
      });
    }

    // Verificar formato das credenciais
    let credentialsValid = false;
    let credentialsError = null;
    
    try {
      const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
      credentialsValid = !!(credentials.type && credentials.project_id && credentials.private_key);
      console.log('✅ simple-test: Credenciais válidas:', credentialsValid);
    } catch (error) {
      credentialsError = error.message;
      console.error('❌ simple-test: Erro ao parsear credenciais:', error.message);
    }

    return res.status(200).json({
      status: 'success',
      message: 'API funcionando',
      timestamp: new Date().toISOString(),
      environment: envVars,
      googleSheets: credentialsValid ? 'Valid credentials' : 'Invalid credentials',
      credentialsError: credentialsError
    });
    
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
};
