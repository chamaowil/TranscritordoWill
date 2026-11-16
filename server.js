import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createPixPayment } from './pix.js';
import { db } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'transcritor-do-will-secure-jwt-secret-key-2026';

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

// Configuração de Administradores
const ADMIN_EMAILS = [
  (process.env.ADMIN_EMAIL || 'wilsonbrenomkt@gmail.com').toLowerCase().trim(),
  'wilsonbrenomkt@gmail.com'
];

function isAdminEmail(email) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

// Middleware de Autenticação Segura JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'AUTH_REQUIRED',
      message: 'Acesso não autorizado. Por favor, entre na sua conta para continuar.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'INVALID_TOKEN',
        message: 'Sua sessão expirou. Faça login novamente.'
      });
    }

    const user = db.findUserById(decoded.id);
    if (!user) {
      return res.status(403).json({
        success: false,
        error: 'USER_NOT_FOUND',
        message: 'Usuário não encontrado.'
      });
    }

    // Se for o dono/admin, garante privilégios máximos e acesso ilimitado
    if (isAdminEmail(user.email)) {
      user.role = 'admin';
      user.plan = 'unlimited';
      user.credits = 999999;
    }

    req.user = user;
    next();
  });
}

// Middleware de Proteção Admin
function requireAdmin(req, res, next) {
  if (!req.user || (!isAdminEmail(req.user.email) && req.user.role !== 'admin')) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Apenas o administrador do sistema pode realizar esta ação.'
    });
  }
  next();
}

// Helper para obter cliente Gemini (exclusivo do servidor, sem vazar chaves)
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Serviço de IA temporariamente indisponível. Contate o suporte.');
  }
  return new GoogleGenAI({ apiKey: apiKey.trim() });
}

// ========================================================
// ROTAS DE STATUS & PÚBLICAS
// ========================================================
app.get('/api/status', (req, res) => {
  const hasServerKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');
  res.json({
    ok: true,
    service: 'Transcritor do Will',
    hasServerApiKey: hasServerKey,
    defaultPort: PORT
  });
});

// ========================================================
// ROTAS DE AUTENTICAÇÃO (CADASTRO, LOGIN E PERFIL)
// ========================================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Informe seu nome completo.' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Informe um e-mail válido.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'A senha deve ter no mínimo 6 caracteres.' });
    }

    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Este e-mail já está cadastrado. Faça login.' });
    }

    const isAdmin = isAdminEmail(email);
    const passwordHash = await bcrypt.hash(password, 10);
    const user = db.createUser({
      name,
      email,
      passwordHash,
      role: isAdmin ? 'admin' : 'user',
      plan: isAdmin ? 'unlimited' : 'free',
      credits: isAdmin ? 999999 : 1
    });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        credits: user.credits
      }
    });
  } catch (err) {
    console.error('Erro no registro:', err);
    res.status(500).json({ success: false, message: 'Erro interno ao criar conta.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Informe e-mail e senha.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const isAdmin = isAdminEmail(cleanEmail);
    const isMasterPass = (password === 'senha-do-will-2026' || password === (process.env.ADMIN_PASSWORD || 'senha-do-will-2026'));

    let user = db.findUserByEmail(cleanEmail);

    // Se o dono estiver entrando e a conta ainda não foi inicializada no banco, cria automaticamente
    if (!user && isAdmin) {
      const passwordHash = await bcrypt.hash(password, 10);
      user = db.createUser({
        name: 'Will (Dono)',
        email: cleanEmail,
        passwordHash,
        role: 'admin',
        plan: 'unlimited',
        credits: 999999
      });
      console.log('[Auth] Conta de Administrador criada automaticamente no login:', cleanEmail);
    }

    if (!user) {
      return res.status(400).json({ success: false, message: 'E-mail ou senha incorretos.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);

    // Se for admin com senha mestre, aceita mesmo se o hash anterior for diferente
    if (!match && !(isAdmin && isMasterPass)) {
      return res.status(400).json({ success: false, message: 'E-mail ou senha incorretos.' });
    }

    // Se for admin com senha mestre e hash desatualizado, atualiza a senha no banco
    if (isAdmin && isMasterPass && !match) {
      const newHash = await bcrypt.hash(password, 10);
      db.updateUser(user.id, { passwordHash: newHash });
    }

    // Se for o dono do sistema, garante papel de admin e créditos infinitos
    if (isAdmin && (user.role !== 'admin' || user.plan !== 'unlimited')) {
      user.role = 'admin';
      user.plan = 'unlimited';
      user.credits = 999999;
      db.updateUser(user.id, { role: 'admin', plan: 'unlimited', credits: 999999 });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || (isAdmin ? 'admin' : 'user'),
        plan: user.plan,
        credits: user.credits,
        transcriptionsCount: user.transcriptionsCount || 0
      }
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ success: false, message: 'Erro interno ao realizar login.' });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = req.user;
  const isAdmin = isAdminEmail(user.email) || user.role === 'admin';
  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: isAdmin ? 'admin' : (user.role || 'user'),
      plan: isAdmin ? 'unlimited' : user.plan,
      credits: isAdmin ? 999999 : user.credits,
      transcriptionsCount: user.transcriptionsCount || 0
    }
  });
});

