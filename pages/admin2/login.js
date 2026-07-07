import { useState } from 'react';
import { useRouter } from 'next/router';
import { loginUser, setSession, getDB, saveDB } from '../../lib/store';
import { Shield, Eye, EyeOff, Lock, Mail, KeyRound, CheckCircle, X } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('admin@testfree.com');
  const [password, setPassword] = useState('admin123');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPw, setResetNewPw] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetMsg, setResetMsg] = useState(null);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 600));
    const user = loginUser(email, password);
    if (!user) { setError('Invalid email or password'); setLoading(false); return; }
    if (user.role !== 'admin') { setError('Access denied. Admins only.'); setLoading(false); return; }
    setSession(user);
    router.push('/admin2');
  };

  const handleResetPassword = () => {
    if (!resetEmail || !resetNewPw || !resetConfirm) {
      setResetMsg({ type: 'error', text: 'Please fill in all fields.' }); return;
    }
    if (resetNewPw.length < 6) {
      setResetMsg({ type: 'error', text: 'New password must be at least 6 characters.' }); return;
    }
    if (resetNewPw !== resetConfirm) {
      setResetMsg({ type: 'error', text: 'Passwords do not match.' }); return;
    }
    const db = getDB();
    const user = db.users.find(u => u.email === resetEmail && u.role === 'admin');
    if (!user) {
      setResetMsg({ type: 'error', text: 'No admin account found with this email.' }); return;
    }
    user.password = resetNewPw;
    saveDB();
    setResetMsg({ type: 'success', text: 'Password reset! You can now log in.' });
    setTimeout(() => { setShowForgot(false); setResetMsg(null); setResetEmail(''); setResetNewPw(''); setResetConfirm(''); }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0a0c12 0%, #0f1117 50%, #0a0d18 100%)' }}>
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-purple-600/8 rounded-full blur-3xl" />
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#13161f', border: '1px solid #1e2433' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-indigo-400" />
                <h2 className="font-display font-bold text-white">Reset Admin Password</h2>
              </div>
              <button onClick={() => { setShowForgot(false); setResetMsg(null); }} className="text-gray-600 hover:text-gray-400 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Admin Email</label>
                <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  style={{ background: '#0f1117', border: '1px solid #2a3040' }}
                  placeholder="admin@testfree.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">New Password</label>
                <input type="password" value={resetNewPw} onChange={e => setResetNewPw(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  style={{ background: '#0f1117', border: '1px solid #2a3040' }}
                  placeholder="Min 6 characters" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Confirm New Password</label>
                <input type="password" value={resetConfirm} onChange={e => setResetConfirm(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  style={{ background: '#0f1117', border: '1px solid #2a3040' }}
                  placeholder="Repeat new password" />
              </div>
              {resetMsg && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${resetMsg.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                  {resetMsg.type === 'success' ? <CheckCircle size={13} /> : <X size={13} />}
                  {resetMsg.text}
                </div>
              )}
              <button onClick={handleResetPassword}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2">
                <KeyRound size={14} /> Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-indigo-500/30">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="font-display font-black text-2xl tracking-tight"><span className="text-indigo-400">Test</span><span className="text-purple-400">Free</span> <span className="text-white font-medium text-xl">Admin</span></h1>
          <p className="text-gray-500 text-sm mt-1">Secure administrator access</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6" style={{ background: '#13161f', border: '1px solid #1e2433' }}>
          {/* Demo hint */}
          <div className="rounded-xl px-4 py-3 mb-5 flex items-start gap-2" style={{ background: '#1a2040', border: '1px solid #2a3860' }}>
            <Lock size={14} className="text-indigo-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-indigo-300">Demo Credentials</p>
              <p className="text-xs text-gray-400 mt-0.5">admin@testfree.com / admin123</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  style={{ background: '#0f1117', border: '1px solid #2a3040' }}
                  placeholder="admin@testfree.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-gray-400">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  style={{ background: '#0f1117', border: '1px solid #2a3040' }}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 bg-red-500/10 border border-red-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
              ) : (
                <><Shield size={15} /> Sign In to Admin Panel</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Protected by TestFree Security • Admin access only
        </p>
      </div>
    </div>
  );
}
