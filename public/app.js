// Transcritor de Áudio AI - Frontend Logic

document.addEventListener('DOMContentLoaded', () => {
  // Estado da Aplicação
  const state = {
    selectedFile: null,
    recordedBlob: null,
    isRecording: false,
    mediaRecorder: null,
    recordTimerInterval: null,
    recordSeconds: 0,
    serverHasApiKey: false,
    currentResult: null,
    history: []
  };

  // Elementos do DOM
  const dom = {
    // Header & Key
    btnOpenKeyModal: document.getElementById('btnOpenKeyModal'),
    btnCloseKeyModal: document.getElementById('btnCloseKeyModal'),
    modalKey: document.getElementById('modalKey'),
    inputApiKey: document.getElementById('inputApiKey'),
    btnToggleKeyVisibility: document.getElementById('btnToggleKeyVisibility'),
    btnSaveKey: document.getElementById('btnSaveKey'),
    btnClearKey: document.getElementById('btnClearKey'),
    keyValidationFeedback: document.getElementById('keyValidationFeedback'),
    keyStatusDot: document.getElementById('keyStatusDot'),
    keyStatusText: document.getElementById('keyStatusText'),
    noKeyWarning: document.getElementById('noKeyWarning'),

    // History Modal
    btnOpenHistory: document.getElementById('btnOpenHistory'),
    btnCloseHistoryModal: document.getElementById('btnCloseHistoryModal'),
    modalHistory: document.getElementById('modalHistory'),
    historyList: document.getElementById('historyList'),
    btnClearAllHistory: document.getElementById('btnClearAllHistory'),

    // Tabs de Entrada
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

    // Gravação
    btnRecordToggle: document.getElementById('btnRecordToggle'),
    recordIcon: document.getElementById('recordIcon'),
    recordPulse: document.getElementById('recordPulse'),
    recordTimer: document.getElementById('recordTimer'),
    recordStatus: document.getElementById('recordStatus'),
    recordAudioPreview: document.getElementById('recordAudioPreview'),
    recordAudioElement: document.getElementById('recordAudioElement'),

    // Opções
    selectModel: document.getElementById('selectModel'),
    selectOutputFormat: document.getElementById('selectOutputFormat'),
    checkSpeakers: document.getElementById('checkSpeakers'),
    checkTimestamps: document.getElementById('checkTimestamps'),
    checkSummary: document.getElementById('checkSummary'),
    selectLanguage: document.getElementById('selectLanguage'),
    customInstructions: document.getElementById('customInstructions'),
    btnTranscribe: document.getElementById('btnTranscribe'),

    // Loading & Resultados
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

    // Ações
    btnExportPDF: document.getElementById('btnExportPDF'),
    btnCopyText: document.getElementById('btnCopyText'),
    btnDownloadDropdown: document.getElementById('btnDownloadDropdown'),
    downloadMenu: document.getElementById('downloadMenu'),
    btnDownloadTXT: document.getElementById('btnDownloadTXT'),
    btnDownloadSRT: document.getElementById('btnDownloadSRT'),
    btnDownloadMD: document.getElementById('btnDownloadMD'),
    btnPrint: document.getElementById('btnPrint'),

    // Toast
    toast: document.getElementById('toastNotification'),
    toastMessage: document.getElementById('toastMessage'),
    toastIcon: document.getElementById('toastIcon')
  };

  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================
  async function init() {
    loadLocalApiKey();
    loadHistory();
    await checkServerStatus();
    setupEventListeners();
  }

  // Verifica status do servidor
  async function checkServerStatus() {
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      state.serverHasApiKey = data.hasServerApiKey;
      updateKeyStatusUI();
    } catch (e) {
      console.warn('Não foi possível verificar status do servidor:', e);
    }
  }

  // ==========================================
  // GERENCIAMENTO DA CHAVE API
  // ==========================================
  function getStoredApiKey() {
    return localStorage.getItem('gemini_api_key') || '';
  }

  function loadLocalApiKey() {
    const key = getStoredApiKey();
    if (key) {
      dom.inputApiKey.value = key;
    }
    updateKeyStatusUI();
  }

  function updateKeyStatusUI() {
    const localKey = getStoredApiKey();
    const hasKey = Boolean(localKey || state.serverHasApiKey);

    if (hasKey) {
      dom.keyStatusDot.className = 'w-2 h-2 rounded-full bg-emerald-400';
      dom.keyStatusText.textContent = localKey ? 'Chave Conectada' : 'Chave do Servidor (.env)';
      dom.keyStatusText.className = 'font-medium text-emerald-300';
      dom.noKeyWarning.classList.add('hidden');
    } else {
      dom.keyStatusDot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
      dom.keyStatusText.textContent = 'Configurar Chave API';
      dom.keyStatusText.className = 'font-medium text-slate-300';
      dom.noKeyWarning.classList.remove('hidden');
    }
  }

  async function handleSaveKey() {
    const key = dom.inputApiKey.value.trim();
    if (!key) {
      showKeyFeedback('Por favor, insira uma chave.', 'error');
      return;
    }

    showKeyFeedback('Validando chave com Google AI...', 'info');
    dom.btnSaveKey.disabled = true;

    try {
      const res = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key })
      });
      const data = await res.json();

      if (data.valid) {
        localStorage.setItem('gemini_api_key', key);
        showKeyFeedback('Chave validada e salva com sucesso!', 'success');
        updateKeyStatusUI();
        showToast('Chave da API Gemini configurada!');
        setTimeout(() => {
          dom.modalKey.classList.add('hidden');
          dom.keyValidationFeedback.classList.add('hidden');
        }, 1200);
      } else {
        showKeyFeedback(data.error || 'Chave inválida. Verifique e tente novamente.', 'error');
      }
    } catch (err) {
      showKeyFeedback('Erro ao conectar ao servidor para validar a chave.', 'error');
    } finally {
      dom.btnSaveKey.disabled = false;
    }
  }

  function handleClearKey() {
    localStorage.removeItem('gemini_api_key');
    dom.inputApiKey.value = '';
    updateKeyStatusUI();
    showKeyFeedback('Chave removida do navegador.', 'info');
    showToast('Chave removida');
  }

  function showKeyFeedback(msg, type) {
    dom.keyValidationFeedback.classList.remove('hidden', 'bg-rose-950/50', 'text-rose-300', 'border-rose-700', 'bg-emerald-950/50', 'text-emerald-300', 'border-emerald-700', 'bg-indigo-950/50', 'text-indigo-300', 'border-indigo-700');
    dom.keyValidationFeedback.classList.add('border');

    if (type === 'error') {
      dom.keyValidationFeedback.classList.add('bg-rose-950/50', 'text-rose-300', 'border-rose-700');
    } else if (type === 'success') {
      dom.keyValidationFeedback.classList.add('bg-emerald-950/50', 'text-emerald-300', 'border-emerald-700');
    } else {
      dom.keyValidationFeedback.classList.add('bg-indigo-950/50', 'text-indigo-300', 'border-indigo-700');
    }
    dom.keyValidationFeedback.textContent = msg;
  }

  // ==========================================
  // ARQUIVOS & DRAG-AND-DROP
  // ==========================================
  function setAudioFile(file) {
    if (!file) return;

    state.selectedFile = file;
    state.recordedBlob = null; // Limpa gravado anterior se houver
    dom.recordAudioPreview.classList.add('hidden');

    dom.fileName.textContent = file.name;
    dom.fileSize.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    // Atualiza preview de áudio
    const objectUrl = URL.createObjectURL(file);
    dom.audioElement.src = objectUrl;

    dom.dropZone.classList.add('hidden');
    dom.filePreview.classList.remove('hidden');
  }

  function removeAudioFile() {
    state.selectedFile = null;
    dom.fileInput.value = '';
    dom.audioElement.src = '';
    dom.filePreview.classList.add('hidden');
    dom.dropZone.classList.remove('hidden');
  }

  // ==========================================
  // GRAVAÇÃO DE MICROFONE AO VIVO
  // ==========================================
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
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      }

      state.mediaRecorder = new MediaRecorder(stream, { mimeType });
      const chunks = [];

      state.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      state.mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        state.recordedBlob = blob;
        state.selectedFile = new File([blob], `gravacao-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.webm`, { type: mimeType });
        
        dom.recordAudioElement.src = URL.createObjectURL(blob);
        dom.recordAudioPreview.classList.remove('hidden');
        dom.recordStatus.textContent = 'Gravação concluída! Pronto para transcrever.';
        
        // Desliga tracks do microfone
        stream.getTracks().forEach(track => track.stop());
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
      showToast('Permissão de microfone negada ou indisponível.', 'error');
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
  }

  function updateRecordTimerUI() {
    const mins = String(Math.floor(state.recordSeconds / 60)).padStart(2, '0');
    const secs = String(state.recordSeconds % 60).padStart(2, '0');
    dom.recordTimer.textContent = `${mins}:${secs}`;
  }

  // ==========================================
  // TRANSCRIÇÃO DE ÁUDIO (CHAMADA PRINCIPAL)
  // ==========================================
  async function handleTranscribe() {
    const file = state.selectedFile;
    if (!file) {
      showToast('Por favor, selecione um arquivo de áudio ou grave pelo microfone.', 'error');
      return;
    }

    const apiKey = getStoredApiKey();
    if (!apiKey && !state.serverHasApiKey) {
      dom.modalKey.classList.remove('hidden');
      showKeyFeedback('Informe sua chave da API Gemini para continuar.', 'error');
      return;
    }

    // Prepara Form Data
    const formData = new FormData();
    formData.append('audio', file);
    if (apiKey) formData.append('apiKey', apiKey);
    formData.append('model', dom.selectModel.value);
    formData.append('outputFormat', dom.selectOutputFormat ? dom.selectOutputFormat.value : 'summary_points');
    formData.append('detectSpeakers', dom.checkSpeakers.checked);
    formData.append('includeTimestamps', dom.checkTimestamps.checked);
    formData.append('generateSummary', dom.checkSummary.checked);
    formData.append('targetLanguage', dom.selectLanguage.value);
    formData.append('customInstructions', dom.customInstructions.value);

    // Atualiza UI de Loading
    startLoadingAnimation();

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao processar áudio.');
      }

      // Sucesso!
      displayTranscriptionResult(data);
      saveToHistory(data);
      showToast('Transcrição concluída com sucesso!');

    } catch (error) {
      console.error('Erro na transcrição:', error);
      showToast(error.message || 'Erro durante a transcrição.', 'error');
      
      // Se for erro de autenticação, abre modal da chave
      if (error.message.includes('API_KEY_INVALID') || error.message.includes('Chave da API')) {
        dom.modalKey.classList.remove('hidden');
        showKeyFeedback('A chave fornecida parece inválida ou expirou. Verifique.', 'error');
      }
    } finally {
      stopLoadingAnimation();
    }
  }

  // Animação de Loading com Etapas
  let loadingStepsInterval = null;
  function startLoadingAnimation() {
    dom.btnTranscribe.disabled = true;
    dom.loadingCard.classList.remove('hidden');
    dom.emptyResultState.classList.add('hidden');
    dom.paneResTranscribe.classList.add('hidden');
    dom.paneResSummary.classList.add('hidden');
    dom.paneResSRT.classList.add('hidden');

    const steps = [
      { title: 'Enviando áudio...', sub: 'Fazendo upload seguro para processamento' },
      { title: 'Gemini ouvindo áudio...', sub: 'Reconhecendo vozes, entonação e palavras' },
      { title: 'Formatando falas...', sub: 'Aplicando pontuação e organizando parágrafos' },
      { title: 'Finalizando detalhes...', sub: 'Gerando resumos e marcações de tempo' }
    ];

    let stepIndex = 0;
    dom.loadingTitle.textContent = steps[0].title;
    dom.loadingSubtitle.textContent = steps[0].sub;

    loadingStepsInterval = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
      dom.loadingTitle.textContent = steps[stepIndex].title;
      dom.loadingSubtitle.textContent = steps[stepIndex].sub;
    }, 4500);
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
    dom.summaryContent.textContent = data.summary || 'Nenhum resumo solicitado ou gerado.';
    dom.keyPointsContent.textContent = data.keyPoints || 'Nenhum ponto registrado.';
    dom.actionItemsContent.textContent = data.actionItems || 'Nenhuma ação detectada.';

    // Geração de Legendas SRT
    const srtText = generateSRT(transcription);
    dom.srtTextArea.value = srtText;

    // Contagem de Palavras e Caracteres
    updateWordCount(transcription);

    // Rodapé
    dom.footerFileName.textContent = data.fileName || 'áudio';
    dom.footerModel.textContent = `Modelo: ${data.modelUsed || 'Gemini 3.8'}`;
    dom.resultFooter.classList.remove('hidden');

    // Mostra painel de transcrição
    switchResultTab('transcribe');
  }

  function updateWordCount(text) {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const chars = text.length;
    dom.wordCountLabel.textContent = `${words.toLocaleString()} palavras • ${chars.toLocaleString()} caracteres`;
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

    dom.resTabTranscribe.className = 'px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-400 hover:text-white flex items-center gap-2 transition';
    dom.resTabSummary.className = 'px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-400 hover:text-white flex items-center gap-2 transition';
    dom.resTabSRT.className = 'px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-400 hover:text-white flex items-center gap-2 transition';

    if (tab === 'transcribe') {
      dom.paneResTranscribe.classList.remove('hidden');
      dom.resTabTranscribe.className = 'px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white flex items-center gap-2 transition';
    } else if (tab === 'summary') {
      dom.paneResSummary.classList.remove('hidden');
      dom.resTabSummary.className = 'px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white flex items-center gap-2 transition';
    } else if (tab === 'srt') {
      dom.paneResSRT.classList.remove('hidden');
      dom.resTabSRT.className = 'px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white flex items-center gap-2 transition';
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
    showToast(`Arquivo ${fileName} baixado!`);
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

  // Gera Relatório Formatado em PDF
  async function handleExportPDF() {
    if (!dom.transcriptionTextArea.value.trim()) {
      showToast('Nenhum resultado para exportar em PDF.', 'error');
      return;
    }

    showToast('Gerando PDF profissional com formatação...');

    const data = state.currentResult || {};
    const fileName = data.fileName || (state.selectedFile ? state.selectedFile.name : 'audio');
    const cleanName = fileName.replace(/\.[^/.]+$/, '');
    const transcription = dom.transcriptionTextArea.value;
    const summary = dom.summaryContent ? dom.summaryContent.textContent : '';
    const keyPoints = dom.keyPointsContent ? dom.keyPointsContent.textContent : '';
    const actionItems = dom.actionItemsContent ? dom.actionItemsContent.textContent : '';
    const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const wordCount = transcription.trim() ? transcription.trim().split(/\s+/).length : 0;

    // Constrói container para renderização do PDF
    const container = document.createElement('div');
    container.style.padding = '30px';
    container.style.fontFamily = "'Inter', Arial, sans-serif";
    container.style.color = '#1e293b';
    container.style.background = '#ffffff';
    container.style.fontSize = '12px';
    container.style.lineHeight = '1.6';

    let html = `
      <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <h1 style="font-size: 20px; font-weight: 700; color: #1e1b4b; margin: 0;">Relatório de Transcrição & Análise</h1>
          <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">Inteligência Artificial Corporativa • Google Gemini</p>
        </div>
        <div style="text-align: right; font-size: 10px; color: #64748b;">
          <div><strong>Data:</strong> ${dateStr}</div>
          <div><strong>Arquivo:</strong> ${fileName}</div>
        </div>
      </div>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; margin-bottom: 20px; display: flex; justify-content: space-between; font-size: 11px;">
        <div><strong>Arquivo:</strong> ${fileName}</div>
        <div><strong>Modelo:</strong> ${data.modelUsed || 'Gemini 3.8 Flash'}</div>
        <div><strong>Total de Palavras:</strong> ${wordCount.toLocaleString()}</div>
      </div>
    `;

    if (summary && !summary.includes('Nenhum')) {
      html += `
        <div style="margin-bottom: 16px;">
          <h2 style="font-size: 13px; font-weight: 700; color: #4338ca; border-left: 4px solid #4f46e5; padding-left: 8px; margin-bottom: 8px;">
            📌 Resumo Executivo
          </h2>
          <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 6px; padding: 12px; font-size: 11px; color: #1e293b; white-space: pre-wrap; line-height: 1.6;">${summary}</div>
        </div>
      `;
    }

    if (keyPoints && !keyPoints.includes('Nenhum')) {
      html += `
        <div style="margin-bottom: 16px;">
          <h2 style="font-size: 13px; font-weight: 700; color: #047857; border-left: 4px solid #10b981; padding-left: 8px; margin-bottom: 8px;">
            💡 Pontos-Chave & Tópicos Discutidos
          </h2>
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 12px; font-size: 11px; color: #064e3b; white-space: pre-wrap; line-height: 1.6;">${keyPoints}</div>
        </div>
      `;
    }

    if (actionItems && !actionItems.includes('Nenhuma')) {
      html += `
        <div style="margin-bottom: 16px;">
          <h2 style="font-size: 13px; font-weight: 700; color: #b45309; border-left: 4px solid #f59e0b; padding-left: 8px; margin-bottom: 8px;">
            📋 Próximos Passos & Deliberações
          </h2>
          <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 12px; font-size: 11px; color: #78350f; white-space: pre-wrap; line-height: 1.6;">${actionItems}</div>
        </div>
      `;
    }

    html += `
      <div style="margin-top: 20px;">
        <h2 style="font-size: 13px; font-weight: 700; color: #1e293b; border-left: 4px solid #64748b; padding-left: 8px; margin-bottom: 8px;">
          📝 Transcrição Integral do Áudio
        </h2>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; font-size: 11px; color: #334155; line-height: 1.7; white-space: pre-wrap;">${transcription}</div>
      </div>

      <div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 9px; color: #94a3b8;">
        Relatório gerado automaticamente • Transcritor AI • Todos os direitos reservados
      </div>
    `;

    container.innerHTML = html;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Relatorio-Transcricao-${cleanName}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      if (window.html2pdf) {
        await window.html2pdf().set(opt).from(container).save();
        showToast('Relatório PDF baixado com sucesso!');
      } else {
        window.print();
      }
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      window.print();
    }
  }

  // ==========================================
  // HISTÓRICO LOCAL
  // ==========================================
  function loadHistory() {
    try {
      const stored = localStorage.getItem('transcription_history');
      state.history = stored ? JSON.parse(stored) : [];
      renderHistoryList();
    } catch (e) {
      state.history = [];
    }
  }

  function saveToHistory(data) {
    const item = {
      id: Date.now(),
      date: new Date().toLocaleString('pt-BR'),
      fileName: data.fileName || 'áudio',
      modelUsed: data.modelUsed,
      transcription: data.transcription,
      summary: data.summary,
      keyPoints: data.keyPoints,
      actionItems: data.actionItems,
      words: data.transcription ? data.transcription.split(/\s+/).length : 0
    };

    state.history.unshift(item);
    if (state.history.length > 20) state.history.pop(); // Mantém os últimos 20
    localStorage.setItem('transcription_history', JSON.stringify(state.history));
    renderHistoryList();
  }

  function renderHistoryList() {
    if (!dom.historyList) return;
    if (state.history.length === 0) {
      dom.historyList.innerHTML = '<p class="text-slate-500 text-center py-8">Nenhuma transcrição salva no histórico.</p>';
      return;
    }

    dom.historyList.innerHTML = state.history.map(item => `
      <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-indigo-500/50 transition cursor-pointer group" data-history-id="${item.id}">
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-2 overflow-hidden">
            <i class="fa-solid fa-file-lines text-indigo-400 shrink-0"></i>
            <span class="font-semibold text-slate-200 truncate group-hover:text-indigo-300 transition">${item.fileName}</span>
          </div>
          <span class="text-[10px] text-slate-500 shrink-0">${item.date}</span>
        </div>
        <p class="text-[11px] text-slate-400 line-clamp-2">${item.transcription.slice(0, 160)}...</p>
        <div class="mt-2 flex items-center justify-between text-[10px] text-slate-500">
          <span>${item.words.toLocaleString()} palavras</span>
          <button class="btn-delete-history text-slate-500 hover:text-rose-400 p-1" data-id="${item.id}" title="Excluir">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `).join('');

    // Eventos nos itens do histórico
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

    dom.historyList.querySelectorAll('.btn-delete-history').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.getAttribute('data-id'), 10);
        state.history = state.history.filter(h => h.id !== id);
        localStorage.setItem('transcription_history', JSON.stringify(state.history));
        renderHistoryList();
        showToast('Item removido do histórico');
      });
    });
  }

  // ==========================================
  // TOAST NOTIFICATIONS
  // ==========================================
  let toastTimeout = null;
  function showToast(message, type = 'success') {
    dom.toastMessage.textContent = message;
    if (type === 'error') {
      dom.toastIcon.className = 'fa-solid fa-circle-exclamation text-rose-400 text-base';
      dom.toast.className = 'fixed bottom-6 right-6 bg-slate-900 border border-rose-500/40 text-slate-100 px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 transition-all duration-300 transform translate-y-0 opacity-100';
    } else {
      dom.toastIcon.className = 'fa-solid fa-circle-check text-emerald-400 text-base';
      dom.toast.className = 'fixed bottom-6 right-6 bg-slate-900 border border-emerald-500/40 text-slate-100 px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 transition-all duration-300 transform translate-y-0 opacity-100';
    }

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      dom.toast.className = 'fixed bottom-6 right-6 bg-slate-900 border border-slate-700 text-slate-100 px-4 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 transition-all duration-300 transform translate-y-20 opacity-0 pointer-events-none';
    }, 3500);
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================
  function setupEventListeners() {
    // Modal Chave API
    dom.btnOpenKeyModal.addEventListener('click', () => {
      dom.modalKey.classList.remove('hidden');
    });

    dom.btnCloseKeyModal.addEventListener('click', () => {
      dom.modalKey.classList.add('hidden');
    });

    dom.btnToggleKeyVisibility.addEventListener('click', () => {
      const isPassword = dom.inputApiKey.type === 'password';
      dom.inputApiKey.type = isPassword ? 'text' : 'password';
      dom.btnToggleKeyVisibility.innerHTML = isPassword ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
    });

    dom.btnSaveKey.addEventListener('click', handleSaveKey);
    dom.btnClearKey.addEventListener('click', handleClearKey);

    // Modal Histórico
    dom.btnOpenHistory.addEventListener('click', () => {
      renderHistoryList();
      dom.modalHistory.classList.remove('hidden');
    });

    dom.btnCloseHistoryModal.addEventListener('click', () => {
      dom.modalHistory.classList.add('hidden');
    });

    dom.btnClearAllHistory.addEventListener('click', () => {
      if (confirm('Deseja realmente limpar todo o histórico de transcrições?')) {
        state.history = [];
        localStorage.removeItem('transcription_history');
        renderHistoryList();
        showToast('Histórico limpo');
      }
    });

    // Abas de Entrada (Upload vs Gravar)
    dom.tabUpload.addEventListener('click', () => {
      dom.tabUpload.className = 'flex-1 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white shadow-sm flex items-center justify-center gap-2 transition';
      dom.tabRecord.className = 'flex-1 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white flex items-center justify-center gap-2 transition';
      dom.paneUpload.classList.remove('hidden');
      dom.paneRecord.classList.add('hidden');
    });

    dom.tabRecord.addEventListener('click', () => {
      dom.tabRecord.className = 'flex-1 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white shadow-sm flex items-center justify-center gap-2 transition';
      dom.tabUpload.className = 'flex-1 py-2 text-xs font-semibold rounded-lg text-slate-400 hover:text-white flex items-center justify-center gap-2 transition';
      dom.paneRecord.classList.remove('hidden');
      dom.paneUpload.classList.add('hidden');
    });

    // Drag and Drop & Seleção de Arquivo
    dom.dropZone.addEventListener('click', () => dom.fileInput.click());

    dom.fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        setAudioFile(e.target.files[0]);
      }
    });

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

    dom.btnRemoveFile.addEventListener('click', removeAudioFile);

    // Gravação ao Vivo
    dom.btnRecordToggle.addEventListener('click', toggleRecording);

    // Botão Transcrever
    dom.btnTranscribe.addEventListener('click', handleTranscribe);

    // Abas de Resultado
    dom.resTabTranscribe.addEventListener('click', () => switchResultTab('transcribe'));
    dom.resTabSummary.addEventListener('click', () => switchResultTab('summary'));
    dom.resTabSRT.addEventListener('click', () => switchResultTab('srt'));

    // Edição no Textarea de Transcrição
    dom.transcriptionTextArea.addEventListener('input', () => {
      updateWordCount(dom.transcriptionTextArea.value);
      dom.srtTextArea.value = generateSRT(dom.transcriptionTextArea.value);
    });

    // Ações de Resultado
    if (dom.btnExportPDF) {
      dom.btnExportPDF.addEventListener('click', handleExportPDF);
    }
    dom.btnCopyText.addEventListener('click', handleCopy);

    dom.btnDownloadDropdown.addEventListener('click', (e) => {
      e.stopPropagation();
      dom.downloadMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
      dom.downloadMenu.classList.add('hidden');
    });

    dom.btnDownloadTXT.addEventListener('click', () => {
      const text = dom.transcriptionTextArea.value;
      const baseName = (state.selectedFile ? state.selectedFile.name.replace(/\.[^/.]+$/, '') : 'transcricao');
      downloadFile(text, `${baseName}-transcricao.txt`, 'text/plain;charset=utf-8');
    });

    dom.btnDownloadSRT.addEventListener('click', () => {
      const srt = dom.srtTextArea.value;
      const baseName = (state.selectedFile ? state.selectedFile.name.replace(/\.[^/.]+$/, '') : 'legendas');
      downloadFile(srt, `${baseName}.srt`, 'text/plain;charset=utf-8');
    });

    dom.btnDownloadMD.addEventListener('click', () => {
      const text = dom.transcriptionTextArea.value;
      const summary = dom.summaryContent.textContent;
      const points = dom.keyPointsContent.textContent;
      const actions = dom.actionItemsContent.textContent;
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

    dom.btnPrint.addEventListener('click', () => {
      window.print();
    });

    // Fechar modais com tecla ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        dom.modalKey.classList.add('hidden');
        dom.modalHistory.classList.add('hidden');
      }
    });
  }

  // Inicializa o app
  init();
});
