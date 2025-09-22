# 🤖 Sistema Offline do VeloBot

## Visão Geral
O VeloBot agora possui um sistema de fallback automático que permite funcionar mesmo sem conectividade com a internet, garantindo respostas em até 3-5 segundos.

## Arquitetura do Sistema

### 3 Níveis de Fallback Automático

#### 🚀 **NÍVEL 1: IA Avançada (Online)**
- **Condição**: Conectividade verificada e APIs funcionando
- **Timeout**: 5 segundos para OpenAI, 3 segundos para Google Sheets
- **Funcionalidades**: 
  - Busca semântica com embeddings
  - Análise de intenção e urgência
  - Respostas contextuais inteligentes
- **Tempo de resposta**: 2-5 segundos

#### 🔍 **NÍVEL 2: Busca Local (Offline)**
- **Condição**: Falha na IA Avançada ou conectividade limitada
- **Timeout**: 2 segundos máximo
- **Funcionalidades**:
  - Busca por palavras-chave no cache local
  - Dados da planilha FAQ em memória
  - Respostas baseadas em correspondências exatas
- **Tempo de resposta**: 0.5-2 segundos

#### ⚠️ **NÍVEL 3: Resposta Padrão (Último Recurso)**
- **Condição**: Falha total no sistema
- **Funcionalidades**:
  - Resposta padrão com informações de contato
  - Registro da pergunta para análise posterior
- **Tempo de resposta**: Instantâneo

## Componentes Implementados

### 1. **Sistema de Cache Inteligente**
```javascript
let offlineCache = {
  faqData: null,           // Dados da planilha em memória
  lastSync: 0,            // Timestamp da última sincronização
  embeddings: new Map(),   // Cache de embeddings
  isOnline: true,         // Status de conectividade
  connectionFailures: 0   // Contador de falhas
};
```

### 2. **Monitoramento de Conectividade**
- Verificação automática a cada 30 segundos
- Teste rápido de conectividade com OpenAI API
- Histórico de latência para otimização

### 3. **Sincronização Periódica**
- Cache atualizado a cada 5 minutos
- Fallback para cache desatualizado em caso de falha
- Sincronização em background

### 4. **Timeouts Configuráveis**
```javascript
const OPENAI_TIMEOUT_MS = 5000;      // 5 segundos
const SHEETS_TIMEOUT_MS = 3000;      // 3 segundos
const OFFLINE_RESPONSE_TIMEOUT_MS = 2000; // 2 segundos
```

## Fluxo de Funcionamento

1. **Recepção da Pergunta**
   - Verificação de conectividade
   - Decisão automática do nível de processamento

2. **Nível 1 - IA Avançada**
   - Busca híbrida (keywords + semântica)
   - Análise de contexto e intenção
   - Geração de resposta contextual

3. **Nível 2 - Busca Local**
   - Busca por palavras-chave no cache
   - Correspondências baseadas em score
   - Resposta direta ou esclarecimento

4. **Nível 3 - Resposta Padrão**
   - Mensagem de fallback
   - Informações de contato
   - Registro para análise

## Transparência para o Usuário

### Indicadores de Modo
- **Online**: Resposta completa com IA
- **Offline**: Resposta baseada em cache local
- **Fallback**: Resposta padrão com aviso

### Campos de Resposta
```json
{
  "status": "sucesso_offline",
  "resposta": "Resposta do bot",
  "modo": "offline",
  "nivel": 2,
  "source": "Cache Local"
}
```

## Logs e Monitoramento

### Logs de Conectividade
- ✅ Conectividade verificada: ONLINE
- ❌ Conectividade verificada: OFFLINE (X falhas)
- 🔄 Sincronizando cache offline...
- ⚠️ Usando cache offline desatualizado

### Logs de Processamento
- 🚀 NÍVEL 1: Tentando IA Avançada...
- 🔍 NÍVEL 2: Tentando busca local...
- ⚠️ NÍVEL 3: Usando resposta padrão

## Configurações de Performance

### Otimizações Implementadas
- Cache de embeddings (24h)
- Limitação de itens processados (30 max)
- Timeouts reduzidos para respostas rápidas
- Busca híbrida inteligente
- Fallback automático transparente

### Métricas de Latência
- **OpenAI**: Monitoramento de latência
- **Google Sheets**: Monitoramento de latência
- **Cache Local**: Resposta instantânea
- **Fallback**: Resposta instantânea

## Vantagens do Sistema

1. **Disponibilidade**: Funciona mesmo sem internet
2. **Velocidade**: Resposta em até 3-5 segundos
3. **Transparência**: Usuário não percebe a mudança
4. **Inteligência**: Mantém qualidade das respostas
5. **Monitoramento**: Logs detalhados para análise
6. **Escalabilidade**: Cache otimizado para performance

## Manutenção

### Sincronização Automática
- Cache atualizado a cada 5 minutos
- Fallback para dados desatualizados
- Monitoramento de falhas de conectividade

### Limpeza de Cache
- Embeddings: 24 horas
- Dados FAQ: 5 minutos
- Histórico de latência: 10 medições

## Conclusão

O sistema offline do VeloBot garante alta disponibilidade e performance, com fallback automático transparente que mantém a qualidade das respostas mesmo em condições de conectividade limitada.
