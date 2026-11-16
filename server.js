import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createPixPayment } from './pix.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Garante que o diretório de uploads temporários existe
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuração do Multer para upload de áudios
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp3';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `audio-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // Limite de 100 MB por arquivo
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper para obter cliente Gemini (usa chave enviada na requisição ou do .env)
function getGeminiClient(customApiKey) {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Chave da API do Gemini não configurada. Por favor, informe sua chave do Google AI Studio nas configurações.');
  }
  return new GoogleGenAI({ apiKey: apiKey.trim() });
}

// Endpoint de status da aplicação
app.get('/api/status', (req, res) => {
  const hasServerKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');
  res.json({
    ok: true,
    hasServerApiKey: hasServerKey,
    defaultPort: PORT
  });
});

// Endpoint para testar validade de uma API Key
app.post('/api/validate-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
      return res.status(400).json({ valid: false, error: 'A chave da API não foi fornecida.' });
    }

    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    // Faz uma chamada rápida de teste
    const testResult = await ai.interactions.create({
      model: 'gemini-3.5-flash-lite',
      input: 'Responda apenas "OK" se estiver funcionando.'
    });

    res.json({
      valid: true,
      message: 'Chave de API validada com sucesso!',
      response: testResult.output_text || 'OK'
    });
  } catch (error) {
    console.error('Erro na validação da chave:', error);
    res.status(400).json({
      valid: false,
      error: error.message || 'Chave da API inválida ou sem permissão.'
    });
  }
});

// Endpoint para gerar cobrança Pix
app.post('/api/create-pix', async (req, res) => {
  try {
    const { plan = 'pro' } = req.body;

    const planConfig = {
      single: { title: 'Transcrição Avulsa', amount: 9.90 },
      pro: { title: 'Plano Pro Mensal', amount: 29.90 },
      unlimited: { title: 'Plano Escritório Ilimitado', amount: 79.90 }
    };

    const selected = planConfig[plan] || planConfig.pro;
    const pixKey = process.env.PIX_KEY || 'wilsonbrenomkt@gmail.com';
    const pixName = process.env.PIX_NAME || 'Transcritor do Will';
    const pixCity = process.env.PIX_CITY || 'SAO PAULO';
    const txId = `TRW${Date.now().toString(36).slice(-6).toUpperCase()}`;

    const pixData = await createPixPayment({
      key: pixKey,
      name: pixName,
      city: pixCity,
      amount: selected.amount,
      txId
    });

    res.json({
      success: true,
      plan,
      planTitle: selected.title,
      amount: selected.amount,
      pixCode: pixData.pixCode,
      qrCodeDataUrl: pixData.qrCodeDataUrl,
      beneficiary: pixName,
      txId
    });
  } catch (error) {
    console.error('Erro ao gerar Pix:', error);
    res.status(500).json({ success: false, error: 'Falha ao gerar cobrança Pix.' });
  }
});

// Mapeamento de extensões para MIME types suportados
function getAudioMimeType(filePath, originalMimeType) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.mp3': 'audio/mp3',
    '.wav': 'audio/wav',
    '.m4a': 'audio/m4a',
    '.aac': 'audio/aac',
    '.ogg': 'audio/ogg',
    '.opus': 'audio/ogg',
    '.webm': 'audio/webm',
    '.flac': 'audio/flac',
    '.aiff': 'audio/aiff',
    '.aif': 'audio/aiff',
    '.wma': 'audio/x-ms-wma'
  };

  if (map[ext]) return map[ext];
  if (originalMimeType && originalMimeType.startsWith('audio/')) return originalMimeType;
  return 'audio/mp3';
}

