import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/layout/Navbar';
import { getSession, setSession, getDB, saveDB, getUserStats, getUserRank } from '../lib/store';
import { User, Mail, Calendar, Shield, Save, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Trophy, BarChart2, BookOpen, Clock } from 'lucide-react';

export default function Profile() {
  const [session, setSessionState] = useState(null);
  const [form, setForm] = useState({ name: '', email: '' });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [pwMsg, setPwMsg] = useState(null);
  const [stats, setStats] = useState(null);
  const [rank, setRank] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const router = useRouter();

  useEffect(() => {
    const s = getSession();
    if (!s) { router.push('/auth/login'); return; }
    setSessionState(s);
    setForm({ name: s.name, email: s.email });
    setStats(getUserStats(s.id));
    setRank(getUserRank(s.id));
  }, []);

  const showMsg = (setter, text, type = 'success') => {
    setter({ text, type });
    setTimeout(() => setter(null), 3000);
  };

  const handleSaveProfile = () => {
    if (!form.name.trim()) { showMsg(setProfileMsg, 'Name cannot be empty.', 'error'); return; }
    const db = getDB();
    const idx = db.users.findIndex(u => u.id === session.id);
    if (idx !== -1) {
      db.users[idx].name = form.name.trim();
      db.users[idx].avatar = form.name.trim()[0].toUpperCase();
      saveDB();
    }
    const updated = { ...session, name: form.name.trim(), avatar: form.name.trim()[0].toUpperCase() };
    setSession(updated);
    setSessionState(updated);
    showMsg(setProfileMsg, 'Profile updated successfully!');
  };

  const handleChangePassword = () => {
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      showMsg(setPwMsg, 'Please fill in all fields.', 'error'); return;
    }
    const db = getDB();
    const user = db.users.find(u => u.id === session.id);
    if (!user || user.password !== pwForm.current) {
      showMsg(setPwMsg, 'Current password is incorrect.', 'error'); return;
    }
    if (pwForm.newPw.length < 6) {
      showMsg(setPwMsg, 'New password must be at least 6 characters.', 'error'); return;
    }
    if (pwForm.newPw !== pwForm.confirm) {
      showMsg(setPwMsg, 'Passwords do not match.', 'error'); return;
    }
    user.password = pwForm.newPw;
    saveDB();
    setPwForm({ current: '', newPw: '', confirm: '' });
    showMsg(setPwMsg, 'Password changed successfully!');
  };

  if (!session) return <div className="min-h-screen bg-slate-50"><Navbar /></div>;

  const TABS = [
    { key: 'profile', label: 'Profile Info', icon: User },
    { key: 'password', label: 'Change Password', icon: Lock },
    { key: 'stats', label: 'My Stats', icon: BarChart2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">

        {/* Avatar header */}
        <div className="card mb-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-display font-bold text-3xl shadow-lg flex-shrink-0">
              {session.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-bold text-xl text-gray-900">{session.name}</h2>
              <p className="text-gray-500 text-sm">{session.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${session.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {session.role === 'admin' ? <><Shield size={11} /> Admin</> : <><User size={11} /> Member</>}
                </span>
                {rank && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                    <Trophy size={11} /> Rank #{rank}
                  </span>
                )}
                <span className="text-xs text-gray-400">Member since {session.createdAt || '2024'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1.5 mb-6 shadow-sm">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium transition-all
                ${activeTab === key ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Icon size={14} /> <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Profile Info Tab */}
        {activeTab === 'profile' && (
          <div className="card">
            <h2 className="font-display font-semibold text-base text-gray-900 mb-5 flex items-center gap-2">
              <User size={16} className="text-indigo-500" /> Edit Profile
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label flex items-center gap-1.5"><User size={13} /> Full Name</label>
                <input type="text" className="input-field" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                  onKeyDown={e => e.key === 'Enter' && handleSaveProfile()} />
              </div>
              <div>
                <label className="label flex items-center gap-1.5"><Mail size={13} /> Email Address</label>
                <input type="email" className="input-field bg-gray-50 cursor-not-allowed" value={form.email} readOnly />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="label flex items-center gap-1.5"><Calendar size={13} /> Member Since</label>
                <input type="text" className="input-field bg-gray-50 cursor-not-allowed" value={session.createdAt || '2024'} readOnly />
              </div>

              {profileMsg && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
                  ${profileMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                  {profileMsg.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                  {profileMsg.text}
                </div>
              )}

              <button onClick={handleSaveProfile} className="btn-primary flex items-center gap-2">
                <Save size={15} /> Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Change Password Tab */}
        {activeTab === 'password' && (
          <div className="card">
            <h2 className="font-display font-semibold text-base text-gray-900 mb-5 flex items-center gap-2">
              <Lock size={16} className="text-indigo-500" /> Change Password
            </h2>
            <div className="space-y-4">
              {/* Current password */}
              <div>
                <label className="label">Current Password</label>
                <div className="relative">
                  <input type={showCurrent ? 'text' : 'password'} className="input-field pr-10"
                    value={pwForm.current} onChange={e => setPwForm({ ...pwForm, current: e.target.value })}
                    placeholder="Enter current password" />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <input type={showNew ? 'text' : 'password'} className="input-field pr-10"
                    value={pwForm.newPw} onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })}
                    placeholder="Minimum 6 characters" />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {/* Strength indicator */}
                {pwForm.newPw && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                          pwForm.newPw.length >= i * 3
                            ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-amber-400' : i <= 3 ? 'bg-yellow-400' : 'bg-green-500'
                            : 'bg-gray-200'
                        }`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {pwForm.newPw.length < 4 ? 'Too weak' : pwForm.newPw.length < 7 ? 'Fair' : pwForm.newPw.length < 10 ? 'Good' : 'Strong'}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="label">Confirm New Password</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} className="input-field pr-10"
                    value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                    placeholder="Repeat new password" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {pwForm.confirm && pwForm.newPw && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${pwForm.confirm === pwForm.newPw ? 'text-green-600' : 'text-red-500'}`}>
                    {pwForm.confirm === pwForm.newPw ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                    {pwForm.confirm === pwForm.newPw ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}
              </div>

              {pwMsg && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
                  ${pwMsg.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                  {pwMsg.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
                  {pwMsg.text}
                </div>
              )}

              <button onClick={handleChangePassword} className="btn-primary flex items-center gap-2">
                <Lock size={15} /> Update Password
              </button>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && stats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Quizzes Taken', value: stats.totalAttempts, icon: BookOpen, color: 'indigo' },
                { label: 'Correct Answers', value: stats.totalScore, icon: CheckCircle, color: 'green' },
                { label: 'Avg Score', value: stats.totalAttempts ? `${stats.avgPercentage}%` : '—', icon: BarChart2, color: 'amber' },
                { label: 'Global Rank', value: rank ? `#${rank}` : '—', icon: Trophy, color: 'purple' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="card text-center">
                  <div className={`w-10 h-10 rounded-xl bg-${color}-100 flex items-center justify-center mx-auto mb-2`}>
                    <Icon size={18} className={`text-${color}-600`} />
                  </div>
                  <div className="text-2xl font-display font-bold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <h3 className="font-display font-semibold text-base text-gray-900 mb-4 flex items-center gap-2">
                <Clock size={15} className="text-indigo-500" /> Recent Quizzes
              </h3>
              {stats.recentActivity.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No quizzes taken yet.</p>
              ) : (
                <div className="space-y-2">
                  {stats.recentActivity.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                      <span className="text-xl">{item.topic?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{item.quiz?.title}</p>
                        <p className="text-xs text-gray-400">{item.date}</p>
                      </div>
                      <span className={`text-sm font-bold ${item.percentage >= 70 ? 'text-green-600' : item.percentage >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
