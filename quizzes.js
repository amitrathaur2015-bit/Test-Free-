import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/admin/AdminLayout';
import { getDB, saveDB, addQuiz, addQuestion, editQuestion, deleteQuestion, deleteQuiz, addTopic, deleteTopic, editTopic } from '../../lib/store';
import { logAdminAction } from '../../lib/admin-store';
import { Plus, Trash2, Edit3, Eye, BookOpen, HelpCircle, Search, Upload, Check, X, ChevronDown, ChevronUp } from 'lucide-react';

const S = {
  card: { background: '#13161f', border: '1px solid #1e2433' },
  input: { background: '#0f1117', border: '1px solid #2a3040', color: '#e2e8f0' },
  th: 'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider',
};

const DIFF_COLORS = { Easy: 'text-green-400 bg-green-500/10 border-green-500/25', Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/25', Hard: 'text-red-400 bg-red-500/10 border-red-500/25' };

export default function AdminQuizzes() {
  const [db, setDb] = useState(null);
  const [tab, setTab] = useState('quizzes');
  const [search, setSearch] = useState('');
  const [filterTopic, setFilterTopic] = useState('all');
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  const [toast, setToast] = useState('');

  // Forms
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [showQForm, setShowQForm] = useState(false);
  const [editingQ, setEditingQ] = useState(null);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [quizForm, setQuizForm] = useState({ title: '', topicId: '', duration: 600, difficulty: 'Medium', passingMarks: 50 });
  const [topicForm, setTopicForm] = useState({ name: '', icon: '📚', description: '', color: 'bg-blue-100 text-blue-700' });
  const [qForm, setQForm] = useState({ quizId: '', topicId: '', question: '', options: ['', '', '', ''], correct: 0, explanation: '' });
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);

  const load = () => setDb(getDB());
  useEffect(() => { load(); }, []);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  const handleAddQuiz = () => {
    if (!quizForm.title || !quizForm.topicId) return;
    addQuiz({ ...quizForm, topicId: parseInt(quizForm.topicId), duration: parseInt(quizForm.duration), passingMarks: parseInt(quizForm.passingMarks || 50) });
    logAdminAction(1, 'CREATE_QUIZ', `Created quiz "${quizForm.title}"`);
    setQuizForm({ title: '', topicId: '', duration: 600, difficulty: 'Medium', passingMarks: 50 });
    setShowQuizForm(false); load(); showToast('✅ Quiz created');
  };

  const handleTogglePublish = (quizId) => {
    const d = getDB();
    const quiz = d.quizzes.find(q => q.id === quizId);
    if (!quiz) return;
    quiz.published = !quiz.published;
    saveDB();
    logAdminAction(1, quiz.published ? 'PUBLISH_QUIZ' : 'UNPUBLISH_QUIZ', `Quiz "${quiz.title}"`);
    load(); showToast(`Quiz ${quiz.published ? 'published' : 'unpublished'}`);
  };

  const handleDeleteQuiz = (quizId, title) => {
    if (!confirm(`Delete "${title}"?`)) return;
    deleteQuiz(quizId);
    logAdminAction(1, 'DELETE_QUIZ', `Deleted quiz "${title}"`);
    load(); showToast('Quiz deleted');
  };

  const handleAddQ = () => {
    const f = { ...qForm, quizId: parseInt(qForm.quizId), topicId: parseInt(qForm.topicId || 1), correct: parseInt(qForm.correct) };
    if (editingQ) {
      editQuestion(editingQ.id, f);
      logAdminAction(1, 'EDIT_QUESTION', `Edited Q ${editingQ.id}`);
      showToast('Question updated');
    } else {
      addQuestion(f);
      logAdminAction(1, 'ADD_QUESTION', `Added question to quiz ${f.quizId}`);
      showToast('Question added');
    }
    setQForm({ quizId: '', topicId: '', question: '', options: ['', '', '', ''], correct: 0, explanation: '' });
    setEditingQ(null); setShowQForm(false); load();
  };

  const handleDeleteQ = (id) => {
    deleteQuestion(id);
    logAdminAction(1, 'DELETE_QUESTION', `Deleted question ${id}`);
    load(); showToast('Question deleted');
  };

  const handleBulkImport = () => {
    if (!qForm.quizId || !bulkText.trim()) return;
    const lines = bulkText.split('\n').map(l => l.trim()).filter(Boolean);
    let imported = 0, q = null;
    lines.forEach(line => {
      if (/^\d+[.)]\s/.test(line) || (line.endsWith('?') && !q)) {
        if (q && q.options.length === 4) { addQuestion(q); imported++; }
        q = { quizId: parseInt(qForm.quizId), topicId: parseInt(qForm.topicId || 1), question: line.replace(/^\d+[.)]\s*/, ''), options: [], correct: 0, explanation: '' };
      } else if (q && /^[A-Da-d][.)]\s/.test(line)) {
        q.options.push(line.replace(/^[A-Da-d][.)]\s*/, '').replace(/\*$/, ''));
        if (line.includes('*') || line.toLowerCase().includes('(correct)')) q.correct = q.options.length - 1;
      }
    });
    if (q && q.options.length === 4) { addQuestion(q); imported++; }
    logAdminAction(1, 'BULK_IMPORT', `Imported ${imported} questions`);
    setBulkText(''); setShowBulk(false); load();
    showToast(`✅ Imported ${imported} questions`);
  };

  const handleAddTopic = () => {
    if (!topicForm.name) return;
    if (editingTopic) {
      editTopic(editingTopic.id, topicForm);
      logAdminAction(1, 'EDIT_TOPIC', `Edited topic "${topicForm.name}"`);
      showToast('Topic updated');
    } else {
      addTopic(topicForm);
      logAdminAction(1, 'CREATE_TOPIC', `Created topic "${topicForm.name}"`);
      showToast('Topic created');
    }
    setTopicForm({ name: '', icon: '📚', description: '', color: 'bg-blue-100 text-blue-700' });
    setEditingTopic(null);
    setShowTopicForm(false);
    load();
  };

  const startEditTopic = (t) => {
    setEditingTopic(t);
    setTopicForm({ name: t.name, icon: t.icon, description: t.description || '', color: t.color || 'bg-blue-100 text-blue-700' });
    setShowTopicForm(true);
  };

  const handleDeleteTopic = (t) => {
    const qCount = db.quizzes.filter(q => q.topicId === t.id).length;
    const msg = qCount > 0
      ? `"${t.name}" topic ke saath ${qCount} quiz(zes) aur unke saare questions bhi delete ho jayenge. Pakka delete karna hai?`
      : `Pakka "${t.name}" topic delete karna hai?`;
    if (!confirm(msg)) return;
    deleteTopic(t.id);
    logAdminAction(1, 'DELETE_TOPIC', `Deleted topic "${t.name}" (${qCount} quizzes removed)`);
    showToast('Topic deleted');
    load();
  };

  if (!db) return <AdminLayout title="Quiz Management"><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div></AdminLayout>;

  const filteredQuizzes = db.quizzes.filter(q => {
    const m = !search || q.title.toLowerCase().includes(search.toLowerCase());
    const t = filterTopic === 'all' || q.topicId === parseInt(filterTopic);
    return m && t;
  });

  return (
    <AdminLayout title="Quiz Management">
      {toast && <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 shadow-xl animate-fade-in">{toast}</div>}

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: '#13161f', border: '1px solid #1e2433' }}>
        {['quizzes', 'questions', 'topics'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── QUIZZES ── */}
      {tab === 'quizzes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search quizzes..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none" style={S.input} />
            </div>
            <select value={filterTopic} onChange={e => setFilterTopic(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm" style={S.input}>
              <option value="all">All Topics</option>
              {db.topics.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
            </select>
            <button onClick={() => setShowQuizForm(!showQuizForm)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
              <Plus size={15} /> New Quiz
            </button>
          </div>

          {showQuizForm && (
            <div className="rounded-2xl p-5" style={{ ...S.card, border: '1px solid #3730a3' }}>
              <h3 className="font-semibold text-white mb-4">Create Quiz</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <input value={quizForm.title} onChange={e => setQuizForm(f => ({ ...f, title: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl text-sm focus:outline-none sm:col-span-2" style={S.input} placeholder="Quiz title..." />
                <select value={quizForm.topicId} onChange={e => setQuizForm(f => ({ ...f, topicId: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl text-sm" style={S.input}>
                  <option value="">Select Topic...</option>
                  {db.topics.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                </select>
                <select value={quizForm.difficulty} onChange={e => setQuizForm(f => ({ ...f, difficulty: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl text-sm" style={S.input}>
                  {['Easy', 'Medium', 'Hard'].map(d => <option key={d}>{d}</option>)}
                </select>
                <div className="flex items-center gap-2">
                  <input type="number" value={quizForm.duration / 60} onChange={e => setQuizForm(f => ({ ...f, duration: parseInt(e.target.value) * 60 }))}
                    className="flex-1 px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={S.input} min={1} max={120} />
                  <span className="text-sm text-gray-500 shrink-0">minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" value={quizForm.passingMarks} onChange={e => setQuizForm(f => ({ ...f, passingMarks: parseInt(e.target.value) }))}
                    className="flex-1 px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={S.input} min={0} max={100} />
                  <span className="text-sm text-gray-500 shrink-0">% passing</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleAddQuiz} className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">Create Quiz</button>
                <button onClick={() => setShowQuizForm(false)} className="px-5 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors">Cancel</button>
              </div>
            </div>
          )}

          <div className="rounded-2xl overflow-hidden" style={S.card}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ borderBottom: '1px solid #1e2433' }}>
                  <tr>
                    <th className={S.th}>Quiz</th>
                    <th className={S.th}>Topic</th>
                    <th className={S.th}>Questions</th>
                    <th className={S.th}>Difficulty</th>
                    <th className={S.th}>Duration</th>
                    <th className={S.th}>Attempts</th>
                    <th className={S.th}>Status</th>
                    <th className={S.th}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: '#1e2433' }}>
                  {filteredQuizzes.map(quiz => {
                    const topic = db.topics.find(t => t.id === quiz.topicId);
                    const qCount = db.questions.filter(q => q.quizId === quiz.id).length;
                    const isExpanded = expandedQuiz === quiz.id;
                    return (
                      <>
                        <tr key={quiz.id} className="hover:bg-white/2 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <button onClick={() => setExpandedQuiz(isExpanded ? null : quiz.id)} className="text-gray-500 hover:text-gray-300">
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                              <span className="text-sm font-medium text-gray-100">{quiz.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-400">{topic?.icon} {topic?.name}</td>
                          <td className="px-4 py-3.5 text-sm text-gray-300">{qCount}</td>
                          <td className="px-4 py-3.5">
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${DIFF_COLORS[quiz.difficulty] || DIFF_COLORS.Medium}`}>{quiz.difficulty}</span>
                          </td>
                          <td className="px-4 py-3.5 text-sm text-gray-400">{quiz.duration / 60}m</td>
                          <td className="px-4 py-3.5 text-sm text-gray-300">{quiz.attempts || 0}</td>
                          <td className="px-4 py-3.5">
                            <button onClick={() => handleTogglePublish(quiz.id)}
                              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${quiz.published !== false ? 'text-green-400 bg-green-500/10 border-green-500/25' : 'text-gray-500 bg-gray-500/10 border-gray-500/25'}`}>
                              {quiz.published !== false ? '● Published' : '○ Draft'}
                            </button>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex gap-1">
                              <Link href={`/quiz/${quiz.id}`} className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"><Eye size={14} /></Link>
                              <button onClick={() => handleDeleteQuiz(quiz.id, quiz.title)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && db.questions.filter(q => q.quizId === quiz.id).map(q => (
                          <tr key={`q-${q.id}`} style={{ background: '#0c0f16' }}>
                            <td colSpan={8} className="px-8 py-2.5">
                              <div className="flex items-start gap-3">
                                <span className="text-xs text-indigo-400 font-mono shrink-0 mt-0.5">Q{q.id}</span>
                                <div className="flex-1 text-sm text-gray-300">{q.question}</div>
                                <span className="text-xs text-green-400 shrink-0">✓ {['A','B','C','D'][q.correct]}</span>
                                <button onClick={() => { setEditingQ(q); setQForm({ ...q, quizId: String(q.quizId) }); setShowQForm(true); setTab('questions'); }}
                                  className="p-1 text-gray-500 hover:text-indigo-400 transition-colors"><Edit3 size={13} /></button>
                                <button onClick={() => handleDeleteQ(q.id)} className="p-1 text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── QUESTIONS ── */}
      {tab === 'questions' && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => { setEditingQ(null); setQForm({ quizId: '', topicId: '', question: '', options: ['', '', '', ''], correct: 0, explanation: '' }); setShowQForm(!showQForm); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
              <Plus size={15} /> Add Question
            </button>
            <button onClick={() => setShowBulk(!showBulk)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition-colors" style={{ border: '1px solid #2a3040', background: '#0f1117' }}>
              <Upload size={15} /> Bulk Import
            </button>
          </div>

          {showBulk && (
            <div className="rounded-2xl p-5 space-y-3" style={{ ...S.card, border: '1px solid #3730a3' }}>
              <h3 className="font-semibold text-white">Bulk Import Questions</h3>
              <p className="text-xs text-gray-400">Format: "1. Question?" then "A. Option A", "B. Option B*" (mark correct with *)</p>
              <select value={qForm.quizId} onChange={e => setQForm(f => ({ ...f, quizId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-sm" style={S.input}>
                <option value="">Select Quiz...</option>
                {db.quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
              </select>
              <textarea value={bulkText} onChange={e => setBulkText(e.target.value)}
                rows={8} className="w-full px-3 py-2.5 rounded-xl text-sm font-mono focus:outline-none resize-none"
                style={S.input} placeholder="1. What is 2+2?&#10;A. 3&#10;B. 4*&#10;C. 5&#10;D. 6&#10;&#10;2. Next question..." />
              <div className="flex gap-2">
                <button onClick={handleBulkImport} className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">Import</button>
                <button onClick={() => setShowBulk(false)} className="px-5 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-200 transition-colors">Cancel</button>
              </div>
            </div>
          )}

          {showQForm && (
            <div className="rounded-2xl p-5 space-y-3" style={{ ...S.card, border: '1px solid #3730a3' }}>
              <h3 className="font-semibold text-white">{editingQ ? 'Edit' : 'Add'} Question</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <select value={qForm.quizId} onChange={e => setQForm(f => ({ ...f, quizId: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl text-sm" style={S.input}>
                  <option value="">Select Quiz...</option>
                  {db.quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                </select>
                <select value={qForm.topicId} onChange={e => setQForm(f => ({ ...f, topicId: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl text-sm" style={S.input}>
                  <option value="">Topic...</option>
                  {db.topics.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
                </select>
              </div>
              <textarea value={qForm.question} onChange={e => setQForm(f => ({ ...f, question: e.target.value }))}
                rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none resize-none" style={S.input} placeholder="Question text..." />
              <div className="grid grid-cols-2 gap-2">
                {qForm.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <button onClick={() => setQForm(f => ({ ...f, correct: oi }))}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${parseInt(qForm.correct) === oi ? 'border-green-500 bg-green-500' : 'border-gray-600'}`}>
                      {parseInt(qForm.correct) === oi && <Check size={12} className="text-white" />}
                    </button>
                    <span className="text-xs text-gray-500 font-bold w-4">{['A','B','C','D'][oi]}</span>
                    <input value={opt} onChange={e => setQForm(f => { const o = [...f.options]; o[oi] = e.target.value; return { ...f, options: o }; })}
                      className="flex-1 px-2 py-1.5 rounded-lg text-sm focus:outline-none" style={S.input} placeholder={`Option ${['A','B','C','D'][oi]}`} />
                  </div>
                ))}
              </div>
              <input value={qForm.explanation} onChange={e => setQForm(f => ({ ...f, explanation: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none" style={S.input} placeholder="Explanation (optional)" />
              <div className="flex gap-2">
                <button onClick={handleAddQ} className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">{editingQ ? 'Update' : 'Add'}</button>
                <button onClick={() => { setShowQForm(false); setEditingQ(null); }} className="px-5 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-200 transition-colors">Cancel</button>
              </div>
            </div>
          )}

          <div className="rounded-2xl overflow-hidden" style={S.card}>
            <div className="max-h-[600px] overflow-y-auto divide-y" style={{ borderColor: '#1e2433' }}>
              {db.questions.map(q => {
                const quiz = db.quizzes.find(qz => qz.id === q.quizId);
                return (
                  <div key={q.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-white/2 transition-colors">
                    <span className="text-xs text-gray-600 font-mono mt-0.5 shrink-0">#{q.id}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 font-medium">{q.question}</p>
                      <div className="flex gap-2 mt-1.5 flex-wrap">
                        {q.options.map((opt, oi) => (
                          <span key={oi} className={`text-xs px-2 py-0.5 rounded-lg ${oi === q.correct ? 'bg-green-500/15 text-green-400 border border-green-500/25' : 'bg-white/5 text-gray-500'}`}>
                            {['A','B','C','D'][oi]}. {opt}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{quiz?.title}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => { setEditingQ(q); setQForm({ ...q, quizId: String(q.quizId) }); setShowQForm(true); }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"><Edit3 size={14} /></button>
                      <button onClick={() => handleDeleteQ(q.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"><Trash2 size={14} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TOPICS ── */}
      {tab === 'topics' && (
        <div className="space-y-4">
          <button onClick={() => { setEditingTopic(null); setTopicForm({ name: '', icon: '📚', description: '', color: 'bg-blue-100 text-blue-700' }); setShowTopicForm(!showTopicForm); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
            <Plus size={15} /> New Topic
          </button>
          {showTopicForm && (
            <div className="rounded-2xl p-5 space-y-3" style={{ ...S.card, border: '1px solid #3730a3' }}>
              <p className="text-sm font-semibold text-white">{editingTopic ? `Editing "${editingTopic.name}"` : 'New Topic'}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <input value={topicForm.name} onChange={e => setTopicForm(f => ({ ...f, name: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={S.input} placeholder="Topic name..." />
                <input value={topicForm.icon} onChange={e => setTopicForm(f => ({ ...f, icon: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={S.input} placeholder="Emoji icon..." />
                <input value={topicForm.description} onChange={e => setTopicForm(f => ({ ...f, description: e.target.value }))}
                  className="px-3 py-2.5 rounded-xl text-sm focus:outline-none sm:col-span-2" style={S.input} placeholder="Description..." />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAddTopic} className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
                  {editingTopic ? 'Update Topic' : 'Create Topic'}
                </button>
                <button onClick={() => { setShowTopicForm(false); setEditingTopic(null); }} className="px-5 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-200 transition-colors">Cancel</button>
              </div>
            </div>
          )}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {db.topics.map(t => {
              const qCount = db.quizzes.filter(q => q.topicId === t.id).length;
              return (
                <div key={t.id} className="rounded-2xl p-5 relative group" style={S.card}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-3xl">{t.icon}</div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEditTopic(t)}
                        className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-colors" title="Edit">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDeleteTopic(t)}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="font-semibold text-white text-base">{t.name}</p>
                  <p className="text-xs text-gray-500 mt-1 mb-2">{t.description}</p>
                  <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">{qCount} quizzes</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
