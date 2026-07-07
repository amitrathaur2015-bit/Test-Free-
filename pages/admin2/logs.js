import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { getActivityLogs } from '../../lib/admin-store';
import { Activity, Search, Filter, Download, RefreshCw, Shield, Trash2, UserCheck, Upload, Send, Edit3, Eye } from 'lucide-react';

const S = {
  card: { background: '#13161f', border: '1px solid #1e2433' },
  input: { background: '#0f1117', border: '1px solid #2a3040', color: '#e2e8f0' },
  th: 'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider',
};

const ACTION_META = {
  CREATE_QUIZ: { icon: Shield, color: 'green', label: 'CREATE' },
  DELETE_QUIZ: { icon: Trash2, color: 'red', label: 'DELETE' },
  CREATE_TOPIC: { icon: Shield, color: 'indigo', label: 'TOPIC' },
  BAN_USER: { icon: UserCheck, color: 'red', label: 'BAN' },
  UNBAN_USER: { icon: UserCheck, color: 'green', label: 'UNBAN' },
  DELETE_USER: { icon: Trash2, color: 'red', label: 'DELETE' },
  CHANGE_ROLE: { icon: UserCheck, color: 'purple', label: 'ROLE' },
  UPLOAD_PDF: { icon: Upload, color: 'blue', label: 'UPLOAD' },
  DELETE_PDF: { icon: Trash2, color: 'red', label: 'PDF' },
  SEND_ANNOUNCEMENT: { icon: Send, color: 'indigo', label: 'NOTIFY' },
  DELETE_MESSAGE: { icon: Trash2, color: 'amber', label: 'CHAT' },
  ADD_QUESTION: { icon: Edit3, color: 'green', label: 'QUESTION' },
  DELETE_QUESTION: { icon: Trash2, color: 'red', label: 'QUESTION' },
};

const COLOR_MAP = {
  green: 'text-green-400 bg-green-500/10 border-green-500/20',
  red: 'text-red-400 bg-red-500/10 border-red-500/20',
  indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  gray: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
};

function timeAgo(ts) {
  const d = Date.now() - ts;
  if (d < 60000) return `${Math.floor(d / 1000)}s ago`;
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    setLogs(getActivityLogs(500));
  }, [refresh]);

  const actionTypes = [...new Set(logs.map(l => l.action))];

  const filtered = logs.filter(l => {
    const matchSearch = !search || l.detail.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase());
    const matchAction = filterAction === 'all' || l.action === filterAction;
    return matchSearch && matchAction;
  });

  const exportLogs = () => {
    const rows = [['ID', 'Action', 'Detail', 'Timestamp']];
    logs.forEach(l => rows.push([l.id, l.action, l.detail, new Date(l.ts).toISOString()]));
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Stats
  const today = new Date().toDateString();
  const todayLogs = logs.filter(l => new Date(l.ts).toDateString() === today);
  const actionCounts = {};
  logs.forEach(l => { actionCounts[l.action] = (actionCounts[l.action] || 0) + 1; });

  return (
    <AdminLayout title="Activity Logs">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-xl text-white flex items-center gap-2">
            <Activity size={22} className="text-indigo-400" /> Activity Logs
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Complete audit trail of all admin actions</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setRefresh(r => r + 1)} className="p-2 rounded-xl text-gray-400 hover:text-white transition-colors" style={{ background: '#1e2433' }}>
            <RefreshCw size={15} />
          </button>
          <button onClick={exportLogs} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-300 hover:text-white transition-colors" style={{ background: '#1e2433' }}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Actions', value: logs.length, color: 'indigo' },
          { label: 'Today', value: todayLogs.length, color: 'green' },
          { label: 'Deletions', value: logs.filter(l => l.action.includes('DELETE')).length, color: 'red' },
          { label: 'Bans', value: logs.filter(l => l.action.includes('BAN')).length, color: 'amber' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl p-4" style={S.card}>
            <div className={`text-2xl font-bold text-${color}-400`}>{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none"
            style={S.input} placeholder="Search actions or details..." />
        </div>
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
          className="px-3 py-2.5 rounded-xl text-sm focus:outline-none" style={{ ...S.input, minWidth: '160px' }}>
          <option value="all">All Actions</option>
          {actionTypes.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Logs table */}
      <div className="rounded-2xl overflow-hidden" style={S.card}>
        <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: '#1e2433' }}>
          <span className="text-sm text-gray-400">{filtered.length} entries</span>
          <span className="text-xs text-gray-600">Showing last 500 actions</span>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0" style={{ background: '#0f1117' }}>
              <tr>
                <th className={S.th}>#</th>
                <th className={S.th}>Action</th>
                <th className={S.th}>Detail</th>
                <th className={S.th}>Time</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#1e2433' }}>
              {filtered.map(log => {
                const meta = ACTION_META[log.action] || { icon: Activity, color: 'gray', label: log.action.split('_')[0] };
                const colorClass = COLOR_MAP[meta.color] || COLOR_MAP.gray;
                return (
                  <tr key={log.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-600 font-mono">#{log.id}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-semibold ${colorClass}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300 max-w-md">
                      <span className="line-clamp-2">{log.detail}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      <div>{timeAgo(log.ts)}</div>
                      <div className="text-gray-700">{new Date(log.ts).toLocaleTimeString()}</div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="py-12 text-center text-gray-600">No logs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
