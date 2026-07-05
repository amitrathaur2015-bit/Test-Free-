// Extended data layer — PDF uploads, community chat, advanced admin
// In production: PostgreSQL + Prisma + Redis + S3

const COMMUNITY_DB = {
  rooms: [
    { id: 'general', name: 'General Discussion', icon: '💬', description: 'Chat about anything', members: 0, pinned: true },
    { id: 'math', name: 'Mathematics', icon: '📐', description: 'Math doubts & discussions', members: 0 },
    { id: 'science', name: 'Science', icon: '🔬', description: 'Physics, Chemistry, Biology', members: 0 },
    { id: 'history', name: 'History', icon: '📜', description: 'World history discussions', members: 0 },
    { id: 'tech', name: 'Technology', icon: '💻', description: 'Programming & tech help', members: 0 },
    { id: 'gk', name: 'General Knowledge', icon: '🧠', description: 'GK doubts & quizzes', members: 0 },
    { id: 'doubts', name: '❓ Doubt Zone', icon: '❓', description: 'Ask any academic doubt', members: 0, pinned: true },
  ],
  messages: {
    general: [
      { id: 1, userId: 2, userName: 'John Doe', avatar: 'J', text: 'Hey everyone! Welcome to TestFree community 👋', ts: Date.now() - 3600000 },
      { id: 2, userId: 3, userName: 'Jane Smith', avatar: 'J', text: 'Hi! Just scored 90% on the Math quiz 🎉', ts: Date.now() - 1800000 },
      { id: 3, userId: 2, userName: 'John Doe', avatar: 'J', text: 'Awesome Jane! Which quiz was it?', ts: Date.now() - 900000 },
    ],
    doubts: [
      { id: 4, userId: 3, userName: 'Jane Smith', avatar: 'J', text: 'Can someone explain the difference between mean and median?', ts: Date.now() - 7200000, isDoubt: true },
      { id: 5, userId: 2, userName: 'John Doe', avatar: 'J', text: 'Mean is the average (sum/count). Median is the middle value when sorted. Example: [1,2,100] — mean=34.3, median=2', ts: Date.now() - 7000000 },
    ],
    math: [],
    science: [],
    history: [],
    tech: [],
    gk: [],
  },
  privateChats: {},
  // chatId -> [{userId, userName, avatar, text, ts}]
  nextMsgId: 100,
  onlineUsers: {},
  // userId -> { lastSeen, userName, avatar }
};

const PDF_DB = {
  uploads: [],
  // { id, fileName, fileSize, uploadedBy, uploadedAt, status, progress, extractedCount, approvedCount, topicDetected, error, quizId }
  nextId: 1,
  processingLogs: [],
};

// ── COMMUNITY STORE ──────────────────────────────────────────────────────────

function getCommunityDB() {
  if (typeof window === 'undefined') return COMMUNITY_DB;
  try {
    const saved = localStorage.getItem('testfree_community');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge static rooms
      return { ...COMMUNITY_DB, ...parsed, rooms: COMMUNITY_DB.rooms };
    }
  } catch {}
  return COMMUNITY_DB;
}

function saveCommunityDB(db) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem('testfree_community', JSON.stringify(db)); } catch {}
}

export function getRooms() {
  return getCommunityDB().rooms;
}

export function getRoomMessages(roomId) {
  const db = getCommunityDB();
  return (db.messages[roomId] || []).slice(-100);
}

export function sendRoomMessage(roomId, userId, userName, avatar, text, isDoubt = false) {
  const db = getCommunityDB();
  if (!db.messages[roomId]) db.messages[roomId] = [];
  const msg = {
    id: db.nextMsgId++,
    userId, userName, avatar, text, isDoubt,
    ts: Date.now(),
  };
  db.messages[roomId] = [...(db.messages[roomId] || []), msg].slice(-200);
  saveCommunityDB(db);
  return msg;
}

export function getPrivateChat(userId1, userId2) {
  const db = getCommunityDB();
  const chatId = [userId1, userId2].sort().join('-');
  return (db.privateChats[chatId] || []).slice(-100);
}

export function sendPrivateMessage(fromId, fromName, fromAvatar, toId, text) {
  const db = getCommunityDB();
  const chatId = [fromId, toId].sort().join('-');
  if (!db.privateChats[chatId]) db.privateChats[chatId] = [];
  const msg = {
    id: db.nextMsgId++,
    fromId, fromName, fromAvatar, toId,
    text, ts: Date.now(),
  };
  db.privateChats[chatId] = [...db.privateChats[chatId], msg].slice(-200);
  saveCommunityDB(db);
  return msg;
}

export function setUserOnline(userId, userName, avatar) {
  const db = getCommunityDB();
  if (!db.onlineUsers) db.onlineUsers = {};
  db.onlineUsers[userId] = { userName, avatar, lastSeen: Date.now() };
  saveCommunityDB(db);
}