// Constrói o prompt adequado para transcrição
function buildTranscriptionPrompt({
  detectSpeakers,
  includeTimestamps,
  outputFormat = 'summary_points',
  targetLanguage,
  customInstructions
}) {
  const instructions = [];

  instructions.push('Você é um assistente especialista de transcrição e análise de áudio profissional de alto nível.');
  instructions.push('Sua tarefa principal é transcrever o áudio com máxima fidelidade e precisão.');
  instructions.push('Mantenha pontuação impecável, acentuação e divida as falas em parágrafos coerentes.');

  if (targetLanguage === 'translate_pt') {
    instructions.push('ATENÇÃO: Transcreva e TRADUZA todo o conteúdo diretamente para Português do Brasil com naturalidade.');
  } else if (targetLanguage && targetLanguage !== 'auto') {
    instructions.push(`Idioma alvo desejado para a transcrição: ${targetLanguage}.`);
  }

  if (detectSpeakers === 'true' || detectSpeakers === true) {
    instructions.push('IDENTIFICAÇÃO DE FALANTES: Identifique com clareza os diferentes interlocutores (exemplo: "Falante 1:", "Falante 2:" ou os nomes caso citados no áudio).');
  }

  if (includeTimestamps === 'true' || includeTimestamps === true) {
    instructions.push('MARCADORES DE TEMPO (TIMESTAMPS): Inclua marcadores no formato [MM:SS] no início de cada parágrafo ou quando houver mudança de fala.');
  }

  if (customInstructions && customInstructions.trim()) {
    instructions.push(`INSTRUÇÕES / VOCABULÁRIO ESPECÍFICO: ${customInstructions.trim()}`);
  }

  instructions.push('');
  instructions.push('ESTRUTURA DA RESPOSTA:');

  if (outputFormat === 'meeting_minutes') {
    instructions.push('Por favor, formate sua resposta rigorosamente nas seguintes seções:');
    instructions.push('## Transcrição Completa');
    instructions.push('(texto integral e fiel do áudio)');
    instructions.push('');
    instructions.push('## Resumo Executivo');
    instructions.push('(síntese executiva do objetivo e conclusão da reunião)');
    instructions.push('');
    instructions.push('## Pontos-Chave & Decisões');
    instructions.push('(itens discutidos, deliberações e acordos firmados em tópicos/bullet points)');
    instructions.push('');
    instructions.push('## Próximos Passos & Ações');
    instructions.push('(tabela ou lista com: Ação, Responsável identificado e Prazos/Compromissos)');
  } else if (outputFormat === 'social_content') {
    instructions.push('Por favor, formate sua resposta rigorosamente nas seguintes seções:');
    instructions.push('## Transcrição Completa');
    instructions.push('(texto integral do áudio)');
    instructions.push('');
    instructions.push('## Resumo Executivo');
    instructions.push('(visão geral do tema abordado)');
    instructions.push('');
    instructions.push('## Pontos-Chave & Decisões');
    instructions.push('(as 5 maiores lições ou insights em bullet points envolventes)');
    instructions.push('');
    instructions.push('## Próximos Passos & Ações');
    instructions.push('(um post pronto para LinkedIn/Instagram com gancho cativante, tópicos centrais e chamada para ação final)');
  } else if (outputFormat === 'faq') {
    instructions.push('Por favor, formate sua resposta rigorosamente nas seguintes seções:');
    instructions.push('## Transcrição Completa');
    instructions.push('(texto integral do áudio)');
    instructions.push('');
    instructions.push('## Resumo Executivo');
    instructions.push('(resumo do contexto e temas tratados)');
    instructions.push('');
    instructions.push('## Pontos-Chave & Decisões');
    instructions.push('(lista de Perguntas e Respostas detalhadas com base no que foi discutido)');
    instructions.push('');
    instructions.push('## Próximos Passos & Ações');
    instructions.push('(conclusões e recomendações finais)');
  } else if (outputFormat === 'summary_points') {
    instructions.push('Por favor, formate sua resposta rigorosamente nas seguintes seções:');
    instructions.push('## Transcrição Completa');
    instructions.push('(coloque aqui o texto integral transcrito)');
    instructions.push('');
    instructions.push('## Resumo Executivo');
    instructions.push('(um resumo conciso e claro dos principais assuntos discutidos)');
    instructions.push('');
    instructions.push('## Pontos-Chave & Decisões');
    instructions.push('(tópicos mais importantes e decisões estruturados em tópicos/bullet points)');
    instructions.push('');
    instructions.push('## Próximos Passos & Ações');
    instructions.push('(tarefas, compromissos ou ações práticas mencionadas)');
  } else {
    instructions.push('Retorne apenas a transcrição do áudio, sem introduções ou comentários meta antes ou depois.');
  }

  return instructions.join('\n');
}

