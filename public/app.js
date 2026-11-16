// Transcritor do Will - Frontend Logic
// Cores Oficiais: Branco, Cinza Chumbo (#0f172a, #1e293b), Azul Royal (#1d4ed8, #2563eb)
// Sem vazamento de credenciais: Todas as chaves e processamentos ficam no servidor

document.addEventListener('DOMContentLoaded', () => {
  // Estado Global da Aplicação
  const state = {
    selectedFile: null,
    recordedBlob: null,
    isRecording: false,
    mediaRecorder: null,
    recordTimerInterval: null,
    recordSeconds: 0,
    user: null,
    token: localStorage.getItem('trw_auth_token') || null,
    currentResult: null,
    history: [],
    currentPixTxId: null,
    currentSelectedPlan: 'pro'
  };

  // Elementos do DOM
  const dom = {
    // Header & Perfil
    unauthNav: document.getElementById('unauthNav'),
    authNav: document.getElementById('authNav'),
    btnOpenLogin: document.getElementById('btnOpenLogin'),
    btnOpenRegister: document.getElementById('btnOpenRegister'),
    btnOpenAdminModal: document.getElementById('btnOpenAdminModal'),
    btnUserPlanBadge: document.getElementById('btnUserPlanBadge'),
    headerCreditsText: document.getElementById('headerCreditsText'),
    headerUserName: document.getElementById('headerUserName'),
    btnLogout: document.getElementById('btnLogout'),

    // Modal Admin (Exclusivo Dono)
    btnCloseAdminModal: document.getElementById('btnCloseAdminModal'),
    modalAdmin: document.getElementById('modalAdmin'),
    tabAdminGrant: document.getElementById('tabAdminGrant'),
    tabAdminUsers: document.getElementById('tabAdminUsers'),
    paneAdminGrant: document.getElementById('paneAdminGrant'),
    paneAdminUsers: document.getElementById('paneAdminUsers'),
    adminFeedback: document.getElementById('adminFeedback'),
    formAdminGrant: document.getElementById('formAdminGrant'),
    adminClientEmail: document.getElementById('adminClientEmail'),
    adminClientName: document.getElementById('adminClientName'),
    adminSelectPlan: document.getElementById('adminSelectPlan'),
    btnRefreshAdminUsers: document.getElementById('btnRefreshAdminUsers'),
    adminUsersList: document.getElementById('adminUsersList'),
    adminTotalUsersLabel: document.getElementById('adminTotalUsersLabel'),

    // Tema Dark / Light
    btnToggleTheme: document.getElementById('btnToggleTheme'),
    themeIcon: document.getElementById('themeIcon'),
    themeText: document.getElementById('themeText'),

    // Modal de Autenticação (Login / Cadastro)
    modalAuth: document.getElementById('modalAuth'),
    btnCloseAuthModal: document.getElementById('btnCloseAuthModal'),
    tabAuthLogin: document.getElementById('tabAuthLogin'),
    tabAuthRegister: document.getElementById('tabAuthRegister'),
    formLogin: document.getElementById('formLogin'),
    formRegister: document.getElementById('formRegister'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    btnToggleLoginPass: document.getElementById('btnToggleLoginPass'),
    registerName: document.getElementById('registerName'),
    registerEmail: document.getElementById('registerEmail'),
    registerPassword: document.getElementById('registerPassword'),
    btnToggleRegisterPass: document.getElementById('btnToggleRegisterPass'),
    authFeedback: document.getElementById('authFeedback'),
    btnSwitchToRegister: document.getElementById('btnSwitchToRegister'),
    btnSwitchToLogin: document.getElementById('btnSwitchToLogin'),
    authSubtitle: document.getElementById('authSubtitle'),

    // Modal de Planos & Checkout Pix
    btnOpenPricingModal: document.getElementById('btnOpenPricingModal'),
    btnClosePricingModal: document.getElementById('btnClosePricingModal'),
    modalPricing: document.getElementById('modalPricing'),
    pricingPlansView: document.getElementById('pricingPlansView'),
    pricingCheckoutView: document.getElementById('pricingCheckoutView'),
    btnBackToPlans: document.getElementById('btnBackToPlans'),
    pixQrCodeImg: document.getElementById('pixQrCodeImg'),
    checkoutPlanBadge: document.getElementById('checkoutPlanBadge'),
    checkoutPlanTitle: document.getElementById('checkoutPlanTitle'),
    checkoutAmountText: document.getElementById('checkoutAmountText'),
    inputPixCode: document.getElementById('inputPixCode'),
    btnCopyPixCode: document.getElementById('btnCopyPixCode'),
    btnConfirmPayment: document.getElementById('btnConfirmPayment'),

    // Modal de Histórico Privado
    btnOpenHistory: document.getElementById('btnOpenHistory'),
    btnCloseHistoryModal: document.getElementById('btnCloseHistoryModal'),
    modalHistory: document.getElementById('modalHistory'),
    historyList: document.getElementById('historyList'),
    btnClearAllHistory: document.getElementById('btnClearAllHistory'),

    // Abas de Entrada de Áudio
    tabUpload: document.getElementById('tabUpload'),
    tabRecord: document.getElementById('tabRecord'),
    paneUpload: document.getElementById('paneUpload'),
    paneRecord: document.getElementById('paneRecord'),

    // Upload de Arquivo
    dropZone: document.getElementById('dropZone'),
    fileInput: document.getElementById('fileInput'),
    filePreview: document.getElementById('filePreview'),
    fileName: document.getElementById('fileName'),
    fileSize: document.getElementById('fileSize'),
    btnRemoveFile: document.getElementById('btnRemoveFile'),
    audioElement: document.getElementById('audioElement'),

    // Gravação Microfone
    btnRecordToggle: document.getElementById('btnRecordToggle'),
    recordIcon: document.getElementById('recordIcon'),
    recordPulse: document.getElementById('recordPulse'),
    recordTimer: document.getElementById('recordTimer'),
    recordStatus: document.getElementById('recordStatus'),
    recordAudioPreview: document.getElementById('recordAudioPreview'),
    recordAudioElement: document.getElementById('recordAudioElement'),

    // Opções de Transcrição
    selectModel: document.getElementById('selectModel'),
    selectOutputFormat: document.getElementById('selectOutputFormat'),
    checkSpeakers: document.getElementById('checkSpeakers'),
    checkTimestamps: document.getElementById('checkTimestamps'),
    selectLanguage: document.getElementById('selectLanguage'),
    customInstructions: document.getElementById('customInstructions'),
    btnTranscribe: document.getElementById('btnTranscribe'),

    // Resultados & Abas
    loadingCard: document.getElementById('loadingCard'),
    loadingTitle: document.getElementById('loadingTitle'),
    loadingSubtitle: document.getElementById('loadingSubtitle'),
    emptyResultState: document.getElementById('emptyResultState'),
    paneResTranscribe: document.getElementById('paneResTranscribe'),
    paneResSummary: document.getElementById('paneResSummary'),
    paneResSRT: document.getElementById('paneResSRT'),
    resTabTranscribe: document.getElementById('resTabTranscribe'),
    resTabSummary: document.getElementById('resTabSummary'),
    resTabSRT: document.getElementById('resTabSRT'),
    transcriptionTextArea: document.getElementById('transcriptionTextArea'),
    summaryContent: document.getElementById('summaryContent'),
    keyPointsContent: document.getElementById('keyPointsContent'),
    actionItemsContent: document.getElementById('actionItemsContent'),
    srtTextArea: document.getElementById('srtTextArea'),
    wordCountLabel: document.getElementById('wordCountLabel'),
    resultFooter: document.getElementById('resultFooter'),
    footerFileName: document.getElementById('footerFileName'),
    footerModel: document.getElementById('footerModel'),

    // Ações de Download / Exportação
    btnExportPDF: document.getElementById('btnExportPDF'),
    btnCopyText: document.getElementById('btnCopyText'),
    btnDownloadDropdown: document.getElementById('btnDownloadDropdown'),
    downloadMenu: document.getElementById('downloadMenu'),
    btnDownloadTXT: document.getElementById('btnDownloadTXT'),
    btnDownloadSRT: document.getElementById('btnDownloadSRT'),
    btnDownloadMD: document.getElementById('btnDownloadMD'),
    btnPrint: document.getElementById('btnPrint'),

    // Notificações Toast
    toast: document.getElementById('toastNotification'),
    toastMessage: document.getElementById('toastMessage'),
    toastIcon: document.getElementById('toastIcon')
  };

  // ==========================================
  // INICIALIZAÇÃO DO APP
  // ==========================================
  async function init() {
    initTheme();
    setupEventListeners();
    await checkAuthStatus();
  }

  // ==========================================
  // TEMA (MODO CLARO / MODO ESCURO)
  // ==========================================
  function initTheme() {
    const savedTheme = localStorage.getItem('transcritor_theme') || 'light';
    applyTheme(savedTheme);
  }

  function applyTheme(theme) {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.classList.add('dark');
      if (dom.themeIcon) dom.themeIcon.className = 'fa-solid fa-sun text-amber-400 text-sm';
      if (dom.themeText) dom.themeText.textContent = 'Claro';
    } else {
      html.classList.remove('dark');
      if (dom.themeIcon) dom.themeIcon.className = 'fa-solid fa-moon text-chumbo-600 dark:text-chumbo-300 text-sm';
      if (dom.themeText) dom.themeText.textContent = 'Escuro';
    }
    localStorage.setItem('transcritor_theme', theme);
  }

  function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(isDark ? 'light' : 'dark');
  }

  // ==========================================
  // AUTENTICAÇÃO E SESSÃO DO USUÁRIO
  // ==========================================
  async function checkAuthStatus() {
    const token = state.token;
    if (!token) {
      state.user = null;
      updateAuthUI();
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok && data.success && data.user) {
        state.user = data.user;
        updateAuthUI();
        loadUserHistory();
      } else {
        // Token inválido ou expirado
        state.token = null;
        state.user = null;
        localStorage.removeItem('trw_auth_token');
        updateAuthUI();
      }
    } catch (err) {
      console.warn('Erro ao verificar sessão do usuário:', err);
      updateAuthUI();
    }
  }

  function updateAuthUI() {
    if (state.user) {
      // Usuário autenticado
      if (dom.unauthNav) dom.unauthNav.classList.add('hidden');
      if (dom.authNav) dom.authNav.classList.remove('hidden');

      const firstName = (state.user.name || 'Usuário').split(' ')[0];
      if (dom.headerUserName) dom.headerUserName.textContent = firstName;

      // Atualiza badge de créditos / plano
      if (dom.headerCreditsText) {
        if (state.user.plan === 'pro') {
          dom.headerCreditsText.textContent = '⭐ Plano Pro';
        } else if (state.user.plan === 'unlimited') {
          dom.headerCreditsText.textContent = '🏢 Ilimitado';
        } else {
          const c = state.user.credits || 0;
          dom.headerCreditsText.textContent = `${c} Crédito${c === 1 ? '' : 's'}`;
        }
      }

      // Botão Painel Admin (apenas para o dono do sistema)
      const isAdmin = state.user.role === 'admin' || (state.user.email && state.user.email.toLowerCase() === 'wilsonbrenomkt@gmail.com');
      if (dom.btnOpenAdminModal) {
        if (isAdmin) {
          dom.btnOpenAdminModal.classList.remove('hidden');
        } else {
          dom.btnOpenAdminModal.classList.add('hidden');
        }
      }
    } else {
      // Visitante não autenticado
      if (dom.unauthNav) dom.unauthNav.classList.remove('hidden');
      if (dom.authNav) dom.authNav.classList.add('hidden');
      if (dom.btnOpenAdminModal) dom.btnOpenAdminModal.classList.add('hidden');
    }
  }

  function openAuthModal(defaultTab = 'login', message = '') {
    if (dom.modalAuth) {
      switchAuthTab(defaultTab);
      if (message) {
        showAuthFeedback(message, 'info');
      } else {
        hideAuthFeedback();
      }
      dom.modalAuth.classList.remove('hidden');
    }
  }

  function closeAuthModal() {
    if (dom.modalAuth) {
      dom.modalAuth.classList.add('hidden');
      hideAuthFeedback();
    }
  }

  function switchAuthTab(tab) {
    hideAuthFeedback();
    if (tab === 'register') {
      dom.tabAuthRegister.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-royal-700 text-white shadow-xs transition';
      dom.tabAuthLogin.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-chumbo-600 dark:text-chumbo-400 hover:text-chumbo-900 dark:hover:text-white transition';
      dom.formRegister.classList.remove('hidden');
      dom.formLogin.classList.add('hidden');
      if (dom.authSubtitle) dom.authSubtitle.textContent = 'Crie sua conta e ganhe 1 crédito grátis';
    } else {
      dom.tabAuthLogin.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-royal-700 text-white shadow-xs transition';
      dom.tabAuthRegister.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-chumbo-600 dark:text-chumbo-400 hover:text-chumbo-900 dark:hover:text-white transition';
      dom.formLogin.classList.remove('hidden');
      dom.formRegister.classList.add('hidden');
      if (dom.authSubtitle) dom.authSubtitle.textContent = 'Entre na sua conta para transcrever';
    }
  }

  function showAuthFeedback(msg, type = 'error') {
    if (!dom.authFeedback) return;
    dom.authFeedback.textContent = msg;
    dom.authFeedback.classList.remove('hidden');

    if (type === 'error') {
      dom.authFeedback.className = 'p-3 rounded-xl text-xs font-medium bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300';
    } else if (type === 'success') {
      dom.authFeedback.className = 'p-3 rounded-xl text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300';
    } else {
      dom.authFeedback.className = 'p-3 rounded-xl text-xs font-medium bg-royal-50 dark:bg-royal-950/60 border border-royal-200 dark:border-royal-800 text-royal-700 dark:text-royal-300';
    }
  }

  function hideAuthFeedback() {
    if (dom.authFeedback) {
      dom.authFeedback.classList.add('hidden');
      dom.authFeedback.textContent = '';
    }
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    const email = dom.loginEmail.value.trim();
    const password = dom.loginPassword.value;

    if (!email || !password) {
      showAuthFeedback('Por favor, informe seu e-mail e senha.', 'error');
      return;
    }

    showAuthFeedback('Autenticando...', 'info');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (res.ok && data.success && data.token) {
        state.token = data.token;
        state.user = data.user;
        localStorage.setItem('trw_auth_token', data.token);

        updateAuthUI();
        closeAuthModal();
        showToast(`Bem-vindo de volta, ${data.user.name}!`);
        loadUserHistory();
      } else {
        showAuthFeedback(data.message || 'E-mail ou senha incorretos.', 'error');
      }
    } catch (err) {
      console.error('Erro no login:', err);
      showAuthFeedback('Erro de conexão ao servidor. Tente novamente.', 'error');
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    const name = dom.registerName.value.trim();
    const email = dom.registerEmail.value.trim();
    const password = dom.registerPassword.value;

    if (!name || !email || !password) {
      showAuthFeedback('Preencha todos os campos para continuar.', 'error');
      return;
    }
    if (password.length < 6) {
      showAuthFeedback('A senha deve ter pelo menos 6 caracteres.', 'error');
      return;
    }

    showAuthFeedback('Criando sua conta...', 'info');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();

      if (res.ok && data.success && data.token) {
        state.token = data.token;
        state.user = data.user;
        localStorage.setItem('trw_auth_token', data.token);

        updateAuthUI();
        closeAuthModal();
        showToast(`Conta criada! Você ganhou 1 crédito gratuito 🎉`);
        loadUserHistory();
      } else {
        showAuthFeedback(data.message || 'Falha ao criar conta. Verifique os dados.', 'error');
      }
    } catch (err) {
      console.error('Erro no cadastro:', err);
      showAuthFeedback('Erro de conexão ao servidor. Tente novamente.', 'error');
    }
  }

  function handleLogout() {
    state.token = null;
    state.user = null;
    localStorage.removeItem('trw_auth_token');
    updateAuthUI();
    state.history = [];
    renderHistoryList();
    showToast('Você saiu da sua conta.');
  }

  // ==========================================
  // GESTÃO DE PLANOS & PAGAMENTO PIX
  // ==========================================
  async function handleSelectPlan(plan) {
    state.currentSelectedPlan = plan;

    // Se o usuário não estiver logado, convidamos a logar primeiro
    if (!state.user) {
      dom.modalPricing.classList.add('hidden');
      openAuthModal('register', 'Crie sua conta ou faça login antes para vincular sua assinatura!');
      return;
    }

    try {
      showToast('Gerando cobrança Pix instantânea...');
      const res = await fetch('/api/create-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          userEmail: state.user.email
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        state.currentPixTxId = data.txId;

        // Atualiza a View de Checkout
        dom.checkoutPlanBadge.textContent = data.planTitle;
        dom.checkoutPlanTitle.textContent = data.planTitle;
        dom.checkoutAmountText.textContent = `R$ ${Number(data.amount).toFixed(2).replace('.', ',')}`;
        dom.pixQrCodeImg.src = data.qrCodeDataUrl;
        dom.inputPixCode.value = data.pixCode;

        // Alterna visão
        dom.pricingPlansView.classList.add('hidden');
        dom.pricingCheckoutView.classList.remove('hidden');
      } else {
        showToast(data.error || 'Erro ao gerar Pix.', 'error');
      }
    } catch (err) {
      console.error('Erro ao gerar Pix:', err);
      showToast('Falha ao comunicar com o servidor Pix.', 'error');
    }
  }

  function handleBackToPlans() {
    if (dom.pricingCheckoutView) dom.pricingCheckoutView.classList.add('hidden');
    if (dom.pricingPlansView) dom.pricingPlansView.classList.remove('hidden');
  }

  function handleCopyPix() {
    const code = dom.inputPixCode.value;
    if (!code) return;

    navigator.clipboard.writeText(code).then(() => {
      const originalHTML = dom.btnCopyPixCode.innerHTML;
      dom.btnCopyPixCode.innerHTML = '<i class="fa-solid fa-check"></i> <span>Copiado!</span>';
      showToast('Código Pix copiado! Cole no app do seu banco.');
      setTimeout(() => {
        dom.btnCopyPixCode.innerHTML = originalHTML;
      }, 2500);
    }).catch(() => {
      showToast('Falha ao copiar automaticamente.', 'error');
    });
  }

  async function handleConfirmPayment() {
    if (!state.user || !state.token) {
      dom.modalPricing.classList.add('hidden');
      openAuthModal('login', 'Faça login para ativar seu plano.');
      return;
    }

    try {
      dom.btnConfirmPayment.disabled = true;
      dom.btnConfirmPayment.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Ativando seu plano...';

      const res = await fetch('/api/confirm-pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({
          plan: state.currentSelectedPlan,
          txId: state.currentPixTxId
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        state.user = data.user;
        updateAuthUI();
        dom.modalPricing.classList.add('hidden');
        handleBackToPlans();
        showToast('🎉 Pagamento confirmado! Seu plano/créditos foram ativados com sucesso.');
      } else {
        showToast(data.message || 'Não foi possível confirmar o plano agora.', 'error');
      }
    } catch (err) {
      console.error('Erro ao confirmar plano:', err);
      showToast('Erro ao confirmar pagamento.', 'error');
    } finally {
      dom.btnConfirmPayment.disabled = false;
      dom.btnConfirmPayment.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span>Já realizei o pagamento Pix</span>';
    }
  }

  // ==========================================
  // UPLOAD DE ARQUIVOS E GRAVAÇÃO
  // ==========================================
  function setAudioFile(file) {
    if (!file) return;

    // Checagem básica de tamanho (100MB)
    if (file.size > 100 * 1024 * 1024) {
      showToast('O arquivo excede o limite máximo permitido de 100 MB.', 'error');
      return;
    }

    state.selectedFile = file;
    state.recordedBlob = null;

    // Atualiza preview
    dom.fileName.textContent = file.name;
    const mbSize = (file.size / (1024 * 1024)).toFixed(1);
    dom.fileSize.textContent = `${mbSize} MB`;

    // Carrega no player
    const objectUrl = URL.createObjectURL(file);
    dom.audioElement.src = objectUrl;

    dom.dropZone.classList.add('hidden');
    dom.filePreview.classList.remove('hidden');

    showToast(`Áudio "${file.name}" carregado com sucesso.`);
  }

  function removeAudioFile() {
    state.selectedFile = null;
    dom.fileInput.value = '';
    dom.audioElement.src = '';
    dom.dropZone.classList.remove('hidden');
    dom.filePreview.classList.add('hidden');
  }

  async function toggleRecording() {
    if (state.isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';

      state.mediaRecorder = new MediaRecorder(stream, { mimeType });
      state.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      state.mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        state.recordedBlob = blob;

        const file = new File([blob], `gravacao-${Date.now()}.${mimeType.includes('webm') ? 'webm' : 'ogg'}`, {
          type: mimeType
        });
        state.selectedFile = file;

        // Player de preview da gravação
        const url = URL.createObjectURL(blob);
        dom.recordAudioElement.src = url;
        dom.recordAudioPreview.classList.remove('hidden');

        stream.getTracks().forEach(track => track.stop());
        showToast('Gravação concluída e pronta para transcrever!');
      };

      state.mediaRecorder.start();
      state.isRecording = true;
      state.recordSeconds = 0;
      updateRecordTimerUI();

      state.recordTimerInterval = setInterval(() => {
        state.recordSeconds++;
        updateRecordTimerUI();
      }, 1000);

      // UI
      dom.btnRecordToggle.classList.add('recording-active', 'bg-rose-700');
      dom.recordIcon.className = 'fa-solid fa-stop text-white';
      dom.recordPulse.classList.remove('hidden');
      dom.recordStatus.textContent = 'Gravando... Clique no botão para parar.';
      dom.recordAudioPreview.classList.add('hidden');

    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      showToast('Permissão de microfone negada ou microfone indisponível.', 'error');
    }
  }

  function stopRecording() {
    if (!state.mediaRecorder || !state.isRecording) return;
    state.mediaRecorder.stop();
    state.isRecording = false;
    clearInterval(state.recordTimerInterval);

    dom.btnRecordToggle.classList.remove('recording-active', 'bg-rose-700');
    dom.recordIcon.className = 'fa-solid fa-microphone text-white';
    dom.recordPulse.classList.add('hidden');
    dom.recordStatus.textContent = 'Gravação finalizada. Pronto para transcrever!';
  }

  function updateRecordTimerUI() {
    const mins = String(Math.floor(state.recordSeconds / 60)).padStart(2, '0');
    const secs = String(state.recordSeconds % 60).padStart(2, '0');
    dom.recordTimer.textContent = `${mins}:${secs}`;
  }

  // ==========================================
  // TRANSCRIÇÃO DE ÁUDIO COM IA
  // ==========================================
  async function handleTranscribe() {
    const file = state.selectedFile;
    if (!file) {
      showToast('Por favor, selecione um arquivo de áudio ou grave pelo microfone.', 'error');
      return;
    }

    // Validação de autenticação
    if (!state.user || !state.token) {
      openAuthModal('register', '🎁 Cadastre-se gratuitamente em 10 segundos para testar! Você ganha 1 crédito grátis.');
      return;
    }

    // Validação de créditos do usuário
    const hasActiveSubscription = state.user.plan === 'pro' || state.user.plan === 'unlimited';
    const hasCredits = (state.user.credits || 0) > 0;

    if (!hasActiveSubscription && !hasCredits) {
      handleBackToPlans();
      dom.modalPricing.classList.remove('hidden');
      showToast('Você utilizou seu crédito gratuito! Escolha um plano para continuar transcrevendo.', 'error');
      return;
    }

    // Prepara Form Data
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('model', dom.selectModel.value);
    formData.append('outputFormat', dom.selectOutputFormat ? dom.selectOutputFormat.value : 'summary_points');
    formData.append('detectSpeakers', dom.checkSpeakers.checked);
    formData.append('includeTimestamps', dom.checkTimestamps.checked);
    formData.append('targetLanguage', dom.selectLanguage.value);
    formData.append('customInstructions', dom.customInstructions.value);

    // Inicia UI de processamento
    startLoadingAnimation();

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.error === 'CREDITS_EXHAUSTED') {
          handleBackToPlans();
          dom.modalPricing.classList.remove('hidden');
          throw new Error('Seus créditos esgotaram. Escolha um plano para continuar.');
        }
        if (data.error === 'AUTH_REQUIRED' || data.error === 'INVALID_TOKEN') {
          state.user = null;
          state.token = null;
          localStorage.removeItem('trw_auth_token');
          updateAuthUI();
          openAuthModal('login', 'Sua sessão expirou. Entre novamente.');
          throw new Error('Sessão expirada. Entre novamente.');
        }
        throw new Error(data.error || 'Falha ao processar áudio.');
      }

      // Sucesso! Atualiza créditos na UI
      if (data.remainingCredits !== undefined) {
        state.user.credits = data.remainingCredits;
        updateAuthUI();
      }

      displayTranscriptionResult(data);
      loadUserHistory();
      showToast('Transcrição concluída com sucesso!');

    } catch (error) {
      console.error('Erro na transcrição:', error);
      showToast(error.message || 'Erro durante a transcrição.', 'error');
    } finally {
      stopLoadingAnimation();
    }
  }

  // Animação de Loading Inteligente
  let loadingStepsInterval = null;
  function startLoadingAnimation() {
    dom.btnTranscribe.disabled = true;
    dom.loadingCard.classList.remove('hidden');
    dom.emptyResultState.classList.add('hidden');
    dom.paneResTranscribe.classList.add('hidden');
    dom.paneResSummary.classList.add('hidden');
    dom.paneResSRT.classList.add('hidden');

    const steps = [
      { title: 'Enviando áudio...', sub: 'Fazendo upload seguro para processamento com IA' },
      { title: 'Transcrevendo áudio...', sub: 'Reconhecendo vozes, entonação e palavras com alta fidelidade' },
      { title: 'Formatando falas e parágrafos...', sub: 'Aplicando pontuação e organizando os falantes' },
      { title: 'Finalizando relatório executivo...', sub: 'Gerando atas, resumos e marcações de tempo' }
    ];

    let stepIndex = 0;
    dom.loadingTitle.textContent = steps[0].title;
    dom.loadingSubtitle.textContent = steps[0].sub;

    loadingStepsInterval = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
      dom.loadingTitle.textContent = steps[stepIndex].title;
      dom.loadingSubtitle.textContent = steps[stepIndex].sub;
    }, 4000);
  }

  function stopLoadingAnimation() {
    dom.btnTranscribe.disabled = false;
    dom.loadingCard.classList.add('hidden');
    if (loadingStepsInterval) clearInterval(loadingStepsInterval);
  }

  // ==========================================
  // EXIBIÇÃO DO RESULTADO
  // ==========================================
  function displayTranscriptionResult(data) {
    state.currentResult = data;

    const transcription = data.transcription || data.rawOutput || '';
    dom.transcriptionTextArea.value = transcription;

    // Resumo & Ações
    dom.summaryContent.textContent = data.summary || 'Resumo gerado na íntegra da transcrição.';
    dom.keyPointsContent.textContent = data.keyPoints || 'Nenhum ponto registrado.';
    dom.actionItemsContent.textContent = data.actionItems || 'Nenhuma ação pendente identificada.';

    // Geração de Legendas SRT
    const srtText = generateSRT(transcription);
    dom.srtTextArea.value = srtText;

    // Contagem de Palavras e Caracteres
    updateWordCount(transcription);

    // Rodapé
    dom.footerFileName.textContent = data.fileName || 'áudio';
    dom.footerModel.textContent = `Modelo: ${data.modelUsed || 'Gemini 3.8 Flash'}`;
    dom.resultFooter.classList.remove('hidden');

    // Mostra painel de transcrição
    switchResultTab('transcribe');
  }

  function updateWordCount(text) {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = text.length;
    dom.wordCountLabel.textContent = `${words.toLocaleString('pt-BR')} palavras • ${chars.toLocaleString('pt-BR')} caracteres`;
  }

  // Gera formato SRT a partir do texto
  function generateSRT(text) {
    if (!text) return '';
    const paragraphs = text.split(/\n+/).filter(p => p.trim());
    let srt = '';
    let currentTimeSec = 0;

    paragraphs.forEach((p, idx) => {
      // Tenta achar timestamp [MM:SS] no parágrafo
      const tsMatch = p.match(/\[(\d{1,2}):(\d{2})\]/);
      let startSec = currentTimeSec;
      if (tsMatch) {
        startSec = parseInt(tsMatch[1], 10) * 60 + parseInt(tsMatch[2], 10);
      }

      const wordCount = p.split(/\s+/).length;
      const durationSec = Math.max(3, Math.min(10, Math.round(wordCount * 0.4)));
      const endSec = startSec + durationSec;
      currentTimeSec = endSec;

      const formatTime = (totalSeconds) => {
        const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const secs = String(totalSeconds % 60).padStart(2, '0');
        return `${hrs}:${mins}:${secs},000`;
      };

      const cleanText = p.replace(/\[\d{1,2}:\d{2}\]/g, '').trim();

      srt += `${idx + 1}\n`;
      srt += `${formatTime(startSec)} --> ${formatTime(endSec)}\n`;
      srt += `${cleanText}\n\n`;
    });

    return srt.trim();
  }

  // ==========================================
  // ABAS DO RESULTADO
  // ==========================================
  function switchResultTab(tab) {
    dom.emptyResultState.classList.add('hidden');
    dom.paneResTranscribe.classList.add('hidden');
    dom.paneResSummary.classList.add('hidden');
    dom.paneResSRT.classList.add('hidden');

    dom.resTabTranscribe.className = 'px-3 py-1.5 text-xs font-semibold rounded-lg text-chumbo-600 dark:text-chumbo-400 hover:text-chumbo-900 dark:hover:text-white flex items-center gap-1.5 transition';
    dom.resTabSummary.className = 'px-3 py-1.5 text-xs font-semibold rounded-lg text-chumbo-600 dark:text-chumbo-400 hover:text-chumbo-900 dark:hover:text-white flex items-center gap-1.5 transition';
    dom.resTabSRT.className = 'px-3 py-1.5 text-xs font-semibold rounded-lg text-chumbo-600 dark:text-chumbo-400 hover:text-chumbo-900 dark:hover:text-white flex items-center gap-1.5 transition';

    if (tab === 'transcribe') {
      dom.paneResTranscribe.classList.remove('hidden');
      dom.resTabTranscribe.className = 'px-3 py-1.5 text-xs font-bold rounded-lg bg-royal-700 text-white shadow-xs flex items-center gap-1.5 transition';
    } else if (tab === 'summary') {
      dom.paneResSummary.classList.remove('hidden');
      dom.resTabSummary.className = 'px-3 py-1.5 text-xs font-bold rounded-lg bg-royal-700 text-white shadow-xs flex items-center gap-1.5 transition';
    } else if (tab === 'srt') {
      dom.paneResSRT.classList.remove('hidden');
      dom.resTabSRT.className = 'px-3 py-1.5 text-xs font-bold rounded-lg bg-royal-700 text-white shadow-xs flex items-center gap-1.5 transition';
    }
  }

  // ==========================================
  // EXPORTAÇÃO & DOWNLOADS
  // ==========================================
  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    dom.downloadMenu.classList.add('hidden');
    showToast(`Arquivo "${fileName}" baixado com sucesso!`);
  }

  function handleCopy() {
    const text = dom.transcriptionTextArea.value;
    if (!text) {
      showToast('Nada para copiar ainda.', 'error');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      showToast('Transcrição copiada para a Área de Transferência!');
    }).catch(() => {
      showToast('Falha ao copiar texto.', 'error');
    });
  }

  // Gera Relatório Corporativo Formatado em PDF
  async function handleExportPDF() {
    if (!dom.transcriptionTextArea.value.trim()) {
      showToast('Nenhum resultado para exportar em PDF.', 'error');
      return;
    }

    showToast('Gerando PDF executivo com formatação...');

    const data = state.currentResult || {};
    const fileName = data.fileName || (state.selectedFile ? state.selectedFile.name : 'audio');
    const cleanName = fileName.replace(/\.[^/.]+$/, '');
    const transcription = dom.transcriptionTextArea.value;
    const summary = dom.summaryContent ? dom.summaryContent.textContent : '';
    const keyPoints = dom.keyPointsContent ? dom.keyPointsContent.textContent : '';
    const actionItems = dom.actionItemsContent ? dom.actionItemsContent.textContent : '';
    const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const wordCount = transcription.trim() ? transcription.trim().split(/\s+/).length : 0;

    // Container de renderização do PDF
    const container = document.createElement('div');
    container.style.padding = '30px';
    container.style.fontFamily = "'Inter', Arial, sans-serif";
    container.style.color = '#1e293b';
    container.style.background = '#ffffff';
    container.style.fontSize = '12px';
    container.style.lineHeight = '1.6';

    let html = `
      <div style="border-bottom: 3px solid #1d4ed8; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="/assets/icon.png" style="width: 38px; height: 38px; border-radius: 8px; object-fit: cover;" alt="Logo">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px;">Transcritor do Will</h1>
                <span style="font-size: 10px; font-weight: 700; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 2px 6px; border-radius: 9999px; text-transform: uppercase;">transcritordowill</span>
              </div>
              <p style="font-size: 11px; color: #64748b; margin: 3px 0 0 0; font-weight: 500;">Relatório Executivo de Transcrição & Análise de Áudio</p>
            </div>
          </div>
        </div>
        <div style="text-align: right; font-size: 10px; color: #64748b;">
          <div><strong>Data:</strong> ${dateStr}</div>
          <div><strong>Arquivo:</strong> ${fileName}</div>
          <div><strong>Volume:</strong> ${wordCount.toLocaleString('pt-BR')} palavras</div>
        </div>
      </div>
    `;

    // Resumo Executivo
    if (summary && !summary.includes('Nenhum')) {
      html += `
        <div style="background: #f8fafc; border-left: 4px solid #1d4ed8; padding: 14px 16px; border-radius: 6px; margin-bottom: 18px;">
          <h2 style="font-size: 13px; font-weight: 800; color: #1d4ed8; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">
            Resumo Executivo
          </h2>
          <div style="font-size: 11.5px; color: #334155; white-space: pre-line; line-height: 1.6;">${escapeHtml(summary)}</div>
        </div>
      `;
    }

    // Pontos-Chave
    if (keyPoints && !keyPoints.includes('Nenhum')) {
      html += `
        <div style="background: #f8fafc; border-left: 4px solid #334155; padding: 14px 16px; border-radius: 6px; margin-bottom: 18px;">
          <h2 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">
            Pontos-Chave & Decisões
          </h2>
          <div style="font-size: 11.5px; color: #334155; white-space: pre-line; line-height: 1.6;">${escapeHtml(keyPoints)}</div>
        </div>
      `;
    }

    // Próximos Passos
    if (actionItems && !actionItems.includes('Nenhuma')) {
      html += `
        <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px 16px; border-radius: 6px; margin-bottom: 22px;">
          <h2 style="font-size: 13px; font-weight: 800; color: #15803d; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">
            Próximos Passos & Ações
          </h2>
          <div style="font-size: 11.5px; color: #166534; white-space: pre-line; line-height: 1.6;">${escapeHtml(actionItems)}</div>
        </div>
      `;
    }

    // Transcrição Integral
    html += `
      <div style="margin-top: 10px;">
        <h2 style="font-size: 13px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
          Transcrição Integral do Áudio
        </h2>
        <div style="font-size: 11px; color: #1e293b; white-space: pre-line; line-height: 1.7;">${escapeHtml(transcription)}</div>
      </div>
    `;

    // Rodapé do PDF
    html += `
      <div style="margin-top: 30px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #94a3b8; display: flex; justify-content: space-between;">
        <span>Gerado com Transcritor do Will • Alta Fidelidade</span>
        <span>transcritordowill.onrender.com</span>
      </div>
    `;

    container.innerHTML = html;
    document.body.appendChild(container);

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `${cleanName}-relatorio-transcritordowill.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(container).save();
      showToast('PDF gerado e baixado com sucesso!');
    } catch (e) {
      console.error('Erro ao gerar PDF:', e);
      showToast('Erro ao exportar PDF.', 'error');
    } finally {
      document.body.removeChild(container);
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
  }

  // ==========================================
  // HISTÓRICO PRIVADO DO USUÁRIO
  // ==========================================
  async function loadUserHistory() {
    if (!state.token) {
      state.history = [];
      renderHistoryList();
      return;
    }

    try {
      const res = await fetch('/api/history', {
        headers: { 'Authorization': `Bearer ${state.token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        state.history = data.history || [];
        renderHistoryList();
      }
    } catch (err) {
      console.warn('Erro ao carregar histórico:', err);
    }
  }

  function renderHistoryList() {
    if (!dom.historyList) return;
    if (state.history.length === 0) {
      dom.historyList.innerHTML = '<p class="text-chumbo-400 text-center py-8">Nenhuma transcrição salva no histórico.</p>';
      return;
    }

    dom.historyList.innerHTML = state.history.map(item => `
      <div class="p-3.5 rounded-xl bg-chumbo-50 dark:bg-chumbo-950 border border-chumbo-200 dark:border-chumbo-800 hover:border-royal-500/50 transition cursor-pointer group" data-history-id="${item.id}">
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-2 overflow-hidden">
            <i class="fa-solid fa-file-lines text-royal-700 dark:text-royal-400 shrink-0"></i>
            <span class="font-bold text-chumbo-900 dark:text-chumbo-100 truncate group-hover:text-royal-600 dark:group-hover:text-royal-400 transition">${item.fileName}</span>
          </div>
          <span class="text-[10px] text-chumbo-400 shrink-0">${item.date}</span>
        </div>
        <p class="text-[11px] text-chumbo-500 dark:text-chumbo-400 line-clamp-2">${(item.transcription || '').slice(0, 160)}...</p>
        <div class="mt-2.5 flex items-center justify-between text-[10px] text-chumbo-400 border-t border-chumbo-200/50 dark:border-chumbo-800/50 pt-1.5">
          <span>${(item.words || 0).toLocaleString('pt-BR')} palavras</span>
          <button class="btn-delete-history text-chumbo-400 hover:text-rose-600 dark:hover:text-rose-400 p-1" data-id="${item.id}" title="Excluir">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `).join('');

    // Eventos de clique nos itens do histórico
    dom.historyList.querySelectorAll('[data-history-id]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete-history')) return;
        const id = parseInt(el.getAttribute('data-history-id'), 10);
        const item = state.history.find(h => h.id === id);
        if (item) {
          displayTranscriptionResult(item);
          dom.modalHistory.classList.add('hidden');
          showToast(`Carregada transcrição de "${item.fileName}"`);
        }
      });
    });

    // Evento de exclusão de item individual
    dom.historyList.querySelectorAll('.btn-delete-history').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = parseInt(btn.getAttribute('data-id'), 10);
        if (!state.token) return;

        try {
          await fetch(`/api/history/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${state.token}` }
          });
          state.history = state.history.filter(h => h.id !== id);
          renderHistoryList();
          showToast('Item removido do histórico.');
        } catch (err) {
          showToast('Erro ao remover item.', 'error');
        }
      });
    });
  }

  // ==========================================
  // TOAST NOTIFICATIONS
  // ==========================================
  let toastTimeout = null;
  function showToast(message, type = 'success') {
    if (!dom.toastMessage || !dom.toast) return;
    dom.toastMessage.textContent = message;

    if (type === 'error') {
      dom.toastIcon.className = 'fa-solid fa-circle-exclamation text-rose-400 text-base';
      dom.toast.className = 'fixed bottom-6 right-6 bg-chumbo-900 dark:bg-chumbo-950 border border-rose-500/40 text-white px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 transition-all duration-300 transform translate-y-0 opacity-100';
    } else {
      dom.toastIcon.className = 'fa-solid fa-circle-check text-emerald-400 text-base';
      dom.toast.className = 'fixed bottom-6 right-6 bg-chumbo-900 dark:bg-chumbo-950 border border-emerald-500/40 text-white px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 transition-all duration-300 transform translate-y-0 opacity-100';
    }

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      dom.toast.className = 'fixed bottom-6 right-6 bg-chumbo-900 dark:bg-chumbo-950 border border-chumbo-800 text-white px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 transition-all duration-300 transform translate-y-20 opacity-0 pointer-events-none';
    }, 3500);
  }

  // ==========================================
  // PAINEL ADMINISTRATIVO (EXCLUSIVO DO WILL)
  // ==========================================
  function openAdminModal() {
    if (!dom.modalAdmin) return;
    switchAdminTab('grant');
    hideAdminFeedback();
    dom.modalAdmin.classList.remove('hidden');
  }

  function closeAdminModal() {
    if (dom.modalAdmin) dom.modalAdmin.classList.add('hidden');
  }

  function switchAdminTab(tab) {
    hideAdminFeedback();
    if (tab === 'users') {
      dom.tabAdminUsers.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-royal-700 text-white shadow-xs transition';
      dom.tabAdminGrant.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-chumbo-600 dark:text-chumbo-400 hover:text-chumbo-900 dark:hover:text-white transition';
      dom.paneAdminUsers.classList.remove('hidden');
      dom.paneAdminGrant.classList.add('hidden');
      loadAdminUsers();
    } else {
      dom.tabAdminGrant.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-royal-700 text-white shadow-xs transition';
      dom.tabAdminUsers.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-chumbo-600 dark:text-chumbo-400 hover:text-chumbo-900 dark:hover:text-white transition';
      dom.paneAdminGrant.classList.remove('hidden');
      dom.paneAdminUsers.classList.add('hidden');
    }
  }

  function showAdminFeedback(msg, type = 'success') {
    if (!dom.adminFeedback) return;
    dom.adminFeedback.textContent = msg;
    dom.adminFeedback.classList.remove('hidden');
    if (type === 'error') {
      dom.adminFeedback.className = 'p-3.5 rounded-xl text-xs font-medium bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300';
    } else {
      dom.adminFeedback.className = 'p-3.5 rounded-xl text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300';
    }
  }

  function hideAdminFeedback() {
    if (dom.adminFeedback) {
      dom.adminFeedback.classList.add('hidden');
      dom.adminFeedback.textContent = '';
    }
  }

  async function handleAdminGrantSubmit(e) {
    e.preventDefault();
    const email = dom.adminClientEmail.value.trim();
    const clientName = dom.adminClientName.value.trim();
    const plan = dom.adminSelectPlan.value;

    if (!email) {
      showAdminFeedback('Informe o e-mail do cliente.', 'error');
      return;
    }

    try {
      showAdminFeedback('Processando e liberando acesso...', 'info');
      const res = await fetch('/api/admin/set-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.token}`
        },
        body: JSON.stringify({ email, clientName, plan })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showAdminFeedback(data.message, 'success');
        showToast(data.message);
        dom.adminClientEmail.value = '';
        dom.adminClientName.value = '';
      } else {
        showAdminFeedback(data.message || 'Erro ao liberar plano.', 'error');
      }
    } catch (err) {
      console.error('Erro no admin grant:', err);
      showAdminFeedback('Erro ao conectar com o servidor.', 'error');
    }
  }

  async function loadAdminUsers() {
    if (!dom.adminUsersList) return;
    dom.adminUsersList.innerHTML = '<p class="text-chumbo-400 text-center py-6">Carregando lista de clientes...</p>';

    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${state.token}` }
      });
      const data = await res.json();

      if (res.ok && data.success && data.users) {
        if (dom.adminTotalUsersLabel) dom.adminTotalUsersLabel.textContent = `Total de Clientes: ${data.users.length}`;
        if (data.users.length === 0) {
          dom.adminUsersList.innerHTML = '<p class="text-chumbo-400 text-center py-6">Nenhum cliente cadastrado ainda.</p>';
          return;
        }

        dom.adminUsersList.innerHTML = data.users.map(u => `
          <div class="p-3 rounded-xl bg-chumbo-50 dark:bg-chumbo-950 border border-chumbo-200 dark:border-chumbo-800 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-chumbo-900 dark:text-white">${u.name}</span>
                ${u.role === 'admin' ? '<span class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Admin</span>' : ''}
              </div>
              <p class="text-[11px] text-chumbo-500 dark:text-chumbo-400">${u.email}</p>
            </div>
            <div class="flex items-center gap-2 text-right">
              <div>
                <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${u.plan === 'pro' || u.plan === 'unlimited' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-chumbo-200 text-chumbo-700 dark:bg-chumbo-800 dark:text-chumbo-300'}">
                  ${u.plan.toUpperCase()}
                </span>
                <p class="text-[10px] text-chumbo-500 font-medium mt-0.5">${u.credits} créditos</p>
              </div>
              <button class="btn-quick-grant px-2.5 py-1 text-[11px] font-bold rounded-lg bg-royal-700 text-white hover:bg-royal-800 transition" data-email="${u.email}">
                + Pro
              </button>
            </div>
          </div>
        `).join('');

        // Ação rápida nos botões da lista
        dom.adminUsersList.querySelectorAll('.btn-quick-grant').forEach(btn => {
          btn.addEventListener('click', async () => {
            const email = btn.getAttribute('data-email');
            btn.disabled = true;
            btn.textContent = '...';
            try {
              const res = await fetch('/api/admin/set-plan', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify({ email, plan: 'pro' })
              });
              const data = await res.json();
              if (data.success) {
                showToast(`Plano Pro liberado para ${email}!`);
                loadAdminUsers();
              }
            } catch(e) {
              btn.disabled = false;
              btn.textContent = '+ Pro';
            }
          });
        });

      } else {
        dom.adminUsersList.innerHTML = '<p class="text-rose-500 text-center py-6">Erro ao carregar clientes.</p>';
      }
    } catch (err) {
      dom.adminUsersList.innerHTML = '<p class="text-rose-500 text-center py-6">Erro de conexão.</p>';
    }
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================
  function setupEventListeners() {
    // Alternar Tema Escuro / Claro
    if (dom.btnToggleTheme) {
      dom.btnToggleTheme.addEventListener('click', toggleTheme);
    }

    // Autenticação: Botões Header
    if (dom.btnOpenLogin) {
      dom.btnOpenLogin.addEventListener('click', () => openAuthModal('login'));
    }
    if (dom.btnOpenRegister) {
      dom.btnOpenRegister.addEventListener('click', () => openAuthModal('register'));
    }
    if (dom.btnLogout) {
      dom.btnLogout.addEventListener('click', handleLogout);
    }

    // Modal Autenticação
    if (dom.btnCloseAuthModal) {
      dom.btnCloseAuthModal.addEventListener('click', closeAuthModal);
    }
    if (dom.tabAuthLogin) {
      dom.tabAuthLogin.addEventListener('click', () => switchAuthTab('login'));
    }
    if (dom.tabAuthRegister) {
      dom.tabAuthRegister.addEventListener('click', () => switchAuthTab('register'));
    }
    if (dom.btnSwitchToRegister) {
      dom.btnSwitchToRegister.addEventListener('click', () => switchAuthTab('register'));
    }
    if (dom.btnSwitchToLogin) {
      dom.btnSwitchToLogin.addEventListener('click', () => switchAuthTab('login'));
    }
    if (dom.formLogin) {
      dom.formLogin.addEventListener('submit', handleLoginSubmit);
    }
    if (dom.formRegister) {
      dom.formRegister.addEventListener('submit', handleRegisterSubmit);
    }

    // Toggles de Visibilidade de Senha
    if (dom.btnToggleLoginPass) {
      dom.btnToggleLoginPass.addEventListener('click', () => {
        const isPass = dom.loginPassword.type === 'password';
        dom.loginPassword.type = isPass ? 'text' : 'password';
        dom.btnToggleLoginPass.innerHTML = isPass ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
      });
    }
    if (dom.btnToggleRegisterPass) {
      dom.btnToggleRegisterPass.addEventListener('click', () => {
        const isPass = dom.registerPassword.type === 'password';
        dom.registerPassword.type = isPass ? 'text' : 'password';
        dom.btnToggleRegisterPass.innerHTML = isPass ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
      });
    }

    // Modal Admin (Exclusivo do Dono Will)
    if (dom.btnOpenAdminModal) {
      dom.btnOpenAdminModal.addEventListener('click', openAdminModal);
    }
    if (dom.btnCloseAdminModal) {
      dom.btnCloseAdminModal.addEventListener('click', closeAdminModal);
    }
    if (dom.tabAdminGrant) {
      dom.tabAdminGrant.addEventListener('click', () => switchAdminTab('grant'));
    }
    if (dom.tabAdminUsers) {
      dom.tabAdminUsers.addEventListener('click', () => switchAdminTab('users'));
    }
    if (dom.formAdminGrant) {
      dom.formAdminGrant.addEventListener('submit', handleAdminGrantSubmit);
    }
    if (dom.btnRefreshAdminUsers) {
      dom.btnRefreshAdminUsers.addEventListener('click', loadAdminUsers);
    }

    // Modal de Planos & Pagamento Pix
    if (dom.btnOpenPricingModal) {
      dom.btnOpenPricingModal.addEventListener('click', () => {
        handleBackToPlans();
        dom.modalPricing.classList.remove('hidden');
      });
    }
    if (dom.btnUserPlanBadge) {
      dom.btnUserPlanBadge.addEventListener('click', () => {
        handleBackToPlans();
        dom.modalPricing.classList.remove('hidden');
      });
    }
    if (dom.btnClosePricingModal) {
      dom.btnClosePricingModal.addEventListener('click', () => {
        dom.modalPricing.classList.add('hidden');
      });
    }
    if (dom.btnBackToPlans) {
      dom.btnBackToPlans.addEventListener('click', handleBackToPlans);
    }
    if (dom.btnCopyPixCode) {
      dom.btnCopyPixCode.addEventListener('click', handleCopyPix);
    }
    if (dom.btnConfirmPayment) {
      dom.btnConfirmPayment.addEventListener('click', handleConfirmPayment);
    }
    document.querySelectorAll('.btn-select-plan').forEach(btn => {
      btn.addEventListener('click', () => {
        const plan = btn.getAttribute('data-plan') || 'pro';
        handleSelectPlan(plan);
      });
    });

    // Modal Histórico
    if (dom.btnOpenHistory) {
      dom.btnOpenHistory.addEventListener('click', () => {
        if (!state.user) {
          openAuthModal('login', 'Faça login para ver seu histórico privado de transcrições.');
          return;
        }
        loadUserHistory();
        dom.modalHistory.classList.remove('hidden');
      });
    }
    if (dom.btnCloseHistoryModal) {
      dom.btnCloseHistoryModal.addEventListener('click', () => {
        dom.modalHistory.classList.add('hidden');
      });
    }
    if (dom.btnClearAllHistory) {
      dom.btnClearAllHistory.addEventListener('click', async () => {
        if (!state.token) return;
        if (confirm('Deseja realmente limpar todo o seu histórico privado de transcrições?')) {
          try {
            await fetch('/api/history', {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${state.token}` }
            });
            state.history = [];
            renderHistoryList();
            showToast('Histórico limpo com sucesso.');
          } catch (err) {
            showToast('Erro ao limpar histórico.', 'error');
          }
        }
      });
    }

    // Abas de Entrada (Upload vs Gravar)
    if (dom.tabUpload) {
      dom.tabUpload.addEventListener('click', () => {
        dom.tabUpload.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-royal-700 text-white shadow-sm flex items-center justify-center gap-2 transition';
        dom.tabRecord.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-chumbo-600 dark:text-chumbo-400 hover:text-chumbo-900 dark:hover:text-white flex items-center justify-center gap-2 transition';
        dom.paneUpload.classList.remove('hidden');
        dom.paneRecord.classList.add('hidden');
      });
    }
    if (dom.tabRecord) {
      dom.tabRecord.addEventListener('click', () => {
        dom.tabRecord.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-royal-700 text-white shadow-sm flex items-center justify-center gap-2 transition';
        dom.tabUpload.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-chumbo-600 dark:text-chumbo-400 hover:text-chumbo-900 dark:hover:text-white flex items-center justify-center gap-2 transition';
        dom.paneRecord.classList.remove('hidden');
        dom.paneUpload.classList.add('hidden');
      });
    }

    // Drag and Drop & Seleção de Arquivo
    if (dom.dropZone) {
      dom.dropZone.addEventListener('click', () => dom.fileInput.click());
      dom.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dom.dropZone.classList.add('drag-over');
      });
      dom.dropZone.addEventListener('dragleave', () => {
        dom.dropZone.classList.remove('drag-over');
      });
      dom.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dom.dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          setAudioFile(e.dataTransfer.files[0]);
        }
      });
    }

    if (dom.fileInput) {
      dom.fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          setAudioFile(e.target.files[0]);
        }
      });
    }

    if (dom.btnRemoveFile) {
      dom.btnRemoveFile.addEventListener('click', removeAudioFile);
    }

    // Gravação Microfone
    if (dom.btnRecordToggle) {
      dom.btnRecordToggle.addEventListener('click', toggleRecording);
    }

    // Botão Transcrever
    if (dom.btnTranscribe) {
      dom.btnTranscribe.addEventListener('click', handleTranscribe);
    }

    // Abas de Resultado
    if (dom.resTabTranscribe) dom.resTabTranscribe.addEventListener('click', () => switchResultTab('transcribe'));
    if (dom.resTabSummary) dom.resTabSummary.addEventListener('click', () => switchResultTab('summary'));
    if (dom.resTabSRT) dom.resTabSRT.addEventListener('click', () => switchResultTab('srt'));

    // Edição no Textarea de Transcrição
    if (dom.transcriptionTextArea) {
      dom.transcriptionTextArea.addEventListener('input', () => {
        updateWordCount(dom.transcriptionTextArea.value);
        dom.srtTextArea.value = generateSRT(dom.transcriptionTextArea.value);
      });
    }

    // Ações de Exportação
    if (dom.btnExportPDF) {
      dom.btnExportPDF.addEventListener('click', handleExportPDF);
    }
    if (dom.btnCopyText) {
      dom.btnCopyText.addEventListener('click', handleCopy);
    }

    // Dropdown de Downloads
    if (dom.btnDownloadDropdown) {
      dom.btnDownloadDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        dom.downloadMenu.classList.toggle('hidden');
      });
      document.addEventListener('click', () => {
        dom.downloadMenu.classList.add('hidden');
      });
    }

    if (dom.btnDownloadTXT) {
      dom.btnDownloadTXT.addEventListener('click', () => {
        const text = dom.transcriptionTextArea.value;
        const baseName = (state.selectedFile ? state.selectedFile.name.replace(/\.[^/.]+$/, '') : 'transcricao');
        downloadFile(text, `${baseName}-transcricao.txt`, 'text/plain;charset=utf-8');
      });
    }

    if (dom.btnDownloadSRT) {
      dom.btnDownloadSRT.addEventListener('click', () => {
        const srt = dom.srtTextArea.value;
        const baseName = (state.selectedFile ? state.selectedFile.name.replace(/\.[^/.]+$/, '') : 'legendas');
        downloadFile(srt, `${baseName}.srt`, 'text/plain;charset=utf-8');
      });
    }

    if (dom.btnDownloadMD) {
      dom.btnDownloadMD.addEventListener('click', () => {
        const text = dom.transcriptionTextArea.value;
        const summary = dom.summaryContent ? dom.summaryContent.textContent : '';
        const points = dom.keyPointsContent ? dom.keyPointsContent.textContent : '';
        const actions = dom.actionItemsContent ? dom.actionItemsContent.textContent : '';
        const baseName = (state.selectedFile ? state.selectedFile.name.replace(/\.[^/.]+$/, '') : 'transcricao');

        let md = `# Transcrição de Áudio: ${baseName}\n\n`;
        md += `*Data: ${new Date().toLocaleString('pt-BR')}*\n\n`;
        md += `## Transcrição Completa\n\n${text}\n\n`;
        if (summary && !summary.includes('Nenhum')) {
          md += `## Resumo Executivo\n\n${summary}\n\n`;
        }
        if (points && !points.includes('Nenhum')) {
          md += `## Pontos-Chave & Decisões\n\n${points}\n\n`;
        }
        if (actions && !actions.includes('Nenhuma')) {
          md += `## Próximos Passos & Ações\n\n${actions}\n\n`;
        }

        downloadFile(md, `${baseName}-relatorio.md`, 'text/markdown;charset=utf-8');
      });
    }

    if (dom.btnPrint) {
      dom.btnPrint.addEventListener('click', () => {
        window.print();
      });
    }

    // Fechar modais com tecla ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (dom.modalAuth) dom.modalAuth.classList.add('hidden');
        if (dom.modalHistory) dom.modalHistory.classList.add('hidden');
        if (dom.modalPricing) dom.modalPricing.classList.add('hidden');
        if (dom.modalAdmin) dom.modalAdmin.classList.add('hidden');
      }
    });
  }

  // Inicializa a aplicação
  init();
});
