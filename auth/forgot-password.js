import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Mail, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setSent(true);
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
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle size={52} className="mx-auto text-green-500 mb-4" />
              <h2 className="font-display font-bold text-xl text-gray-900 mb-2">Check your inbox</h2>
              <p className="text-gray-500 text-sm mb-6">We've sent reset instructions to <strong>{email}</strong></p>
              <Link href="/auth/login" className="btn-primary inline-flex items-center gap-2">
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
                  <Mail size={22} className="text-indigo-600" />
                </div>
                <h1 className="font-display font-bold text-xl text-gray-900 mb-1">Forgot password?</h1>
                <p className="text-gray-500 text-sm">Enter your email and we'll send reset instructions.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <input type="email" className="input-field" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
                </div>
                <button onClick={handleSubmit} disabled={loading || !email}
                  className="btn-primary w-full flex items-center justify-center gap-2 !py-3">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Send Reset Link'}
                </button>
              </div>
              <p className="text-center text-sm text-gray-500 mt-5">
                Remember it?{' '}
                <Link href="/auth/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
