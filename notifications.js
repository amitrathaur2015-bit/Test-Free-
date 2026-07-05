import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { getAnnouncements, sendAnnouncement, deleteAnnouncement } from '../../lib/admin-store';
import { Bell, Send, Trash2, Users, Plus, X, CheckCircle, BookOpen, Trophy, AlertTriangle, Star, Megaphone } from 'lucide-react';

const S = {
  card: { background: '#13161f', border: '1px solid #1e2433' },
  input: { background: '#0f1117', border: '1px solid #2a3040', color: '#e2e8f0' },
};

const TEMPLATES = [
  { icon: '🎉', title: 'New Quiz Available!', body: 'A new quiz has just been added. Check it out in the Topics section and challenge yourself!', target: 'all', color: 'indigo' },
  { icon: '📚', title: 'Study Material Updated', body: 'New PDF study material has been uploaded to the library. Download it now for free!', target: 'all', color: 'blue' },
  { icon: '🏆', title: 'Leaderboard Updated', body: 'The weekly leaderboard has been updated. See where you stand among other students!', target: 'all', color: 'amber' },
  { icon: '⚠️', title: 'Scheduled Maintenance', body: 'The platform will undergo scheduled maintenance. Please save your progress before the downtime.', target: 'all', color: 'red' },
  { icon: '🔥', title: 'New Challenge Week!', body: 'This week\'s challenge is live! Take quizzes, earn points, and win the leaderboard.', target: 'user', color: 'orange' },
  { icon: '✅', title: 'System Update', body: 'We have deployed new features and performance improvements. Enjoy the updated experience!', target: 'all', color: 'green' },
];

const TARGET_CONFIG = {
  all: { label: 'All Users', icon: '👥', color: 'indigo' },
  user: { label: 'Students Only', icon: '🎓', color: 'blue' },
  admin: { label: 'Admins Only', icon: '🛡️', color: 'purple' },
};

