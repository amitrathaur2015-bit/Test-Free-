import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '../components/layout/Navbar';
import { getDB, getSession } from '../lib/store';
import { Search, BookOpen, Clock, Users, ChevronRight, Zap, Award, TrendingUp, Star } from 'lucide-react';

export default function Home() {
  const [topics, setTopics] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [session, setSession] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const db = getDB();
    setTopics(db.topics);
    setJobs(db.jobs || []);
    setQuizzes(db.quizzes);
    setFilteredQuizzes(db.quizzes.slice(0, 8));
    setSession(getSession());
  }, []);

  const difficultyColor = (d) => ({ Easy: 'text-green-600 bg-green-50', Medium: 'text-amber-600 bg-amber-50', Hard: 'text-red-600 bg-red-50' }[d] || '');

  const getTopicById = (id) => topics.find(t => t.id === id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800" />
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '60px 60px'}} />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium mb-6 border border-white/20">
            <Zap size={14} className="text-amber-300" />
            Free quizzes across 8+ topics
          </div>
          <h1 className="font-display font-extrabold text-4xl md:text-6xl text-white leading-tight mb-4">
            <span className="text-white">Test</span><span className="text-amber-300">Free</span>
          </h1>
          <p className="text-indigo-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Practice MCQ quizzes across Mathematics, Science, History, Technology and more. Free forever.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-6 mt-10">
            {[['500+', 'Questions'], ['50+', 'Quizzes'], ['8+', 'Topics'], ['Free', 'Always']].map(([num, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-display font-bold text-white">{num}</div>
                <div className="text-indigo-200 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">

        {/* Naukri / Jobs Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-bold text-2xl text-gray-900 flex items-center gap-2">
                💼 Naukri-wise Practice
              </h2>
              <p className="text-gray-500 text-sm mt-1">Choose your job exam and practice topic-wise</p>
            </div>
            <Link href="/jobs" className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.slice(0, 6).map(job => (
              <Link key={job.id} href={`/jobs/${job.id}`}
                className="card hover:shadow-lg hover:border-indigo-200 transition-all duration-200 group flex items-start gap-4 p-5">
                <div className="text-4xl shrink-0">{job.icon}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{job.name}</h3>
                  <p className="text-gray-500 text-xs mt-1 line-clamp-2">{job.description}</p>
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{job.topicCount || 0} topics</span>
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">{job.quizCount || 0} quizzes</span>
                    {(job.tags || []).slice(0, 2).map(t => (
                      <span key={t} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 transition-colors shrink-0 mt-1" />
              </Link>
            ))}
          </div>
          {jobs.length > 6 && (
            <div className="text-center mt-4">
              <Link href="/jobs" className="inline-flex items-center gap-2 px-5 py-2 rounded-xl border border-indigo-200 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 transition-colors">
                View all {jobs.length} Naukri exams <ChevronRight size={15} />
              </Link>
            </div>
          )}
        </section>

        {/* Topics */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-bold text-2xl text-gray-900">Browse by Topic</h2>
              <p className="text-gray-500 text-sm mt-1">Pick a subject and start practicing</p>
            </div>
            <Link href="/topics" className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {topics.map(topic => (
              <Link key={topic.id} href={`/topics/${topic.id}`}
                className="card hover:shadow-md hover:border-indigo-200 transition-all duration-200 group cursor-pointer p-4">
                <div className={`text-3xl mb-3`}>{topic.icon}</div>
                <div className="font-semibold text-gray-900 text-sm group-hover:text-indigo-600 transition-colors">{topic.name}</div>
                <div className="text-gray-400 text-xs mt-1">{topic.quizCount} quizzes</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Quizzes */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-bold text-2xl text-gray-900">Latest Quizzes</h2>
              <p className="text-gray-500 text-sm mt-1">{filteredQuizzes.length} quiz{filteredQuizzes.length !== 1 ? 'zes' : ''} available</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredQuizzes.map(quiz => {
              const topic = getTopicById(quiz.topicId);
              return (
                <div key={quiz.id} className="card hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col group">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl">{topic?.icon}</span>
                    <span className={`badge ${difficultyColor(quiz.difficulty)}`}>{quiz.difficulty}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">{quiz.title}</h3>
                  <p className="text-xs text-gray-400 mb-3">{topic?.name}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1"><BookOpen size={12} />{quiz.questionCount} Qs</span>
                    <span className="flex items-center gap-1"><Clock size={12} />{Math.floor(quiz.duration / 60)}m</span>
                    <span className="flex items-center gap-1"><Users size={12} />{quiz.attempts.toLocaleString()}</span>
                  </div>
                  <div className="mt-auto">
                    <Link href={`/quiz/${quiz.id}`} className="btn-primary w-full text-center block text-sm">
                      Start Quiz
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA for non-logged users */}
        {!session && (
          <section className="card bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-12 border-0">
            <Award size={40} className="mx-auto mb-4 text-amber-300" />
            <h2 className="font-display font-bold text-2xl mb-2">Track Your Progress</h2>
            <p className="text-indigo-100 mb-6 max-w-md mx-auto">Create a free account to save your scores, view history, and compete on the leaderboard.</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/auth/register" className="bg-white text-indigo-600 font-semibold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-md">
                Create Free Account
              </Link>
              <Link href="/auth/login" className="bg-white/10 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors border border-white/30">
                Sign In
              </Link>
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-12 py-8 text-center text-gray-400 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BookOpen size={16} className="text-indigo-500" />
          <span className="font-display font-semibold text-gray-700">TestFree</span>
        </div>
        <p>© 2024 TestFree — Free quizzes for everyone.</p>
      </footer>
    </div>
  );
}
