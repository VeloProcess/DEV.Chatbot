// api/ask-simple.js - Versão simplificada para debug
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🔍 ask-simple: Iniciando...');
    
    const { pergunta, email, usar_ia_avancada = 'true' } = req.query;
    
    if (!pergunta) {
      return res.status(400).json({ error: "Nenhuma pergunta fornecida." });
    }

    console.log('🔍 ask-simple: Pergunta recebida:', { pergunta, email, usar_ia_avancada });

    // Dados de fallback simples
    const fallbackData = [
      ['Pergunta', 'Resposta', 'Palavras-chave', 'Tabulacoes'],
      ['Pix', 'Para informações sobre PIX, entre em contato com nosso suporte.', 'pix, pagamento, transferencia', ''],
      ['Antecipação', 'Para informações sobre antecipação, entre em contato com nosso suporte.', 'antecipacao, adiantamento', ''],
      ['Crédito', 'Para informações sobre crédito, entre em contato com nosso suporte.', 'credito, financiamento', '']
    ];

    // Busca simples por palavras-chave
    const perguntaLower = pergunta.toLowerCase();
    let resposta = "Desculpe, não encontrei informações sobre essa pergunta. Entre em contato com nosso suporte.";
    let sourceRow = 'N/A';
    let source = 'Fallback';

    for (let i = 1; i < fallbackData.length; i++) {
      const linha = fallbackData[i];
      const palavrasChave = linha[2].toLowerCase();
      
      if (palavrasChave.includes(perguntaLower) || perguntaLower.includes(linha[0].toLowerCase())) {
        resposta = linha[1];
        sourceRow = i + 1;
        source = 'Fallback';
        break;
      }
    }

    console.log('🔍 ask-simple: Resposta encontrada:', { resposta, sourceRow, source });

    return res.status(200).json({
      status: "sucesso_offline",
      resposta: resposta,
      sourceRow: sourceRow,
      source: source,
      modo: 'offline',
      nivel: 2
    });

  } catch (error) {
    console.error('❌ ask-simple: Erro:', error);
    return res.status(500).json({
      status: "erro_critico",
      resposta: "Desculpe, ocorreu um erro interno. Tente novamente em alguns instantes.",
      source: "Sistema",
      error: error.message
    });
  }
};
