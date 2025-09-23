// server-local.js - Servidor local para testar APIs
require('dotenv').config();

// Configurar variáveis de ambiente para teste
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test-key';
process.env.GOOGLE_CREDENTIALS = process.env.GOOGLE_CREDENTIALS || JSON.stringify({
  "type": "service_account",
  "project_id": "test",
  "private_key_id": "test",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB\nwIuHhF0L8uQ5XpFGxclR1ai9i+tsTfTsI1thI+3Fj0W3zMYmR2Nx4UdE\n-----END PRIVATE KEY-----\n",
  "client_email": "test@test.iam.gserviceaccount.com",
  "client_id": "test",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/test%40test.iam.gserviceaccount.com"
});

const express = require('express');
const path = require('path');
const askHandler = require('./api/ask');
const askSimpleHandler = require('./api/ask-simple');
const askMongoHandler = require('./api/ask-mongodb');
const adminHandler = require('./api/admin');
const logQuestionHandler = require('./api/logQuestion');
const getNewsHandler = require('./api/getNews');
const getProductStatusHandler = require('./api/getProductStatus');
const voiceHandler = require('./api/voice');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Rotas da API
app.get('/api/ask', (req, res) => {
  console.log('🔍 Local: /api/ask chamado');
  askHandler(req, res);
});

app.get('/api/ask-simple', (req, res) => {
  console.log('🔍 Local: /api/ask-simple chamado');
  askSimpleHandler(req, res);
});

app.get('/api/ask-mongodb', (req, res) => {
  console.log('🔍 Local: /api/ask-mongodb chamado');
  askMongoHandler(req, res);
});

app.get('/api/admin', (req, res) => {
  console.log('🔍 Local: /api/admin chamado');
  adminHandler(req, res);
});

app.post('/api/logQuestion', (req, res) => {
  console.log('🔍 Local: /api/logQuestion chamado');
  logQuestionHandler(req, res);
});

app.get('/api/getNews', (req, res) => {
  console.log('🔍 Local: /api/getNews chamado');
  getNewsHandler(req, res);
});

app.get('/api/getProductStatus', (req, res) => {
  console.log('🔍 Local: /api/getProductStatus chamado');
  getProductStatusHandler(req, res);
});

app.get('/api/voice', (req, res) => {
  console.log('🔍 Local: /api/voice chamado');
  voiceHandler(req, res);
});

app.post('/api/voice', (req, res) => {
  console.log('🔍 Local: /api/voice (POST) chamado');
  voiceHandler(req, res);
});

app.get('/api/simple-test', (req, res) => {
  console.log('🔍 Local: /api/simple-test chamado');
  res.json({ status: 'success', message: 'API funcionando localmente' });
});

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor local rodando em http://localhost:${PORT}`);
  console.log(`📊 Teste as APIs:`);
  console.log(`   - http://localhost:${PORT}/api/ask-simple?pergunta=Pix&email=teste@teste.com`);
  console.log(`   - http://localhost:${PORT}/api/ask-mongodb?pergunta=Pix&email=teste@teste.com`);
  console.log(`   - http://localhost:${PORT}/api/admin?action=getUserProfile&email=gabriel.araujo@velotax.com.br`);
  console.log(`   - http://localhost:${PORT}/api/ask?pergunta=Pix&email=teste@teste.com`);
});
