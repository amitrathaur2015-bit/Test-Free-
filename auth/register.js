import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { registerUser, setSession } from '../../lib/store';
import { BookOpen, Eye, EyeOff, UserPlus, Check } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    setError('');
    if (!form.name || !form.email || !form.password) { setError('Please fill in all fields.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const user = registerUser(form.name, form.email, form.password);
    setLoading(false);
    if (!user) { setError('An account with this email already exists.'); return; }
    setSession(user);
    router.push('/dashboard');
  };

  const perks = ['Free quizzes across 8+ topics', 'Track your scores & progress', 'Dashboard with activity history'];

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
          <p className="text-gray-500 mt-2 text-sm">Create your free account</p>
        </div>

        <div className="card shadow-xl border-0">
          <h1 className="font-display font-bold text-xl text-gray-900 mb-2">Join TestFree</h1>
          <ul className="space-y-1 mb-5">
            {perks.map(p => (
              <li key={p} className="flex items-center gap-2 text-sm text-gray-500">
                <Check size={14} className="text-green-500 shrink-0" />{p}
              </li>
            ))}
          </ul>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input type="text" className="input-field" placeholder="Your name"
                value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <label className="label">Email address</label>
              <input type="email" className="input-field" placeholder="you@example.com"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input-field pr-12"
                  placeholder="Min 6 characters" value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input type="password" className="input-field" placeholder="Repeat password"
                value={form.confirm} onChange={e => setForm({...form, confirm: e.target.value})}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
            <button onClick={handleSubmit} disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 !py-3">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><UserPlus size={16} /> Create Account</>
              )}
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
        <p className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
