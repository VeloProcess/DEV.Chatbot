// api/ask-debug.js - Versão de debug sem Google Sheets
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { pergunta, email, usar_ia_avancada = 'true' } = req.query;
    if (!pergunta) return res.status(400).json({ error: "Nenhuma pergunta fornecida." });

    console.log('🔍 ask-debug: Pergunta recebida:', { pergunta, email, usar_ia_avancada });

    // Simular dados da planilha para teste
    const mockFaqData = [
      ['Pergunta', 'Resposta', 'Palavras-chave', 'Tabulacoes'],
      ['Como funciona o PIX?', 'O PIX é um sistema de pagamento instantâneo do Banco Central que permite transferências 24/7.', 'pix, pagamento, transferencia', 'Financeiro'],
      ['O que é antecipação?', 'Antecipação é quando você recebe o valor do seu salário antes da data de vencimento.', 'antecipacao, salario, adiantamento', 'Financeiro'],
      ['Como funciona o crédito?', 'O crédito é uma modalidade de empréstimo com juros e prazo definidos.', 'credito, emprestimo, financiamento', 'Financeiro'],
      ['O que é o Veloprime?', 'Veloprime é nosso sistema de gestão empresarial completo.', 'veloprime, sistema, gestao', 'Sistema'],
      ['Como atualizar situação no app?', 'No app, vá em Configurações > Atualizar Dados > Situação.', 'app, atualizar, situacao', 'Tecnico']
    ];

    // Função de busca simples
    function findMatches(pergunta, faqData) {
      const dados = faqData.slice(1);
      const perguntaLower = pergunta.toLowerCase();
      
      for (let i = 0; i < dados.length; i++) {
        const linha = dados[i];
        const perguntaOriginal = linha[0] || '';
        const palavrasChave = linha[2] || '';
        
        if (perguntaOriginal.toLowerCase().includes(perguntaLower) || 
            palavrasChave.toLowerCase().includes(perguntaLower)) {
          return [{
            resposta: linha[1],
            perguntaOriginal: perguntaOriginal,
            sourceRow: i + 2,
            tabulacoes: linha[3] || null
          }];
        }
      }
      return [];
    }

    const correspondencias = findMatches(pergunta, mockFaqData);

    if (correspondencias.length === 0) {
      return res.status(200).json({
        status: "sucesso_offline",
        resposta: "Desculpe, não encontrei informações sobre essa pergunta na nossa base de dados. Entre em contato com nosso suporte.",
        sourceRow: 'N/A',
        source: 'Debug Mock',
        modo: 'offline',
        nivel: 2
      });
    }

    return res.status(200).json({
      status: "sucesso",
      resposta: correspondencias[0].resposta,
      sourceRow: correspondencias[0].sourceRow,
      tabulacoes: correspondencias[0].tabulacoes,
      source: "Debug Mock"
    });

  } catch (error) {
    console.error("ERRO NO ask-debug:", error);
    return res.status(500).json({ 
      error: "Erro interno no servidor.", 
      details: error.message 
    });
  }
};
