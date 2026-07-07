// ── Admin Store ─────────────────────────────────────────────────────────────
// Manages all admin-specific data: activity logs, notifications,
// announcements, PDF library, banned chat users, reports
// In production: replace with PostgreSQL + Prisma

const ADMIN_DEFAULTS = {
  activityLogs: [
    { id: 1, adminId: 1, action: 'CREATE_QUIZ', detail: 'Created quiz "Basic Mathematics"', ts: Date.now() - 86400000 * 3 },
    { id: 2, adminId: 1, action: 'BAN_USER', detail: 'Banned user test@example.com', ts: Date.now() - 86400000 * 2 },
    { id: 3, adminId: 1, action: 'UPLOAD_PDF', detail: 'Uploaded "Physics Chapter 1.pdf"', ts: Date.now() - 86400000 },
    { id: 4, adminId: 1, action: 'DELETE_QUESTION', detail: 'Deleted question ID 12', ts: Date.now() - 3600000 * 5 },
    { id: 5, adminId: 1, action: 'SEND_ANNOUNCEMENT', detail: 'Sent announcement to all users', ts: Date.now() - 3600000 * 2 },
  ],
  announcements: [
    { id: 1, title: '🎉 Welcome to TestFree!', body: 'Take quizzes, earn points, climb the leaderboard.', targetRole: 'all', sentAt: new Date().toISOString(), sentBy: 'Admin', read: [] },
    { id: 2, title: '📚 New Quizzes Added', body: 'Science and History quizzes have been updated.', targetRole: 'all', sentAt: new Date().toISOString(), sentBy: 'Admin', read: [] },
  ],
  pdfLibrary: [
    { id: 1, title: 'Physics Chapter 1 – Motion', category: 'Science', fileName: 'physics-ch1.pdf', fileSize: 2.4, uploadedBy: 'Admin', uploadedAt: '2024-02-01', downloads: 42, description: 'Newton\'s laws and kinematics', tags: ['physics', 'motion', 'class11'] },
    { id: 2, title: 'World History – Ancient Civilizations', category: 'History', fileName: 'history-ancient.pdf', fileSize: 5.1, uploadedBy: 'Admin', uploadedAt: '2024-02-10', downloads: 31, description: 'Egypt, Rome, Greece overview', tags: ['history', 'ancient'] },
    { id: 3, title: 'Mathematics – Algebra Basics', category: 'Mathematics', fileName: 'algebra-basics.pdf', fileSize: 1.8, uploadedBy: 'Admin', uploadedAt: '2024-03-01', downloads: 87, description: 'Linear equations and quadratics', tags: ['math', 'algebra'] },
  ],
  chatBans: [],       // [{ userId, reason, bannedAt, bannedBy }]
  chatReports: [],    // [{ id, reporterId, msgId, roomId, reason, ts, resolved }]
  nextAnnouncementId: 3,
  nextPdfId: 4,
  nextLogId: 6,
};

function getAdminDB() {
  if (typeof window === 'undefined') return JSON.parse(JSON.stringify(ADMIN_DEFAULTS));
  try {
    const saved = localStorage.getItem('testfree_admin_db');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...ADMIN_DEFAULTS, ...parsed };
    }
  } catch {}
  return JSON.parse(JSON.stringify(ADMIN_DEFAULTS));
}

function saveAdminDB(db) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem('testfree_admin_db', JSON.stringify(db)); } catch {}
}

// ── Activity Logs ─────────────────────────────────────────────────────────────

export function logAdminAction(adminId, action, detail) {
  const db = getAdminDB();
  db.activityLogs.unshift({ id: db.nextLogId++, adminId, action, detail, ts: Date.now() });
  db.activityLogs = db.activityLogs.slice(0, 500); // keep last 500
  saveAdminDB(db);
}

export function getActivityLogs(limit = 50) {
  return getAdminDB().activityLogs.slice(0, limit);
}

// ── Announcements ─────────────────────────────────────────────────────────────

export function getAnnouncements() {
  return getAdminDB().announcements.slice().reverse();
}