export function getOnlineUsers() {
  const db = getCommunityDB();
  const cutoff = Date.now() - 5 * 60 * 1000;
  return Object.entries(db.onlineUsers || {})
    .filter(([, u]) => u.lastSeen > cutoff)
    .map(([id, u]) => ({ id: parseInt(id), ...u }));
}

export function deleteMessage(roomId, msgId) {
  const db = getCommunityDB();
  if (db.messages[roomId]) {
    db.messages[roomId] = db.messages[roomId].filter(m => m.id !== parseInt(msgId));
    saveCommunityDB(db);
    return true;
  }
  return false;
}

// ── PDF UPLOAD STORE ─────────────────────────────────────────────────────────

function getPdfDB() {
  if (typeof window === 'undefined') return PDF_DB;
  try {
    const saved = localStorage.getItem('testfree_pdf');
    if (saved) return JSON.parse(saved);
  } catch {}
  return { ...PDF_DB };
}

function savePdfDB(db) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem('testfree_pdf', JSON.stringify(db)); } catch {}
}

export function createPdfUpload(fileName, fileSize, uploadedBy) {
  const db = getPdfDB();
  const upload = {
    id: (db.nextId || 1),
    fileName, fileSize, uploadedBy,
    uploadedAt: new Date().toISOString(),
    status: 'uploading', // uploading | processing | extracting | review | approved | published | failed
    progress: 0,
    extractedCount: 0,
    approvedCount: 0,
    topicDetected: null,
    quizId: null,
    error: null,
    logs: [],
  };
  db.nextId = (db.nextId || 1) + 1;
  if (!db.uploads) db.uploads = [];
  db.uploads.push(upload);
  savePdfDB(db);
  return upload;
}

export function updatePdfUpload(id, updates) {
  const db = getPdfDB();
  const idx = (db.uploads || []).findIndex(u => u.id === id);
  if (idx === -1) return null;
  db.uploads[idx] = { ...db.uploads[idx], ...updates };
  if (updates.log) {
    db.uploads[idx].logs = [...(db.uploads[idx].logs || []), { msg: updates.log, ts: new Date().toISOString() }];
    delete db.uploads[idx].log;
  }
  savePdfDB(db);
  return db.uploads[idx];
}

export function getPdfUploads() {
  const db = getPdfDB();
  return (db.uploads || []).reverse();
}

export function getPdfUpload(id) {
  const db = getPdfDB();
  return (db.uploads || []).find(u => u.id === parseInt(id));
}

// ── ADMIN HELPERS ────────────────────────────────────────────────────────────

export function getPlatformAnalytics() {
  if (typeof window === 'undefined') return null;
  try {
    const { getDB } = require('./store');
    const db = getDB();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now - 7 * 86400000).toISOString().split('T')[0];

    const todayResults = db.results.filter(r => r.date === today);
    const weekResults = db.results.filter(r => r.date >= weekAgo);

    const topQuizzes = db.quizzes.map(q => ({
      ...q,
      attemptCount: db.results.filter(r => r.quizId === q.id).length,
      avgScore: (() => {
        const rs = db.results.filter(r => r.quizId === q.id);
        return rs.length ? Math.round(rs.reduce((s, r) => s + r.percentage, 0) / rs.length) : 0;
      })(),
    })).sort((a, b) => b.attemptCount - a.attemptCount).slice(0, 5);

    const userActivity = db.users.filter(u => u.role !== 'admin').map(u => ({
      ...u,
      attempts: db.results.filter(r => r.userId === u.id).length,
      avgScore: (() => {
        const rs = db.results.filter(r => r.userId === u.id);
        return rs.length ? Math.round(rs.reduce((s, r) => s + r.percentage, 0) / rs.length) : 0;
      })(),
      lastActive: db.results.filter(r => r.userId === u.id).slice(-1)[0]?.date || u.createdAt,
    }));

    return {
      totalUsers: db.users.filter(u => u.role !== 'admin').length,
      totalQuizzes: db.quizzes.length,
      totalQuestions: db.questions.length,
      totalAttempts: db.results.length,
      todayAttempts: todayResults.length,
      weekAttempts: weekResults.length,
      avgPlatformScore: db.results.length ? Math.round(db.results.reduce((s, r) => s + r.percentage, 0) / db.results.length) : 0,
      topQuizzes,
      userActivity,
      pdfUploads: getPdfUploads(),
    };
  } catch { return null; }
}

export function banUser(userId) {
  if (typeof window === 'undefined') return false;
  try {
    const { getDB, saveDB } = require('./store');
    const db = getDB();
    const user = db.users.find(u => u.id === userId);
    if (user) { user.banned = !user.banned; saveDB(); return true; }
  } catch {}
  return false;
}
