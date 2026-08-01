import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/layout/Navbar';
import { getSession, getQuizHistory, getQuizWithQuestions } from '../../lib/store';
import { Clock, CheckCircle, XCircle, RotateCcw, Eye, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

export default function History() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [reviewData, setReviewData] = useState({});

  useEffect(() => {
    const s = getSession();
    if (!s) { router.push('/auth/login'); return; }
    setSession(s);
    setHistory(getQuizHistory(s.id));
  }, []);

  const toggleReview = (result) => {
    if (expanded === result.id) { setExpanded(null); return; }
    setExpanded(result.id);
    if (!reviewData[result.id]) {
      const quiz = getQuizWithQuestions(result.quizId);
      if (quiz) setReviewData(prev => ({ ...prev, [result.id]: quiz }));
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}m ${s % 60}s`;
  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const grade = (pct) => {
    if (pct >= 90) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (pct >= 70) return { label: 'Good', color: 'text-indigo-600', bg: 'bg-indigo-100' };
    if (pct >= 50) return { label: 'Average', color: 'text-amber-600', bg: 'bg-amber-100' };
    return { label: 'Needs Work', color: 'text-red-600', bg: 'bg-red-100' };
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="font-display font-bold text-2xl text-gray-900 flex items-center gap-2">
            <BookOpen className="text-indigo-500" size={26} /> Quiz History
          </h1>
          <p className="text-gray-500 text-sm mt-1">All your attempts with review & reattempt options</p>
        </div>

        {history.length === 0 ? (
          <div className="card text-center py-16">
            <BookOpen size={48} className="mx-auto text-gray-200 mb-4" />
            <h2 className="font-display font-semibold text-lg text-gray-700 mb-2">No quiz history yet</h2>
            <p className="text-gray-400 text-sm mb-6">Start taking quizzes to build your history</p>
            <Link href="/" className="btn-primary inline-flex">Browse Quizzes</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => {
              const g = grade(item.percentage);
              const isExpanded = expanded === item.id;
              const quiz = reviewData[item.id];
              return (
                <div key={item.id} className="card p-0 overflow-hidden">
                  {/* Result Header */}
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="text-2xl shrink-0">{item.topic?.icon || '📝'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.quiz?.title}</h3>
                            <p className="text-xs text-gray-400 mt-0.5">{item.topic?.name} • {formatDate(item.date)}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${g.bg} ${g.color}`}>{g.label}</span>
                            <span className={`text-xl font-display font-bold ${g.color}`}>{item.percentage}%</span>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><CheckCircle size={12} className="text-green-500" /> {item.score}/{item.total} correct</span>
                          <span className="flex items-center gap-1"><XCircle size={12} className="text-red-400" /> {item.total - item.score} wrong</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {formatTime(item.timeTaken)}</span>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3 bg-gray-100 rounded-full h-2">
                          <div className={`h-2 rounded-full transition-all ${item.percentage >= 70 ? 'bg-green-500' : item.percentage >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
                            style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 mt-4">
                      <Link href={`/quiz/${item.quizId}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors">
                        <RotateCcw size={13} /> Reattempt
                      </Link>
                      <button onClick={() => toggleReview(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors">
                        <Eye size={13} /> {isExpanded ? 'Hide' : 'Review Answers'}
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>
                  </div>

                  {/* Review Answers Drawer */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 p-5">
                      {!quiz ? (
                        <p className="text-gray-400 text-sm text-center py-4">Loading questions...</p>
                      ) : (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-sm text-gray-700 mb-3">Answer Review</h4>
                          {quiz.questions.map((q, qi) => {
                            // For review we don't have per-question answers stored, show correct answers
                            return (
                              <div key={q.id} className="bg-white rounded-xl p-4 border border-gray-100">
                                <p className="text-sm font-medium text-gray-900 mb-3">
                                  <span className="text-gray-400 mr-2">Q{qi + 1}.</span>{q.question}
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {q.options.map((opt, oi) => (
                                    <div key={oi}
                                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors
                                        ${oi === q.correct ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-gray-50 text-gray-600'}`}>
                                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                                        ${oi === q.correct ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                        {['A', 'B', 'C', 'D'][oi]}
                                      </span>
                                      {opt}
                                      {oi === q.correct && <CheckCircle size={12} className="text-green-500 ml-auto" />}
                                    </div>
                                  ))}
                                </div>
                                {q.explanation && (
                                  <div className="mt-3 p-3 bg-indigo-50 rounded-lg border-l-4 border-indigo-400">
                                    <p className="text-xs text-indigo-800"><span className="font-bold">Explanation:</span> {q.explanation}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