export function sendAnnouncement({ title, body, targetRole = 'all', sentBy = 'Admin' }) {
  const db = getAdminDB();
  const ann = { id: db.nextAnnouncementId++, title, body, targetRole, sentAt: new Date().toISOString(), sentBy, read: [] };
  db.announcements.push(ann);
  saveAdminDB(db);
  logAdminAction(1, 'SEND_ANNOUNCEMENT', `Sent: "${title}" to ${targetRole}`);
  return ann;
}

export function deleteAnnouncement(id) {
  const db = getAdminDB();
  db.announcements = db.announcements.filter(a => a.id !== id);
  saveAdminDB(db);
}

export function getUserAnnouncements(userId, role) {
  return getAdminDB().announcements.filter(a => a.targetRole === 'all' || a.targetRole === role);
}

// ── PDF Library ────────────────────────────────────────────────────────────────

export function getPDFLibrary(category = null) {
  const db = getAdminDB();
  let pdfs = db.pdfLibrary;
  if (category) pdfs = pdfs.filter(p => p.category === category);
  return pdfs.slice().reverse();
}

export function addPDFToLibrary({ title, category, fileName, fileSize, description, tags, uploadedBy }) {
  const db = getAdminDB();
  const pdf = {
    id: db.nextPdfId++,
    title, category, fileName, fileSize,
    description: description || '',
    tags: tags || [],
    uploadedBy: uploadedBy || 'Admin',
    uploadedAt: new Date().toISOString().split('T')[0],
    downloads: 0,
  };
  db.pdfLibrary.push(pdf);
  saveAdminDB(db);
  logAdminAction(1, 'UPLOAD_PDF', `Uploaded "${title}" (${category})`);
  return pdf;
}

export function updatePDF(id, updates) {
  const db = getAdminDB();
  const idx = db.pdfLibrary.findIndex(p => p.id === id);
  if (idx === -1) return null;
  db.pdfLibrary[idx] = { ...db.pdfLibrary[idx], ...updates };
  saveAdminDB(db);
  return db.pdfLibrary[idx];
}

export function deletePDF(id) {
  const db = getAdminDB();
  db.pdfLibrary = db.pdfLibrary.filter(p => p.id !== id);
  saveAdminDB(db);
  logAdminAction(1, 'DELETE_PDF', `Deleted PDF ID ${id}`);
}

export function incrementDownload(id) {
  const db = getAdminDB();
  const pdf = db.pdfLibrary.find(p => p.id === id);
  if (pdf) { pdf.downloads++; saveAdminDB(db); }
}

// ── Chat Bans ─────────────────────────────────────────────────────────────────

export function getChatBans() {
  return getAdminDB().chatBans;
}

export function banUserFromChat(userId, reason, bannedBy) {
  const db = getAdminDB();
  if (!db.chatBans.find(b => b.userId === userId)) {
    db.chatBans.push({ userId, reason: reason || 'Violation', bannedAt: new Date().toISOString(), bannedBy });
    saveAdminDB(db);
    logAdminAction(1, 'CHAT_BAN', `Banned user ${userId} from chat`);
  }
}

export function unbanUserFromChat(userId) {
  const db = getAdminDB();
  db.chatBans = db.chatBans.filter(b => b.userId !== userId);
  saveAdminDB(db);
}

export function isUserChatBanned(userId) {
  return getAdminDB().chatBans.some(b => b.userId === userId);
}

// ── Chat Reports ──────────────────────────────────────────────────────────────

export function getChatReports() {
  return getAdminDB().chatReports.slice().reverse();
}

export function reportChatMessage(reporterId, msgId, roomId, reason) {
  const db = getAdminDB();
  db.chatReports.push({ id: Date.now(), reporterId, msgId, roomId, reason, ts: Date.now(), resolved: false });
  saveAdminDB(db);
}

export function resolveChatReport(id) {
  const db = getAdminDB();
  const r = db.chatReports.find(r => r.id === id);
  if (r) { r.resolved = true; saveAdminDB(db); }
}

// ── Platform Analytics ────────────────────────────────────────────────────────

