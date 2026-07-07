import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/layout/Navbar';
import { getDB } from '../../lib/store';
import { BookOpen, Clock, Users, ChevronLeft, Search, Filter, SortAsc } from 'lucide-react';

export default function TopicDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [topic, setTopic] = useState(null);
  const [allQuizzes, setAllQuizzes] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (!id) return;
    const db = getDB();
    const t = db.topics.find(t => t.id === parseInt(id));
    setTopic(t);
    const q = db.quizzes.filter(q => q.topicId === parseInt(id));
    setAllQuizzes(q);
    setQuizzes(q);
  }, [id]);

  useEffect(() => {
    let filtered = [...allQuizzes];

    // Search filter
    if (search.trim()) {
      filtered = filtered.filter(q =>
        q.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Difficulty filter
    if (difficulty !== 'All') {
      filtered = filtered.filter(q => q.difficulty === difficulty);
    }

    // Sort
    if (sortBy === 'newest') filtered.sort((a, b) => (b.id - a.id));
    else if (sortBy === 'popular') filtered.sort((a, b) => b.attempts - a.attempts);
    else if (sortBy === 'az') filtered.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === 'easy-first') {
      const order = { Easy: 0, Medium: 1, Hard: 2 };
      filtered.sort((a, b) => (order[a.difficulty] || 1) - (order[b.difficulty] || 1));
    }

    setQuizzes(filtered);
  }, [search, difficulty, sortBy, allQuizzes]);

  if (!topic) return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="flex items-center justify-center py-20 text-gray-400">Loading...</div>
    </div>
  );

  const diffBadge = (d) => ({
    Easy: 'bg-green-50 text-green-700 border-green-100',
    Medium: 'bg-amber-50 text-amber-700 border-amber-100',
    Hard: 'bg-red-50 text-red-700 border-red-100',
  }[d] || 'bg-gray-50 text-gray-600');

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">

        <Link href="/topics" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-6 transition-colors group">
          <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> All Topics
        </Link>

        {/* Topic header */}
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <div className="text-5xl">{topic.icon}</div>
            <div className="flex-1">
              <h1 className="font-display font-bold text-2xl text-gray-900">{topic.name}</h1>
              <p className="text-gray-500 mt-1 text-sm">{topic.description}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">
                  {allQuizzes.length} quiz{allQuizzes.length !== 1 ? 'zes' : ''} available
                </span>
                <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                  {allQuizzes.reduce((s, q) => s + q.attempts, 0).toLocaleString()} total attempts
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="card mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search in ${topic.name}...`}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 transition-colors bg-white"
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium">
                  ✕
                </button>
              )}
            </div>

            {/* Difficulty filter */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 shrink-0">
              {['All', 'Easy', 'Medium', 'Hard'].map(d => (
                <button key={d} onClick={() => setDifficulty(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    difficulty === d
                      ? d === 'Easy' ? 'bg-white text-green-700 shadow-sm'
                        : d === 'Medium' ? 'bg-white text-amber-700 shadow-sm'
                        : d === 'Hard' ? 'bg-white text-red-700 shadow-sm'
                        : 'bg-white text-indigo-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {d}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-indigo-400 shrink-0">
              <option value="newest">Newest first</option>
              <option value="popular">Most popular</option>
              <option value="az">A → Z</option>
              <option value="easy-first">Easy first</option>
            </select>
          </div>

          {/* Active filter summary */}
          {(search || difficulty !== 'All') && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">
                Showing {quizzes.length} of {allQuizzes.length} quizzes
              </span>
              <button onClick={() => { setSearch(''); setDifficulty('All'); setSortBy('newest'); }}
                className="text-xs text-indigo-600 font-medium hover:underline ml-auto">
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Quiz list */}
        <div className="space-y-3">
          {quizzes.length === 0 ? (
            <div className="card text-center py-14">
              <Search size={36} className="mx-auto text-gray-200 mb-3" />
              <p className="font-medium text-gray-500">No quizzes found</p>
              <p className="text-sm text-gray-400 mt-1">Try changing your search or filters</p>
              <button onClick={() => { setSearch(''); setDifficulty('All'); }}
                className="mt-4 text-sm text-indigo-600 font-medium hover:underline">
                Clear filters
              </button>
            </div>
          ) : (
            quizzes.map(quiz => (
              <div key={quiz.id}
                className="card hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex items-center gap-4">
                <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-indigo-50 items-center justify-center text-2xl shrink-0">
                  {topic.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${diffBadge(quiz.difficulty)}`}>
                      {quiz.difficulty}
                    </span>
                    {quiz.passingMarks && (
                      <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                        Pass: {quiz.passingMarks}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <BookOpen size={11} /> {quiz.questionCount} questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {Math.floor(quiz.duration / 60)} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={11} /> {quiz.attempts.toLocaleString()} attempts
                    </span>
                  </div>
                </div>
                <Link href={`/quiz/${quiz.id}`}
                  className="btn-primary shrink-0 text-sm px-5 py-2">
                  Start →
                </Link>
              </div>
            ))
          )}
        </div>

        {quizzes.length > 0 && (
          <p className="text-center text-xs text-gray-400 mt-6">
            Showing {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''}
          </p>
        )}
      </div>
    </div>
  );
}
