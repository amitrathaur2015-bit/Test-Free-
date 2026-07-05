import { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { getSession, getDB, addQuestion, addQuiz, saveDB } from '../../lib/store';
import { addPDFToLibrary, logAdminAction } from '../../lib/admin-store';
import { extractQuestionsWithAI, detectTopicFromText } from '../../lib/pdf-processor';
import { Brain, Upload, FileText, CheckCircle, XCircle, RefreshCw, Zap, Shield, Eye, Layers, BarChart2, AlertCircle } from 'lucide-react';

const S = {
  card: { background: '#13161f', border: '1px solid #1e2433' },
  input: { background: '#0f1117', border: '1px solid #2a3040', color: '#e2e8f0' },
};

const STEPS = ['idle', 'reading', 'extracting', 'classifying', 'done', 'error'];
const STEP_LABELS = { idle: 'Ready', reading: 'Reading PDF...', extracting: 'AI Extracting...', classifying: 'Classifying Topics...', done: 'Complete ✓', error: 'Error' };
const STEP_COLORS = { idle: '#4b5563', reading: '#3b82f6', extracting: '#6366f1', classifying: '#8b5cf6', done: '#10b981', error: '#ef4444' };

export default function AdminPDFUploadAI() {
  const fileRef = useRef(null);
  const [session, setSession] = useState(null);
  const [db, setDb] = useState(null);
  const [file, setFile] = useState(null);
  const [topicHint, setTopicHint] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [passingMarks, setPassingMarks] = useState(60);
  const [addToPDFLib, setAddToPDFLib] = useState(true);

  const [step, setStep] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [pageCount, setPageCount] = useState(0);
  const [publishedId, setPublishedId] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState('');
  const logsRef = useRef(null);

  useEffect(() => {
    setSession(getSession());
    setDb(getDB());
  }, []);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  const addLog = useCallback((msg, type = 'info') => {
    setLogs(prev => [...prev.slice(-100), { msg, type, ts: new Date().toLocaleTimeString() }]);
    setTimeout(() => logsRef.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 50);
  }, []);

  const handleFile = (f) => {
    if (!f || f.type !== 'application/pdf') { showToast('❌ Please select a PDF file'); return; }
    if (f.size > 400 * 1024 * 1024) { showToast('❌ File too large (max 400 MB)'); return; }
    setFile(f);
    setQuestions([]); setSelected(new Set()); setLogs([]);
    setStep('idle'); setProgress(0); setPublishedId(null);
    if (!quizTitle) setQuizTitle(f.name.replace('.pdf', '').replace(/[-_]/g, ' '));
  };

  const process = async () => {
    if (!file) return;
    setStep('reading'); setProgress(3); setLogs([]);
    addLog(`📄 Loading "${file.name}" (${(file.size / 1024 / 1024).toFixed(1)} MB)...`, 'info');

    try {
      // Read file
      const base64Data = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = e => res(e.target.result);
        r.onerror = () => rej(new Error('File read failed'));
        r.readAsDataURL(file);
      });
      setProgress(15);
      addLog('✅ File loaded into memory', 'success');

      // Extract text via API
      addLog('🔍 Extracting text from PDF...', 'info');
      const res = await fetch('/api/pdf/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileSize: file.size, base64Data, topicHint }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Text extraction failed');
      }
      const { text, pageCount: pages, charCount } = await res.json();
      setPageCount(pages);
      setProgress(30);
      addLog(`📃 Extracted ${pages} pages, ${charCount?.toLocaleString() || '?'} characters`, 'success');

      // Auto-detect topic
      if (!topicHint) {
        const detected = detectTopicFromText(text);
        setTopicHint(detected);
        addLog(`🏷️ Auto-detected topic: ${detected}`, 'info');
      }

      // AI extraction
      setStep('extracting');
      addLog('🤖 Claude AI is extracting MCQ questions...', 'info');
      const extracted = await extractQuestionsWithAI(text, topicHint || 'General Knowledge', ({ step: s, progress: p, log }) => {
        setProgress(30 + Math.round(p * 0.65));
        if (log) addLog(log, s === 'done' ? 'success' : s === 'classifying' ? 'purple' : 'info');
        if (s === 'classifying') setStep('classifying');
      });

      setQuestions(extracted);
      setSelected(new Set(extracted.map((_, i) => i)));
      setProgress(100);
      setStep('done');
      addLog(`🎉 Extraction complete! Found ${extracted.length} MCQ questions.`, 'success');
      logAdminAction(session?.id || 1, 'AI_PDF_EXTRACT', `Extracted ${extracted.length} questions from "${file.name}"`);

      // Add to PDF library if checked
      if (addToPDFLib) {
        addPDFToLibrary({
          title: quizTitle || file.name.replace('.pdf', ''),
          category: topicHint || 'General Knowledge',
          fileName: file.name,
          fileSize: parseFloat((file.size / 1024 / 1024).toFixed(2)),
          description: `AI-extracted: ${extracted.length} MCQ questions`,
          tags: [topicHint?.toLowerCase() || 'general'],
          uploadedBy: session?.name || 'Admin',
        });
        addLog('📚 Added to PDF Library', 'success');
      }
    } catch (err) {
      setStep('error');
      addLog(`❌ ${err.message}`, 'error');
    }
  };

  const toggleQ = (i) => setSelected(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });

  const publish = async () => {
    if (selected.size === 0) return;
    setPublishing(true);
    try {
      const d = getDB();
      const topicName = topicHint || 'General Knowledge';
      const topic = d.topics.find(t => t.name === topicName) || d.topics.find(t => t.name === 'General Knowledge') || d.topics[0];

      const quiz = {
        id: d.nextQuizId++,
        title: quizTitle || `${topic.name} Quiz from PDF`,
        topicId: topic.id,
        duration: Math.max(300, selected.size * 60),
        questionCount: selected.size,
        difficulty,
        passingMarks: parseInt(passingMarks),
        published: true,
        attempts: 0,
        createdAt: new Date().toISOString().split('T')[0],
        fromPDF: file?.name,
      };
      d.quizzes.push(quiz);

      [...selected].forEach(i => {
        const q = questions[i];
        const qTopic = d.topics.find(t => t.name === q.topic) || topic;
        d.questions.push({
          id: d.nextQuestionId++,
          quizId: quiz.id,
          topicId: qTopic.id,
          question: q.question,
          options: q.options,
          correct: q.correct,
          explanation: q.explanation || '',
        });
      });

      const topicObj = d.topics.find(t => t.id === topic.id);
      if (topicObj) topicObj.quizCount = d.quizzes.filter(q => q.topicId === topic.id).length;

      saveDB();
      setPublishedId(quiz.id);
      logAdminAction(session?.id || 1, 'PUBLISH_QUIZ', `Published "${quiz.title}" (${selected.size} questions) from PDF`);
      addLog(`✅ Quiz "${quiz.title}" published with ${selected.size} questions!`, 'success');
      setDb(getDB());
    } catch (err) {
      addLog(`❌ Publish failed: ${err.message}`, 'error');
    }
    setPublishing(false);
  };

  const reset = () => {
    setFile(null); setQuestions([]); setSelected(new Set()); setLogs([]);
    setStep('idle'); setProgress(0); setPublishedId(null); setQuizTitle(''); setTopicHint('');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <AdminLayout title="AI PDF Question Extractor">
      {toast && <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 shadow-xl">{toast}</div>}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* LEFT — controls */}
        <div className="space-y-4">
          {/* Upload zone */}
          <div className="rounded-2xl p-5" style={S.card}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Upload size={15} className="text-indigo-400" />
              </div>
              <span className="font-display font-semibold text-gray-200">Upload PDF</span>
              <span className="ml-auto text-xs text-gray-600">Max 400 MB</span>
            </div>
            {!file ? (
              <div
                onClick={() => fileRef.current?.click()}
                onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                onDragOver={e => e.preventDefault()}
                className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-indigo-500"
                style={{ borderColor: '#2a3040' }}>
                <Brain size={36} className="mx-auto mb-3" style={{ color: '#4b5563' }} />
                <p className="text-sm text-gray-400 font-medium">Drop PDF here or click to browse</p>
                <p className="text-xs mt-1" style={{ color: '#4b5563' }}>Text-based PDFs work best</p>
                <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => handleFile(e.target.files[0])} />
              </div>
            ) : (
              <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: '#0f1117', border: '1px solid #2a3040' }}>
                <FileText size={20} className="text-red-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB {pageCount > 0 && `• ${pageCount} pages`}</p>
                </div>
                <button onClick={reset} className="text-gray-600 hover:text-red-400 transition-colors"><XCircle size={16} /></button>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="rounded-2xl p-5 space-y-3" style={S.card}>
            <div className="flex items-center gap-2 mb-1">
              <Layers size={15} className="text-indigo-400" />
              <span className="font-display font-semibold text-gray-200 text-sm">Quiz Settings</span>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Quiz Title</label>
              <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none" style={S.input}
                placeholder="Auto-generated from PDF name" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Topic Hint</label>
              <select value={topicHint} onChange={e => setTopicHint(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm" style={S.input}>
                <option value="">Auto-detect from content</option>
                {db?.topics.map(t => <option key={t.id} value={t.name}>{t.icon} {t.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Difficulty</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm" style={S.input}>
                  {['Easy', 'Medium', 'Hard'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Passing %</label>
                <input type="number" value={passingMarks} onChange={e => setPassingMarks(e.target.value)}
                  min={0} max={100} className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none" style={S.input} />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={addToPDFLib} onChange={e => setAddToPDFLib(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-600" />
              <span className="text-xs text-gray-400">Save to PDF Library</span>
            </label>
          </div>

          <button onClick={process} disabled={!file || ['reading','extracting','classifying'].includes(step)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: ['reading','extracting','classifying'].includes(step) ? '#3730a3' : 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
            {['reading','extracting','classifying'].includes(step)
              ? <><RefreshCw size={15} className="animate-spin" /> Processing…</>
              : <><Brain size={15} /> Extract Questions with AI</>}
          </button>
        </div>

        {/* RIGHT — progress + results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Progress */}
          {(step !== 'idle' || logs.length > 0) && (
            <div className="rounded-2xl p-5" style={S.card}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart2 size={15} className="text-indigo-400" />
                  <span className="font-display font-semibold text-gray-200 text-sm">Processing</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold border"
                  style={{ color: STEP_COLORS[step], borderColor: `${STEP_COLORS[step]}40`, background: `${STEP_COLORS[step]}15` }}>
                  {STEP_LABELS[step]}
                </span>
              </div>
              {/* Progress bar */}
              <div className="rounded-full h-2.5 mb-1 overflow-hidden" style={{ background: '#1e2433' }}>
                <div className="h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%`, background: STEP_COLORS[step] }}>
                  {!['done','error','idle'].includes(step) && (
                    <div className="h-full bg-white/20 animate-pulse rounded-full" />
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-600 text-right mb-3">{progress}%</p>

              {/* Terminal log */}
              <div ref={logsRef} className="rounded-xl p-3 overflow-y-auto font-mono text-xs" style={{ background: '#080b12', border: '1px solid #1e2433', maxHeight: '180px' }}>
                {logs.length === 0
                  ? <span className="text-gray-700">$ waiting for input...</span>
                  : logs.map((l, i) => (
                    <div key={i} className={`mb-0.5 flex gap-2 ${l.type === 'error' ? 'text-red-400' : l.type === 'success' ? 'text-green-400' : l.type === 'purple' ? 'text-purple-400' : 'text-gray-400'}`}>
                      <span className="text-gray-700 shrink-0">[{l.ts}]</span>
                      <span>{l.msg}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Published success */}
          {publishedId && (
            <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: '#0a1f14', border: '1px solid #15803d40' }}>
              <CheckCircle size={26} className="text-green-400 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-green-300 text-sm">Quiz published successfully!</p>
                <p className="text-xs text-green-600 mt-0.5">Students can now take this quiz</p>
              </div>
              <div className="flex gap-2">
                <a href={`/quiz/${publishedId}`} target="_blank"
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white" style={{ background: '#15803d' }}>
                  Preview →
                </a>
                <button onClick={reset} className="px-3 py-1.5 rounded-xl text-xs font-semibold text-green-400 hover:text-green-300 transition-colors"
                  style={{ border: '1px solid #15803d40' }}>
                  Upload Another
                </button>
              </div>
            </div>
          )}

          {/* Question results */}
          {questions.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={S.card}>
              <div className="px-5 py-4 border-b flex items-center justify-between flex-wrap gap-2" style={{ borderColor: '#1e2433' }}>
                <div>
                  <h2 className="font-display font-semibold text-gray-200 flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-400" />
                    {questions.length} Questions Extracted
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">{selected.size} selected for publishing</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelected(new Set(questions.map((_, i) => i)))}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">All</button>
                  <span className="text-gray-700">|</span>
                  <button onClick={() => setSelected(new Set())}
                    className="text-xs text-gray-500 hover:text-gray-300 font-medium">None</button>
                  {!publishedId && (
                    <button onClick={publish} disabled={selected.size === 0 || publishing}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-40 ml-2"
                      style={{ background: '#4f46e5' }}>
                      {publishing ? <RefreshCw size={12} className="animate-spin" /> : <Shield size={12} />}
                      Publish {selected.size} Questions
                    </button>
                  )}
                </div>
              </div>

              <div className="divide-y overflow-y-auto" style={{ borderColor: '#1e2433', maxHeight: '600px' }}>
                {questions.map((q, i) => {
                  const isSelected = selected.has(i);
                  return (
                    <div key={i} onClick={() => toggleQ(i)}
                      className="p-4 cursor-pointer transition-colors"
                      style={{ background: isSelected ? '#1a1f40' : 'transparent' }}
                      onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#1a1d2a'; }}
                      onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-600' : 'border-gray-600'}`}>
                          {isSelected && <CheckCircle size={11} className="text-white" strokeWidth={3} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-bold text-indigo-400">Q{i + 1}</span>
                            {q.topic && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#1e2433', color: '#94a3b8' }}>{q.topic}</span>}
                          </div>
                          <p className="text-sm text-gray-200 mb-2 leading-relaxed">{q.question}</p>
                          <div className="grid grid-cols-2 gap-1.5">
                            {q.options.map((opt, oi) => (
                              <div key={oi} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs ${oi === q.correct ? 'text-green-300' : 'text-gray-500'}`}
                                style={{ background: oi === q.correct ? '#0a2e1a' : '#0f1117', border: `1px solid ${oi === q.correct ? '#15803d50' : '#1e2433'}` }}>
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${oi === q.correct ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-500'}`}>
                                  {['A','B','C','D'][oi]}
                                </span>
                                {opt}
                              </div>
                            ))}
                          </div>
                          {q.explanation && (
                            <p className="text-xs mt-2 pl-2" style={{ color: '#818cf8', borderLeft: '2px solid #4f46e5' }}>
                              💡 {q.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {step === 'idle' && questions.length === 0 && (
            <div className="rounded-2xl p-12 text-center" style={S.card}>
              <Brain size={48} className="mx-auto mb-4" style={{ color: '#2d3748' }} />
              <p className="font-display font-semibold text-gray-500 mb-2">AI Question Extraction</p>
              <p className="text-sm text-gray-600 mb-6">Upload a PDF textbook or question bank and Claude AI will extract all MCQ questions automatically.</p>
              <div className="flex justify-center gap-6">
                {[
                  { icon: Upload, label: '1. Upload PDF', color: '#6366f1' },
                  { icon: Brain, label: '2. AI Extracts', color: '#8b5cf6' },
                  { icon: Shield, label: '3. Review & Publish', color: '#10b981' },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                      <Icon size={20} style={{ color }} />
                    </div>
                    <p className="text-xs text-gray-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