export function getPlatformAnalytics(mainDB) {
  const results = mainDB.results || [];
  const users = mainDB.users || [];
  const quizzes = mainDB.quizzes || [];
  const questions = mainDB.questions || [];
  const topics = mainDB.topics || [];

  // Quiz attempt trend last 7 days
  const today = new Date();
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const attemptsByDay = last7Days.map(date => ({
    date,
    label: new Date(date).toLocaleDateString('en', { weekday: 'short' }),
    count: results.filter(r => r.date === date).length,
  }));

  // Most attempted quizzes
  const quizAttempts = quizzes.map(q => ({
    ...q,
    attemptCount: results.filter(r => r.quizId === q.id).length,
    avgScore: (() => {
      const qr = results.filter(r => r.quizId === q.id);
      return qr.length ? Math.round(qr.reduce((s, r) => s + r.percentage, 0) / qr.length) : 0;
    })(),
  })).sort((a, b) => b.attemptCount - a.attemptCount);

  // Top scoring students
  const userStats = users.map(u => {
    const ur = results.filter(r => r.userId === u.id);
    const avg = ur.length ? Math.round(ur.reduce((s, r) => s + r.percentage, 0) / ur.length) : 0;
    return { ...u, attempts: ur.length, avgScore: avg, totalCorrect: ur.reduce((s, r) => s + r.score, 0) };
  }).sort((a, b) => b.avgScore - a.avgScore || b.attempts - a.attempts);

  // Topic performance
  const topicPerf = topics.map(t => {
    const topicQuizIds = quizzes.filter(q => q.topicId === t.id).map(q => q.id);
    const tr = results.filter(r => topicQuizIds.includes(r.quizId));
    const avg = tr.length ? Math.round(tr.reduce((s, r) => s + r.percentage, 0) / tr.length) : 0;
    return { ...t, attempts: tr.length, avgScore: avg };
  }).sort((a, b) => b.attempts - a.attempts);

  // Score distribution buckets
  const scoreBuckets = [
    { label: '0-20%', count: results.filter(r => r.percentage <= 20).length, color: '#ef4444' },
    { label: '21-40%', count: results.filter(r => r.percentage > 20 && r.percentage <= 40).length, color: '#f97316' },
    { label: '41-60%', count: results.filter(r => r.percentage > 40 && r.percentage <= 60).length, color: '#f59e0b' },
    { label: '61-80%', count: results.filter(r => r.percentage > 60 && r.percentage <= 80).length, color: '#10b981' },
    { label: '81-100%', count: results.filter(r => r.percentage > 80).length, color: '#6366f1' },
  ];

  return {
    totalUsers: users.length,
    totalQuizzes: quizzes.length,
    totalQuestions: questions.length,
    totalTopics: topics.length,
    totalAttempts: results.length,
    avgScore: results.length ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length) : 0,
    newUsersToday: users.filter(u => u.createdAt === today.toISOString().split('T')[0]).length,
    attemptsByDay,
    quizAttempts,
    userStats,
    topicPerf,
    scoreBuckets,
  };
}

// ── CSV Export ────────────────────────────────────────────────────────────────

export function exportResultsCSV(mainDB) {
  const rows = [['User', 'Email', 'Quiz', 'Score', 'Percentage', 'Time (s)', 'Date']];
  mainDB.results.forEach(r => {
    const user = mainDB.users.find(u => u.id === r.userId);
    const quiz = mainDB.quizzes.find(q => q.id === r.quizId);
    rows.push([
      user?.name || r.userId,
      user?.email || '',
      quiz?.title || r.quizId,
      `${r.score}/${r.total}`,
      `${r.percentage}%`,
      r.timeTaken,
      r.date,
    ]);
  });
  return rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}

export function exportUsersCSV(mainDB) {
  const rows = [['ID', 'Name', 'Email', 'Role', 'Joined', 'Quizzes Attempted', 'Avg Score']];
  mainDB.users.forEach(u => {
    const ur = mainDB.results.filter(r => r.userId === u.id);
    const avg = ur.length ? Math.round(ur.reduce((s, r) => s + r.percentage, 0) / ur.length) : 0;
    rows.push([u.id, u.name, u.email, u.role, u.createdAt, ur.length, avg + '%']);
  });
  return rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}
