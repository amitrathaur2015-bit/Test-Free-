import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../../components/layout/Navbar';
import { getSession, getUserStats, getDB, getUserRank, getLeaderboard, getNotifications } from '../../lib/store';
import { BarChart2, CheckCircle, Clock, TrendingUp, BookOpen, PlayCircle, User, Trophy, History, Bell } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [session, setSession] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [topics, setTopics] = useState([]);
  const [rank, setRank] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const s = getSession();
    if (!s) { router.push('/auth/login'); return; }
    setSession(s);
    const st = getUserStats(s.id);
    setStats(st);
    const db = getDB();
    setQuizzes(db.quizzes);
    setTopics(db.topics);
    setRank(getUserRank(s.id));
    setNotifs(getNotifications(s.id));
  }, []);

  if (!session || !stats) return (
    <div className="min-h-screen bg-slate-50"><Navbar />
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  const grade = (pct) => pct >= 90 ? 'bg-green-500' : pct >= 70 ? 'bg-indigo-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-display font-bold text-2xl shadow-md">
            {session.avatar}
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-gray-900">Welcome, {session.name.split(' ')[0]}!</h1>
            <p className="text-gray-500 text-sm">Here's your learning overview</p>
          </div>
          {rank && (
            <div className="ml-auto hidden sm:flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2">
              <Trophy size={18} className="text-amber-500" />
              <div>
                <p className="text-xs text-amber-700 font-medium">Global Rank</p>
                <p className="text-lg font-display font-bold text-amber-800">#{rank}</p>
              </div>
            </div>
          )}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Tests Taken', value: stats.totalAttempts, icon: BookOpen, color: 'indigo' },
            { label: 'Correct Answers', value: stats.totalScore, icon: CheckCircle, color: 'green' },
            { label: 'Avg Score', value: stats.totalAttempts ? `${stats.avgPercentage}%` : '—', icon: TrendingUp, color: 'amber' },
            { label: 'Global Rank', value: rank ? `#${rank}` : '—', icon: Trophy, color: 'purple' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card">
              <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center mb-3`}>
                <Icon size={18} className={`text-${color}-600`} />
              </div>
              <div className="text-2xl font-display font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Quick Nav */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { href: '/leaderboard', icon: Trophy, label: 'Leaderboard', color: 'amber' },
            { href: '/analytics', icon: BarChart2, label: 'Analytics', color: 'indigo' },
            { href: '/history', icon: Clock, label: 'Quiz History', color: 'green' },
            { href: '/topics', icon: BookOpen, label: 'All Topics', color: 'purple' },
          ].map(({ href, icon: Icon, label, color }) => (
            <Link key={href} href={href}
              className={`flex items-center gap-3 p-3 rounded-xl border border-${color}-100 bg-${color}-50 hover:bg-${color}-100 transition-colors`}>
              <Icon size={18} className={`text-${color}-600 shrink-0`} />
              <span className={`text-sm font-semibold text-${color}-700`}>{label}</span>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-semibold text-lg text-gray-900">Recent Activity</h2>
                <Link href="/history" className="text-indigo-600 text-xs font-medium hover:underline">View all →</Link>
              </div>
              {stats.recentActivity.length === 0 ? (
                <div className="text-center py-10">
                  <PlayCircle size={40} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-gray-400 font-medium">No quizzes attempted yet</p>
                  <Link href="/" className="btn-primary inline-flex mt-4 text-sm">Start your first quiz</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recentActivity.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-indigo-50 transition-colors">
                      <div className="text-2xl">{item.topic?.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{item.quiz?.title}</p>
                        <p className="text-xs text-gray-400">{item.topic?.name} • {formatDate(item.date)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-sm font-bold ${item.percentage >= 70 ? 'text-green-600' : item.percentage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          {item.percentage}%
                        </div>
                        <div className="text-xs text-gray-400">{item.score}/{item.total}</div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Link href={`/quiz/${item.quizId}`} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg font-medium hover:bg-indigo-100 transition-colors">
                          Retry
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Notifications */}
            {notifs.length > 0 && (
              <div className="card">
                <h2 className="font-display font-semibold text-base text-gray-900 mb-3 flex items-center gap-2">
                  <Bell size={15} className="text-indigo-500" /> Notifications
                </h2>
                <div className="space-y-2">
                  {notifs.map(n => (
                    <div key={n.id} className="text-sm text-gray-700 bg-indigo-50 rounded-xl px-3 py-2.5">{n.msg}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Profile card */}
            <div className="card">
              <h2 className="font-display font-semibold text-base text-gray-900 mb-4 flex items-center gap-2">
                <User size={16} className="text-indigo-500" /> Your Profile
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium text-gray-900">{session.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Rank</span><span className="font-bold text-amber-600">{rank ? `#${rank} Global` : 'Unranked'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Role</span><span className={`badge ${session.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'} px-2 py-0.5 rounded-full text-xs font-semibold`}>{session.role}</span></div>
              </div>
              <Link href="/profile" className="btn-secondary w-full text-center text-sm mt-4 block">Edit Profile</Link>
            </div>

            {/* Suggested quizzes */}
            <div className="card">
              <h2 className="font-display font-semibold text-base text-gray-900 mb-4">Suggested Quizzes</h2>
              <div className="space-y-2">
                {quizzes.slice(0, 4).map(quiz => {
                  const topic = topics.find(t => t.id === quiz.topicId);
                  return (
                    <Link key={quiz.id} href={`/quiz/${quiz.id}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-indigo-50 transition-colors group">
                      <span className="text-xl">{topic?.icon}</span>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors flex-1 truncate">{quiz.title}</span>
                      <PlayCircle size={16} className="text-gray-300 group-hover:text-indigo-400 shrink-0 transition-colors" />
                    </Link>
                  );
                })}
              </div>
              <Link href="/" className="btn-primary w-full text-center text-sm mt-4 block">Browse All</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
