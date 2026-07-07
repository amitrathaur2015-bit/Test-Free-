import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getQuizWithQuestions, getSession, saveResult, getUserRank } from '../../lib/store';
import { Clock, ChevronLeft, ChevronRight, CheckCircle, AlertCircle, BookOpen, Trophy, RotateCcw, BarChart2, Eye, EyeOff } from 'lucide-react';

export default function QuizPage() {
  const router = useRouter();
  const { id } = router.query;
  const [quiz, setQuiz] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [session, setSession] = useState(null);
  const [rank, setRank] = useState(null);
  const [reviewMode, setReviewMode] = useState(false);
  const [showExpl, setShowExpl] = useState({});

  useEffect(() => {
    if (!id) return;
    const data = getQuizWithQuestions(id);
    if (!data) { router.push('/'); return; }
    setQuiz(data);
    setTimeLeft(data.duration);
    setSession(getSession());
  }, [id]);

  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  const handleSubmit = useCallback(() => {
    if (!quiz || submitted) return;
    setSubmitted(true);
    const timeTaken = quiz.duration - (timeLeft || 0);
    let score = 0;
    quiz.questions.forEach(q => { if (answers[q.id] === q.correct) score++; });
    const res = { score, total: quiz.questions.length, percentage: Math.round(score / quiz.questions.length * 100), timeTaken };
    setResult(res);
    if (session) {
      saveResult(session.id, parseInt(id), score, quiz.questions.length, timeTaken);
      setTimeout(() => setRank(getUserRank(session.id)), 100);
    }
  }, [quiz, answers, timeLeft, submitted, session, id]);

  const handleAnswer = (qId, optIdx) => { if (!submitted) setAnswers(prev => ({ ...prev, [qId]: optIdx })); };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleReattempt = () => {
    setSubmitted(false);
    setResult(null);
    setAnswers({});
    setCurrent(0);
    setTimeLeft(quiz.duration);
    setReviewMode(false);
    setShowExpl({});
  };

  if (!quiz) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500">Loading quiz...</p>
      </div>
    </div>
  );

  // RESULT SCREEN
  if (submitted && result) {
    const grade = result.percentage >= 90 ? { label: 'Excellent!', color: 'text-green-600', ring: 'stroke-green-500' }
      : result.percentage >= 70 ? { label: 'Good Job!', color: 'text-indigo-600', ring: 'stroke-indigo-500' }
      : result.percentage >= 50 ? { label: 'Average', color: 'text-amber-600', ring: 'stroke-amber-500' }
      : { label: 'Keep Practicing', color: 'text-red-600', ring: 'stroke-red-500' };

    const passingMarks = quiz.passingMarks || 60;
    const passed = result.percentage >= passingMarks;

    const circumference = 2 * Math.PI * 52;
    const progress = (result.percentage / 100) * circumference;

    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-white border-b border-gray-100 h-16 flex items-center px-6 shadow-sm">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center"><span className="text-white font-black text-sm leading-none">T</span></div>
            <span className="font-display font-black text-lg tracking-tight"><span className="text-indigo-600">Test</span><span className="text-purple-600">Free</span></span>
          </Link>
        </nav>
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="card text-center">
            {/* Score Ring */}
            <div className="relative w-36 h-36 mx-auto mb-4">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" strokeWidth="10" />
                <circle cx="60" cy="60" r="52" fill="none" className={grade.ring} strokeWidth="10"
                  strokeDasharray={`${progress} ${circumference}`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-display font-bold ${grade.color}`}>{result.percentage}%</span>
              </div>
            </div>

            <h2 className={`font-display font-bold text-2xl ${grade.color} mb-2`}>{grade.label}</h2>

            {/* Pass / Fail badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-3 ${passed ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
              <span className={`w-2 h-2 rounded-full ${passed ? 'bg-green-500' : 'bg-red-500'}`} />
              {passed ? '✓ PASSED' : '✗ FAILED'} — Passing marks: {passingMarks}%
            </div>

            <p className="text-gray-500 text-sm mb-6">You scored {result.score} out of {result.total} questions</p>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Correct', value: result.score, color: 'text-green-600 bg-green-50' },
                { label: 'Wrong', value: result.total - result.score, color: 'text-red-600 bg-red-50' },
                { label: 'Time', value: formatTime(result.timeTaken), color: 'text-indigo-600 bg-indigo-50' },
              ].map(s => (
                <div key={s.label} className={`rounded-xl py-3 px-2 ${s.color}`}>
                  <div className="text-xl font-bold">{s.value}</div>
                  <div className="text-xs font-medium opacity-70">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Rank tracking */}
            {rank && (
              <div className="mb-6 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-center gap-3">
                <Trophy size={20} className="text-amber-500 shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-amber-800">Your Global Rank: #{rank}</p>
                  <p className="text-xs text-amber-600">Check the leaderboard to see how you compare</p>
                </div>
                <Link href="/leaderboard" className="text-xs text-amber-700 font-bold border border-amber-300 px-2 py-1 rounded-lg hover:bg-amber-100 transition ml-auto">View →</Link>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 mb-6">
              <button onClick={handleReattempt}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors">
                <RotateCcw size={15} /> Reattempt Quiz
              </button>
              <Link href="/analytics"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
                <BarChart2 size={15} /> View Analytics
              </Link>
              <Link href="/history"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
                <Clock size={15} /> History
              </Link>
            </div>

            <button onClick={() => setReviewMode(!reviewMode)}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-indigo-200 text-indigo-700 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-colors mb-4">
              {reviewMode ? <EyeOff size={15} /> : <Eye size={15} />}
              {reviewMode ? 'Hide Answer Review' : 'Review All Answers'}
            </button>

            {/* Review Section */}
            {reviewMode && (
              <div className="text-left space-y-4 mt-4">
                <h3 className="font-display font-semibold text-gray-900">Answer Review</h3>
                {quiz.questions.map((q, qi) => {
                  const userAns = answers[q.id];
                  const isCorrect = userAns === q.correct;
                  return (
                    <div key={q.id} className={`rounded-xl border p-4 ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                      <div className="flex items-start gap-2 mb-3">
                        {isCorrect ? <CheckCircle size={16} className="text-green-500 mt-0.5 shrink-0" /> : <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />}
                        <p className="text-sm font-medium text-gray-900"><span className="text-gray-400 mr-1">Q{qi + 1}.</span>{q.question}</p>
                      </div>
                      <div className="space-y-1.5 ml-6">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs
                            ${oi === q.correct ? 'bg-green-200 text-green-900 font-semibold' : oi === userAns && !isCorrect ? 'bg-red-200 text-red-900' : 'bg-white/60 text-gray-600'}`}>
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                              ${oi === q.correct ? 'bg-green-600 text-white' : oi === userAns && !isCorrect ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                              {['A','B','C','D'][oi]}
                            </span>
                            {opt}
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <div className="mt-3 ml-6 p-2.5 bg-white/70 rounded-lg border-l-4 border-indigo-400">
                          <p className="text-xs text-gray-700"><span className="font-bold text-indigo-700">Explanation:</span> {q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // QUIZ SCREEN
  const q = quiz.questions[current];
  const answered = Object.keys(answers).length;
  const urgent = timeLeft !== null && timeLeft <= 60;
  const progressPct = ((current + 1) / quiz.questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center"><span className="text-white font-black text-sm leading-none">T</span></div>
            <span className="font-display font-black text-lg tracking-tight"><span className="text-indigo-600">Test</span><span className="text-purple-600">Free</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-semibold text-sm transition-colors ${urgent ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-amber-50 text-amber-700'}`}>
              <Clock size={15} />
              {formatTime(timeLeft || 0)}
            </div>
            <div className="text-xs text-gray-500">{answered}/{quiz.questions.length} answered</div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Quiz Info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl">{quiz.topic?.icon}</div>
          <div>
            <h1 className="font-display font-bold text-lg text-gray-900">{quiz.title}</h1>
            <p className="text-xs text-gray-500">{quiz.topic?.name} • {quiz.questions.length} questions</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 bg-gray-100 rounded-full h-2.5">
            <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="text-xs font-semibold text-gray-600 shrink-0">{current + 1}/{quiz.questions.length}</span>
        </div>

        {/* Question card */}
        <div className="card mb-4">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
              {current + 1}
            </div>
            <p className="font-medium text-gray-900 leading-relaxed">{q.question}</p>
          </div>

          <div className="space-y-2.5">
            {q.options.map((opt, oi) => {
              const selected = answers[q.id] === oi;
              return (
                <button key={oi} onClick={() => handleAnswer(q.id, oi)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left text-sm font-medium transition-all
                    ${selected
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                      : 'border-gray-100 bg-white hover:border-indigo-200 hover:bg-indigo-50 text-gray-700'}`}>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                    ${selected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {['A', 'B', 'C', 'D'][oi]}
                  </span>
                  {opt}
                  {selected && <CheckCircle size={15} className="text-indigo-500 ml-auto shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft size={16} /> Previous
          </button>

          {/* Question dots */}
          <div className="flex gap-1.5 overflow-x-auto max-w-xs">
            {quiz.questions.map((_, qi) => (
              <button key={qi} onClick={() => setCurrent(qi)}
                className={`w-7 h-7 rounded-full text-xs font-bold shrink-0 transition-colors
                  ${qi === current ? 'bg-indigo-600 text-white' : answers[quiz.questions[qi].id] !== undefined ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {qi + 1}
              </button>
            ))}
          </div>

          {current === quiz.questions.length - 1 ? (
            <button onClick={handleSubmit}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
              Submit <CheckCircle size={15} />
            </button>
          ) : (
            <button onClick={() => setCurrent(c => Math.min(quiz.questions.length - 1, c + 1))}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
              Next <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Submit early button */}
        {answered > 0 && (
          <div className="mt-4 text-center">
            <button onClick={handleSubmit}
              className="text-xs text-gray-400 hover:text-red-500 underline transition-colors">
              Submit early ({answered}/{quiz.questions.length} answered)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
