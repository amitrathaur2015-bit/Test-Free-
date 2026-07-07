import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/layout/Navbar';
import { getSession, getAllStats, deleteQuestion, deleteQuiz, addTopic, addQuiz, addQuestion, editQuestion, getDB, saveDB } from '../../lib/store';
import { getRooms, getRoomMessages, deleteMessage } from '../../lib/store-extended';
import {
  Users, BookOpen, HelpCircle, BarChart2, Plus, Trash2, Edit3,
  Check, X, Shield, Brain, MessageCircle, Upload, FileText,
  TrendingUp, Eye, Ban, Crown, RefreshCw, AlertTriangle, ChevronDown
} from 'lucide-react';

const TABS = [
  { key: 'overview', label: 'Overview', icon: BarChart2 },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'questions', label: 'Questions', icon: HelpCircle },
  { key: 'quizzes', label: 'Quizzes', icon: BookOpen },
  { key: 'topics', label: 'Topics', icon: TrendingUp },
  { key: 'moderation', label: 'Chat Moderation', icon: MessageCircle },
  { key: 'pdf', label: 'PDF Upload', icon: Brain },
];

export default function Admin() {
  const [session, setSession] = useState(null);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('overview');
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [showAddQuiz, setShowAddQuiz] = useState(false);
  const [showAddQ, setShowAddQ] = useState(false);
  const [editQ, setEditQ] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [communityRooms, setCommunityRooms] = useState([]);
  const [moderateRoom, setModerateRoom] = useState('general');
  const [moderateMsgs, setModerateMsgs] = useState([]);
  const router = useRouter();

  const [topicForm, setTopicForm] = useState({ name: '', icon: '📚', description: '', color: 'bg-blue-100 text-blue-700' });
  const [quizForm, setQuizForm] = useState({ title: '', topicId: '', duration: 600, difficulty: 'Medium' });
  const [qForm, setQForm] = useState({ quizId: '', question: '', options: ['', '', '', ''], correct: 0, explanation: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== 'admin') { router.push('/auth/login'); return; }
    setSession(s);
    setStats(getAllStats());
    setCommunityRooms(getRooms());
  }, [refresh]);

  useEffect(() => {
    if (tab === 'moderation') {
      setModerateMsgs(getRoomMessages(moderateRoom));
    }
  }, [tab, moderateRoom, refresh]);

  const showMsg = (m, isErr = false) => {
    setMsg({ text: m, err: isErr });
    setTimeout(() => setMsg(''), 2500);
  };

  const handleAddTopic = () => {
    if (!topicForm.name) return;
    addTopic(topicForm);
    setTopicForm({ name: '', icon: '📚', description: '', color: 'bg-blue-100 text-blue-700' });
    setShowAddTopic(false);
    setRefresh(r => r + 1);
    showMsg('✅ Topic added!');
  };

  const handleAddQuiz = () => {
    if (!quizForm.title || !quizForm.topicId) return;
    addQuiz({ ...quizForm, topicId: parseInt(quizForm.topicId), duration: parseInt(quizForm.duration) });
    setQuizForm({ title: '', topicId: '', duration: 600, difficulty: 'Medium' });
    setShowAddQuiz(false);
    setRefresh(r => r + 1);
    showMsg('✅ Quiz created!');
  };

  const handleAddQ = () => {
    if (!qForm.question || !qForm.quizId || qForm.options.some(o => !o)) return;
    if (editQ) {
      editQuestion(editQ.id, { ...qForm, quizId: parseInt(qForm.quizId), correct: parseInt(qForm.correct) });
      setEditQ(null);
      showMsg('✅ Question updated!');
    } else {
      addQuestion({ ...qForm, quizId: parseInt(qForm.quizId), topicId: parseInt(qForm.topicId || 1), correct: parseInt(qForm.correct) });
      showMsg('✅ Question added!');
    }
    setQForm({ quizId: '', question: '', options: ['', '', '', ''], correct: 0, explanation: '' });
    setShowAddQ(false);
    setRefresh(r => r + 1);
  };

  const startEdit = (q) => {
    setEditQ(q);
    setQForm({ ...q, quizId: String(q.quizId), correct: q.correct });
    setShowAddQ(true);
  };

  const handleDeleteQ = (id) => {
    if (!confirm('Delete this question?')) return;
    deleteQuestion(id);
    setRefresh(r => r + 1);
    showMsg('✅ Question deleted!');
  };

  const handleDeleteQuiz = (id) => {
    if (!confirm('Delete this quiz and all its questions?')) return;
    deleteQuiz(id);
    setRefresh(r => r + 1);
    showMsg('✅ Quiz deleted!');
  };

  const handleUserAction = (userId, action) => {
    const db = getDB();
    const user = db.users.find(u => u.id === userId);
    if (!user) return;
    if (action === 'ban') user.banned = !user.banned;
    if (action === 'admin') user.role = user.role === 'admin' ? 'user' : 'admin';
    saveDB();
    setRefresh(r => r + 1);
    showMsg(`✅ User ${action === 'ban' ? (user.banned ? 'unbanned' : 'banned') : 'role updated'}`);
  };

  const handleDeleteMsg = (roomId, msgId) => {
    deleteMessage(roomId, msgId);
    setModerateMsgs(getRoomMessages(roomId));
    showMsg('✅ Message deleted');
  };

  if (!session || !stats) return (
    <div className="min-h-screen bg-slate-50"><Navbar />
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  const db = getDB();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Flash msg */}
      {msg && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold ${msg.err ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
          {msg.text}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-md">
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-gray-900">Admin Panel</h1>
            <p className="text-gray-500 text-sm">Manage your TestFree platform</p>
          </div>
          <Link href="/admin/pdf-upload"
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
            <Brain size={15} /> AI PDF Upload
          </Link>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 overflow-x-auto bg-white border border-gray-100 rounded-2xl p-1.5 mb-6 shadow-sm">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0
                ${tab === t.key ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'indigo' },
                { label: 'Quizzes', value: stats.totalQuizzes, icon: BookOpen, color: 'green' },
                { label: 'Questions', value: stats.totalQuestions, icon: HelpCircle, color: 'purple' },
                { label: 'Topics', value: stats.totalTopics, icon: TrendingUp, color: 'amber' },
                { label: 'Attempts', value: stats.totalAttempts, icon: BarChart2, color: 'rose' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="card">
                  <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center mb-3`}>
                    <Icon size={18} className={`text-${color}-600`} />
                  </div>
                  <div className="text-2xl font-display font-bold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h2 className="font-display font-semibold text-base text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { href: '/admin/pdf-upload', icon: Brain, label: 'AI PDF Upload', desc: 'Extract questions from PDF', color: 'indigo' },
                  { action: () => { setTab('questions'); setShowAddQ(true); }, icon: Plus, label: 'Add Question', desc: 'Manually add a question', color: 'green' },
                  { action: () => { setTab('quizzes'); setShowAddQuiz(true); }, icon: BookOpen, label: 'Create Quiz', desc: 'Create a new quiz', color: 'amber' },
                  { action: () => setTab('moderation'), icon: MessageCircle, label: 'Moderate Chat', desc: 'Review community messages', color: 'purple' },
                ].map(({ href, action, icon: Icon, label, desc, color }) => {
                  const inner = (
                    <div className={`card border-${color}-100 bg-${color}-50 hover:bg-${color}-100 cursor-pointer transition-all`} onClick={action}>
                      <Icon size={20} className={`text-${color}-600 mb-2`} />
                      <p className={`font-semibold text-sm text-${color}-800`}>{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                  );
                  return href ? <Link key={label} href={href}>{inner}</Link> : <div key={label}>{inner}</div>;
                })}
              </div>
            </div>

            {/* Recent results */}
            <div className="card p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-display font-semibold text-base text-gray-900">Recent Quiz Attempts</h2>
                <span className="text-xs text-gray-400">{stats.results.length} total</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 text-left">
                    <th className="px-6 py-3 font-medium text-gray-500">User</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Quiz</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Score</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Date</th>
                  </tr></thead>
                  <tbody>
                    {stats.results.slice().reverse().slice(0, 10).map(r => {
                      const user = stats.users.find(u => u.id === r.userId);
                      const quiz = stats.quizzes.find(q => q.id === r.quizId);
                      return (
                        <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50">
                          <td className="px-6 py-3 font-medium text-gray-900">{user?.name || '—'}</td>
                          <td className="px-4 py-3 text-gray-600 truncate max-w-32">{quiz?.title || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`font-bold ${r.percentage >= 70 ? 'text-green-600' : r.percentage >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{r.percentage}%</span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{r.date}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === 'users' && (
          <div className="card p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-display font-semibold text-base text-gray-900">User Management</h2>
              <span className="text-xs text-gray-400">{stats.users.length} users</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 text-left">
                  <th className="px-6 py-3 font-medium text-gray-500">User</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Role</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Attempts</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr></thead>
                <tbody>
                  {stats.users.map(user => {
                    const attempts = stats.results.filter(r => r.userId === user.id).length;
                    const avgPct = attempts > 0
                      ? Math.round(stats.results.filter(r => r.userId === user.id).reduce((s, r) => s + r.percentage, 0) / attempts)
                      : 0;
                    return (
                      <tr key={user.id} className={`border-t border-gray-50 hover:bg-gray-50 transition-colors ${user.banned ? 'opacity-60' : ''}`}>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${user.role === 'admin' ? 'bg-purple-600' : 'bg-indigo-600'}`}>
                              {user.avatar}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.name}</p>
                              <p className="text-xs text-gray-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {attempts} quiz{attempts !== 1 ? 'zes' : ''}
                          {attempts > 0 && <span className="text-xs text-gray-400 ml-1">({avgPct}%)</span>}
                        </td>
                        <td className="px-4 py-3">
                          {user.banned
                            ? <span className="text-xs font-semibold px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Banned</span>
                            : <span className="text-xs font-semibold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Active</span>}
                        </td>
                        <td className="px-4 py-3">
                          {user.id !== session.id && (
                            <div className="flex gap-1.5">
                              <button onClick={() => handleUserAction(user.id, 'ban')}
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${user.banned ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                                <Ban size={11} /> {user.banned ? 'Unban' : 'Ban'}
                              </button>
                              <button onClick={() => handleUserAction(user.id, 'admin')}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors">
                                <Crown size={11} /> {user.role === 'admin' ? 'Demote' : 'Promote'}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── QUESTIONS TAB ── */}
        {tab === 'questions' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-display font-semibold text-lg text-gray-900">Questions ({stats.questions.length})</h2>
              <button onClick={() => { setEditQ(null); setQForm({ quizId: '', question: '', options: ['', '', '', ''], correct: 0, explanation: '' }); setShowAddQ(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                <Plus size={15} /> Add Question
              </button>
            </div>

            {/* Add/Edit form */}
            {showAddQ && (
              <div className="card border-2 border-indigo-200">
                <h3 className="font-semibold text-base text-gray-900 mb-4">{editQ ? 'Edit Question' : 'New Question'}</h3>
                <div className="space-y-3">
                  <select value={qForm.quizId} onChange={e => setQForm(f => ({ ...f, quizId: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 bg-white">
                    <option value="">Select Quiz…</option>
                    {stats.quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                  </select>
                  <textarea value={qForm.question} onChange={e => setQForm(f => ({ ...f, question: e.target.value }))}
                    rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none"
                    placeholder="Question text…" />
                  <div className="grid grid-cols-2 gap-2">
                    {qForm.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input type="radio" name="correct" checked={parseInt(qForm.correct) === oi} onChange={() => setQForm(f => ({ ...f, correct: oi }))}
                          className="text-indigo-600" />
                        <input value={opt} onChange={e => setQForm(f => { const o = [...f.options]; o[oi] = e.target.value; return { ...f, options: o }; })}
                          className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
                          placeholder={`Option ${['A','B','C','D'][oi]}`} />
                      </div>
                    ))}
                  </div>
                  <textarea value={qForm.explanation} onChange={e => setQForm(f => ({ ...f, explanation: e.target.value }))}
                    rows={1} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none"
                    placeholder="Explanation (optional)" />
                  <div className="flex gap-2">
                    <button onClick={handleAddQ} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                      {editQ ? 'Update' : 'Add'} Question
                    </button>
                    <button onClick={() => { setShowAddQ(false); setEditQ(null); }} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="card p-0 overflow-hidden">
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 z-10">
                    <tr><th className="px-6 py-3 font-medium text-gray-500 text-left">Question</th>
                    <th className="px-4 py-3 font-medium text-gray-500 text-left">Quiz</th>
                    <th className="px-4 py-3 font-medium text-gray-500 text-left">Answer</th>
                    <th className="px-4 py-3 font-medium text-gray-500 text-left">Actions</th></tr>
                  </thead>
                  <tbody>
                    {stats.questions.map(q => {
                      const quiz = stats.quizzes.find(qz => qz.id === q.quizId);
                      return (
                        <tr key={q.id} className="border-t border-gray-50 hover:bg-gray-50">
                          <td className="px-6 py-3 max-w-xs">
                            <p className="text-gray-900 font-medium truncate">{q.question}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{quiz?.title || '—'}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">{['A','B','C','D'][q.correct]}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5">
                              <button onClick={() => startEdit(q)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit3 size={14} /></button>
                              <button onClick={() => handleDeleteQ(q.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── QUIZZES TAB ── */}
        {tab === 'quizzes' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-display font-semibold text-lg text-gray-900">Quizzes ({stats.quizzes.length})</h2>
              <button onClick={() => setShowAddQuiz(!showAddQuiz)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                <Plus size={15} /> Create Quiz
              </button>
            </div>
            {showAddQuiz && (
              <div className="card border-2 border-indigo-200">
                <h3 className="font-semibold text-base text-gray-900 mb-4">New Quiz</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input value={quizForm.title} onChange={e => setQuizForm(f => ({ ...f, title: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                    placeholder="Quiz title…" />
                  <select value={quizForm.topicId} onChange={e => setQuizForm(f => ({ ...f, topicId: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 bg-white">
                    <option value="">Select Topic…</option>
                    {stats.topics.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                  </select>
                  <select value={quizForm.duration} onChange={e => setQuizForm(f => ({ ...f, duration: parseInt(e.target.value) }))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 bg-white">
                    {[300,600,900,1200,1800].map(d => <option key={d} value={d}>{d/60} minutes</option>)}
                  </select>
                  <select value={quizForm.difficulty} onChange={e => setQuizForm(f => ({ ...f, difficulty: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 bg-white">
                    {['Easy','Medium','Hard'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={handleAddQuiz} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">Create Quiz</button>
                  <button onClick={() => setShowAddQuiz(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors">Cancel</button>
                </div>
              </div>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.quizzes.map(quiz => {
                const topic = stats.topics.find(t => t.id === quiz.topicId);
                const qCount = stats.questions.filter(q => q.quizId === quiz.id).length;
                return (
                  <div key={quiz.id} className="card">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{topic?.icon}</span>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{quiz.title}</p>
                          <p className="text-xs text-gray-400">{topic?.name}</p>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteQuiz(quiz.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex gap-2 flex-wrap mt-3">
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{qCount} questions</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${quiz.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : quiz.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{quiz.difficulty}</span>
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{quiz.attempts} attempts</span>
                    </div>
                    <Link href={`/quiz/${quiz.id}`} className="mt-3 flex items-center gap-1 text-xs text-indigo-600 font-medium hover:underline">
                      <Eye size={12} /> Preview Quiz
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TOPICS TAB ── */}
        {tab === 'topics' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-display font-semibold text-lg text-gray-900">Topics ({stats.topics.length})</h2>
              <button onClick={() => setShowAddTopic(!showAddTopic)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                <Plus size={15} /> Add Topic
              </button>
            </div>
            {showAddTopic && (
              <div className="card border-2 border-indigo-200">
                <h3 className="font-semibold text-base mb-4">New Topic</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input value={topicForm.name} onChange={e => setTopicForm(f => ({ ...f, name: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                    placeholder="Topic name…" />
                  <input value={topicForm.icon} onChange={e => setTopicForm(f => ({ ...f, icon: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                    placeholder="Icon emoji…" />
                  <input value={topicForm.description} onChange={e => setTopicForm(f => ({ ...f, description: e.target.value }))}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 sm:col-span-2"
                    placeholder="Description…" />
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={handleAddTopic} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700">Add Topic</button>
                  <button onClick={() => setShowAddTopic(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
                </div>
              </div>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.topics.map(t => (
                <div key={t.id} className="card text-center">
                  <div className="text-3xl mb-2">{t.icon}</div>
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{t.quizCount} quizzes</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── MODERATION TAB ── */}
        {tab === 'moderation' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-lg text-gray-900 flex items-center gap-2">
                <MessageCircle size={20} className="text-indigo-500" /> Chat Moderation
              </h2>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              {/* Room selector */}
              <div className="card md:col-span-1">
                <h3 className="font-semibold text-sm text-gray-700 mb-3">Rooms</h3>
                <div className="space-y-1">
                  {communityRooms.map(r => (
                    <button key={r.id} onClick={() => { setModerateRoom(r.id); setModerateMsgs(getRoomMessages(r.id)); }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${moderateRoom === r.id ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}>
                      {r.icon} {r.name}
                    </button>
                  ))}
                </div>
              </div>
              {/* Messages */}
              <div className="card md:col-span-3 p-0 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                  <p className="font-semibold text-sm text-gray-900">{communityRooms.find(r => r.id === moderateRoom)?.name}</p>
                  <span className="text-xs text-gray-400">{moderateMsgs.length} messages</span>
                </div>
                <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-50">
                  {moderateMsgs.length === 0 ? (
                    <div className="py-10 text-center text-gray-400 text-sm">No messages in this room</div>
                  ) : (
                    moderateMsgs.map(m => (
                      <div key={m.id} className="flex items-start gap-3 px-5 py-3 hover:bg-red-50 group transition-colors">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{m.avatar}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-xs text-gray-800">{m.userName}</span>
                            {m.isDoubt && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Doubt</span>}
                            <span className="text-xs text-gray-400">{new Date(m.ts).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-gray-700">{m.text}</p>
                        </div>
                        <button onClick={() => handleDeleteMsg(moderateRoom, m.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all shrink-0">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PDF TAB ── */}
        {tab === 'pdf' && (
          <div className="text-center py-16">
            <Brain size={48} className="mx-auto text-indigo-300 mb-4" />
            <h3 className="font-display font-bold text-xl text-gray-800 mb-2">AI PDF Question Extractor</h3>
            <p className="text-gray-500 mb-6">Upload PDF files and let AI extract MCQ questions automatically</p>
            <Link href="/admin/pdf-upload" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
              <Upload size={18} /> Open PDF Uploader
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