// Endpoint principal: Transcrever áudio
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  let uploadedFile = null;
  let geminiFileRef = null;
  let ai = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo de áudio foi enviado.' });
    }

    uploadedFile = req.file;
    const {
      apiKey,
      model = 'gemini-3.8-flash',
      detectSpeakers = 'true',
      includeTimestamps = 'true',
      generateSummary = 'true',
      outputFormat = 'summary_points',
      targetLanguage = 'auto',
      customInstructions = ''
    } = req.body;

    ai = getGeminiClient(apiKey);

    const filePath = uploadedFile.path;
    const fileSize = uploadedFile.size;
    const mimeType = getAudioMimeType(filePath, uploadedFile.mimetype);

    console.log(`[Upload] Arquivo: ${uploadedFile.originalname} | Tamanho: ${(fileSize / (1024 * 1024)).toFixed(2)} MB | Formato Análise: ${outputFormat}`);

    // Escolhe o modelo: gemini-3.8-flash ou gemini-3.5-transcribe
    const selectedModel = model === 'gemini-3.5-transcribe' ? 'gemini-3.5-transcribe' : 'gemini-3.8-flash';

    let interactionInput = [];

    // Se o arquivo for menor que 15MB, podemos enviar inline em Base64
    if (fileSize < 15 * 1024 * 1024) {
      console.log('[Gemini] Processando com dados inline (Base64)...');
      const fileBuffer = await fs.promises.readFile(filePath);
      const base64Data = fileBuffer.toString('base64');

      if (selectedModel === 'gemini-3.5-transcribe') {
        interactionInput = [
          {
            type: 'audio',
            data: base64Data,
            mime_type: mimeType
          }
        ];
      } else {
        const promptText = buildTranscriptionPrompt({
          detectSpeakers,
          includeTimestamps,
          outputFormat,
          targetLanguage,
          customInstructions
        });

        interactionInput = [
          { type: 'text', text: promptText },
          {
            type: 'audio',
            data: base64Data,
            mime_type: mimeType
          }
        ];
      }
    } else {
      // Para arquivos maiores que 15MB, usamos o Gemini Files API
      console.log('[Gemini] Arquivo grande. Fazendo upload via Gemini Files API...');
      geminiFileRef = await ai.files.upload({
        file: filePath,
        config: { mimeType }
      });
      console.log(`[Gemini Files] Upload concluído: ${geminiFileRef.uri}`);

      if (selectedModel === 'gemini-3.5-transcribe') {
        interactionInput = [
          {
            type: 'audio',
            uri: geminiFileRef.uri,
            mime_type: geminiFileRef.mimeType || mimeType
          }
        ];
      } else {
        const promptText = buildTranscriptionPrompt({
          detectSpeakers,
          includeTimestamps,
          outputFormat,
          targetLanguage,
          customInstructions
        });

        interactionInput = [
          { type: 'text', text: promptText },
          {
            type: 'audio',
            uri: geminiFileRef.uri,
            mime_type: geminiFileRef.mimeType || mimeType
          }
        ];
      }
    }

    console.log(`[Gemini] Chamando modelo ${selectedModel}...`);
    const interaction = await ai.interactions.create({
      model: selectedModel,
      input: interactionInput
    });

    const fullOutput = interaction.output_text || '';

    // Extrai seções estruturadas se houver
    let transcriptionText = fullOutput;
    let summaryText = '';
    let keyPointsText = '';
    let actionItemsText = '';

    const transMatch = fullOutput.match(/## Transcrição Completa\s*([\s\S]*?)(?=## Resumo Executivo|$)/i);
    const sumMatch = fullOutput.match(/## Resumo Executivo\s*([\s\S]*?)(?=## Pontos-Chave|$)/i);
    const pointsMatch = fullOutput.match(/## Pontos-Chave[^\n]*\s*([\s\S]*?)(?=## Próximos Passos|$)/i);
    const actionsMatch = fullOutput.match(/## Próximos Passos[^\n]*\s*([\s\S]*?)$/i);

    if (transMatch) transcriptionText = transMatch[1].trim();
    if (sumMatch) summaryText = sumMatch[1].trim();
    if (pointsMatch) keyPointsText = pointsMatch[1].trim();
    if (actionsMatch) actionItemsText = actionsMatch[1].trim();

    res.json({
      success: true,
      modelUsed: selectedModel,
      outputFormat,
      rawOutput: fullOutput,
      transcription: transcriptionText,
      summary: summaryText,
      keyPoints: keyPointsText,
      actionItems: actionItemsText,
      fileName: uploadedFile.originalname,
      fileSize: fileSize,
      durationEstimatedSeconds: Math.round(fileSize / (16 * 1024)) // Estimativa básica
    });

  } catch (error) {
    console.error('[Erro na transcrição]:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro inesperado ao processar a transcrição.'
    });
  } finally {
    // Limpa o arquivo temporário do servidor
    if (uploadedFile && uploadedFile.path) {
      fs.unlink(uploadedFile.path, (err) => {
        if (err) console.error('Erro ao deletar arquivo temporário local:', err);
      });
    }

    // Se enviou para o Files API, deleta o arquivo temporário na nuvem do Gemini
    if (geminiFileRef && geminiFileRef.name && ai) {
      try {
        await ai.files.delete({ name: geminiFileRef.name });
      } catch (err) {
        // Exclusão é melhor esforço
      }
    }
  }
});

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Servidor de Transcrição de Áudio rodando com sucesso!`);
  console.log(` Acesse no navegador: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    const nextPort = Number(PORT) + 1;
    console.log(`Porta ${PORT} em uso. Tentando porta alternativa ${nextPort}...`);
    app.listen(nextPort, () => {
      console.log(`Servidor rodando em: http://localhost:${nextPort}`);
    });
  } else {
    console.error('Erro no servidor:', err);
  }
});
