import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { setSession } from '../../lib/store';
import { supabase } from '../../lib/supabase';
import { Shield, Eye, EyeOff, Lock, Mail, KeyRound, CheckCircle, X } from 'lucide-react';

const ADMIN_EMAIL = 'amitrathaur2015@gmail.com';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetNewPw, setResetNewPw] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetMsg, setResetMsg] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecovering(true);
        setShowForgot(true);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!supabase) { setError('Supabase connection missing.'); setLoading(false); return; }
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (err || !data?.user) { setError('Invalid email or password'); setLoading(false); return; }
    if (data.user.email !== ADMIN_EMAIL) {
      await supabase.auth.signOut();
      setError('Access denied. Admins only.');
      setLoading(false);
      return;
    }
    setSession({ id: 1, name: 'Admin', email: data.user.email, role: 'admin', avatar: 'A' });
    router.push('/admin2');
  };

  const handleSendReset = async () => {
    if (!resetEmail) { setResetMsg({ type: 'error', text: 'Please enter your email.' }); return; }
    if (!supabase) { setResetMsg({ type: 'error', text: 'Supabase connection missing.' }); return; }
    const { error: err } = await supabase.auth.resetPasswordForEmail(resetEmail.trim().toLowerCase(), {
      redirectTo: window.location.origin + '/admin2/login',
    });
    if (err) { setResetMsg({ type: 'error', text: 'Could not send reset email. Try again later.' }); return; }
    setResetMsg({ type: 'success', text: 'If this email exists, a reset link has been sent.' });
  };

  const handleSetNewPassword = async () => {
    if (!resetNewPw || !resetConfirm) { setResetMsg({ type: 'error', text: 'Please fill in all fields.' }); return; }
    if (resetNewPw.length < 8) { setResetMsg({ type: 'error', text: 'Password must be at least 8 characters.' }); return; }
    if (resetNewPw !== resetConfirm) { setResetMsg({ type: 'error', text: 'Passwords do not match.' }); return; }
    const { error: err } = await supabase.auth.updateUser({ password: resetNewPw });
    if (err) { setResetMsg({ type: 'error', text: 'Could not update password. Try again.' }); return; }
    setResetMsg({ type: 'success', text: 'Password updated! You can now log in.' });
    setTimeout(() => {
      setShowForgot(false); setRecovering(false); setResetMsg(null);
      setResetNewPw(''); setResetConfirm('');
    }, 2000);
  };

  const closeForgot = () => {
    setShowForgot(false); setRecovering(false); setResetMsg(null);
  };

  const inputStyle = { background: '#0f1117', border: '1px solid #2a3040' };
  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50';

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0a0c12 0%, #0f1117 50%, #0a0d18 100%)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-purple-600/8 rounded-full blur-3xl" />
      </div>

      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#13161f', border: '1px solid #1e2433' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-indigo-400" />
                <h2 className="font-display font-bold text-white">{recovering ? 'Set New Password' : 'Reset Admin Password'}</h2>
              </div>
              <button onClick={closeForgot} className="text-gray-600 hover:text-gray-400 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              {recovering ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">New Password</label>
                    <input type="password" value={resetNewPw} onChange={e => setResetNewPw(e.target.value)}
                      className={inputCls} style={inputStyle} placeholder="Min 8 characters" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Confirm New Password</label>
                    <input type="password" value={resetConfirm} onChange={e => setResetConfirm(e.target.value)}
                      className={inputCls} style={inputStyle} placeholder="Repeat new password" />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Admin Email</label>
                  <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)}
                    className={inputCls} style={inputStyle} placeholder="your admin email" />
                </div>
              )}
              {resetMsg && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium ${resetMsg.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                  {resetMsg.type === 'success' ? <CheckCircle size={13} /> : <X size={13} />}
                  {resetMsg.text}
                </div>
              )}
              <button onClick={recovering ? handleSetNewPassword : handleSendReset}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2">
                <KeyRound size={14} /> {recovering ? 'Update Password' : 'Send Reset Link'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-indigo-500/30">
            <Shield size={32} className="text-white" />
          </div>
          <h1 className="font-display font-black text-2xl tracking-tight"><span className="text-indigo-400">Test</span><span className="text-purple-400">Free</span> <span className="text-white font-medium text-xl">Admin</span></h1>
          <p className="text-gray-500 text-sm mt-1">Secure administrator access</p>
        </div>

        <div className="rounded-2xl p-6" style={{ background: '#13161f', border: '1px solid #1e2433' }}>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  style={inputStyle}
                  placeholder="Admin email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-gray-400">Password</label>
                <button type="button" onClick={() => setShowForgot(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  style={inputStyle}
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
