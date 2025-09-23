// api/getNews.js - Buscar notícias do arquivo JSON
const fs = require('fs');
const path = require('path');

// Cache global para as notícias
global.newsCache = global.newsCache || {
  data: null,
  timestamp: 0,
  ttl: 300000 // 5 minutos
};

// Função para carregar dados de notícias do arquivo JSON
function loadNewsData() {
  // Verificar cache primeiro
  const now = Date.now();
  if (global.newsCache.data && (now - global.newsCache.timestamp) < global.newsCache.ttl) {
    console.log('✅ getNews: Usando cache global');
    return global.newsCache.data;
  }

  try {
    const newsPath = path.join(__dirname, '../Noticias.json');
    console.log('🔍 getNews: Carregando dados de notícias de:', newsPath);
    
    const fileContent = fs.readFileSync(newsPath, 'utf8');
    const newsData = JSON.parse(fileContent);
    
    // Atualizar cache
    global.newsCache.data = newsData;
    global.newsCache.timestamp = now;
    
    console.log('✅ getNews: Dados de notícias carregados:', newsData.length, 'notícias');
    return newsData;
    
  } catch (error) {
    console.error('❌ getNews: Erro ao carregar dados de notícias:', error);
    return [];
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🔍 getNews: Buscando notícias...');
    
    const newsData = loadNewsData();
    
    if (!newsData || newsData.length === 0) {
      return res.status(200).json({
        success: true,
        news: [],
        message: 'Nenhuma notícia encontrada'
      });
    }

    // Ordenar por data (mais recente primeiro)
    const sortedNews = newsData.sort((a, b) => {
      const dateA = new Date(a.publicadoEm.split('/').reverse().join('-'));
      const dateB = new Date(b.publicadoEm.split('/').reverse().join('-'));
      return dateB - dateA;
    });

    console.log('✅ getNews: Retornando', sortedNews.length, 'notícias');
    
    return res.status(200).json({
      success: true,
      news: sortedNews,
      count: sortedNews.length,
      source: 'JSON Local'
    });

  } catch (error) {
    console.error('❌ getNews: Erro no processamento:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message 
    });
  }
};