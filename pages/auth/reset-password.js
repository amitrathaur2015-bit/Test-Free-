import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { BookOpen, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supabase) { setChecked(true); return; }
    supabase.auth.getSession().then(({ data }) => {
      if (data && data.session) setReady(true);
      setChecked(true);
    });
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') { setReady(true); setChecked(true); }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const handleSubmit = async () => {
    setError('');
    if (pw.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (pw !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);
    if (err) { setError('Could not update password. Please request a new link.'); return; }
    setDone(true);
    try { await supabase.auth.signOut(); } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <BookOpen size={20} className="text-white" />
            </div>
            <span className="font-display font-bold text-2xl text-gray-900">Test<span className="text-indigo-600">Free</span></span>
          </Link>
        </div>

        <div className="card shadow-xl border-0">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle size={52} className="mx-auto text-green-500 mb-4" />
              <h2 className="font-display font-bold text-xl text-gray-900 mb-2">Password updated</h2>
              <p className="text-gray-500 text-sm mb-6">You can now sign in with your new password.</p>
              <Link href="/auth/login" className="btn-primary inline-flex items-center gap-2">Go to Login</Link>
            </div>
          ) : !checked ? (
            <p className="text-center text-gray-500 text-sm py-6">Loading...</p>
          ) : !ready ? (
            <div className="text-center py-4">
              <p className="text-gray-600 text-sm mb-4">This reset link is invalid or has expired.</p>
              <Link href="/auth/forgot-password" className="btn-primary inline-flex items-center gap-2">Request a new link</Link>
            </div>
          ) : (
            <>
              <h1 className="font-display font-bold text-xl text-gray-900 mb-5">Set a new password</h1>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">{error}</div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="label">New password</label>
                  <input type="password" className="input-field" placeholder="Min 8 characters"
                    value={pw} onChange={e => setPw(e.target.value)} />
                </div>
                <div>
                  <label className="label">Confirm new password</label>
                  <input type="password" className="input-field" placeholder="Repeat password"
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                </div>
                <button onClick={handleSubmit} disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 !py-3">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Update Password'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
