import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/layout/Navbar';
import { getDB, getJobStats } from '../../lib/store';
import { ChevronLeft, BookOpen, Clock, Users, Search, ChevronRight, Star, Trophy, Target } from 'lucide-react';

export default function JobDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [job, setJob] = useState(null);
  const [topics, setTopics] = useState([]);
  const [allTopics, setAllTopics] = useState([]);
  const [stats, setStats] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!id) return;
    const db = getDB();
    const j = (db.jobs || []).find(j => j.id === parseInt(id));
    if (!j) { router.push('/jobs'); return; }
    setJob(j);

    const jobTopics = db.topics.filter(t => t.jobId === parseInt(id));
    setAllTopics(jobTopics);
    setTopics(jobTopics);

    // Compute stats
    const topicIds = jobTopics.map(t => t.id);
    const quizzes = db.quizzes.filter(q => topicIds.includes(q.topicId));
    const quizIds = quizzes.map(q => q.id);
    const attempts = db.results.filter(r => quizIds.includes(r.quizId)).length;
    const questions = db.questions.filter(q => quizIds.includes(q.quizId)).length;
    setStats({ topicCount: jobTopics.length, quizCount: quizzes.length, questionCount: questions, attempts });
  }, [id]);

  useEffect(() => {
    if (!search.trim()) { setTopics(allTopics); return; }
    const q = search.toLowerCase();
    setTopics(allTopics.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q)
    ));
  }, [search, allTopics]);

  if (!job) return (
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

      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-4 transition-colors group">
            <ChevronLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" /> Sabhi Naukri
          </Link>

          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-3xl bg-indigo-100 flex items-center justify-center text-4xl shadow-md shrink-0">
              {job.icon}
            </div>
            <div className="flex-1">
              <h1 className="font-display font-extrabold text-3xl text-gray-900">{job.name}</h1>
              <p className="text-gray-500 mt-1 text-sm max-w-xl">{job.description}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {(job.tags || []).map(t => (
                  <span key={t} className="text-xs bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-medium border border-indigo-100">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Stats bar */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                { icon: BookOpen, label: 'Topics', value: stats.topicCount, color: 'text-indigo-600 bg-indigo-50' },
                { icon: Star, label: 'Quizzes', value: stats.quizCount, color: 'text-amber-600 bg-amber-50' },
                { icon: Target, label: 'Questions', value: stats.questionCount, color: 'text-green-600 bg-green-50' },
                { icon: Users, label: 'Attempts', value: stats.attempts.toLocaleString(), color: 'text-purple-600 bg-purple-50' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className={`rounded-2xl px-4 py-3 flex items-center gap-3 ${color}`}>
                  <Icon size={18} className="shrink-0" />
                  <div>
                    <div className="text-lg font-display font-bold">{value}</div>
                    <div className="text-xs opacity-70 font-medium">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Topics header + search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h2 className="font-display font-bold text-xl text-gray-900">
            Topics in {job.name}
          </h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Topic dhundo..."
              className="pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 bg-white w-48" />
          </div>
        </div>

        {/* Topics Grid */}
        {topics.length === 0 ? (
          <div className="card text-center py-16">
            <BookOpen size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="font-semibold text-gray-500 text-lg">
              {search ? 'Koi topic nahi mila' : 'Abhi koi topic nahi hai'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {search ? 'Search badlo' : 'Admin se topics add karwao'}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map(topic => {
              const db = typeof window !== 'undefined' ? require('../../lib/store').getDB() : { quizzes: [] };
              const quizCount = (db.quizzes || []).filter(q => q.topicId === topic.id).length;
              return (
                <Link key={topic.id} href={`/jobs/${id}/topics/${topic.id}`}
                  className="card hover:shadow-md hover:border-indigo-200 transition-all duration-200 group flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl shrink-0 border border-indigo-100 group-hover:bg-indigo-100 transition-colors">
                      {topic.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {topic.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">{quizCount} quiz{quizCount !== 1 ? 'zes' : ''}</p>
                    </div>
                  </div>
                  {topic.description && (
                    <p className="text-gray-500 text-xs leading-relaxed flex-1 mb-3">{topic.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                      {quizCount} Quizzes
                    </span>
                    <span className="text-xs text-indigo-500 font-semibold flex items-center gap-1 group-hover:gap-1.5 transition-all">
                      Start <ChevronRight size={12} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Breadcrumb path hint */}
        <div className="mt-10 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
          <div className="text-indigo-500 shrink-0">
            <Trophy size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-800">Taiyari ka rasta:</p>
            <p className="text-xs text-indigo-600 mt-0.5">
              Naukri ({job.name}) → Topic → Quiz → Result
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
