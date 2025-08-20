document.addEventListener('DOMContentLoaded', () => {
    // ================== CONFIGURAÇÕES GLOBAIS ==================
    const DOMINIO_PERMITIDO = "@velotax.com.br";
    const CLIENT_ID = '827325386401-ahi2f9ume9i7lc28lau7j4qlviv5d22k.apps.googleusercontent.com';

    // ================== ELEMENTOS DO DOM ==================
    const identificacaoOverlay = document.getElementById('identificacao-overlay');
    const appWrapper = document.querySelector('.app-wrapper');
    const errorMsg = document.getElementById('identificacao-error');

    // ================== VARIÁVEIS DE ESTADO ==================
    let ultimaPergunta = '';
    let ultimaResposta = '';
    let ultimaLinhaDaFonte = null;
    let isTyping = false;
    let dadosAtendente = null;
    let tokenClient = null;

    // ================== LÓGICA DE AUTENTICAÇÃO ==================
    function waitForGoogleScript() {
        return new Promise((resolve, reject) => {
            const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
            if (!script) return reject(new Error('Script Google não encontrado.'));
            if (window.google && window.google.accounts) return resolve(window.google.accounts);
            script.onload = () => resolve(window.google.accounts);
            script.onerror = () => reject(new Error('Erro ao carregar script Google.'));
        });
    }

    function initGoogleSignIn() {
        waitForGoogleScript().then(accounts => {
            tokenClient = accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: 'profile email',
                callback: handleGoogleSignIn
            });
            document.getElementById('google-signin-button').addEventListener('click', () => tokenClient.requestAccessToken());
            verificarIdentificacao();
        }).catch(error => {
            errorMsg.textContent = 'Erro ao carregar autenticação do Google.';
            errorMsg.classList.remove('hidden');
        });
    }

    function handleGoogleSignIn(response) {
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${response.access_token}` }
        })
        .then(res => res.json())
        .then(user => {
            if (user.email && user.email.endsWith(DOMINIO_PERMITIDO)) {
                dadosAtendente = { nome: user.name, email: user.email, timestamp: Date.now() };
                localStorage.setItem('dadosAtendenteChatbot', JSON.stringify(dadosAtendente));
                identificacaoOverlay.classList.add('hidden');
                appWrapper.classList.remove('hidden');
                iniciarBot();
            } else {
                errorMsg.textContent = 'Acesso permitido apenas para e-mails @velotax.com.br!';
                errorMsg.classList.remove('hidden');
            }
        });
    }

    function verificarIdentificacao() {
        const umDiaEmMs = 24 * 60 * 60 * 1000;
        let dadosSalvos = null;
        try {
            const dadosSalvosString = localStorage.getItem('dadosAtendenteChatbot');
            if (dadosSalvosString) dadosSalvos = JSON.parse(dadosSalvosString);
        } catch (e) {
            localStorage.removeItem('dadosAtendenteChatbot');
        }
        if (dadosSalvos && dadosSalvos.email && (Date.now() - dadosSalvos.timestamp < umDiaEmMs)) {
            dadosAtendente = dadosSalvos;
            identificacaoOverlay.classList.add('hidden');
            appWrapper.classList.remove('hidden');
            iniciarBot();
        } else {
            localStorage.removeItem('dadosAtendenteChatbot');
            identificacaoOverlay.classList.remove('hidden');
            appWrapper.classList.add('hidden');
        }
    }

    // ================== FUNÇÃO PRINCIPAL DO BOT ==================
    function iniciarBot() {
        const chatBox = document.getElementById('chat-box');
        const userInput = document.getElementById('user-input');
        const sendButton = document.getElementById('send-button');
        const themeSwitcher = document.getElementById('theme-switcher');
        const body = document.body;
        const questionSearch = document.getElementById('question-search');

        document.getElementById('gemini-button').addEventListener('click', () => window.open('https://gemini.google.com/app?hl=pt-BR', '_blank'));

        questionSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const questions = document.querySelectorAll('#quick-questions-list li, #more-questions-list-financeiro li, #more-questions-list-tecnico li');
            questions.forEach(question => {
                const text = question.textContent.toLowerCase();
                question.classList.toggle('hidden', !text.includes(searchTerm));
            });
        });

        function showTypingIndicator() {
            if (isTyping) return;
            isTyping = true;
            const typingContainer = document.createElement('div');
            typingContainer.className = 'message-container bot typing-indicator';
            typingContainer.id = 'typing-indicator';
            typingContainer.innerHTML = `<div class="avatar bot">🤖</div><div class="message-content"><div class="message"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
            chatBox.appendChild(typingContainer);
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        function hideTypingIndicator() {
            isTyping = false;
            const typingIndicator = document.getElementById('typing-indicator');
            if (typingIndicator) typingIndicator.remove();
        }

        function formatarLinks(texto) {
            if (!texto || typeof texto !== 'string') return '';
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            return texto.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>');
        }

        function formatarAssinatura(nomeCompleto) {
            if (!nomeCompleto || typeof nomeCompleto !== 'string' || nomeCompleto.trim() === '') return '';
            const nomes = nomeCompleto.trim().split(' ');
            const primeiroNome = nomes[0];
            let assinaturaFormatada = primeiroNome;
            if (nomes.length > 1 && nomes[1]) {
                const inicialDoSegundoNome = nomes[1].charAt(0).toUpperCase();
                assinaturaFormatada += ` ${inicialDoSegundoNome}.`;
            }
            return assinaturaFormatada;
        }

        // --- FUNÇÃO addMessage (VERSÃO LIMPA E CORRIGIDA) ---
        function addMessage(message, sender, options = {}) {
            const { sourceRow = null, options: clarificationOptions = [] } = options;

            let mensagemFinal = message;
            if (sender === 'bot' && dadosAtendente && typeof mensagemFinal === 'string' && mensagemFinal.includes('{{ASSINATURA_ATENDENTE}}')) {
                const assinatura = formatarAssinatura(dadosAtendente.nome);
                mensagemFinal = mensagemFinal.replace(/{{ASSINATURA_ATENDENTE}}/g, assinatura);
            }

            const messageContainer = document.createElement('div');
            messageContainer.classList.add('message-container', sender);
            const avatarDiv = `<div class="avatar ${sender === 'user' ? 'user' : 'bot'}">${sender === 'user' ? '👤' : '🤖'}</div>`;
            const messageContentDiv = document.createElement('div');
            messageContentDiv.className = 'message-content';
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message';
            
            const mensagemComLinks = formatarLinks(mensagemFinal);
            messageDiv.innerHTML = mensagemComLinks.replace(/\n/g, '<br>');
            messageContentDiv.appendChild(messageDiv);

            // Adiciona os botões de FEEDBACK (👍/👎) se for uma resposta final
            if (sender === 'bot' && sourceRow) {
                ultimaResposta = messageContainer.querySelector('.message').textContent;
                ultimaLinhaDaFonte = sourceRow;
                const feedbackContainer = document.createElement('div');
                feedbackContainer.className = 'feedback-container';
                const positiveBtn = document.createElement('button');
                positiveBtn.className = 'feedback-btn';
                positiveBtn.innerHTML = '👍';
                positiveBtn.title = 'Resposta útil';
                positiveBtn.onclick = () => enviarFeedback('logFeedbackPositivo', feedbackContainer);
                const negativeBtn = document.createElement('button');
                negativeBtn.className = 'feedback-btn';
                negativeBtn.innerHTML = '👎';
                negativeBtn.title = 'Resposta incorreta ou incompleta';
                negativeBtn.onclick = () => abrirModalFeedback(feedbackContainer);
                feedbackContainer.appendChild(positiveBtn);
                feedbackContainer.appendChild(negativeBtn);
                messageContentDiv.appendChild(feedbackContainer);
            }

            // Adiciona os botões de ESCLARECIMENTO se o backend os enviou
            if (sender === 'bot' && clarificationOptions.length > 0) {
                const optionsContainer = document.createElement('div');
                optionsContainer.className = 'clarification-container';
                clarificationOptions.forEach(optionText => {
                    const button = document.createElement('button');
                    button.className = 'clarification-item';
                    button.textContent = optionText;
                    button.onclick = () => handleSendMessage(optionText);
                    optionsContainer.appendChild(button);
                });
                messageContentDiv.appendChild(optionsContainer);
            }

            messageContainer.innerHTML = avatarDiv;
            messageContainer.appendChild(messageContentDiv);
            chatBox.appendChild(messageContainer);
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        async function enviarFeedback(action, container, sugestao = null) {
            if (!ultimaPergunta || !ultimaLinhaDaFonte) {
                console.error("FALHA: Feedback não enviado.");
                return;
            }
            container.textContent = 'Obrigado pelo feedback!';
            container.className = 'feedback-thanks';
            try {
                await fetch('/api/feedback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: action,
                        question: ultimaPergunta,
                        sourceRow: ultimaLinhaDaFonte,
                        email: dadosAtendente.email,
                        sugestao: sugestao
                    })
                });
            } catch (error) {
                console.error("ERRO DE REDE ao enviar feedback:", error);
            }
        }

        async function buscarResposta(textoDaPergunta) {
            ultimaPergunta = textoDaPergunta;
            ultimaLinhaDaFonte = null;
            if (!textoDaPergunta.trim()) return;
            showTypingIndicator();
            try {
                const url = `/api/ask?pergunta=${encodeURIComponent(textoDaPergunta)}`;
                const response = await fetch(url);
                hideTypingIndicator();
                if (!response.ok) throw new Error(`Erro de rede ou API: ${response.status}`);
                const data = await response.json();
                
                if (data.status === 'sucesso') {
                    addMessage(data.resposta, 'bot', { sourceRow: data.sourceRow });
                } else if (data.status === 'clarification_needed') {
                    addMessage(data.resposta, 'bot', { options: data.options });
                } else {
                    addMessage(data.resposta, 'bot');
                }
            } catch (error) {
                hideTypingIndicator();
                addMessage("Erro de conexão com o backend. Aguarde um instante que estamos verificando o ocorrido", 'bot');
                console.error("Detalhes do erro:", error);
            }
        }

        async function logQuestionOnSheet(question, email) {
            if (!question || !email) return;
            try {
                await fetch('/api/logQuestion', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'question',
                        payload: {
                            question: question,
                            email: email
                        }
                    })
                });
            } catch (error) {
                console.error("Erro ao registrar a pergunta na planilha:", error);
            }
        }

        function handleSendMessage(text) {
            const trimmedText = text.trim();
            if (!trimmedText) return;
            addMessage(trimmedText, 'user');
            logQuestionOnSheet(trimmedText, dadosAtendente.email);
            buscarResposta(trimmedText);
            userInput.value = '';
        }

        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSendMessage(userInput.value);
            }
        });
        sendButton.addEventListener('click', () => handleSendMessage(userInput.value));

        document.querySelectorAll('#quick-questions-list li, #more-questions-list-financeiro li, #more-questions-list-tecnico li').forEach(item => {
            item.addEventListener('click', (e) => handleSendMessage(e.currentTarget.getAttribute('data-question')));
        });

        const expandableFaqHeader = document.getElementById('expandable-faq-header');
        if(expandableFaqHeader) {
            expandableFaqHeader.addEventListener('click', (e) => {
                e.currentTarget.classList.toggle('expanded');
                document.getElementById('more-questions').classList.toggle('hidden');
            });
        }

        themeSwitcher.addEventListener('click', () => {
            body.classList.toggle('dark-theme');
            const isDark = body.classList.contains('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            themeSwitcher.innerHTML = isDark ? '🌙' : '☀️';
        });

        const feedbackOverlay = document.getElementById('feedback-overlay');
        const feedbackSendBtn = document.getElementById('feedback-send');
        const feedbackCancelBtn = document.getElementById('feedback-cancel');
        const feedbackText = document.getElementById('feedback-comment'); 
        let activeFeedbackContainer = null;

        function abrirModalFeedback(container) {
            activeFeedbackContainer = container;
            feedbackOverlay.classList.remove('hidden');
            if(feedbackText) feedbackText.focus();
        }

        function fecharModalFeedback() {
            feedbackOverlay.classList.add('hidden');
            if(feedbackText) feedbackText.value = '';
            activeFeedbackContainer = null;
        }

        if(feedbackCancelBtn) feedbackCancelBtn.addEventListener('click', fecharModalFeedback);

        if(feedbackSendBtn) feedbackSendBtn.addEventListener('click', () => {
            const sugestao = feedbackText ? feedbackText.value.trim() : '';
            if (activeFeedbackContainer) {
                enviarFeedback('logFeedbackNegativo', activeFeedbackContainer, sugestao || null);
                fecharModalFeedback();
            } else {
                console.error("FALHA: Nenhum 'activeFeedbackContainer' encontrado.");
            }
        });

        function setInitialTheme() {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme === 'dark') {
                body.classList.add('dark-theme');
                themeSwitcher.innerHTML = '🌙';
            } else {
                body.classList.remove('dark-theme');
                themeSwitcher.innerHTML = '☀️';
            }
        }

        const primeiroNome = dadosAtendente.nome.split(' ')[0];
        addMessage(`Olá, ${primeiroNome}! Como posso te ajudar hoje?`, 'bot');
        setInitialTheme();
    }

    initGoogleSignIn();
});
