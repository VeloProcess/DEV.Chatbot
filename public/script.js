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
    let ultimaLinhaDaFonte = null;
    let isTyping = false;
    let dadosAtendente = null;
    let tokenClient = null;

    // ================== FUNÇÕES DE CONTROLE DE UI ==================
    function showOverlay() {
        identificacaoOverlay.classList.remove('hidden');
        appWrapper.classList.add('hidden');
    }

    function hideOverlay() {
        identificacaoOverlay.classList.add('hidden');
        appWrapper.classList.remove('hidden');
    }

    // ================== LÓGICA DE AUTENTICAÇÃO ==================
    function waitForGoogleScript() {
        return new Promise((resolve, reject) => {
            const script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
            if (!script) {
                reject(new Error('Script Google Identity Services não encontrado no HTML.'));
                return;
            }
            if (window.google && window.google.accounts) {
                resolve(window.google.accounts);
                return;
            }
            script.addEventListener('load', () => {
                if (window.google && window.google.accounts) {
                    resolve(window.google.accounts);
                } else {
                    reject(new Error('Falha ao carregar Google Identity Services.'));
                }
            });
            script.addEventListener('error', () => {
                reject(new Error('Erro ao carregar o script Google Identity Services.'));
            });
        });
    }

    function initGoogleSignIn() {
        waitForGoogleScript().then(accounts => {
            tokenClient = accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: 'profile email',
                callback: handleGoogleSignIn
            });
            document.getElementById('google-signin-button').addEventListener('click', function() {
                tokenClient.requestAccessToken();
            });
            verificarIdentificacao();
        }).catch(error => {
            errorMsg.textContent = 'Erro ao carregar autenticação do Google. Verifique sua conexão ou tente novamente mais tarde.';
            errorMsg.classList.remove('hidden');
        });
    }

    function handleGoogleSignIn(response) {
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                Authorization: `Bearer ${response.access_token}`
            }
        })
        .then(res => res.json())
        .then(user => {
            const email = user.email;
            if (email && email.endsWith(DOMINIO_PERMITIDO)) {
                dadosAtendente = { nome: user.name, email: user.email, timestamp: Date.now() };
                localStorage.setItem('dadosAtendenteChatbot', JSON.stringify(dadosAtendente));
                hideOverlay();
                iniciarBot(); // Passar dadosAtendente não é mais necessário aqui, pois é uma variável global
            } else {
                errorMsg.textContent = 'Acesso permitido apenas para e-mails @velotax.com.br!';
                errorMsg.classList.remove('hidden');
            }
        })
        .catch(error => {
            errorMsg.textContent = 'Erro ao verificar login. Tente novamente.';
            errorMsg.classList.remove('hidden');
        });
    }

    function verificarIdentificacao() {
        const umDiaEmMs = 24 * 60 * 60 * 1000;
        let dadosSalvos = null;
        try {
            const dadosSalvosString = localStorage.getItem('dadosAtendenteChatbot');
            if (dadosSalvosString) {
                dadosSalvos = JSON.parse(dadosSalvosString);
            }
        } catch (e) {
            localStorage.removeItem('dadosAtendenteChatbot');
        }
        if (dadosSalvos && dadosSalvos.email && dadosSalvos.email.endsWith(DOMINIO_PERMITIDO) && (Date.now() - dadosSalvos.timestamp < umDiaEmMs)) {
            dadosAtendente = dadosSalvos; // Garante que dadosAtendente seja preenchido
            hideOverlay();
            iniciarBot();
        } else {
            localStorage.removeItem('dadosAtendenteChatbot');
            showOverlay();
        }
    }

    // ================== FUNÇÃO PRINCIPAL DO BOT ==================
    function iniciarBot() {
        // Elementos do DOM do bot
        const chatBox = document.getElementById('chat-box');
        const userInput = document.getElementById('user-input');
        const sendButton = document.getElementById('send-button');
        const themeSwitcher = document.getElementById('theme-switcher');
        const body = document.body;
        const questionSearch = document.getElementById('question-search');

        document.getElementById('gemini-button').addEventListener('click', function() {
            window.open('https://gemini.google.com/app?hl=pt-BR', '_blank');
        });

        // Filtro de busca de perguntas
        questionSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const questions = document.querySelectorAll('#quick-questions-list li, #more-questions-list-financeiro li, #more-questions-list-tecnico li');
            questions.forEach(question => {
                const text = question.textContent.toLowerCase();
                question.classList.toggle('hidden', !text.includes(searchTerm));
            });
        });

        // Indicador de digitação
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

        // Adicionar mensagem ao chat (com lógica de feedback atualizada)
        function addMessage(message, sender, options = {}) {
            const { sourceRow = null } = options;
            const messageContainer = document.createElement('div');
            messageContainer.classList.add('message-container', sender);

            const avatarDiv = `<div class="avatar">${sender === 'user' ? '👤' : '🤖'}</div>`;
            const messageContentDiv = `<div class="message-content"><div class="message">${message.replace(/\n/g, '<br>')}</div></div>`;

            messageContainer.innerHTML = sender === 'user' ? messageContentDiv + avatarDiv : avatarDiv + messageContentDiv;
            chatBox.appendChild(messageContainer);

            if (sender === 'bot' && sourceRow) {
                const messageBox = messageContainer.querySelector('.message-content');
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
                messageBox.appendChild(feedbackContainer);
            }
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        // Enviar feedback (com suporte a sugestão e LOGS DE DEBUG)
        async function enviarFeedback(action, container, sugestao = null) {
            console.log("--- DEBUG FEEDBACK ---");
            console.log("1. Tentando enviar feedback. Ação:", action);
            console.log("2. Valor ATUAL de 'ultimaPergunta':", `"${ultimaPergunta}"`);
            console.log("3. Valor ATUAL de 'ultimaLinhaDaFonte':", ultimaLinhaDaFonte);

            if (!ultimaPergunta || !ultimaLinhaDaFonte) {
                console.error("4. FALHA: Feedback não enviado. 'ultimaPergunta' ou 'ultimaLinhaDaFonte' está vazio ou nulo. Verifique a resposta da API na aba 'Network'.");
                return;
            }

            container.textContent = 'Obrigado pelo feedback!';
            container.className = 'feedback-thanks';

            try {
                console.log("4. SUCESSO: Variáveis validadas. Enviando para /api/feedback...");
                const response = await fetch('/api/feedback', {
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
                if (!response.ok) {
                    console.error("5. ERRO NO BACKEND: A API /api/feedback respondeu com um erro.", response.status, response.statusText);
                } else {
                    console.log("5. SUCESSO: Feedback enviado para o backend.");
                }
            } catch (error) {
                console.error("ERRO DE REDE ao enviar feedback:", error);
            }
        }

        // Buscar resposta do backend (com LOGS DE DEBUG)
        async function buscarResposta(textoDaPergunta) {
            ultimaPergunta = textoDaPergunta;
            ultimaLinhaDaFonte = null;
            if (!textoDaPergunta.trim()) return;
            showTypingIndicator();

            try {
                const url = `/api/ask?pergunta=${encodeURIComponent(textoDaPergunta)}`;
                const response = await fetch(url);
                hideTypingIndicator();

                if (!response.ok) {
                    throw new Error(`Erro de rede ou API: ${response.status}`);
                }

                const data = await response.json();
                
                // LOG DE DEBUG ADICIONADO AQUI
                console.log("--- DEBUG RESPOSTA ---");
                console.log("Dados recebidos de /api/ask:", data);

                if (data.status === 'sucesso') {
                    ultimaLinhaDaFonte = data.sourceRow;
                    addMessage(data.resposta, 'bot', { sourceRow: data.sourceRow });
                } else {
                    addMessage(data.resposta || "Ocorreu um erro ao processar sua pergunta.", 'bot');
                }
            } catch (error) {
                hideTypingIndicator();
                addMessage("Erro de conexão com o backend. Verifique o console (F12) para mais detalhes.", 'bot');
                console.error("Detalhes do erro de fetch:", error);
            }
        }

        // Enviar mensagem
        function handleSendMessage(text) {
            const trimmedText = text.trim();
            if (!trimmedText) return;
            addMessage(trimmedText, 'user');
            buscarResposta(trimmedText);
            userInput.value = '';
        }

        // Listeners de eventos
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

        document.getElementById('expandable-faq-header').addEventListener('click', (e) => {
            e.currentTarget.classList.toggle('expanded');
            const moreQuestions = document.getElementById('more-questions');
            moreQuestions.classList.toggle('hidden', !e.currentTarget.classList.contains('expanded'));
        });

        themeSwitcher.addEventListener('click', () => {
            body.classList.toggle('dark-theme');
            const isDark = body.classList.contains('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            themeSwitcher.innerHTML = isDark ? '🌙' : '☀️';
        });

        // ==================================================
        //  LÓGICA PARA CONTROLAR O MODAL DE FEEDBACK
        // ==================================================
        const feedbackOverlay = document.getElementById('feedback-overlay');
        const feedbackSendBtn = document.getElementById('feedback-send');
        const feedbackCancelBtn = document.getElementById('feedback-cancel');
        const feedbackText = document.getElementById('feedback-text');
        let activeFeedbackContainer = null;

        function abrirModalFeedback(container) {
            activeFeedbackContainer = container;
            feedbackOverlay.classList.remove('hidden');
            feedbackText.focus();
        }

        function fecharModalFeedback() {
            feedbackOverlay.classList.add('hidden');
            feedbackText.value = '';
            activeFeedbackContainer = null;
        }

        feedbackCancelBtn.addEventListener('click', fecharModalFeedback);

        feedbackSendBtn.addEventListener('click', () => {
            const sugestao = feedbackText.value.trim();
            if (activeFeedbackContainer) {
                enviarFeedback('logFeedbackNegativo', activeFeedbackContainer, sugestao || null);
                fecharModalFeedback();
            }
        });

        // Configurar tema inicial e mensagem de boas-vindas
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

    // Inicia a aplicação
    initGoogleSignIn();
});
