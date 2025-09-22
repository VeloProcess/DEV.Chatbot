// api/test-simple.js - Teste simples sem Google Sheets
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { pergunta } = req.query;
    
    // Dados mockados para teste
    const mockData = [
      ['Pergunta', 'Resposta', 'Palavras-chave', 'Tabulacoes'],
      ['Como funciona o PIX?', 'O PIX é um sistema de pagamento instantâneo do Banco Central que permite transferências 24/7.', 'pix, pagamento, transferencia', 'Financeiro'],
      ['O que é antecipação?', 'Antecipação é quando você recebe o valor do seu salário antes da data de vencimento.', 'antecipacao, salario, adiantamento', 'Financeiro'],
      ['Como funciona o crédito?', 'O crédito é uma modalidade de empréstimo com juros e prazo definidos.', 'credito, emprestimo, financiamento', 'Financeiro'],
      ['O que é o Veloprime?', 'Veloprime é nosso sistema de gestão empresarial completo.', 'veloprime, sistema, gestao', 'Sistema']
    ];

    // Busca simples
    const perguntaLower = (pergunta || '').toLowerCase();
    let resposta = null;
    
    for (let i = 1; i < mockData.length; i++) {
      const linha = mockData[i];
      const perguntaOriginal = linha[0] || '';
      const palavrasChave = linha[2] || '';
      
      if (perguntaOriginal.toLowerCase().includes(perguntaLower) || 
          palavrasChave.toLowerCase().includes(perguntaLower)) {
        resposta = {
          status: "sucesso",
          resposta: linha[1],
          sourceRow: i + 1,
          tabulacoes: linha[3] || null,
          source: "Teste Mock"
        };
        break;
      }
    }

    if (!resposta) {
      resposta = {
        status: "sucesso_offline",
        resposta: "Desculpe, não encontrei informações sobre essa pergunta na nossa base de dados. Entre em contato com nosso suporte.",
        sourceRow: 'N/A',
        source: 'Teste Mock',
        modo: 'offline',
        nivel: 2
      };
    }

    return res.status(200).json(resposta);

  } catch (error) {
    console.error("ERRO NO test-simple:", error);
    return res.status(500).json({ 
      error: "Erro interno no servidor.", 
      details: error.message 
    });
  }
};
