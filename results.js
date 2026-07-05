import { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { getDB } from '../../lib/store';
import { getPlatformAnalytics, exportResultsCSV, exportUsersCSV } from '../../lib/admin-store';
import { BarChart2, Download, Trophy, TrendingUp, Users, Target, Star, Filter, Search, ChevronDown } from 'lucide-react';

const S = {
  card: { background: '#13161f', border: '1px solid #1e2433' },
  input: { background: '#0f1117', border: '1px solid #2a3040', color: '#e2e8f0' },
  th: 'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider',
  td: 'px-4 py-3.5 text-sm text-gray-300',
};

function Badge({ label, color }) {
  const c = {
    green: 'bg-green-500/10 text-green-400 border-green-500/25',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
    red: 'bg-red-500/10 text-red-400 border-red-500/25',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/25',
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${c[color] || c.indigo}`}>{label}</span>;
}

export default function AdminResults() {
  const [analytics, setAnalytics] = useState(null);
  const [db, setDb] = useState(null);
  const [tab, setTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [filterTopic, setFilterTopic] = useState('all');
  const [sortBy, setSortBy] = useState('attempts');

  // Chart refs
  const pieRef = useRef(null);
  const lineRef = useRef(null);
  const pieChart = useRef(null);
  const lineChart = useRef(null);

  useEffect(() => {
    const d = getDB();
    setDb(d);
    setAnalytics(getPlatformAnalytics(d));
  }, []);

  useEffect(() => {
    if (!analytics) return;
    import('chart.js/auto').then(({ default: Chart }) => {
      // Pie chart — topic distribution
      if (pieRef.current) {
        if (pieChart.current) pieChart.current.destroy();
        const labels = analytics.topicPerf.map(t => t.name);
        const data = analytics.topicPerf.map(t => t.attempts);
        const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899'];
        pieChart.current = new Chart(pieRef.current, {
          type: 'doughnut',
          data: {
            labels,
            datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#13161f' }],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'right', labels: { color: '#9ca3af', font: { size: 11 }, padding: 12 } },
              title: { display: true, text: 'Attempts by Topic', color: '#e2e8f0', font: { size: 13, weight: '600' } },
            },
            cutout: '60%',
          },
        });
      }
      // Line chart — 7-day trend
      if (lineRef.current) {
        if (lineChart.current) lineChart.current.destroy();
        lineChart.current = new Chart(lineRef.current, {
          type: 'line',
          data: {
            labels: analytics.attemptsByDay.map(d => d.label),
            datasets: [{
              label: 'Attempts',
              data: analytics.attemptsByDay.map(d => d.count),
              borderColor: '#6366f1',
              backgroundColor: '#6366f115',
              pointBackgroundColor: '#6366f1',
              pointRadius: 4,
              fill: true,
              tension: 0.4,
            }],
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false }, title: { display: true, text: '7-Day Attempt Trend', color: '#e2e8f0', font: { size: 13, weight: '600' } } },
            scales: {
              x: { grid: { color: '#1e2433' }, ticks: { color: '#64748b' } },
              y: { grid: { color: '#1e2433' }, ticks: { color: '#64748b' }, beginAtZero: true },
            },
          },
        });
      }
    });
    return () => {
      pieChart.current?.destroy();
      lineChart.current?.destroy();
    };
  }, [analytics, tab]);

  if (!analytics || !db) return (
    <AdminLayout title="Results & Analytics">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  const downloadCSV = (type) => {
    const csv = type === 'results' ? exportResultsCSV(db) : exportUsersCSV(db);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const gradeColor = (pct) => pct >= 80 ? 'green' : pct >= 60 ? 'amber' : 'red';
  const gradeLabel = (pct) => pct >= 80 ? `${pct}% ✓` : `${pct}%`;

  const filteredResults = db.results
    .filter(r => {
      const user = db.users.find(u => u.id === r.userId);
      const quiz = db.quizzes.find(q => q.id === r.quizId);
      const matchSearch = !search || user?.name.toLowerCase().includes(search.toLowerCase()) || quiz?.title.toLowerCase().includes(search.toLowerCase());
      const matchTopic = filterTopic === 'all' || quiz?.topicId === parseInt(filterTopic);
      return matchSearch && matchTopic;
    })
    .slice()
    .reverse()
    .slice(0, 100);

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'results', label: `All Results (${db.results.length})` },
    { key: 'students', label: 'Top Students' },
    { key: 'quizzes', label: 'Quiz Performance' },
    { key: 'topics', label: 'Topic Analytics' },
  ];

  return (
    <AdminLayout title="Results & Analytics">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-white">Results & Analytics</h1>
          <p className="text-gray-500 text-sm mt-0.5">Platform-wide performance data</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => downloadCSV('results')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-colors"
            style={{ background: '#1e2433' }}>
            <Download size={14} /> Results CSV
          </button>
          <button onClick={() => downloadCSV('users')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-colors"
            style={{ background: '#1e2433' }}>
            <Download size={14} /> Users CSV
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Attempts', value: analytics.totalAttempts, icon: BarChart2, color: 'indigo' },
          { label: 'Avg Score', value: `${analytics.avgScore}%`, icon: Target, color: 'green' },
          { label: 'Top Score', value: `${Math.max(0, ...db.results.map(r => r.percentage))}%`, icon: Trophy, color: 'amber' },
          { label: 'Active Students', value: analytics.userStats.filter(u => u.attempts > 0).length, icon: Users, color: 'purple' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl p-5" style={S.card}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-${color}-500/10 border border-${color}-500/20`}>
              <Icon size={18} className={`text-${color}-400`} />
            </div>
            <div className="text-3xl font-display font-bold text-white">{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 overflow-x-auto" style={{ background: '#13161f', border: '1px solid #1e2433' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${tab === t.key ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl p-5" style={S.card}><canvas ref={pieRef} /></div>
          <div className="rounded-2xl p-5" style={S.card}><canvas ref={lineRef} /></div>

          {/* Score buckets */}
          <div className="rounded-2xl p-5" style={S.card}>
            <h3 className="font-semibold text-white mb-4">Score Distribution</h3>
            <div className="space-y-3">
              {analytics.scoreBuckets.map(b => {
                const pct = analytics.totalAttempts > 0 ? Math.round((b.count / analytics.totalAttempts) * 100) : 0;
                return (
                  <div key={b.label} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-16 shrink-0">{b.label}</span>
                    <div className="flex-1 rounded-full h-2" style={{ background: '#1e2433' }}>
                      <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: b.color }} />
                    </div>
                    <span className="text-xs text-gray-400 w-14 text-right">{b.count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Topic performance summary */}
          <div className="rounded-2xl p-5" style={S.card}>
            <h3 className="font-semibold text-white mb-4">Topic Performance</h3>
            <div className="space-y-3">
              {analytics.topicPerf.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center gap-3">
                  <span className="text-lg shrink-0">{t.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-300 truncate">{t.name}</span>
                      <span className={`text-xs font-bold ${t.avgScore >= 70 ? 'text-green-400' : t.avgScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{t.avgScore}%</span>
                    </div>
                    <div className="rounded-full h-1.5" style={{ background: '#1e2433' }}>
                      <div className={`h-1.5 rounded-full ${t.avgScore >= 70 ? 'bg-green-500' : t.avgScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${t.avgScore}%` }} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{t.attempts} att.</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ALL RESULTS ── */}
      {tab === 'results' && (
        <div>
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none"
                style={S.input} placeholder="Search user or quiz..." />
            </div>
            <select value={filterTopic} onChange={e => setFilterTopic(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={{ ...S.input, minWidth: '160px' }}>
              <option value="all">All Topics</option>
              {db.topics.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
            </select>
          </div>
          <div className="rounded-2xl overflow-hidden" style={S.card}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: '#0f1117' }}>
                  <tr>
                    <th className={S.th}>User</th>
                    <th className={S.th}>Quiz</th>
                    <th className={S.th}>Score</th>
                    <th className={S.th}>Time</th>
                    <th className={S.th}>Date</th>
                    <th className={S.th}>Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: '#1e2433' }}>
                  {filteredResults.map(r => {
                    const user = db.users.find(u => u.id === r.userId);
                    const quiz = db.quizzes.find(q => q.id === r.quizId);
                    const topic = quiz ? db.topics.find(t => t.id === quiz.topicId) : null;
                    const mins = Math.floor(r.timeTaken / 60);
                    const secs = r.timeTaken % 60;
                    return (
                      <tr key={r.id} className="hover:bg-white/2 transition-colors">
                        <td className={S.td}>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{user?.avatar}</div>
                            <span className="font-medium text-gray-200">{user?.name || '—'}</span>
                          </div>
                        </td>
                        <td className={S.td}>
                          <span className="text-gray-300">{quiz?.title || '—'}</span>
                          {topic && <span className="ml-1 text-gray-600 text-xs">{topic.icon}</span>}
                        </td>
                        <td className={S.td}>{r.score}/{r.total}</td>
                        <td className={S.td}>{mins}m {secs}s</td>
                        <td className={S.td}>{r.date}</td>
                        <td className={`${S.td}`}>
                          <Badge label={gradeLabel(r.percentage)} color={gradeColor(r.percentage)} />
                        </td>
                      </tr>
                    );
                  })}
                  {filteredResults.length === 0 && (
                    <tr><td colSpan={6} className="py-12 text-center text-gray-600">No results found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TOP STUDENTS ── */}
      {tab === 'students' && (
        <div className="rounded-2xl overflow-hidden" style={S.card}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#1e2433' }}>
            <h2 className="font-display font-semibold text-white">Leaderboard — Top Students</h2>
            <button onClick={() => downloadCSV('users')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white transition-colors"
              style={{ background: '#0f1117' }}>
              <Download size={13} /> Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: '#0f1117' }}>
                <tr>
                  <th className={S.th}>Rank</th>
                  <th className={S.th}>Student</th>
                  <th className={S.th}>Quizzes</th>
                  <th className={S.th}>Total Correct</th>
                  <th className={S.th}>Avg Score</th>
                  <th className={S.th}>Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#1e2433' }}>
                {analytics.userStats.filter(u => u.attempts > 0).map((u, i) => (
                  <tr key={u.id} className="hover:bg-white/2 transition-colors">
                    <td className={S.td}>
                      <span className={`text-xl ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-400' : 'text-gray-600'}`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </span>
                    </td>
                    <td className={S.td}>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">{u.avatar}</div>
                        <div>
                          <p className="font-medium text-gray-200">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={S.td}>{u.attempts}</td>
                    <td className={S.td}>{u.totalCorrect}</td>
                    <td className={S.td}>
                      <div className="flex items-center gap-2">
                        <div className="w-16 rounded-full h-1.5" style={{ background: '#1e2433' }}>
                          <div className={`h-1.5 rounded-full ${u.avgScore >= 70 ? 'bg-green-500' : u.avgScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${u.avgScore}%` }} />
                        </div>
                        <span className={`font-bold text-sm ${u.avgScore >= 70 ? 'text-green-400' : u.avgScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                          {u.avgScore}%
                        </span>
                      </div>
                    </td>
                    <td className={S.td}><Badge label={u.avgScore >= 80 ? 'Excellent' : u.avgScore >= 60 ? 'Good' : 'Improving'} color={gradeColor(u.avgScore)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── QUIZ PERFORMANCE ── */}
      {tab === 'quizzes' && (
        <div className="rounded-2xl overflow-hidden" style={S.card}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#1e2433' }}>
            <h2 className="font-display font-semibold text-white">Quiz Performance Report</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead style={{ background: '#0f1117' }}>
                <tr>
                  <th className={S.th}>Quiz</th>
                  <th className={S.th}>Topic</th>
                  <th className={S.th}>Difficulty</th>
                  <th className={S.th}>Attempts</th>
                  <th className={S.th}>Avg Score</th>
                  <th className={S.th}>Pass Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#1e2433' }}>
                {analytics.quizAttempts.map(q => {
                  const topic = db.topics.find(t => t.id === q.topicId);
                  const quizResults = db.results.filter(r => r.quizId === q.id);
                  const passRate = quizResults.length > 0
                    ? Math.round(quizResults.filter(r => r.percentage >= (q.passingMarks || 50)).length / quizResults.length * 100)
                    : 0;
                  return (
                    <tr key={q.id} className="hover:bg-white/2 transition-colors">
                      <td className={`${S.td} font-medium text-gray-200`}>{q.title}</td>
                      <td className={S.td}>{topic ? `${topic.icon} ${topic.name}` : '—'}</td>
                      <td className={S.td}>
                        <Badge label={q.difficulty}
                          color={q.difficulty === 'Easy' ? 'green' : q.difficulty === 'Medium' ? 'amber' : 'red'} />
                      </td>
                      <td className={S.td}>{q.attemptCount}</td>
                      <td className={S.td}>
                        <span className={`font-bold ${q.avgScore >= 70 ? 'text-green-400' : q.avgScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                          {q.avgScore}%
                        </span>
                      </td>
                      <td className={S.td}>
                        <div className="flex items-center gap-2">
                          <div className="w-12 rounded-full h-1.5" style={{ background: '#1e2433' }}>
                            <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${passRate}%` }} />
                          </div>
                          <span className="text-gray-400">{passRate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TOPIC ANALYTICS ── */}
      {tab === 'topics' && (
        <div className="grid md:grid-cols-2 gap-4">
          {analytics.topicPerf.map(t => {
            const topicQuizIds = db.quizzes.filter(q => q.topicId === t.id).map(q => q.id);
            const topicResults = db.results.filter(r => topicQuizIds.includes(r.quizId));
            const passRate = topicResults.length > 0
              ? Math.round(topicResults.filter(r => r.percentage >= 60).length / topicResults.length * 100)
              : 0;
            return (
              <div key={t.id} className="rounded-2xl p-5" style={S.card}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{t.icon}</span>
                  <div>
                    <h3 className="font-semibold text-white">{t.name}</h3>
                    <p className="text-xs text-gray-500">{t.attempts} total attempts</p>
                  </div>
                  <div className="ml-auto text-right">
                    <div className={`text-2xl font-bold ${t.avgScore >= 70 ? 'text-green-400' : t.avgScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{t.avgScore}%</div>
                    <div className="text-xs text-gray-500">avg score</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Quizzes</span>
                    <span className="text-gray-200">{db.quizzes.filter(q => q.topicId === t.id).length}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Questions</span>
                    <span className="text-gray-200">{db.questions.filter(q => q.topicId === t.id).length}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Pass Rate (≥60%)</span>
                    <span className={passRate >= 60 ? 'text-green-400' : 'text-amber-400'}>{passRate}%</span>
                  </div>
                </div>
                <div className="mt-3 rounded-full h-2" style={{ background: '#1e2433' }}>
                  <div className={`h-2 rounded-full ${t.avgScore >= 70 ? 'bg-green-500' : t.avgScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${t.avgScore}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