// ========================================================
// ROTAS DE ADMINISTRAÇÃO (PAINEL DO DONO & CLIENTES EXTERNOS)
// ========================================================
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  try {
    const users = db.getUsers().map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role || 'user',
      plan: u.plan,
      credits: u.credits,
      transcriptionsCount: u.transcriptionsCount || 0,
      createdAt: u.createdAt
    }));
    res.json({ success: true, users });
  } catch (err) {
    console.error('Erro ao listar usuários admin:', err);
    res.status(500).json({ success: false, message: 'Erro ao carregar lista de usuários.' });
  }
});

app.post('/api/admin/set-plan', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, plan, addCredits, clientName, customPassword } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Informe um e-mail válido para o cliente.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = db.findUserByEmail(cleanEmail);

    let planToSet = plan || 'pro';
    let creditsToSet = 10;

    if (planToSet === 'single') creditsToSet = 1;
    if (planToSet === 'credits_5') { planToSet = 'single'; creditsToSet = 5; }
    if (planToSet === 'credits_10') { planToSet = 'single'; creditsToSet = 10; }
    if (planToSet === 'pro') creditsToSet = 999;
    if (planToSet === 'unlimited') creditsToSet = 99999;

    const chosenPassword = customPassword && customPassword.trim().length >= 6
      ? customPassword.trim()
      : '123456';

    if (!user) {
      // Cliente novo ainda não cadastrado no site: cria a conta com senha padrão fácil ou personalizada
      const passwordHash = await bcrypt.hash(chosenPassword, 10);
      user = db.createUser({
        name: clientName && clientName.trim() ? clientName.trim() : cleanEmail.split('@')[0],
        email: cleanEmail,
        passwordHash,
        plan: planToSet,
        credits: creditsToSet
      });

      return res.json({
        success: true,
        isNewUser: true,
        message: `Novo cliente cadastrado com sucesso! Plano: ${planToSet.toUpperCase()} | Senha de acesso: ${chosenPassword}`,
        tempPassword: chosenPassword,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          plan: user.plan,
          credits: user.credits
        }
      });
    }

    // Cliente já existente: atualiza plano ou soma créditos
    let newCredits = creditsToSet;
    if (addCredits && !isNaN(Number(addCredits))) {
      newCredits = (user.credits || 0) + Number(addCredits);
    }

    const updates = {
      plan: planToSet,
      credits: newCredits
    };

    // Se passou uma senha personalizada, atualiza também a senha
    if (customPassword && customPassword.trim().length >= 6) {
      updates.passwordHash = await bcrypt.hash(customPassword.trim(), 10);
    }

    const updatedUser = db.updateUser(user.id, updates);

    res.json({
      success: true,
      isNewUser: false,
      message: `Plano atualizado para ${user.name} (${user.email})! Senha: ${customPassword ? customPassword.trim() : '(mantida)'}`,
      tempPassword: customPassword ? customPassword.trim() : null,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        plan: updatedUser.plan,
        credits: updatedUser.credits
      }
    });

  } catch (err) {
    console.error('Erro ao definir plano admin:', err);
    res.status(500).json({ success: false, message: 'Erro interno ao alterar plano.' });
  }
});

