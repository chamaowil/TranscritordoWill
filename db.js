import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');

// Inicializa arquivos caso não existam
function initFile(file, defaultData = []) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
}

initFile(USERS_FILE, []);
initFile(HISTORY_FILE, []);
initFile(TRANSACTIONS_FILE, []);

// Helper para leitura segura
function readJSON(file) {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error(`Erro ao ler ${file}:`, err);
    return [];
  }
}

// Helper para escrita segura
function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Erro ao escrever em ${file}:`, err);
  }
}

export const db = {
  // --- USUÁRIOS ---
  getUsers() {
    return readJSON(USERS_FILE);
  },

  findUserByEmail(email) {
    if (!email) return null;
    const users = this.getUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  },

  findUserById(id) {
    if (!id) return null;
    const users = this.getUsers();
    return users.find(u => u.id === id);
  },

  createUser(userData) {
    const users = this.getUsers();
    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      passwordHash: userData.passwordHash,
      role: userData.role || 'user',
      plan: userData.plan || 'free', // 'free' | 'single' | 'pro' | 'unlimited'
      credits: userData.credits !== undefined ? userData.credits : 1, // 1 crédito gratuito de boas-vindas
      transcriptionsCount: 0,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    writeJSON(USERS_FILE, users);
    return newUser;
  },

  updateUser(id, updates) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;

    users[idx] = { ...users[idx], ...updates, updatedAt: new Date().toISOString() };
    writeJSON(USERS_FILE, users);
    return users[idx];
  },

  // --- HISTÓRICO PRIVADO DE TRANSCRIÇÕES ---
  getUserHistory(userId) {
    const all = readJSON(HISTORY_FILE);
    return all.filter(h => h.userId === userId).sort((a, b) => b.id - a.id);
  },

  addHistory(item) {
    const all = readJSON(HISTORY_FILE);
    all.unshift(item);
    // Limita o histórico global a 2000 itens para performance
    if (all.length > 2000) all.pop();
    writeJSON(HISTORY_FILE, all);
    return item;
  },

  deleteHistoryItem(userId, itemId) {
    const all = readJSON(HISTORY_FILE);
    const filtered = all.filter(h => !(h.userId === userId && h.id === itemId));
    writeJSON(HISTORY_FILE, filtered);
  },

  clearUserHistory(userId) {
    const all = readJSON(HISTORY_FILE);
    const filtered = all.filter(h => h.userId !== userId);
    writeJSON(HISTORY_FILE, filtered);
  },

  // --- TRANSAÇÕES PIX ---
  addTransaction(tx) {
    const all = readJSON(TRANSACTIONS_FILE);
    all.push(tx);
    writeJSON(TRANSACTIONS_FILE, all);
    return tx;
  },

  findTransaction(txId) {
    const all = readJSON(TRANSACTIONS_FILE);
    return all.find(t => t.txId === txId);
  },

  updateTransaction(txId, updates) {
    const all = readJSON(TRANSACTIONS_FILE);
    const idx = all.findIndex(t => t.txId === txId);
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
      writeJSON(TRANSACTIONS_FILE, all);
      return all[idx];
    }
    return null;
  }
};
