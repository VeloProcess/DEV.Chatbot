// api/simple-test.js - Teste muito simples
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    return res.status(200).json({
      status: 'success',
      message: 'API funcionando',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
};