app.post('/api/admin/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, newPassword = '123456' } = req.body;
    if (!email || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'A senha deve ter no mínimo 6 caracteres.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = db.findUserByEmail(cleanEmail);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    db.updateUser(user.id, { passwordHash });

    res.json({
      success: true,
      message: `Senha de ${user.name} (${user.email}) redefinida com sucesso para "${newPassword}"!`,
      newPassword
    });
  } catch (err) {
    console.error('Erro ao redefinir senha:', err);
    res.status(500).json({ success: false, message: 'Erro interno ao redefinir senha.' });
  }
});

// ========================================================
// ROTAS DE PAGAMENTO PIX E ASSINATURAS
// ========================================================
app.post('/api/create-pix', async (req, res) => {
  try {
    const { plan = 'pro', userEmail } = req.body;

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

    db.addTransaction({
      txId,
      plan,
      planTitle: selected.title,
      amount: selected.amount,
      userEmail: userEmail || null,
      status: 'pending',
      createdAt: new Date().toISOString()
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

app.post('/api/confirm-pix', authenticateToken, (req, res) => {
  try {
    const { plan, txId } = req.body;
    const user = req.user;

    let updates = {};

    if (plan === 'single') {
      updates = {
        credits: (user.credits || 0) + 1
      };
    } else if (plan === 'pro') {
      updates = {
        plan: 'pro',
        credits: 999
      };
    } else if (plan === 'unlimited') {
      updates = {
        plan: 'unlimited',
        credits: 9999
      };
    }

    const updatedUser = db.updateUser(user.id, updates);
    if (txId) {
      db.updateTransaction(txId, { status: 'paid', userId: user.id });
    }

    res.json({
      success: true,
      message: 'Plano ativado com sucesso!',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        plan: updatedUser.plan,
        credits: updatedUser.credits
      }
    });
  } catch (err) {
    console.error('Erro ao confirmar plano:', err);
    res.status(500).json({ success: false, message: 'Erro ao ativar plano.' });
  }
});

// ========================================================
// ROTAS DE HISTÓRICO PRIVADO DO USUÁRIO
// ========================================================
app.get('/api/history', authenticateToken, (req, res) => {
  const history = db.getUserHistory(req.user.id);
  res.json({ success: true, history });
});

app.delete('/api/history/:id', authenticateToken, (req, res) => {
  const id = parseInt(req.params.id, 10);
  db.deleteHistoryItem(req.user.id, id);
  res.json({ success: true, message: 'Item removido do histórico.' });
});

app.delete('/api/history', authenticateToken, (req, res) => {
  db.clearUserHistory(req.user.id);
  res.json({ success: true, message: 'Histórico limpo.' });
});

// ========================================================
// TRANSCRIÇÃO DE ÁUDIO COM IA (PROTEGIDA POR LOGIN & CRÉDITOS)
// ========================================================
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

function buildTranscriptionPrompt({
  detectSpeakers,
  includeTimestamps,
  outputFormat = 'summary_points',
  targetLanguage,
  customInstructions
}) {
  const instructions = [];

  instructions.push('Você é o Transcritor do Will, um assistente especialista de transcrição e análise de áudio de alto nível.');
  instructions.push('Sua tarefa é transcrever o áudio fornecido com máxima fidelidade e precisão.');
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

app.post('/api/transcribe', authenticateToken, upload.single('audio'), async (req, res) => {
  let uploadedFile = null;
  let geminiFileRef = null;
  let ai = null;

  try {
    const user = req.user;

    // Verificação de Créditos e Plano
    const hasActiveSubscription = user.plan === 'pro' || user.plan === 'unlimited';
    const hasCredits = (user.credits || 0) > 0;

    if (!hasActiveSubscription && !hasCredits) {
      return res.status(403).json({
        success: false,
        error: 'CREDITS_EXHAUSTED',
        message: 'Você utilizou seu crédito gratuito! Escolha um plano ou adquira créditos para continuar transcrevendo.'
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo de áudio foi enviado.' });
    }

    uploadedFile = req.file;
    const {
      model = 'gemini-3.8-flash',
      detectSpeakers = 'true',
      includeTimestamps = 'true',
      outputFormat = 'summary_points',
      targetLanguage = 'auto',
      customInstructions = ''
    } = req.body;

    ai = getGeminiClient();

    const filePath = uploadedFile.path;
    const fileSize = uploadedFile.size;
    const mimeType = getAudioMimeType(filePath, uploadedFile.mimetype);

    console.log(`[Upload] Usuário: ${user.email} | Arquivo: ${uploadedFile.originalname} | Tamanho: ${(fileSize / (1024 * 1024)).toFixed(2)} MB`);

    const selectedModel = model === 'gemini-3.5-transcribe' ? 'gemini-3.5-transcribe' : 'gemini-3.8-flash';
    let interactionInput = [];

    if (fileSize < 15 * 1024 * 1024) {
      const fileBuffer = await fs.promises.readFile(filePath);
      const base64Data = fileBuffer.toString('base64');

      if (selectedModel === 'gemini-3.5-transcribe') {
        interactionInput = [{ type: 'audio', data: base64Data, mime_type: mimeType }];
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
          { type: 'audio', data: base64Data, mime_type: mimeType }
        ];
      }
    } else {
      geminiFileRef = await ai.files.upload({
        file: filePath,
        config: { mimeType }
      });

      if (selectedModel === 'gemini-3.5-transcribe') {
        interactionInput = [{ type: 'audio', uri: geminiFileRef.uri, mime_type: geminiFileRef.mimeType || mimeType }];
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
          { type: 'audio', uri: geminiFileRef.uri, mime_type: geminiFileRef.mimeType || mimeType }
        ];
      }
    }

    const interaction = await ai.interactions.create({
      model: selectedModel,
      input: interactionInput
    });

    const fullOutput = interaction.output_text || '';

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

    // Desconta crédito se o plano for 'free' ou 'single'
    let remainingCredits = user.credits;
    if (!hasActiveSubscription && user.credits > 0) {
      remainingCredits = user.credits - 1;
      db.updateUser(user.id, {
        credits: remainingCredits,
        transcriptionsCount: (user.transcriptionsCount || 0) + 1
      });
    } else {
      db.updateUser(user.id, {
        transcriptionsCount: (user.transcriptionsCount || 0) + 1
      });
    }

    // Salva no histórico privado do usuário
    const historyItem = {
      id: Date.now(),
      userId: user.id,
      date: new Date().toLocaleString('pt-BR'),
      fileName: uploadedFile.originalname,
      modelUsed: selectedModel,
      outputFormat,
      transcription: transcriptionText,
      summary: summaryText,
      keyPoints: keyPointsText,
      actionItems: actionItemsText,
      words: transcriptionText ? transcriptionText.split(/\s+/).length : 0
    };
    db.addHistory(historyItem);

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
      remainingCredits,
      plan: user.plan
    });

  } catch (error) {
    console.error('[Erro na transcrição]:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro inesperado ao processar a transcrição.'
    });
  } finally {
    if (uploadedFile && uploadedFile.path) {
      fs.unlink(uploadedFile.path, () => {});
    }
    if (geminiFileRef && geminiFileRef.name && ai) {
      try {
        await ai.files.delete({ name: geminiFileRef.name });
      } catch (err) {}
    }
  }
});

// Assegura que a conta do administrador/dono sempre exista na inicialização
async function ensureAdminUser() {
  try {
    const adminEmail = 'wilsonbrenomkt@gmail.com';
    let admin = db.findUserByEmail(adminEmail);
    if (!admin) {
      const passwordHash = await bcrypt.hash('senha-do-will-2026', 10);
      db.createUser({
        name: 'Will (Dono)',
        email: adminEmail,
        passwordHash,
        role: 'admin',
        plan: 'unlimited',
        credits: 999999
      });
      console.log('[Admin] Conta mestre do Will inicializada com sucesso.');
    } else if (admin.role !== 'admin' || admin.plan !== 'unlimited') {
      db.updateUser(admin.id, { role: 'admin', plan: 'unlimited', credits: 999999 });
    }
  } catch (err) {
    console.error('Erro ao verificar conta admin:', err);
  }
}
ensureAdminUser();

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Transcritor do Will (Produção) rodando com sucesso!`);
  console.log(` Acesse: http://localhost:${PORT}`);
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
