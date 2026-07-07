import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/layout/Navbar';
import { getSession, getAnalytics, getUserStats } from '../../lib/store';
import { TrendingUp, Target, AlertTriangle, CheckCircle, BarChart2, PieChart } from 'lucide-react';

export default function Analytics() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState(null);
  const pieRef = useRef(null);
  const barRef = useRef(null);
  const lineRef = useRef(null);
  const pieChart = useRef(null);
  const barChart = useRef(null);
  const lineChart = useRef(null);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.push('/auth/login'); return; }
    setSession(s);
    const a = getAnalytics(s.id);
    const st = getUserStats(s.id);
    setAnalytics(a);
    setStats(st);
  }, []);

  useEffect(() => {
    if (!analytics) return;
    // Dynamically load Chart.js
    import('chart.js/auto').then((ChartModule) => {
      const Chart = ChartModule.default;

      // Destroy previous instances
      if (pieChart.current) pieChart.current.destroy();
      if (barChart.current) barChart.current.destroy();
      if (lineChart.current) lineChart.current.destroy();

      const topicLabels = analytics.topicPerf.map(t => t.name);
      const topicData = analytics.topicPerf.map(t => t.accuracy);
      const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899'];

      // PIE chart — topic distribution
      if (pieRef.current && analytics.topicPerf.length > 0) {
        pieChart.current = new Chart(pieRef.current, {
          type: 'doughnut',
          data: {
            labels: topicLabels,
            datasets: [{
              data: analytics.topicPerf.map(t => t.attempts),
              backgroundColor: colors.slice(0, topicLabels.length),
              borderWidth: 2,
              borderColor: '#fff',
            }],
          },
          options: {
            responsive: true,
            plugins: {
              legend: { position: 'right', labels: { font: { size: 11 }, padding: 12 } },
              title: { display: true, text: 'Quiz Attempts by Topic', font: { size: 13, weight: '600' } },
            },
            cutout: '60%',
          },
        });
      }

      // BAR chart — accuracy by topic
      if (barRef.current && analytics.topicPerf.length > 0) {
        barChart.current = new Chart(barRef.current, {
          type: 'bar',
          data: {
            labels: topicLabels,
            datasets: [{
              label: 'Accuracy %',
              data: topicData,
              backgroundColor: topicData.map(v => v >= 70 ? '#10b981cc' : v >= 50 ? '#f59e0bcc' : '#ef4444cc'),
              borderRadius: 8,
              borderSkipped: false,
            }],
          },
          options: {
            responsive: true,
            scales: {
              y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%', font: { size: 11 } }, grid: { color: '#f1f5f9' } },
              x: { ticks: { font: { size: 11 } }, grid: { display: false } },
            },
            plugins: {
              legend: { display: false },
              title: { display: true, text: 'Accuracy by Topic', font: { size: 13, weight: '600' } },
            },
          },
        });
      }

      // LINE chart — progress over time
      if (lineRef.current && analytics.progress.length > 0) {
        lineChart.current = new Chart(lineRef.current, {
          type: 'line',
          data: {
            labels: analytics.progress.map((p, i) => p.label || `Q${i + 1}`),
            datasets: [{
              label: 'Score %',
              data: analytics.progress.map(p => p.percentage),
              borderColor: '#6366f1',
              backgroundColor: '#6366f120',
              pointBackgroundColor: '#6366f1',
              pointRadius: 5,
              fill: true,
              tension: 0.4,
            }],
          },
          options: {
            responsive: true,
            scales: {
              y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%', font: { size: 11 } }, grid: { color: '#f1f5f9' } },
              x: { ticks: { font: { size: 11 } }, grid: { display: false } },
            },
            plugins: {
              legend: { display: false },
              title: { display: true, text: 'Performance Over Time', font: { size: 13, weight: '600' } },
            },
          },
        });
      }
    });

    return () => {
      if (pieChart.current) pieChart.current.destroy();
      if (barChart.current) barChart.current.destroy();
      if (lineChart.current) lineChart.current.destroy();
    };
  }, [analytics]);

  if (!session || !analytics) return (
    <div className="min-h-screen bg-slate-50"><Navbar />
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">

        <div className="mb-6">
          <h1 className="font-display font-bold text-2xl text-gray-900 flex items-center gap-2">
            <BarChart2 className="text-indigo-500" size={26} /> Performance Analytics
          </h1>
          <p className="text-gray-500 text-sm mt-1">Your detailed learning insights</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Overall Accuracy', value: `${analytics.accuracy}%`, icon: Target, color: 'indigo', sub: 'across all topics' },
            { label: 'Total Correct', value: analytics.totalCorrect, icon: CheckCircle, color: 'green', sub: `out of ${analytics.totalQs}` },
            { label: 'Strong Topics', value: analytics.strong.length, icon: TrendingUp, color: 'amber', sub: 'topics ≥ 70%' },
            { label: 'Needs Work', value: analytics.weak.length, icon: AlertTriangle, color: 'red', sub: 'topics < 70%' },
          ].map(({ label, value, icon: Icon, color, sub }) => (
            <div key={label} className="card">
              <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center mb-3`}>
                <Icon size={18} className={`text-${color}-600`} />
              </div>
              <div className="text-2xl font-display font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="card">
            {analytics.topicPerf.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-gray-400 flex-col gap-2">
                <PieChart size={32} className="opacity-30" />
                <p className="text-sm">Take quizzes to see topic distribution</p>
              </div>
            ) : <canvas ref={pieRef} />}
          </div>
          <div className="card">
            {analytics.topicPerf.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-gray-400 flex-col gap-2">
                <BarChart2 size={32} className="opacity-30" />
                <p className="text-sm">Take quizzes to see accuracy data</p>
              </div>
            ) : <canvas ref={barRef} />}
          </div>
        </div>

        {/* Progress Line Chart */}
        <div className="card mb-6">
          {analytics.progress.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 flex-col gap-2">
              <TrendingUp size={32} className="opacity-30" />
              <p className="text-sm">Complete more quizzes to see your progress trend</p>
              <Link href="/" className="btn-primary text-sm mt-2">Start a Quiz</Link>
            </div>
          ) : <canvas ref={lineRef} />}
        </div>

        {/* Strong & Weak Topics */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-display font-semibold text-base text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" /> Strong Topics
            </h2>
            {analytics.strong.length === 0 ? (
              <p className="text-gray-400 text-sm py-6 text-center">No strong topics yet — keep practicing!</p>
            ) : (
              <div className="space-y-3">
                {analytics.strong.map(t => (
                  <div key={t.topicId} className="flex items-center gap-3">
                    <span className="text-xl">{t.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-800">{t.name}</span>
                        <span className="text-sm font-bold text-green-600">{t.accuracy}%</span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${t.accuracy}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{t.attempts} attempt{t.attempts !== 1 ? 's' : ''} • {t.correct}/{t.total} correct</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="font-display font-semibold text-base text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" /> Needs Improvement
            </h2>
            {analytics.weak.length === 0 ? (
              <p className="text-gray-400 text-sm py-6 text-center">🎉 No weak topics — you're doing great!</p>
            ) : (
              <div className="space-y-3">
                {analytics.weak.map(t => (
                  <div key={t.topicId} className="flex items-center gap-3">
                    <span className="text-xl">{t.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-800">{t.name}</span>
                        <span className="text-sm font-bold text-red-500">{t.accuracy}%</span>
                      </div>
                      <div className="bg-gray-100 rounded-full h-2">
                        <div className="bg-red-400 h-2 rounded-full transition-all" style={{ width: `${t.accuracy}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{t.attempts} attempt{t.attempts !== 1 ? 's' : ''} • {t.correct}/{t.total} correct</p>
                    </div>
                    <Link href="/topics" className="text-xs text-indigo-600 font-medium hover:underline shrink-0">Practice →</Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Topic Performance Table */}
        {analytics.topicPerf.length > 0 && (
          <div className="card mt-6 p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-display font-semibold text-base text-gray-900">Topic-wise Breakdown</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-6 py-3 font-medium text-gray-500">Topic</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Attempts</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Correct</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Accuracy</th>
                    <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topicPerf.map(t => (
                    <tr key={t.topicId} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-900 flex items-center gap-2">
                        <span>{t.icon}</span> {t.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{t.attempts}</td>
                      <td className="px-4 py-3 text-gray-600">{t.correct}/{t.total}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-100 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${t.accuracy >= 70 ? 'bg-green-500' : t.accuracy >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
                              style={{ width: `${t.accuracy}%` }} />
                          </div>
                          <span className={`font-bold text-sm ${t.accuracy >= 70 ? 'text-green-600' : t.accuracy >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                            {t.accuracy}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${t.accuracy >= 70 ? 'bg-green-100 text-green-700' : t.accuracy >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {t.accuracy >= 70 ? '✓ Strong' : t.accuracy >= 50 ? '→ Average' : '↑ Improve'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
