import { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { getDB } from '../../lib/store';
import { getPlatformAnalytics, getActivityLogs } from '../../lib/admin-store';
import {
  Users, BookOpen, BarChart2, TrendingUp, TrendingDown,
  HelpCircle, Activity, CheckCircle, Clock, Star, Zap
} from 'lucide-react';

const S = {
  card: { background: '#13161f', border: '1px solid #1e2433' },
  input: { background: '#0f1117', border: '1px solid #2a3040', color: '#e2e8f0' },
};

function StatCard({ label, value, icon: Icon, color, sub, trend }) {
  const colors = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    green: 'bg-green-500/10 text-green-400 border-green-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  };
  return (
    <div className="rounded-2xl p-5" style={S.card}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors[color]}`}>
          <Icon size={18} />
        </div>
        {trend != null && (
          <span className={`text-xs font-semibold flex items-center gap-1 ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-3xl font-display font-bold text-white mb-1">{value}</div>
      <div className="text-sm font-medium text-gray-300">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function MiniBar({ label, value, max, color = '#6366f1' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="text-xs text-gray-400 w-16 shrink-0 truncate">{label}</div>
      <div className="flex-1 rounded-full h-2" style={{ background: '#1e2433' }}>
        <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-xs text-gray-400 w-8 text-right">{value}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [logs, setLogs] = useState([]);
  const barRef = useRef(null);
  const barChart = useRef(null);

  useEffect(() => {
    const db = getDB();
    const a = getPlatformAnalytics(db);
    setAnalytics(a);
    setLogs(getActivityLogs(8));

    // Draw chart
    import('chart.js/auto').then(({ default: Chart }) => {
      if (barRef.current) {
        if (barChart.current) barChart.current.destroy();
        barChart.current = new Chart(barRef.current, {
          type: 'bar',
          data: {
            labels: a.attemptsByDay.map(d => d.label),
            datasets: [{
              label: 'Quiz Attempts',
              data: a.attemptsByDay.map(d => d.count),
              backgroundColor: '#6366f120',
              borderColor: '#6366f1',
              borderWidth: 2,
              borderRadius: 6,
              borderSkipped: false,
            }],
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { color: '#1e2433' }, ticks: { color: '#64748b', font: { size: 11 } } },
              y: { grid: { color: '#1e2433' }, ticks: { color: '#64748b', font: { size: 11 } }, beginAtZero: true, precision: 0 },
            },
          },
        });
      }
    });
    return () => { if (barChart.current) barChart.current.destroy(); };
  }, []);

  if (!analytics) return (
    <AdminLayout title="Dashboard">
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  const logColor = (action) => {
    if (action.includes('BAN') || action.includes('DELETE')) return 'text-red-400 bg-red-500/10';
    if (action.includes('CREATE') || action.includes('UPLOAD')) return 'text-green-400 bg-green-500/10';
    if (action.includes('SEND')) return 'text-indigo-400 bg-indigo-500/10';
    return 'text-gray-400 bg-gray-500/10';
  };

  const timeAgo = (ts) => {
    const d = Date.now() - ts;
    if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
    if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
    return `${Math.floor(d / 86400000)}d ago`;
  };

  return (
    <AdminLayout title="Dashboard">
      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard label="Total Users" value={analytics.totalUsers} icon={Users} color="indigo" sub="Registered" trend={5} />
        <StatCard label="Quizzes" value={analytics.totalQuizzes} icon={BookOpen} color="green" sub="Active" />
        <StatCard label="Attempts" value={analytics.totalAttempts} icon={Activity} color="amber" sub="All time" trend={12} />
        <StatCard label="Questions" value={analytics.totalQuestions} icon={HelpCircle} color="purple" sub="In DB" />
        <StatCard label="Avg Score" value={`${analytics.avgScore}%`} icon={Star} color="cyan" sub="Platform wide" />
        <StatCard label="Topics" value={analytics.totalTopics} icon={Zap} color="rose" sub="Categories" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Chart */}
        <div className="lg:col-span-2 rounded-2xl p-5" style={S.card}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-semibold text-white">Quiz Attempts</h2>
              <p className="text-xs text-gray-500 mt-0.5">Last 7 days activity</p>
            </div>
            <div className="text-xs text-gray-500 px-2 py-1 rounded-lg" style={{ background: '#0f1117' }}>
              {analytics.totalAttempts} total
            </div>
          </div>
          <canvas ref={barRef} height={120} />
        </div>

        {/* Score distribution */}
        <div className="rounded-2xl p-5" style={S.card}>
          <h2 className="font-display font-semibold text-white mb-1">Score Distribution</h2>
          <p className="text-xs text-gray-500 mb-4">How students are performing</p>
          <div className="space-y-3">
            {analytics.scoreBuckets.map(b => (
              <MiniBar key={b.label} label={b.label} value={b.count} max={analytics.totalAttempts} color={b.color} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top quizzes */}
        <div className="rounded-2xl p-0 overflow-hidden" style={S.card}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#1e2433' }}>
            <h2 className="font-display font-semibold text-white">Top Quizzes</h2>
          </div>
          <div className="divide-y" style={{ borderColor: '#1e2433' }}>
            {analytics.quizAttempts.slice(0, 5).map((q, i) => (
              <div key={q.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/2 transition-colors">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold
                  ${i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-gray-500/20 text-gray-400' : i === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-gray-500'}`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 truncate font-medium">{q.title}</p>
                  <p className="text-xs text-gray-500">{q.attemptCount} attempts</p>
                </div>
                <span className="text-xs font-semibold text-indigo-400">{q.avgScore}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top students */}
        <div className="rounded-2xl p-0 overflow-hidden" style={S.card}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#1e2433' }}>
            <h2 className="font-display font-semibold text-white">Top Students</h2>
          </div>
          <div className="divide-y" style={{ borderColor: '#1e2433' }}>
            {analytics.userStats.filter(u => u.attempts > 0).slice(0, 5).map((u, i) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/2 transition-colors">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {u.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 font-medium truncate">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.attempts} quizzes</p>
                </div>
                <div className={`text-sm font-bold ${u.avgScore >= 80 ? 'text-green-400' : u.avgScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                  {u.avgScore}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity log */}
        <div className="rounded-2xl p-0 overflow-hidden" style={S.card}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#1e2433' }}>
            <h2 className="font-display font-semibold text-white">Recent Actions</h2>
            <a href="/admin2/logs" className="text-xs text-indigo-400 hover:text-indigo-300">View all</a>
          </div>
          <div className="divide-y" style={{ borderColor: '#1e2433' }}>
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 px-5 py-3 hover:bg-white/2 transition-colors">
                <span className={`text-xs px-1.5 py-0.5 rounded font-mono font-bold mt-0.5 shrink-0 ${logColor(log.action)}`}>
                  {log.action.split('_')[0]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-300 leading-relaxed">{log.detail}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{timeAgo(log.ts)}</p>
                </div>
              </div>
            ))}
            {logs.length === 0 && <p className="text-xs text-gray-600 px-5 py-4">No actions yet</p>}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
