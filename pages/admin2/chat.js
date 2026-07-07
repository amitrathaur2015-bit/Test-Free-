import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { getRooms, getRoomMessages, deleteMessage } from '../../lib/store-extended';
import { banUserFromChat, unbanUserFromChat, getChatBans, logAdminAction } from '../../lib/admin-store';
import { MessageSquare, Trash2, Ban, Search, AlertTriangle, CheckCircle, RefreshCw, Users, Hash, Eye } from 'lucide-react';

const S = {
  card: { background: '#13161f', border: '1px solid #1e2433' },
  input: { background: '#0f1117', border: '1px solid #2a3040', color: '#e2e8f0' },
};

function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 60000) return 'just now';
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return new Date(ts).toLocaleString();
}

export default function AdminChat() {
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState('general');
  const [messages, setMessages] = useState([]);
  const [bans, setBans] = useState([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [tab, setTab] = useState('messages');
  const [filterType, setFilterType] = useState('all');
  const [stats, setStats] = useState({});

  const load = () => {
    const r = getRooms();
    setRooms(r);
    setMessages(getRoomMessages(activeRoom));
    setBans(getChatBans());
    // Build stats per room
    const s = {};
    r.forEach(room => {
      const msgs = getRoomMessages(room.id);
      s[room.id] = {
        total: msgs.length,
        doubts: msgs.filter(m => m.isDoubt).length,
        lastActivity: msgs.length ? msgs[msgs.length - 1].ts : 0,
      };
    });
    setStats(s);
  };

  useEffect(() => { load(); }, [activeRoom]);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2000); };

  const handleDelete = (msgId) => {
    deleteMessage(activeRoom, msgId);
    logAdminAction(1, 'DELETE_MESSAGE', `Deleted message ${msgId} from #${activeRoom}`);
    load();
    showToast('🗑️ Message deleted');
  };

  const handleDeleteAll = () => {
    if (!confirm(`Delete ALL messages in #${activeRoom}?`)) return;
    const msgs = getRoomMessages(activeRoom);
    msgs.forEach(m => deleteMessage(activeRoom, m.id));
    logAdminAction(1, 'CLEAR_ROOM', `Cleared all messages in #${activeRoom}`);
    load();
    showToast(`🗑️ Room cleared`);
  };

  const handleBanToggle = (userId, userName) => {
    const isBanned = bans.find(b => b.userId === userId);
    if (isBanned) {
      unbanUserFromChat(userId);
      logAdminAction(1, 'UNBAN_CHAT_USER', `Unbanned ${userName} from chat`);
      showToast(`✅ Unbanned ${userName} from chat`);
    } else {
      const reason = 'Violated community guidelines';
      banUserFromChat(userId, reason, 1);
      logAdminAction(1, 'BAN_CHAT_USER', `Banned ${userName} from chat. Reason: ${reason}`);
      showToast(`🚫 Banned ${userName} from chat`);
    }
    load();
  };

  const filtered = messages.filter(m => {
    const matchSearch = !search || m.text.toLowerCase().includes(search.toLowerCase()) || m.userName.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || (filterType === 'doubt' && m.isDoubt) || (filterType === 'regular' && !m.isDoubt);
    return matchSearch && matchType;
  });

  const totalMessages = Object.values(stats).reduce((s, r) => s + r.total, 0);

  return (
    <AdminLayout title="Chat Moderation">
      {toast && <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 shadow-xl">{toast}</div>}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Messages', value: totalMessages, color: 'indigo' },
          { label: 'Active Rooms', value: rooms.length, color: 'green' },
          { label: 'Doubts Posted', value: Object.values(stats).reduce((s, r) => s + r.doubts, 0), color: 'amber' },
          { label: 'Chat Bans', value: bans.length, color: 'red' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4" style={S.card}>
            <div className={`text-2xl font-bold text-${color}-400`}>{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 p-1 rounded-xl mb-5 w-fit" style={{ background: '#13161f', border: '1px solid #1e2433' }}>
        {['messages', 'bans'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab === t ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
            {t === 'bans' ? `🚫 Bans (${bans.length})` : '💬 Messages'}
          </button>
        ))}
      </div>

      {tab === 'messages' && (
        <div className="grid lg:grid-cols-4 gap-4">
          {/* Room list */}
          <div className="rounded-2xl overflow-hidden" style={S.card}>
            <div className="px-4 py-3 border-b text-xs font-semibold text-gray-500 uppercase" style={{ borderColor: '#1e2433' }}>
              Rooms
            </div>
            <div className="divide-y" style={{ borderColor: '#1e2433' }}>
              {rooms.map(r => {
                const rs = stats[r.id] || { total: 0, doubts: 0, lastActivity: 0 };
                const isActive = activeRoom === r.id;
                return (
                  <button key={r.id} onClick={() => setActiveRoom(r.id)}
                    className={`w-full text-left px-4 py-3 transition-colors flex items-start gap-3 hover:bg-white/3
                      ${isActive ? 'bg-indigo-600/15 border-l-2 border-indigo-500' : ''}`}>
                    <span className="text-lg shrink-0">{r.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className={`text-xs font-semibold ${isActive ? 'text-indigo-300' : 'text-gray-300'}`}>{r.name}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${rs.total > 0 ? 'bg-indigo-500/20 text-indigo-400' : 'bg-gray-700/50 text-gray-600'}`}>
                          {rs.total}
                        </span>
                      </div>
                      {rs.doubts > 0 && <p className="text-xs text-amber-400 mt-0.5">❓ {rs.doubts} doubts</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Messages panel */}
          <div className="lg:col-span-3 rounded-2xl overflow-hidden" style={S.card}>
            <div className="px-5 py-3 border-b flex items-center gap-3 flex-wrap" style={{ borderColor: '#1e2433' }}>
              <div className="relative flex-1 min-w-32">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none" style={S.input}
                  placeholder="Search messages..." />
              </div>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-xs focus:outline-none" style={S.input}>
                <option value="all">All types</option>
                <option value="doubt">Doubts only</option>
                <option value="regular">Regular only</option>
              </select>
              <button onClick={() => load()} className="p-1.5 text-gray-400 hover:text-white rounded-lg transition-colors" title="Refresh" style={{ background: '#1e2433' }}>
                <RefreshCw size={13} />
              </button>
              <button onClick={handleDeleteAll} className="px-2 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors font-medium" style={{ background: '#1e2433' }}>
                Clear Room
              </button>
            </div>
            <div className="max-h-[560px] overflow-y-auto divide-y" style={{ borderColor: '#1e2433' }}>
              {filtered.length === 0 ? (
                <div className="py-16 text-center text-gray-600">
                  <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
                  <p>{search ? 'No messages match search' : 'No messages in this room'}</p>
                </div>
              ) : (
                filtered.map(m => {
                  const isBanned = bans.find(b => b.userId === m.userId);
                  return (
                    <div key={m.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/2 group transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${isBanned ? 'bg-red-600 opacity-60' : 'bg-indigo-600'}`}>
                        {m.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="font-semibold text-xs text-gray-200">{m.userName}</span>
                          {m.isDoubt && <span className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full">❓ Doubt</span>}
                          {isBanned && <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full">🚫 Banned</span>}
                          <span className="text-xs text-gray-600">{timeAgo(m.ts)}</span>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed break-words">{m.text}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => handleBanToggle(m.userId, m.userName)}
                          className={`p-1.5 rounded-lg transition-colors ${isBanned ? 'text-green-400 hover:bg-green-500/10' : 'text-amber-400 hover:bg-amber-500/10'}`}
                          title={isBanned ? 'Unban user' : 'Ban from chat'}>
                          <Ban size={13} />
                        </button>
                        <button onClick={() => handleDelete(m.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title="Delete message">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="px-5 py-2 border-t text-xs text-gray-600 flex justify-between" style={{ borderColor: '#1e2433' }}>
              <span>{filtered.length} messages</span>
              <span>#{activeRoom}</span>
            </div>
          </div>
        </div>
      )}

      {tab === 'bans' && (
        <div className="rounded-2xl overflow-hidden" style={S.card}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#1e2433' }}>
            <h2 className="font-display font-semibold text-white">Chat-Banned Users</h2>
            <p className="text-xs text-gray-500 mt-0.5">These users cannot send messages in community rooms</p>
          </div>
          {bans.length === 0 ? (
            <div className="py-16 text-center text-gray-600">
              <CheckCircle size={32} className="mx-auto mb-3 text-green-600 opacity-40" />
              <p>No users are currently banned from chat</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#1e2433' }}>
              {bans.map(ban => (
                <div key={ban.userId} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    🚫
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-200 text-sm">User ID: {ban.userId}</p>
                    <p className="text-xs text-gray-500">Reason: {ban.reason}</p>
                    <p className="text-xs text-gray-600">Banned: {new Date(ban.bannedAt).toLocaleString()}</p>
                  </div>
                  <button onClick={() => handleBanToggle(ban.userId, `User ${ban.userId}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-green-400 hover:bg-green-500/10 transition-colors" style={{ background: '#1e2433' }}>
                    <CheckCircle size={13} /> Unban
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
