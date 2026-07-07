import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { getDB, saveDB } from '../../lib/store';
import { logAdminAction, banUserFromChat, unbanUserFromChat, exportUsersCSV } from '../../lib/admin-store';
import { Search, Trash2, Ban, Crown, Eye, Download, RefreshCw, X, Mail, Calendar, Trophy, CheckCircle, XCircle, Filter } from 'lucide-react';

const S = {
  card: { background: '#13161f', border: '1px solid #1e2433' },
  input: { background: '#0f1117', border: '1px solid #2a3040', color: '#e2e8f0' },
  th: 'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider',
  td: 'px-4 py-3.5 text-sm',
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [results, setResults] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [toast, setToast] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [sortBy, setSortBy] = useState('name');

  const load = () => {
    const db = getDB();
    setUsers(db.users);
    setResults(db.results);
    setQuizzes(db.quizzes);
  };
  useEffect(() => { load(); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleBan = (user) => {
    const db = getDB();
    const u = db.users.find(x => x.id === user.id);
    if (!u) return;
    u.banned = !u.banned;
    saveDB();
    logAdminAction(1, u.banned ? 'BAN_USER' : 'UNBAN_USER', `${u.banned ? 'Banned' : 'Unbanned'} user: ${u.email}`);
    showToast(`${u.banned ? '🚫 Banned' : '✅ Unbanned'} ${u.name}`);
    if (selectedUser?.id === user.id) setSelectedUser({ ...selectedUser, banned: u.banned });
    load();
  };

  const handlePromote = (user) => {
    const db = getDB();
    const u = db.users.find(x => x.id === user.id);
    if (!u) return;
    u.role = u.role === 'admin' ? 'user' : 'admin';
    saveDB();
    logAdminAction(1, 'CHANGE_ROLE', `Changed role of ${u.email} to ${u.role}`);
    showToast(`Role changed to ${u.role} for ${u.name}`);
    load();
  };

  const handleDelete = (userId) => {
    const db = getDB();
    const u = db.users.find(x => x.id === userId);
    db.users = db.users.filter(x => x.id !== userId);
    db.results = db.results.filter(r => r.userId !== userId);
    saveDB();
    logAdminAction(1, 'DELETE_USER', `Deleted user: ${u?.email}`);
    showToast('✅ User deleted');
    setConfirmDelete(null);
    setSelectedUser(null);
    load();
  };

  const exportCSV = () => {
    const db = getDB();
    const csv = exportUsersCSV(db);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('📥 CSV exported');
  };

  const getUserStats = (userId) => {
    const ur = results.filter(r => r.userId === userId);
    const avg = ur.length ? Math.round(ur.reduce((s, r) => s + r.percentage, 0) / ur.length) : 0;
    const best = ur.length ? Math.max(...ur.map(r => r.percentage)) : 0;
    return { attempts: ur.length, avg, best, recent: ur.slice(-5).reverse() };
  };

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchStatus = filterStatus === 'all' || (filterStatus === 'banned' ? u.banned : !u.banned);
    return matchSearch && matchRole && matchStatus;
  }).sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'joined') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'attempts') return getUserStats(b.id).attempts - getUserStats(a.id).attempts;
    return 0;
  });

  const uStats = selectedUser ? getUserStats(selectedUser.id) : null;

  return (
    <AdminLayout title="User Management">
      {toast && <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 shadow-xl">{toast}</div>}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-80 text-center" style={{ background: '#13161f', border: '1px solid #1e2433' }}>
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} className="text-red-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Delete User?</h3>
            <p className="text-gray-400 text-sm mb-5">This will permanently delete <strong className="text-white">{confirmDelete.name}</strong> and all their quiz history.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors" style={{ background: '#1e2433' }}>Cancel</button>
              <button onClick={() => handleDelete(confirmDelete.id)} className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-500 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users', value: users.length, color: 'indigo' },
          { label: 'Students', value: users.filter(u => u.role === 'user').length, color: 'blue' },
          { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: 'purple' },
          { label: 'Banned', value: users.filter(u => u.banned).length, color: 'red' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4" style={S.card}>
            <div className={`text-2xl font-bold text-${color}-400`}>{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Users table */}
        <div className="lg:col-span-2">
          {/* Filters */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-36">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none" style={S.input}
                placeholder="Search name or email..." />
            </div>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={S.input}>
              <option value="all">All Roles</option>
              <option value="user">Students</option>
              <option value="admin">Admins</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={S.input}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="banned">Banned</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={S.input}>
              <option value="name">Sort: Name</option>
              <option value="joined">Sort: Newest</option>
              <option value="attempts">Sort: Most Active</option>
            </select>
            <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white transition-colors" style={{ background: '#13161f', border: '1px solid #1e2433' }}>
              <Download size={14} /> CSV
            </button>
          </div>

          <div className="rounded-2xl overflow-hidden" style={S.card}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ background: '#0f1117' }}>
                  <tr>
                    <th className={S.th}>User</th>
                    <th className={S.th}>Role</th>
                    <th className={S.th}>Activity</th>
                    <th className={S.th}>Status</th>
                    <th className={S.th}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: '#1e2433' }}>
                  {filtered.map(user => {
                    const us = getUserStats(user.id);
                    const isSelected = selectedUser?.id === user.id;
                    return (
                      <tr key={user.id}
                        onClick={() => setSelectedUser(isSelected ? null : user)}
                        className={`cursor-pointer transition-colors ${isSelected ? 'bg-indigo-600/10' : 'hover:bg-white/2'} ${user.banned ? 'opacity-60' : ''}`}>
                        <td className={S.td}>
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${user.role === 'admin' ? 'bg-purple-600' : 'bg-indigo-600'}`}>
                              {user.avatar}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-200 truncate">{user.name}</p>
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className={S.td}>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${user.role === 'admin' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' : 'text-blue-400 bg-blue-500/10 border-blue-500/20'}`}>
                            {user.role === 'admin' ? '👑 Admin' : '👤 Student'}
                          </span>
                        </td>
                        <td className={S.td}>
                          <p className="text-gray-300 text-xs">{us.attempts} quizzes</p>
                          {us.attempts > 0 && <p className="text-gray-500 text-xs">avg {us.avg}%</p>}
                        </td>
                        <td className={S.td}>
                          {user.banned
                            ? <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">🚫 Banned</span>
                            : <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">✓ Active</span>}
                        </td>
                        <td className={S.td} onClick={e => e.stopPropagation()}>
                          {user.id !== 1 && (
                            <div className="flex gap-1.5">
                              <button onClick={() => handleBan(user)} title={user.banned ? 'Unban' : 'Ban'}
                                className={`p-1.5 rounded-lg transition-colors ${user.banned ? 'text-green-400 hover:bg-green-500/10' : 'text-red-400 hover:bg-red-500/10'}`}>
                                <Ban size={14} />
                              </button>
                              <button onClick={() => handlePromote(user)} title={user.role === 'admin' ? 'Demote' : 'Promote'}
                                className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-colors">
                                <Crown size={14} />
                              </button>
                              <button onClick={() => setConfirmDelete(user)} title="Delete"
                                className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="py-12 text-center text-gray-600">No users found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t text-xs text-gray-600" style={{ borderColor: '#1e2433' }}>
              Showing {filtered.length} of {users.length} users
            </div>
          </div>
        </div>

        {/* User detail sidebar */}
        <div>
          {selectedUser && uStats ? (
            <div className="rounded-2xl overflow-hidden sticky top-6" style={S.card}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#1e2433' }}>
                <h3 className="font-semibold text-white text-sm">User Profile</h3>
                <button onClick={() => setSelectedUser(null)} className="text-gray-500 hover:text-gray-300"><X size={16} /></button>
              </div>
              <div className="p-5">
                <div className="text-center mb-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3 ${selectedUser.role === 'admin' ? 'bg-purple-600' : 'bg-indigo-600'}`}>
                    {selectedUser.avatar}
                  </div>
                  <p className="font-bold text-white">{selectedUser.name}</p>
                  <p className="text-sm text-gray-400">{selectedUser.email}</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${selectedUser.role === 'admin' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' : 'text-blue-400 bg-blue-500/10 border-blue-500/20'}`}>
                      {selectedUser.role === 'admin' ? '👑 Admin' : '👤 Student'}
                    </span>
                    {selectedUser.banned && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">🚫 Banned</span>}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: 'Quizzes', value: uStats.attempts },
                    { label: 'Avg', value: `${uStats.avg}%` },
                    { label: 'Best', value: `${uStats.best}%` },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center rounded-xl py-2 px-1" style={{ background: '#0f1117' }}>
                      <div className="text-white font-bold text-lg">{value}</div>
                      <div className="text-xs text-gray-500">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Info */}
                <div className="space-y-2 text-xs mb-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar size={12} className="text-gray-600" />
                    Joined: {selectedUser.createdAt}
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Mail size={12} className="text-gray-600" />
                    {selectedUser.email}
                  </div>
                </div>

                {/* Recent activity */}
                {uStats.recent.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Recent Quizzes</p>
                    <div className="space-y-1.5">
                      {uStats.recent.map(r => {
                        const quiz = quizzes.find(q => q.id === r.quizId);
                        return (
                          <div key={r.id} className="flex items-center gap-2 py-1.5 px-2.5 rounded-xl" style={{ background: '#0f1117' }}>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-300 truncate">{quiz?.title || 'Quiz'}</p>
                              <p className="text-xs text-gray-600">{r.date}</p>
                            </div>
                            <span className={`text-xs font-bold ${r.percentage >= 70 ? 'text-green-400' : r.percentage >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                              {r.percentage}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {selectedUser.id !== 1 && (
                  <div className="flex flex-col gap-2 mt-4">
                    <button onClick={() => handleBan(selectedUser)}
                      className={`w-full py-2 rounded-xl text-sm font-semibold transition-colors ${selectedUser.banned ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}>
                      {selectedUser.banned ? '✓ Unban User' : '🚫 Ban User'}
                    </button>
                    <button onClick={() => handlePromote(selectedUser)}
                      className="w-full py-2 rounded-xl text-sm font-semibold text-purple-300 hover:bg-purple-500/10 transition-colors" style={{ background: '#1e2433' }}>
                      {selectedUser.role === 'admin' ? 'Demote to Student' : 'Promote to Admin'}
                    </button>
                    <button onClick={() => setConfirmDelete(selectedUser)}
                      className="w-full py-2 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors" style={{ background: '#1e2433' }}>
                      Delete Account
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-8 text-center" style={S.card}>
              <Eye size={32} className="mx-auto text-gray-700 mb-3" />
              <p className="text-gray-500 text-sm">Click a user to view details</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
