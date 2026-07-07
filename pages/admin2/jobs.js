import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/admin/AdminLayout';
import { getDB, saveDB, addJob, editJob, deleteJob, addTopic, deleteQuestion, addQuiz, addQuestion, editQuestion, deleteQuiz, getJobStats, syncJobCounts } from '../../lib/store';
import { logAdminAction } from '../../lib/admin-store';
import { Plus, Trash2, Edit3, Briefcase, BookOpen, Star, ChevronDown, ChevronUp, Search, Check, X, HelpCircle, Eye } from 'lucide-react';

const S = {
  card: { background: '#13161f', border: '1px solid #1e2433' },
  input: { background: '#0f1117', border: '1px solid #2a3040', color: '#e2e8f0' },
};

const JOB_ICONS = ['👮','📋','🚆','🏛️','🏦','🎓','🏥','⚖️','🌾','🔬','🏗️','✈️','🛡️','📚','🏫'];
const TOPIC_ICONS = ['📐','🔬','📜','🌍','💻','📝','🧠','⚽','📊','🗺️','🏛️','⚗️','🔢','💡','📖'];
const COLORS = [
  { label: 'Blue', value: 'bg-blue-100 text-blue-700' },
  { label: 'Green', value: 'bg-green-100 text-green-700' },
  { label: 'Amber', value: 'bg-amber-100 text-amber-700' },
  { label: 'Purple', value: 'bg-purple-100 text-purple-700' },
  { label: 'Teal', value: 'bg-teal-100 text-teal-700' },
  { label: 'Rose', value: 'bg-rose-100 text-rose-700' },
  { label: 'Indigo', value: 'bg-indigo-100 text-indigo-700' },
  { label: 'Orange', value: 'bg-orange-100 text-orange-700' },
];