export default function AdminNotifications() {
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', targetRole: 'all' });
  const [toast, setToast] = useState('');
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState(null);

  const load = () => setAnnouncements(getAnnouncements());
  useEffect(() => { load(); }, []);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2500); };

  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 700));
    sendAnnouncement({ ...form, sentBy: 'Admin' });
    setForm({ title: '', body: '', targetRole: 'all' });
    setShowForm(false);
    setSending(false);
    load();
    showToast('📢 Announcement sent to users!');
  };

  const handleDelete = (id) => {
    deleteAnnouncement(id);
    load();
    showToast('Announcement deleted');
  };

  const applyTemplate = (tpl) => {
    setForm({ title: tpl.title, body: tpl.body, targetRole: tpl.target });
    setShowForm(true);
  };

  const formatDate = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <AdminLayout title="Notifications & Announcements">
      {toast && <div className="fixed top-20 right-6 z-50 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 shadow-xl">{toast}</div>}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-6 w-96 max-w-full" style={{ background: '#13161f', border: '1px solid #1e2433' }}>
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-bold text-white text-base">Preview</h3>
              <button onClick={() => setPreview(null)} className="text-gray-500 hover:text-white"><X size={16} /></button>
            </div>
            {/* Simulated notification UI */}
            <div className="rounded-xl p-4 mb-4" style={{ background: '#0f1117', border: '1px solid #2a3040' }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-xl flex-shrink-0">
                  📢
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{preview.title}</p>
                  <p className="text-gray-400 text-xs mt-1 leading-relaxed">{preview.body}</p>
                  <p className="text-gray-600 text-xs mt-2">TestFree • {formatDate(preview.sentAt)}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Target: {TARGET_CONFIG[preview.targetRole]?.label}</span>
              <span>Sent by: {preview.sentBy}</span>
            </div>
            <button onClick={() => setPreview(null)} className="w-full mt-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors" style={{ background: '#1e2433' }}>
              Close
            </button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Compose + Templates */}
        <div className="lg:col-span-1 space-y-4">
          {/* Compose */}
          <div className="rounded-2xl overflow-hidden" style={S.card}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#1e2433' }}>
              <h2 className="font-display font-semibold text-white flex items-center gap-2">
                <Megaphone size={16} className="text-indigo-400" /> Compose
              </h2>
              <button onClick={() => setShowForm(!showForm)}
                className={`p-1.5 rounded-lg transition-colors ${showForm ? 'text-red-400 hover:bg-red-500/10' : 'text-indigo-400 hover:bg-indigo-500/10'}`}>
                {showForm ? <X size={16} /> : <Plus size={16} />}
              </button>
            </div>
            {showForm ? (
              <div className="p-5 space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    style={S.input} placeholder="Announcement title..." />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Message *</label>
                  <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                    rows={4} className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                    style={S.input} placeholder="Write your announcement..." />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Target Audience</label>
                  <div className="flex gap-2">
                    {Object.entries(TARGET_CONFIG).map(([key, cfg]) => (
                      <button key={key} onClick={() => setForm(f => ({ ...f, targetRole: key }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${form.targetRole === key ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        style={form.targetRole !== key ? { background: '#1e2433' } : {}}>
                        {cfg.icon} {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleSend} disabled={!form.title.trim() || !form.body.trim() || sending}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                  {sending ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</> : <><Send size={14} /> Send Announcement</>}
                </button>
              </div>
            ) : (
              <div className="p-5 text-center">
                <Bell size={28} className="mx-auto text-gray-700 mb-2" />
                <p className="text-sm text-gray-500">Click + to compose an announcement</p>
                <button onClick={() => setShowForm(true)}
                  className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold text-indigo-400 hover:bg-indigo-500/10 transition-colors" style={{ background: '#1e2433' }}>
                  Write Announcement
                </button>
              </div>
            )}
          </div>

          {/* Templates */}
          <div className="rounded-2xl overflow-hidden" style={S.card}>
            <div className="px-5 py-4 border-b" style={{ borderColor: '#1e2433' }}>
              <h2 className="font-display font-semibold text-white text-sm">Quick Templates</h2>
            </div>
            <div className="divide-y" style={{ borderColor: '#1e2433' }}>
              {TEMPLATES.map((tpl, i) => (
                <button key={i} onClick={() => applyTemplate(tpl)}
                  className="w-full text-left px-4 py-3 hover:bg-white/3 transition-colors flex items-start gap-3">
                  <span className="text-lg shrink-0">{tpl.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-300 truncate">{tpl.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{tpl.body}</p>
                  </div>
                  <span className="text-xs text-indigo-500 shrink-0 mt-0.5">Use →</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Announcement history */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl overflow-hidden" style={S.card}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#1e2433' }}>
              <h2 className="font-display font-semibold text-white">Sent Announcements</h2>
              <span className="text-xs text-gray-500">{announcements.length} total</span>
            </div>
            {announcements.length === 0 ? (
              <div className="py-16 text-center text-gray-600">
                <Bell size={32} className="mx-auto mb-3 opacity-30" />
                <p>No announcements sent yet</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#1e2433' }}>
                {announcements.map(ann => {
                  const cfg = TARGET_CONFIG[ann.targetRole] || TARGET_CONFIG.all;
                  return (
                    <div key={ann.id} className="px-5 py-4 hover:bg-white/2 transition-colors group">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center text-xl flex-shrink-0">
                          📢
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-gray-200 text-sm leading-snug">{ann.title}</p>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button onClick={() => setPreview(ann)} className="p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors" style={{ background: '#1e2433' }} title="Preview">
                                <Bell size={13} />
                              </button>
                              <button onClick={() => handleDelete(ann.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" title="Delete">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">{ann.body}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20`}>
                              {cfg.icon} {cfg.label}
                            </span>
                            <span className="text-xs text-gray-600">{formatDate(ann.sentAt)}</span>
                            <span className="text-xs text-gray-600">By {ann.sentBy}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
