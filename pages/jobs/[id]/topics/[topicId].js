import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../../../components/layout/Navbar';
import { getDB } from '../../../../lib/store';
import { ChevronLeft, BookOpen, Clock, Users, Search, PlayCircle, Target, Star } from 'lucide-react';

export default function JobTopicDetail() {
  const router = useRouter();
  const { id: jobId, topicId } = router.query;
  const [job, setJob] = useState(null);
  const [topic, setTopic] = useState(null);
  const [allQuizzes, setAllQuizzes] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('All');

  useEffect(() => {
    if (!jobId || !topicId) return;
    const db = getDB();
    const j = (db.jobs || []).find(j => j.id === parseInt(jobId));
    const t = db.topics.find(t => t.id === parseInt(topicId));
    if (!j || !t) { router.push(`/jobs/${jobId}`); return; }
    setJob(j);
    setTopic(t);
    const q = db.quizzes.filter(q => q.topicId === parseInt(topicId));
    setAllQuizzes(q);
    setQuizzes(q);
  }, [jobId, topicId]);

  useEffect(() => {
    let result = [...allQuizzes];
    if (search.trim()) {
      result = result.filter(q => q.title.toLowerCase().includes(search.toLowerCase()));
    }
    if (difficulty !== 'All') {
      result = result.filter(q => q.difficulty === difficulty);
    }
    setQuizzes(result);
  }, [search, difficulty, allQuizzes]);

  const diffColor = (d) => ({
    Easy: 'bg-green-50 text-green-700 border-green-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    Hard: 'bg-red-50 text-red-700 border-red-200',
  }[d] || 'bg-gray-50 text-gray-600 border-gray-200');

  if (!job || !topic) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Breadcrumb header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4 flex-wrap">
            <Link href="/jobs" className="hover:text-indigo-600 transition-colors">Naukri</Link>
            <span>/</span>
            <Link href={`/jobs/${jobId}`} className="hover:text-indigo-600 transition-colors">{job.name}</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">{topic.name}</span>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl shrink-0">
              {topic.icon}
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl text-gray-900">{topic.name}</h1>
              <p className="text-gray-500 text-sm mt-1">{job.name} — {topic.description || 'Practice quizzes for this topic'}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><BookOpen size={12} /> {allQuizzes.length} quizzes</span>
                <span className="flex items-center gap-1"><Target size={12} /> {allQuizzes.reduce((s, q) => s + (q.questionCount || 0), 0)} questions</span>
                <span className="flex items-center gap-1"><Users size={12} /> {allQuizzes.reduce((s, q) => s + (q.attempts || 0), 0).toLocaleString()} attempts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={`${topic.name} mein quiz dhundo...`}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {['All', 'Easy', 'Medium', 'Hard'].map(d => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    difficulty === d ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                  }`}>{d}</button>
              ))}
            </div>
          </div>
          {(search || difficulty !== 'All') && (
            <p className="text-xs text-gray-400 mt-2">
              {quizzes.length} of {allQuizzes.length} quizzes •{' '}
              <button onClick={() => { setSearch(''); setDifficulty('All'); }} className="text-indigo-600 font-medium hover:underline">
                Clear
              </button>
            </p>
          )}
        </div>

        {/* Quiz list */}
        {quizzes.length === 0 ? (
          <div className="card text-center py-14">
            <PlayCircle size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="font-medium text-gray-500">
              {search || difficulty !== 'All' ? 'Koi quiz nahi mila — filter badlo' : 'Is topic mein abhi koi quiz nahi hai'}
            </p>
            {(search || difficulty !== 'All') && (
              <button onClick={() => { setSearch(''); setDifficulty('All'); }}
                className="mt-3 text-sm text-indigo-600 font-medium hover:underline">
                Sab dikhao
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map((quiz, i) => (
              <div key={quiz.id}
                className="card hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex items-center gap-4">
                {/* Number */}
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-display font-bold text-sm shrink-0 border border-indigo-100">
                  {i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${diffColor(quiz.difficulty)}`}>
                      {quiz.difficulty}
                    </span>
                    {quiz.passingMarks && (
                      <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                        Pass: {quiz.passingMarks}%
                      </span>
                    )}
                    {quiz.fromPDF && (
                      <span className="text-xs text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">
                        📄 PDF
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><BookOpen size={11} /> {quiz.questionCount} questions</span>
                    <span className="flex items-center gap-1"><Clock size={11} /> {Math.floor(quiz.duration / 60)} min</span>
                    <span className="flex items-center gap-1"><Users size={11} /> {(quiz.attempts || 0).toLocaleString()} attempts</span>
                  </div>
                </div>

                <Link href={`/quiz/${quiz.id}`}
                  className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shrink-0">
                  <PlayCircle size={15} /> Start
                </Link>
              </div>
            ))}
          </div>
        )}

        {quizzes.length > 0 && (
          <div className="mt-6 flex items-center justify-between text-xs text-gray-400">
            <span>{quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} available</span>
            <Link href={`/jobs/${jobId}`} className="text-indigo-600 font-medium hover:underline flex items-center gap-1">
              <ChevronLeft size={12} /> Baaki topics
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