export default function AdminJobs() {
  const [db, setDb] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [expandedJob, setExpandedJob] = useState(null);
  const [expandedTopic, setExpandedTopic] = useState(null);
  const [toast, setToast] = useState('');
  const [search, setSearch] = useState('');

  // Forms
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobForm, setJobForm] = useState({ name: '', icon: '📌', description: '', color: COLORS[0].value, tags: '' });

  const [showTopicForm, setShowTopicForm] = useState(null); // jobId
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicForm, setTopicForm] = useState({ name: '', icon: '📚', description: '' });

  const [showQuizForm, setShowQuizForm] = useState(null); // topicId
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [quizForm, setQuizForm] = useState({ title: '', duration: 600, difficulty: 'Medium', passingMarks: 60 });

  const [showQForm, setShowQForm] = useState(null); // quizId
  const [editingQ, setEditingQ] = useState(null);
  const [qForm, setQForm] = useState({ question: '', options: ['', '', '', ''], correct: 0, explanation: '' });

  const reload = () => {
    syncJobCounts();
    const d = getDB();
    setDb(d);
    setJobs(d.jobs || []);
  };

  useEffect(() => { reload(); }, []);

  const showMsg = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  // ── JOB CRUD ────────────────────────────────────────────────────────────────
  const handleSaveJob = () => {
    if (!jobForm.name.trim()) return;
    const tags = jobForm.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (editingJob) {
      editJob(editingJob.id, { ...jobForm, tags });
      showMsg('✅ Naukri updated!');
      logAdminAction(1, 'EDIT_JOB', `Updated job: ${jobForm.name}`);
    } else {
      addJob({ ...jobForm, tags });
      showMsg('✅ Naukri add ho gayi!');
      logAdminAction(1, 'ADD_JOB', `Added job: ${jobForm.name}`);
    }
    setShowJobForm(false); setEditingJob(null);
    setJobForm({ name: '', icon: '📌', description: '', color: COLORS[0].value, tags: '' });
    reload();
  };

  const handleDeleteJob = (job) => {
    if (!confirm(`"${job.name}" aur iske saare topics + quizzes delete karein?`)) return;
    deleteJob(job.id);
    showMsg('✅ Naukri delete ho gayi!');
    logAdminAction(1, 'DELETE_JOB', `Deleted job: ${job.name}`);
    reload();
  };

  const startEditJob = (job) => {
    setEditingJob(job);
    setJobForm({ name: job.name, icon: job.icon, description: job.description, color: job.color, tags: (job.tags || []).join(', ') });
    setShowJobForm(true);
  };

  // ── TOPIC CRUD ──────────────────────────────────────────────────────────────
  const handleSaveTopic = (jobId) => {
    if (!topicForm.name.trim()) return;
    if (editingTopic) {
      const d = getDB();
      const t = d.topics.find(t => t.id === editingTopic.id);
      if (t) { Object.assign(t, topicForm); saveDB(); }
      showMsg('✅ Topic updated!');
    } else {
      const d = getDB();
      d.topics.push({ id: d.nextTopicId++, ...topicForm, jobId: parseInt(jobId), quizCount: 0 });
      saveDB();
      showMsg('✅ Topic add ho gaya!');
    }
    setShowTopicForm(null); setEditingTopic(null);
    setTopicForm({ name: '', icon: '📚', description: '' });
    reload();
  };

  const handleDeleteTopic = (topic) => {
    if (!confirm(`"${topic.name}" aur iske saare quizzes delete karein?`)) return;
    const d = getDB();
    const qIds = d.quizzes.filter(q => q.topicId === topic.id).map(q => q.id);
    d.questions = d.questions.filter(q => !qIds.includes(q.quizId));
    d.quizzes = d.quizzes.filter(q => q.topicId !== topic.id);
    d.topics = d.topics.filter(t => t.id !== topic.id);
    saveDB();
    showMsg('✅ Topic delete ho gaya!');
    reload();
  };

  const startEditTopic = (topic) => {
    setEditingTopic(topic);
    setTopicForm({ name: topic.name, icon: topic.icon, description: topic.description || '' });
    setShowTopicForm(topic.jobId);
  };

  // ── QUIZ CRUD ───────────────────────────────────────────────────────────────
  const handleSaveQuiz = (topicId) => {
    if (!quizForm.title.trim()) return;
    if (editingQuiz) {
      const d = getDB();
      const q = d.quizzes.find(q => q.id === editingQuiz.id);
      if (q) { Object.assign(q, { ...quizForm, duration: parseInt(quizForm.duration), passingMarks: parseInt(quizForm.passingMarks) }); saveDB(); }
      showMsg('✅ Quiz updated!');
    } else {
      addQuiz({ ...quizForm, topicId: parseInt(topicId), duration: parseInt(quizForm.duration), passingMarks: parseInt(quizForm.passingMarks) });
      showMsg('✅ Quiz bana di!');
    }
    setShowQuizForm(null); setEditingQuiz(null);
    setQuizForm({ title: '', duration: 600, difficulty: 'Medium', passingMarks: 60 });
    reload();
  };

  const handleDeleteQuiz = (quiz) => {
    if (!confirm(`"${quiz.title}" delete karein?`)) return;
    deleteQuiz(quiz.id);
    showMsg('✅ Quiz delete ho gayi!');
    reload();
  };

  const startEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setQuizForm({ title: quiz.title, duration: quiz.duration, difficulty: quiz.difficulty, passingMarks: quiz.passingMarks || 60 });
    setShowQuizForm(quiz.topicId);
  };

  // ── QUESTION CRUD ──────────────────────────────────────────────────────────
  const handleSaveQ = (quizId, topicId) => {
    if (!qForm.question.trim() || qForm.options.some(o => !o.trim())) return;
    if (editingQ) {
      editQuestion(editingQ.id, { ...qForm, quizId: parseInt(quizId), topicId: parseInt(topicId), correct: parseInt(qForm.correct) });
      showMsg('✅ Question updated!');
    } else {
      addQuestion({ ...qForm, quizId: parseInt(quizId), topicId: parseInt(topicId), correct: parseInt(qForm.correct) });
      showMsg('✅ Question add ho gaya!');
    }
    setShowQForm(null); setEditingQ(null);
    setQForm({ question: '', options: ['', '', '', ''], correct: 0, explanation: '' });
    reload();
  };

  const handleDeleteQ = (id) => {
    if (!confirm('Question delete karein?')) return;
    deleteQuestion(id);
    showMsg('✅ Question delete ho gaya!');
    reload();
  };

  const startEditQ = (q) => {
    setEditingQ(q);
    setQForm({ question: q.question, options: [...q.options], correct: q.correct, explanation: q.explanation || '' });
    setShowQForm(q.quizId);
  };

  const filteredJobs = jobs.filter(j => !search || j.name.toLowerCase().includes(search.toLowerCase()));

  const inputCls = "w-full px-3 py-2 rounded-xl text-sm focus:outline-none";
  const btnPrimary = "flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all";

  return (
    <AdminLayout title="Naukri & Quiz Management">
      {toast && <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-xl" style={{ background: '#4f46e5' }}>{toast}</div>}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-white flex items-center gap-2">
            <Briefcase size={22} className="text-indigo-400" /> Naukri Management
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Naukri → Topic → Quiz → Question — teen level hierarchy</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Naukri dhundo..."
              className="pl-8 pr-4 py-2 rounded-xl text-sm focus:outline-none" style={S.input} />
          </div>
          <button onClick={() => { setEditingJob(null); setJobForm({ name: '', icon: '📌', description: '', color: COLORS[0].value, tags: '' }); setShowJobForm(true); }}
            className={btnPrimary} style={{ background: '#4f46e5' }}>
            <Plus size={15} /> Naukri Add Karo
          </button>
        </div>
      </div>

      {/* Add/Edit Job Form */}
      {showJobForm && (
        <div className="rounded-2xl p-5 mb-6 border-2" style={{ ...S.card, borderColor: '#4f46e5' }}>
          <h3 className="font-display font-semibold text-white mb-4">{editingJob ? 'Naukri Edit Karo' : 'Nai Naukri Add Karo'}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Naukri ka naam *</label>
              <input value={jobForm.name} onChange={e => setJobForm(f => ({ ...f, name: e.target.value }))}
                className={inputCls} style={S.input} placeholder="jaise: UP Police, SSC CGL..." />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Description</label>
              <input value={jobForm.description} onChange={e => setJobForm(f => ({ ...f, description: e.target.value }))}
                className={inputCls} style={S.input} placeholder="Exam ke baare mein..." />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Icon chuno</label>
              <div className="flex gap-1.5 flex-wrap">
                {JOB_ICONS.map(icon => (
                  <button key={icon} onClick={() => setJobForm(f => ({ ...f, icon }))}
                    className={`w-9 h-9 rounded-xl text-lg transition-all ${jobForm.icon === icon ? 'ring-2 ring-indigo-500 scale-110' : 'opacity-60 hover:opacity-100'}`}
                    style={{ background: '#1e2433' }}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Color theme</label>
              <div className="flex gap-1.5 flex-wrap">
                {COLORS.map(c => (
                  <button key={c.value} onClick={() => setJobForm(f => ({ ...f, color: c.value }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${c.value} ${jobForm.color === c.value ? 'ring-2 ring-indigo-400 scale-105' : 'opacity-60 hover:opacity-100'}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Tags (comma se alag karo)</label>
              <input value={jobForm.tags} onChange={e => setJobForm(f => ({ ...f, tags: e.target.value }))}
                className={inputCls} style={S.input} placeholder="jaise: UP, Police, State" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSaveJob} className={btnPrimary} style={{ background: '#4f46e5' }}>
              <Check size={14} /> {editingJob ? 'Update Karo' : 'Add Karo'}
            </button>
            <button onClick={() => { setShowJobForm(false); setEditingJob(null); }} className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors">
              Raho do
            </button>
          </div>
        </div>
      )}

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={S.card}>
          <Briefcase size={40} className="mx-auto mb-3" style={{ color: '#2d3748' }} />
          <p className="text-gray-500 font-medium">{search ? 'Koi naukri nahi mili' : 'Koi naukri abhi tak add nahi hui'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map(job => {
            const jobTopics = (db?.topics || []).filter(t => t.jobId === job.id);
            const isExpanded = expandedJob === job.id;
            const jStats = getJobStats(job.id);

            return (
              <div key={job.id} className="rounded-2xl overflow-hidden" style={S.card}>
                {/* Job row */}
                <div className="flex items-center gap-4 p-4">
                  <span className="text-3xl shrink-0">{job.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display font-bold text-white text-base">{job.name}</h3>
                      {(job.tags || []).map(t => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#1e2433', color: '#94a3b8' }}>{t}</span>
                      ))}
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">{job.description}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                      <span className="flex items-center gap-1"><BookOpen size={11} className="text-indigo-400" /> {jStats.topicCount} topics</span>
                      <span className="flex items-center gap-1"><Star size={11} className="text-amber-400" /> {jStats.quizCount} quizzes</span>
                      <span className="flex items-center gap-1"><HelpCircle size={11} className="text-green-400" /> {jStats.questionCount} questions</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link href={`/jobs/${job.id}`} target="_blank"
                      className="p-2 rounded-xl text-gray-500 hover:text-indigo-400 transition-colors" style={{ background: '#1e2433' }}>
                      <Eye size={14} />
                    </Link>
                    <button onClick={() => startEditJob(job)}
                      className="p-2 rounded-xl text-gray-500 hover:text-indigo-400 transition-colors" style={{ background: '#1e2433' }}>
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => handleDeleteJob(job)}
                      className="p-2 rounded-xl text-gray-500 hover:text-red-400 transition-colors" style={{ background: '#1e2433' }}>
                      <Trash2 size={14} />
                    </button>
                    <button onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-indigo-400 transition-all" style={{ background: '#1a1f40' }}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      Topics {isExpanded ? 'hide' : 'dekho'}
                    </button>
                  </div>
                </div>

                {/* Topics section */}
                {isExpanded && (
                  <div className="border-t px-4 pb-4 pt-3 space-y-2" style={{ borderColor: '#1e2433' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Topics ({jobTopics.length})</span>
                      <button onClick={() => { setEditingTopic(null); setTopicForm({ name: '', icon: '📚', description: '' }); setShowTopicForm(job.id); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-green-400 transition-all"
                        style={{ background: '#0a2e1a', border: '1px solid #15803d40' }}>
                        <Plus size={12} /> Topic Add Karo
                      </button>
                    </div>

                    {/* Add/Edit Topic Form */}
                    {showTopicForm === job.id && (
                      <div className="rounded-xl p-3 mb-3" style={{ background: '#0f1117', border: '1px solid #2a3040' }}>
                        <p className="text-xs font-semibold text-gray-400 mb-2">{editingTopic ? 'Topic Edit Karo' : 'Naya Topic'}</p>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input value={topicForm.name} onChange={e => setTopicForm(f => ({ ...f, name: e.target.value }))}
                            className="px-3 py-2 rounded-xl text-xs focus:outline-none col-span-2" style={S.input}
                            placeholder="Topic ka naam... jaise General Hindi" />
                          <input value={topicForm.description} onChange={e => setTopicForm(f => ({ ...f, description: e.target.value }))}
                            className="px-3 py-2 rounded-xl text-xs focus:outline-none col-span-2" style={S.input}
                            placeholder="Description (optional)" />
                        </div>
                        <div className="flex gap-1 flex-wrap mb-2">
                          {TOPIC_ICONS.map(icon => (
                            <button key={icon} onClick={() => setTopicForm(f => ({ ...f, icon }))}
                              className={`w-8 h-8 rounded-lg text-sm transition-all ${topicForm.icon === icon ? 'ring-2 ring-indigo-500 scale-110' : 'opacity-60 hover:opacity-100'}`}
                              style={{ background: '#1e2433' }}>
                              {icon}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveTopic(job.id)} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: '#15803d' }}>
                            <Check size={11} className="inline mr-1" />{editingTopic ? 'Update' : 'Add'}
                          </button>
                          <button onClick={() => { setShowTopicForm(null); setEditingTopic(null); }} className="text-xs text-gray-500 hover:text-gray-300 px-2">Raho do</button>
                        </div>
                      </div>
                    )}

                    {jobTopics.length === 0 ? (
                      <p className="text-xs text-gray-600 py-3 text-center">Koi topic nahi — upar se add karo</p>
                    ) : (
                      jobTopics.map(topic => {
                        const topicQuizzes = (db?.quizzes || []).filter(q => q.topicId === topic.id);
                        const isTopicExpanded = expandedTopic === topic.id;
                        return (
                          <div key={topic.id} className="rounded-xl overflow-hidden" style={{ background: '#1a1d2a', border: '1px solid #2a3040' }}>
                            <div className="flex items-center gap-3 p-3">
                              <span className="text-xl">{topic.icon}</span>
                              <div className="flex-1 min-w-0">
                                <span className="font-semibold text-gray-200 text-sm">{topic.name}</span>
                                <span className="ml-2 text-xs text-gray-600">{topicQuizzes.length} quizzes</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => startEditTopic(topic)} className="p-1.5 rounded-lg text-gray-600 hover:text-indigo-400 transition-colors"><Edit3 size={12} /></button>
                                <button onClick={() => handleDeleteTopic(topic)} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                                <button onClick={() => { setEditingQuiz(null); setQuizForm({ title: '', duration: 600, difficulty: 'Medium', passingMarks: 60 }); setShowQuizForm(topic.id); }}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-amber-400" style={{ background: '#1a1208' }}>
                                  <Plus size={10} /> Quiz
                                </button>
                                <button onClick={() => setExpandedTopic(isTopicExpanded ? null : topic.id)}
                                  className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 transition-colors">
                                  {isTopicExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>
                              </div>
                            </div>

                            {/* Quiz list under topic */}
                            {isTopicExpanded && (
                              <div className="border-t px-3 pb-3 pt-2 space-y-1.5" style={{ borderColor: '#2a3040' }}>
                                {/* Add/Edit Quiz Form */}
                                {showQuizForm === topic.id && (
                                  <div className="rounded-xl p-3 mb-2" style={{ background: '#0f1117', border: '1px solid #2a3040' }}>
                                    <p className="text-xs font-semibold text-gray-500 mb-2">{editingQuiz ? 'Quiz Edit' : 'Nai Quiz'}</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      <input value={quizForm.title} onChange={e => setQuizForm(f => ({ ...f, title: e.target.value }))}
                                        className="px-3 py-1.5 rounded-xl text-xs focus:outline-none col-span-2" style={S.input}
                                        placeholder="Quiz ka naam..." />
                                      <select value={quizForm.duration} onChange={e => setQuizForm(f => ({ ...f, duration: parseInt(e.target.value) }))}
                                        className="px-3 py-1.5 rounded-xl text-xs" style={S.input}>
                                        {[300,600,900,1200,1800].map(d => <option key={d} value={d}>{d/60} min</option>)}
                                      </select>
                                      <select value={quizForm.difficulty} onChange={e => setQuizForm(f => ({ ...f, difficulty: e.target.value }))}
                                        className="px-3 py-1.5 rounded-xl text-xs" style={S.input}>
                                        {['Easy','Medium','Hard'].map(d => <option key={d}>{d}</option>)}
                                      </select>
                                      <div className="flex items-center gap-2 col-span-2">
                                        <label className="text-xs text-gray-500 shrink-0">Passing marks:</label>
                                        <input type="number" min={0} max={100} value={quizForm.passingMarks}
                                          onChange={e => setQuizForm(f => ({ ...f, passingMarks: parseInt(e.target.value) }))}
                                          className="flex-1 px-3 py-1.5 rounded-xl text-xs focus:outline-none" style={S.input} />
                                        <span className="text-xs text-gray-600">%</span>
                                      </div>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                      <button onClick={() => handleSaveQuiz(topic.id)} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: '#b45309' }}>
                                        {editingQuiz ? 'Update' : 'Banao'}
                                      </button>
                                      <button onClick={() => { setShowQuizForm(null); setEditingQuiz(null); }} className="text-xs text-gray-600 hover:text-gray-300 px-2">Raho do</button>
                                    </div>
                                  </div>
                                )}

                                {topicQuizzes.length === 0 ? (
                                  <p className="text-xs text-gray-700 py-2 text-center">Koi quiz nahi — upar se add karo</p>
                                ) : topicQuizzes.map(quiz => {
                                  const quizQs = (db?.questions || []).filter(q => q.quizId === quiz.id);
                                  return (
                                    <div key={quiz.id} className="rounded-xl overflow-hidden" style={{ background: '#13161f', border: '1px solid #1e2433' }}>
                                      <div className="flex items-center gap-2 p-2.5">
                                        <Star size={14} className="text-amber-500 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <span className="text-sm text-gray-300 font-medium truncate block">{quiz.title}</span>
                                          <span className="text-xs text-gray-600">{quizQs.length} questions • {quiz.difficulty} • {Math.floor(quiz.duration/60)}m • Pass:{quiz.passingMarks||60}%</span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <Link href={`/quiz/${quiz.id}`} target="_blank" className="p-1.5 rounded-lg text-gray-600 hover:text-indigo-400 transition-colors"><Eye size={11} /></Link>
                                          <button onClick={() => startEditQuiz(quiz)} className="p-1.5 rounded-lg text-gray-600 hover:text-indigo-400 transition-colors"><Edit3 size={11} /></button>
                                          <button onClick={() => handleDeleteQuiz(quiz)} className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
                                          <button onClick={() => { setEditingQ(null); setQForm({ question: '', options: ['', '', '', ''], correct: 0, explanation: '' }); setShowQForm(quiz.id); }}
                                            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-green-400" style={{ background: '#0a1f14' }}>
                                            <Plus size={10} /> Q
                                          </button>
                                        </div>
                                      </div>

                                      {/* Questions */}
                                      {showQForm === quiz.id && (
                                        <div className="border-t p-3" style={{ borderColor: '#1e2433', background: '#0f1117' }}>
                                          <p className="text-xs text-gray-500 mb-2 font-semibold">{editingQ ? 'Question Edit' : 'Naya Question'}</p>
                                          <textarea value={qForm.question} onChange={e => setQForm(f => ({ ...f, question: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-xl text-xs focus:outline-none resize-none mb-2" style={S.input}
                                            rows={2} placeholder="Question likhein..." />
                                          <div className="grid grid-cols-2 gap-1.5 mb-2">
                                            {qForm.options.map((opt, oi) => (
                                              <div key={oi} className="flex items-center gap-1.5">
                                                <input type="radio" name={`correct_${quiz.id}`}
                                                  checked={parseInt(qForm.correct) === oi}
                                                  onChange={() => setQForm(f => ({ ...f, correct: oi }))}
                                                  className="accent-indigo-600 shrink-0" />
                                                <input value={opt} onChange={e => setQForm(f => { const o = [...f.options]; o[oi] = e.target.value; return { ...f, options: o }; })}
                                                  className="flex-1 px-2 py-1.5 rounded-lg text-xs focus:outline-none" style={S.input}
                                                  placeholder={`Option ${['A','B','C','D'][oi]}`} />
                                              </div>
                                            ))}
                                          </div>
                                          <input value={qForm.explanation} onChange={e => setQForm(f => ({ ...f, explanation: e.target.value }))}
                                            className="w-full px-3 py-1.5 rounded-xl text-xs focus:outline-none mb-2" style={S.input}
                                            placeholder="Explanation (optional)" />
                                          <div className="flex gap-2">
                                            <button onClick={() => handleSaveQ(quiz.id, topic.id)} className="px-3 py-1.5 rounded-xl text-xs font-bold text-white" style={{ background: '#15803d' }}>
                                              {editingQ ? 'Update' : 'Add'}
                                            </button>
                                            <button onClick={() => { setShowQForm(null); setEditingQ(null); }} className="text-xs text-gray-600 hover:text-gray-300 px-2">Cancel</button>
                                          </div>
                                        </div>
                                      )}

                                      {/* Question list */}
                                      {quizQs.length > 0 && (
                                        <div className="border-t divide-y" style={{ borderColor: '#1e2433' }}>
                                          {quizQs.map((q, qi) => (
                                            <div key={q.id} className="flex items-start gap-2 px-3 py-2 hover:bg-white/5 transition-colors">
                                              <span className="text-xs text-gray-600 shrink-0 w-5">Q{qi+1}</span>
                                              <p className="flex-1 text-xs text-gray-400 truncate">{q.question}</p>
                                              <span className="text-xs font-bold text-green-500 shrink-0">{['A','B','C','D'][q.correct]}</span>
                                              <button onClick={() => startEditQ(q)} className="text-gray-700 hover:text-indigo-400 transition-colors shrink-0"><Edit3 size={10} /></button>
                                              <button onClick={() => handleDeleteQ(q.id)} className="text-gray-700 hover:text-red-400 transition-colors shrink-0"><Trash2 size={10} /></button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
