import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/layout/Navbar';
import { getSession, getDB, addQuestion, addQuiz, saveDB } from '../../lib/store';
import { extractQuestionsWithAI, detectTopicFromText } from '../../lib/pdf-processor';
import {
  Upload, FileText, Brain, CheckCircle, XCircle, AlertCircle,
  Clock, ChevronRight, Download, Trash2, Eye, RefreshCw,
  BookOpen, Layers, Zap, Shield, BarChart2, ArrowLeft
} from 'lucide-react';

const STATUS = {
  idle: { label: 'Ready', color: 'gray' },
  reading: { label: 'Reading PDF...', color: 'blue' },
  extracting: { label: 'AI Extracting...', color: 'indigo' },
  classifying: { label: 'Classifying...', color: 'purple' },
  done: { label: 'Complete', color: 'green' },
  error: { label: 'Error', color: 'red' },
};

export default function PDFUpload() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [db, setDb] = useState(null);
  const fileRef = useRef(null);
  const dropRef = useRef(null);

  // Upload state
  const [file, setFile] = useState(null);
  const [topicHint, setTopicHint] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');

  // Processing state
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [extractedQs, setExtractedQs] = useState([]);
  const [selectedQs, setSelectedQs] = useState(new Set());
  const [pageCount, setPageCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // History of uploads
  const [uploadHistory, setUploadHistory] = useState([]);

  // Published quiz
  const [publishedQuizId, setPublishedQuizId] = useState(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== 'admin') { router.push('/auth/login'); return; }
    setSession(s);
    const d = getDB();
    setDb(d);
    try {
      const h = JSON.parse(localStorage.getItem('testfree_pdf_history') || '[]');
      setUploadHistory(h);
    } catch {}
  }, []);

  const addLog = useCallback((msg, type = 'info') => {
    setLogs(prev => [...prev, { msg, type, ts: new Date().toLocaleTimeString() }]);
  }, []);

  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (f?.type === 'application/pdf') handleFileSelect(f);
  };

  const handleFileSelect = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') { addLog('Please select a PDF file', 'error'); return; }
    if (f.size > 400 * 1024 * 1024) { addLog('File too large (max 400MB)', 'error'); return; }
    setFile(f);
    setExtractedQs([]);
    setSelectedQs(new Set());
    setLogs([]);
    setStatus('idle');
    setProgress(0);
    setPublishedQuizId(null);
    if (!quizTitle) setQuizTitle(f.name.replace('.pdf', '').replace(/[-_]/g, ' '));
  };

  const startProcessing = async () => {
    if (!file) return;
    setStatus('reading');
    setProgress(2);
    setExtractedQs([]);
    setLogs([]);
    addLog(`📄 Loading "${file.name}" (${(file.size / 1024 / 1024).toFixed(1)} MB)`, 'info');

    try {
      // Step 1: Read file as base64
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = () => reject(new Error('File read failed'));
        reader.readAsDataURL(file);
      });
      setProgress(15);
      addLog('✅ File loaded into memory', 'success');

      // Step 2: Extract text via API
      addLog('🔍 Sending to text extraction service...', 'info');
      const uploadRes = await fetch('/api/pdf/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          base64Data,
          topicHint,
        }),
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error || 'Text extraction failed');
      }

      const { text, pageCount: pages, charCount: chars } = await uploadRes.json();
      setPageCount(pages);
      setCharCount(chars);
      setProgress(30);
      addLog(`📃 Extracted text: ${pages} pages, ${chars.toLocaleString()} characters`, 'success');

      // Auto-detect topic
      if (!topicHint) {
        const detected = detectTopicFromText(text);
        setTopicHint(detected);
        addLog(`🏷️ Auto-detected topic: ${detected}`, 'info');
      }

      // Step 3: AI extraction in chunks
      setStatus('extracting');
      addLog('🤖 Starting AI question extraction...', 'info');

      const questions = await extractQuestionsWithAI(text, topicHint || 'General Knowledge', ({ step, progress: p, log }) => {
        setProgress(30 + Math.round(p * 0.6));
        if (log) addLog(log, step === 'done' ? 'success' : 'info');
        if (step === 'classifying') setStatus('classifying');
      });

      setExtractedQs(questions);
      setSelectedQs(new Set(questions.map((_, i) => i)));
      setProgress(100);
      setStatus('done');
      addLog(`🎉 Done! Found ${questions.length} MCQ questions ready for review.`, 'success');

      // Save to history
      const histEntry = {
        id: Date.now(),
        fileName: file.name,
        fileSize: file.size,
        pages,
        questionCount: questions.length,
        date: new Date().toISOString(),
        topicHint: topicHint || 'General Knowledge',
      };
      const newHistory = [histEntry, ...uploadHistory].slice(0, 20);
      setUploadHistory(newHistory);
      localStorage.setItem('testfree_pdf_history', JSON.stringify(newHistory));

    } catch (err) {
      setStatus('error');
      addLog(`❌ Error: ${err.message}`, 'error');
    }
  };

  const toggleQuestion = (idx) => {
    setSelectedQs(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const selectAll = () => setSelectedQs(new Set(extractedQs.map((_, i) => i)));
  const deselectAll = () => setSelectedQs(new Set());

  const publishQuiz = async () => {
    if (selectedQs.size === 0) return;
    setPublishing(true);

    try {
      const d = getDB();

      // Determine topic
      const topicName = topicHint || 'General Knowledge';
      let topic = d.topics.find(t => t.name === topicName);
      if (!topic) {
        topic = d.topics.find(t => t.name === 'General Knowledge') || d.topics[0];
      }

      // Find the most common topic in selected questions
      const topicCounts = {};
      [...selectedQs].forEach(i => {
        const q = extractedQs[i];
        const t = q.topic || topicName;
        topicCounts[t] = (topicCounts[t] || 0) + 1;
      });
      const dominantTopic = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || topicName;
      const finalTopic = d.topics.find(t => t.name === dominantTopic) || topic;

      // Create quiz
      const quiz = {
        id: d.nextQuizId++,
        title: quizTitle || `${finalTopic.name} Quiz from PDF`,
        topicId: finalTopic.id,
        duration: Math.max(300, selectedQs.size * 60),
        questionCount: selectedQs.size,
        difficulty,
        attempts: 0,
        createdAt: new Date().toISOString().split('T')[0],
        fromPDF: file?.name,
      };
      d.quizzes.push(quiz);

      // Add questions
      [...selectedQs].forEach(i => {
        const q = extractedQs[i];
        const qTopic = d.topics.find(t => t.name === q.topic) || finalTopic;
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

      // Update topic quiz count
      const topicObj = d.topics.find(t => t.id === finalTopic.id);
      if (topicObj) topicObj.quizCount = d.quizzes.filter(q => q.topicId === finalTopic.id).length;

      saveDB();
      setPublishedQuizId(quiz.id);
      addLog(`✅ Published quiz "${quiz.title}" with ${selectedQs.size} questions! (Quiz ID: ${quiz.id})`, 'success');
      setDb(getDB());
    } catch (err) {
      addLog(`❌ Publish failed: ${err.message}`, 'error');
    }
    setPublishing(false);
  };

  const resetAll = () => {
    setFile(null);
    setExtractedQs([]);
    setSelectedQs(new Set());
    setLogs([]);
    setStatus('idle');
    setProgress(0);
    setQuizTitle('');
    setTopicHint('');
    setPublishedQuizId(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const statusInfo = STATUS[status];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-indigo-600 hover:border-indigo-200 transition-all">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-display font-bold text-2xl text-gray-900 flex items-center gap-2">
              <Brain className="text-indigo-500" size={26} /> AI PDF Question Extractor
            </h1>
            <p className="text-gray-500 text-sm">Upload a PDF — AI extracts MCQ questions automatically</p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-2 text-xs bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl text-indigo-700">
            <Zap size={13} /> Powered by Claude AI
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left panel — upload & config */}
          <div className="lg:col-span-1 space-y-4">

            {/* Upload zone */}
            <div className="card">
              <h2 className="font-display font-semibold text-base text-gray-900 mb-3 flex items-center gap-2">
                <Upload size={16} className="text-indigo-500" /> Upload PDF
              </h2>

              {!file ? (
                <div
                  ref={dropRef}
                  onDrop={onDrop}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-indigo-200 rounded-2xl p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                >
                  <Upload size={32} className="mx-auto text-indigo-300 mb-3" />
                  <p className="font-medium text-gray-700 text-sm">Drop PDF here or click to browse</p>
                  <p className="text-xs text-gray-400 mt-1">Max 400 MB • Text-based PDFs only</p>
                  <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={e => handleFileSelect(e.target.files[0])} />
                </div>
              ) : (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <FileText size={22} className="text-indigo-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-indigo-900 text-sm truncate">{file.name}</p>
                      <p className="text-xs text-indigo-600 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      {pageCount > 0 && <p className="text-xs text-indigo-500">{pageCount} pages • {charCount.toLocaleString()} chars</p>}
                    </div>
                    <button onClick={resetAll} className="p-1.5 text-indigo-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all">
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Config */}
            <div className="card">
              <h2 className="font-display font-semibold text-base text-gray-900 mb-3 flex items-center gap-2">
                <Layers size={16} className="text-indigo-500" /> Quiz Settings
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Quiz Title</label>
                  <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                    placeholder="e.g. Science Chapter 1 Quiz" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Topic Hint (optional)</label>
                  <select value={topicHint} onChange={e => setTopicHint(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 bg-white">
                    <option value="">Auto-detect from PDF</option>
                    {db?.topics.map(t => <option key={t.id} value={t.name}>{t.icon} {t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Difficulty</label>
                  <div className="flex gap-2">
                    {['Easy', 'Medium', 'Hard'].map(d => (
                      <button key={d} onClick={() => setDifficulty(d)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${difficulty === d
                          ? d === 'Easy' ? 'bg-green-100 text-green-700 border border-green-200'
                            : d === 'Medium' ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-gray-100 text-gray-500'}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Process button */}
            <button
              onClick={startProcessing}
              disabled={!file || status === 'reading' || status === 'extracting' || status === 'classifying'}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {status === 'reading' || status === 'extracting' || status === 'classifying' ? (
                <><RefreshCw size={16} className="animate-spin" /> Processing...</>
              ) : (
                <><Brain size={16} /> Extract Questions with AI</>
              )}
            </button>

            {/* Upload history */}
            {uploadHistory.length > 0 && (
              <div className="card p-0 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-sm text-gray-900">Recent Uploads</h3>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {uploadHistory.map(h => (
                    <div key={h.id} className="px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <p className="text-xs font-medium text-gray-800 truncate">{h.fileName}</p>
                      <p className="text-xs text-gray-400">{h.questionCount} questions • {h.topicHint} • {new Date(h.date).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right panel — progress + results */}
          <div className="lg:col-span-2 space-y-4">

            {/* Progress card */}
            {(status !== 'idle' || logs.length > 0) && (
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display font-semibold text-base text-gray-900 flex items-center gap-2">
                    <BarChart2 size={16} className="text-indigo-500" /> Processing Status
                  </h2>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                    ${statusInfo.color === 'green' ? 'bg-green-100 text-green-700' :
                      statusInfo.color === 'red' ? 'bg-red-100 text-red-700' :
                      statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                      statusInfo.color === 'indigo' ? 'bg-indigo-100 text-indigo-700' :
                      statusInfo.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-600'}`}>
                    {statusInfo.label}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="bg-gray-100 rounded-full h-3 mb-4 overflow-hidden">
                  <div className={`h-3 rounded-full transition-all duration-500
                    ${status === 'error' ? 'bg-red-500' : status === 'done' ? 'bg-green-500' : 'bg-indigo-500'}`}
                    style={{ width: `${progress}%` }}>
                    {status !== 'done' && status !== 'error' && progress > 0 && (
                      <div className="h-full bg-white/20 animate-pulse rounded-full" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-3 text-right">{progress}% complete</p>

                {/* Logs */}
                <div className="bg-gray-950 rounded-xl p-3 max-h-48 overflow-y-auto font-mono">
                  {logs.length === 0 ? (
                    <p className="text-gray-600 text-xs">Waiting...</p>
                  ) : (
                    logs.map((log, i) => (
                      <div key={i} className={`text-xs mb-1 flex gap-2 ${
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'success' ? 'text-green-400' :
                        'text-gray-300'}`}>
                        <span className="text-gray-600 shrink-0">[{log.ts}]</span>
                        <span>{log.msg}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Published success */}
            {publishedQuizId && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center gap-4">
                <CheckCircle size={28} className="text-green-500 shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-green-800">Quiz Published Successfully!</p>
                  <p className="text-sm text-green-600 mt-0.5">Students can now take the quiz</p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/quiz/${publishedQuizId}`} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors">
                    <Eye size={12} /> Preview
                  </Link>
                  <button onClick={resetAll} className="px-3 py-1.5 border border-green-300 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-100 transition-colors">
                    Upload Another
                  </button>
                </div>
              </div>
            )}

            {/* Extracted Questions */}
            {extractedQs.length > 0 && (
              <div className="card p-0 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h2 className="font-display font-semibold text-base text-gray-900">
                      Extracted Questions
                      <span className="ml-2 text-sm font-normal text-gray-500">({extractedQs.length} found)</span>
                    </h2>
                    <p className="text-xs text-gray-400 mt-0.5">{selectedQs.size} selected for publishing</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={selectAll} className="text-xs text-indigo-600 font-medium hover:underline">Select All</button>
                    <span className="text-gray-300">|</span>
                    <button onClick={deselectAll} className="text-xs text-gray-500 font-medium hover:underline">None</button>
                    {!publishedQuizId && (
                      <button
                        onClick={publishQuiz}
                        disabled={selectedQs.size === 0 || publishing}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {publishing ? <RefreshCw size={12} className="animate-spin" /> : <Shield size={12} />}
                        Publish {selectedQs.size} Questions
                      </button>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                  {extractedQs.map((q, i) => {
                    const isSelected = selectedQs.has(i);
                    return (
                      <div key={i}
                        onClick={() => toggleQuestion(i)}
                        className={`p-4 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50' : 'bg-white hover:bg-gray-50'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all
                            ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                            {isSelected && <CheckCircle size={12} className="text-white" strokeWidth={3} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Q{i + 1}</span>
                              {q.topic && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{q.topic}</span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-2">{q.question}</p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {q.options.map((opt, oi) => (
                                <div key={oi} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
                                  ${oi === q.correct ? 'bg-green-100 text-green-800 font-semibold' : 'bg-gray-100 text-gray-600'}`}>
                                  <span className={`w-4 h-4 rounded-full flex items-center justify-center font-bold text-xs shrink-0
                                    ${oi === q.correct ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                                    {['A','B','C','D'][oi]}
                                  </span>
                                  {opt}
                                </div>
                              ))}
                            </div>
                            {q.explanation && (
                              <p className="text-xs text-indigo-600 mt-2 pl-1 border-l-2 border-indigo-300">
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
            {status === 'idle' && extractedQs.length === 0 && !file && (
              <div className="card text-center py-16">
                <Brain size={48} className="mx-auto text-indigo-200 mb-4" />
                <h3 className="font-display font-semibold text-lg text-gray-700 mb-2">AI Question Extractor</h3>
                <p className="text-gray-400 text-sm mb-1">Upload a PDF textbook or question bank</p>
                <p className="text-gray-400 text-sm">Claude AI will automatically extract all MCQ questions</p>
                <div className="mt-6 grid grid-cols-3 gap-3 max-w-xs mx-auto">
                  {[
                    { icon: Upload, label: 'Upload PDF' },
                    { icon: Brain, label: 'AI Extracts' },
                    { icon: CheckCircle, label: 'Review & Publish' },
                  ].map(({ icon: Icon, label }, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <Icon size={18} className="text-indigo-600" />
                      </div>
                      <p className="text-xs text-gray-500">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
