import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import { getLeaderboard, getDB, getSession, getLiveOnlineCount } from '../../lib/store';
import { Trophy, RefreshCw } from 'lucide-react';

const TYPES = [
  { key: 'global', label: 'All Time' },
  { key: 'daily', label: 'Today' },
  { key: 'weekly', label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
];

export default function Leaderboard() {
  const [type, setType] = useState('global');
  const [topicId, setTopicId] = useState(null);
  const [board, setBoard] = useState([]);
  const [topics, setTopics] = useState([]);
  const [session, setSession] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState('');
  const [flashing, setFlashing] = useState(false);

  const load = () => {
    const data = getLeaderboard(type, topicId);
    setBoard(data);
    setLastUpdated(new Date().toLocaleTimeString());
    setFlashing(true);
    setTimeout(() => setFlashing(false), 600);
  };

  useEffect(() => {
    setSession(getSession());
    const db = getDB();
    setTopics(db.topics);
    setOnlineCount(getLiveOnlineCount());
    load();
    const interval = setInterval(() => {
      setOnlineCount(getLiveOnlineCount());
      load();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => { load(); }, [type, topicId]);

  const myRank = session ? board.find(b => b.userId === session.id) : null;

  const rankBadge = (rank) => {
    if (rank === 1) return <span className="text-2xl">🥇</span>;
    if (rank === 2) return <span className="text-2xl">🥈</span>;
    if (rank === 3) return <span className="text-2xl">🥉</span>;
    return <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-sm font-bold flex items-center justify-center">{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-bold text-2xl text-gray-900 flex items-center gap-2">
              <Trophy className="text-amber-500" size={26} /> Leaderboard
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">See how you rank against others</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-700 text-sm font-semibold">{onlineCount} Online</span>
            </div>
            <button onClick={load} className="p-2 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-all" title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* My Rank Banner */}
        {myRank && (
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                  {session.avatar}
                </div>
                <div>
                  <p className="text-white/70 text-xs font-medium">Your current rank</p>
                  <p className="font-display font-bold text-xl">#{myRank.rank} — {session.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs">Avg Score</p>
                <p className="font-display font-bold text-2xl">{myRank.avgPct}%</p>
                <p className="text-white/60 text-xs">{myRank.attempts} attempts</p>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
              {TYPES.map(t => (
                <button key={t.key} onClick={() => setType(t.key)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${type === t.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
                  {t.label}
                </button>
              ))}
            </div>
            <select value={topicId || ''} onChange={e => setTopicId(e.target.value || null)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white flex-shrink-0">
              <option value="">All Topics</option>
              {topics.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
            </select>
          </div>
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            Live — Last updated: {lastUpdated}
          </p>
        </div>

        {/* Top 3 Podium */}
        {board.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { user: board[1], pos: '2nd', color: 'bg-gray-200 text-gray-700', ht: 'pt-10' },
              { user: board[0], pos: '1st', color: 'bg-amber-400 text-amber-900', ht: 'pt-4' },
              { user: board[2], pos: '3rd', color: 'bg-orange-300 text-orange-900', ht: 'pt-14' },
            ].map(({ user, pos, color, ht }) => (
              <div key={user.userId} className={`card flex flex-col items-center ${ht} pb-4 text-center`}>
                <div className={`w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xl mb-2 ${flashing && pos === '1st' ? 'ring-4 ring-amber-400 ring-offset-2' : ''} transition-all`}>
                  {user.avatar}
                </div>
                <p className="font-semibold text-sm text-gray-900 leading-tight">{user.name.split(' ')[0]}</p>
                <p className={`text-lg font-bold mt-1 ${user.avgPct >= 80 ? 'text-green-600' : 'text-amber-600'}`}>{user.avgPct}%</p>
                <span className={`mt-2 px-3 py-0.5 rounded-full text-xs font-bold ${color}`}>{pos}</span>
              </div>
            ))}
          </div>
        )}

        {/* Full Rankings Table */}
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-display font-semibold text-base text-gray-900">Full Rankings</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">{board.length} players</span>
          </div>
          {board.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Trophy size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No data for this period yet</p>
              <p className="text-sm mt-1">Take a quiz to appear on the leaderboard!</p>
            </div>
          ) : (
            <div>
              {board.map((user) => (
                <div key={user.userId}
                  className={`flex items-center gap-4 px-6 py-3.5 border-b border-gray-50 last:border-0 transition-colors
                    ${session?.id === user.userId ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
                  <div className="w-10 flex justify-center shrink-0">{rankBadge(user.rank)}</div>
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 flex items-center gap-1.5">
                      {user.name}
                      {session?.id === user.userId && <span className="badge bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">You</span>}
                    </p>
                    <p className="text-xs text-gray-400">{user.attempts} quiz{user.attempts !== 1 ? 'zes' : ''} • Best: {user.bestPct}%</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-base font-bold ${user.avgPct >= 80 ? 'text-green-600' : user.avgPct >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                      {user.avgPct}%
                    </div>
                    <div className="text-xs text-gray-400">avg</div>
                  </div>
                  <div className="w-20 hidden sm:block">
                    <div className="bg-gray-100 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all duration-500 ${user.avgPct >= 80 ? 'bg-green-500' : user.avgPct >= 60 ? 'bg-amber-500' : 'bg-red-400'}`}
                        style={{ width: `${user.avgPct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
