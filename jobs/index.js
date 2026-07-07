import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../components/layout/Navbar';
import { getDB } from '../../lib/store';
import { Search, Briefcase, ChevronRight, BookOpen, Users, Star, Filter } from 'lucide-react';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [tag, setTag] = useState('All');

  useEffect(() => {
    const db = getDB();
    setJobs(db.jobs || []);
    setFiltered(db.jobs || []);
  }, []);

  useEffect(() => {
    let result = [...jobs];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(j =>
        j.name.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        (j.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    if (tag !== 'All') {
      result = result.filter(j => (j.tags || []).includes(tag));
    }
    setFiltered(result);
  }, [search, tag, jobs]);

  const allTags = ['All', ...new Set(jobs.flatMap(j => j.tags || []))];

  const colorMap = {
    'bg-blue-100 text-blue-700': { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    'bg-green-100 text-green-700': { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
    'bg-amber-100 text-amber-700': { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
    'bg-purple-100 text-purple-700': { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff' },
    'bg-teal-100 text-teal-700': { bg: '#f0fdfa', text: '#0f766e', border: '#99f6e4' },
    'bg-rose-100 text-rose-700': { bg: '#fff1f2', text: '#be123c', border: '#fecdd3' },
    'bg-indigo-100 text-indigo-700': { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe' },
    'bg-orange-100 text-orange-700': { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' },
  };

  const getColor = (color) => colorMap[color] || { bg: '#f8fafc', text: '#475569', border: '#e2e8f0' };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative max-w-5xl mx-auto px-4 py-14 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-5 border"
            style={{ background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', color: '#c7d2fe' }}>
            <Briefcase size={14} /> Sarkari Naukri Preparation
          </div>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl text-white mb-3">
            Apni Naukri Chuno
          </h1>
          <p className="text-indigo-200 text-lg mb-8 max-w-xl mx-auto">
            UP Police, SSC, Railway, UPSC aur bahut saari naukri ki taiyari ek jagah pe
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Naukri dhundo... jaise UP Police, SSC..."
              className="w-full pl-10 pr-4 py-3.5 rounded-2xl text-sm bg-white text-gray-900 shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 mt-10 text-center">
            {[
              { label: 'Naukri', value: jobs.length + '+' },
              { label: 'Quizzes', value: jobs.reduce((s, j) => s + (j.quizCount || 0), 0) + '+' },
              { label: 'Attempts', value: (jobs.reduce((s, j) => s + (j.attempts || 0), 0) / 1000).toFixed(0) + 'K+' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-3xl font-display font-bold text-white">{s.value}</div>
                <div className="text-indigo-300 text-sm mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Tag Filter */}
        <div className="flex gap-2 flex-wrap mb-6">
          {allTags.map(t => (
            <button key={t} onClick={() => setTag(t)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                tag === t
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}>
              {t}
            </button>
          ))}
        </div>

        {/* Results summary */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg text-gray-900">
            {filtered.length} Naukri{filtered.length !== 1 ? 'yan' : ''} mili
          </h2>
          {(search || tag !== 'All') && (
            <button onClick={() => { setSearch(''); setTag('All'); }}
              className="text-sm text-indigo-600 font-medium hover:underline">
              Filter hatao ✕
            </button>
          )}
        </div>

        {/* Jobs Grid */}
        {filtered.length === 0 ? (
          <div className="card text-center py-16">
            <Briefcase size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="font-semibold text-gray-500 text-lg">Koi naukri nahi mili</p>
            <p className="text-gray-400 text-sm mt-1">Search ya filter badlo</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(job => {
              const c = getColor(job.color);
              return (
                <Link key={job.id} href={`/jobs/${job.id}`}
                  className="card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group flex flex-col">

                  {/* Icon + Name */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-sm"
                      style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                      {job.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-gray-900 text-base group-hover:text-indigo-600 transition-colors leading-tight">
                        {job.name}
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(job.tags || []).map(t => (
                          <span key={t} className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                            style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-500 text-sm leading-relaxed mb-4 flex-1">
                    {job.description}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <BookOpen size={12} className="text-indigo-400" />
                      {job.topicCount} topics
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Star size={12} className="text-amber-400" />
                      {job.quizCount} quizzes
                    </span>
                    <span className="flex items-center gap-1.5 ml-auto font-semibold text-indigo-600">
                      Dekho <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 rounded-2xl p-8 text-center" style={{ background: 'linear-gradient(135deg, #eef2ff, #faf5ff)' }}>
          <h3 className="font-display font-bold text-xl text-gray-900 mb-2">Apni naukri nahi mili?</h3>
          <p className="text-gray-500 text-sm mb-4">Admin se request karo — nai naukri add karwa lo</p>
          <Link href="/community" className="btn-primary inline-flex items-center gap-2">
            <Users size={16} /> Community mein poochho
          </Link>
        </div>
      </div>
    </div>
  );
}
