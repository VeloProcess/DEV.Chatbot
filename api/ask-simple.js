// api/ask-simple.js - Versão simplificada com busca na planilha real
const { google } = require('googleapis');

// Configuração do Google Sheets
const SPREADSHEET_ID = "1tnWusrOW-UXHFM8GT3o0Du93QDwv5G3Ylvgebof9wfQ";
const FAQ_SHEET_NAME = "FAQ!A:C";

// Cliente Google Sheets
let auth, sheets;

try {
  if (!process.env.GOOGLE_CREDENTIALS) {
    console.warn('⚠️ GOOGLE_CREDENTIALS não configurado no ask-simple');
  } else {
    auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    sheets = google.sheets({ version: 'v4', auth });
  }
} catch (error) {
  console.error('❌ Erro ao configurar Google Sheets no ask-simple:', error.message);
}

// Função para buscar dados da planilha
async function getFaqData() {
  try {
    if (!sheets) {
      throw new Error('Google Sheets não configurado');
    }
    
    console.log('🔍 ask-simple: Buscando dados da planilha...');
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: FAQ_SHEET_NAME,
    });
    
    if (!response.data.values || response.data.values.length === 0) {
      throw new Error("Planilha FAQ vazia ou não encontrada");
    }
    
    console.log('✅ ask-simple: Dados da planilha obtidos com sucesso');
    console.log('📊 ask-simple: Estrutura da planilha:', {
      totalLinhas: response.data.values.length,
      primeiraLinha: response.data.values[0],
      totalColunas: response.data.values[0]?.length || 0
    });
    return response.data.values;
  } catch (error) {
    console.error('❌ ask-simple: Erro ao buscar planilha:', error.message);
    throw error;
  }
}

// Função para normalizar texto
function normalizarTexto(texto) {
  if (!texto || typeof texto !== 'string') return '';
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/gi, '').trim();
}

// Função para buscar correspondências
function findMatches(pergunta, faqData) {
  console.log('🔍 ask-simple: Iniciando busca de correspondências...');
  console.log('📊 ask-simple: Dados recebidos:', {
    totalLinhas: faqData.length,
    cabecalho: faqData[0]
  });

  const cabecalho = faqData[0];
  const dados = faqData.slice(1);
  
  // Usar índices fixos baseados na estrutura da planilha
  const idxPergunta = 0; // Coluna A
  const idxResposta = 1; // Coluna B
  const idxPalavrasChave = 2; // Coluna C

  console.log('🔍 ask-simple: Índices encontrados:', {
    pergunta: idxPergunta,
    palavrasChave: idxPalavrasChave,
    resposta: idxResposta
  });

  console.log('✅ ask-simple: Usando estrutura fixa da planilha FAQ');

  const palavrasDaBusca = normalizarTexto(pergunta).split(' ').filter(p => p.length > 2);
  let todasAsCorrespondencias = [];

  console.log('🔍 ask-simple: Palavras da busca:', palavrasDaBusca);
  console.log('🔍 ask-simple: Total de linhas para buscar:', dados.length);

  for (let i = 0; i < dados.length; i++) {
    const linhaAtual = dados[i];
    const textoPalavrasChave = idxPalavrasChave !== -1 ? 
      normalizarTexto(linhaAtual[idxPalavrasChave] || '') : '';
    const textoPergunta = normalizarTexto(linhaAtual[idxPergunta] || '');
    let relevanceScore = 0;
    
    console.log(`🔍 ask-simple: Linha ${i + 2}:`, {
      pergunta: linhaAtual[idxPergunta],
      palavrasChave: linhaAtual[idxPalavrasChave],
      textoPerguntaNormalizado: textoPergunta,
      textoPalavrasChaveNormalizado: textoPalavrasChave
    });
    
    // Buscar nas palavras-chave se existir
    if (textoPalavrasChave) {
      palavrasDaBusca.forEach(palavra => {
        if (textoPalavrasChave.includes(palavra)) {
          relevanceScore++;
          console.log(`✅ ask-simple: Palavra "${palavra}" encontrada nas palavras-chave`);
        }
      });
    }
    
    // Buscar na pergunta também
    palavrasDaBusca.forEach(palavra => {
      if (textoPergunta.includes(palavra)) {
        relevanceScore++;
        console.log(`✅ ask-simple: Palavra "${palavra}" encontrada na pergunta`);
      }
    });
    
    if (relevanceScore > 0) {
      console.log(`🎯 ask-simple: Correspondência encontrada na linha ${i + 2} com score ${relevanceScore}`);
      todasAsCorrespondencias.push({
        resposta: linhaAtual[idxResposta],
        perguntaOriginal: linhaAtual[idxPergunta],
        sourceRow: i + 2,
        score: relevanceScore,
        tabulacoes: linhaAtual[3] || null
      });
    }
  }

  // Desduplicação e ordenação
  const uniqueMatches = {};
  todasAsCorrespondencias.forEach(match => {
    const key = match.perguntaOriginal.trim();
    if (!uniqueMatches[key] || match.score > uniqueMatches[key].score) {
      uniqueMatches[key] = match;
    }
  });
  
  let correspondenciasUnicas = Object.values(uniqueMatches);
  correspondenciasUnicas.sort((a, b) => b.score - a.score);
  return correspondenciasUnicas;
}

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

    // Buscar dados da planilha
    let faqData;
    try {
      faqData = await getFaqData();
    } catch (error) {
      console.log('⚠️ ask-simple: Erro ao buscar planilha, usando fallback:', error.message);
      
      // Dados de fallback se a planilha falhar
      faqData = [
        ['Pergunta', 'Resposta', 'Palavras-chave', 'Tabulacoes'],
        ['Pix', 'Para informações sobre PIX, entre em contato com nosso suporte.', 'pix, pagamento, transferencia', ''],
        ['Antecipação', 'Para informações sobre antecipação, entre em contato com nosso suporte.', 'antecipacao, adiantamento', ''],
        ['Crédito', 'Para informações sobre crédito, entre em contato com nosso suporte.', 'credito, financiamento', '']
      ];
    }

    // Buscar correspondências na planilha
    const correspondencias = findMatches(pergunta, faqData);
    
    if (correspondencias.length === 0) {
      return res.status(200).json({
        status: "sucesso_offline",
        resposta: "Desculpe, não encontrei informações sobre essa pergunta. Entre em contato com nosso suporte.",
        sourceRow: 'N/A',
        source: 'Planilha',
        modo: 'offline',
        nivel: 2
      });
    }

    // Se encontrou correspondências
    if (correspondencias.length === 1 || correspondencias[0].score > correspondencias[1]?.score) {
      console.log('✅ ask-simple: Resposta única encontrada');
      return res.status(200).json({
        status: "sucesso_offline",
        resposta: correspondencias[0].resposta,
        sourceRow: correspondencias[0].sourceRow,
        tabulacoes: correspondencias[0].tabulacoes,
        source: "Planilha",
        modo: 'offline',
        nivel: 2
      });
    } else {
      console.log('✅ ask-simple: Múltiplas correspondências encontradas');
      return res.status(200).json({
        status: "clarification_needed_offline",
        resposta: `Encontrei vários tópicos sobre "${pergunta}". Qual deles se encaixa melhor na sua dúvida?`,
        options: correspondencias.map(c => c.perguntaOriginal).slice(0, 12),
        source: "Planilha",
        sourceRow: 'Pergunta de Esclarecimento',
        modo: 'offline',
        nivel: 2
      });
    }

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
