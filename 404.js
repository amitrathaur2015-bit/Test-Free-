import Link from 'next/link';
import { useRouter } from 'next/router';
import { BookOpen, Home, ArrowLeft, Search, Trophy, BarChart2 } from 'lucide-react';

export default function Custom404() {
  const router = useRouter();

  const quickLinks = [
    { href: '/', icon: Home, label: 'Home', desc: 'Browse quizzes' },
    { href: '/topics', icon: BookOpen, label: 'Topics', desc: 'All subjects' },
    { href: '/leaderboard', icon: Trophy, label: 'Leaderboard', desc: 'Top students' },
    { href: '/dashboard', icon: BarChart2, label: 'Dashboard', desc: 'Your stats' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 flex flex-col items-center justify-center px-4">

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-12">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
          <span className="text-white font-black text-lg leading-none">T</span>
        </div>
        <span className="font-display font-black text-2xl tracking-tight">
          <span className="text-indigo-600">Test</span><span className="text-purple-600">Free</span>
        </span>
      </Link>

      {/* 404 illustration */}
      <div className="text-center mb-8">
        <div className="relative inline-block mb-6">
          <div className="text-[120px] font-display font-black text-indigo-100 leading-none select-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl">
              <Search size={36} className="text-white" />
            </div>
          </div>
        </div>

        <h1 className="font-display font-bold text-2xl text-gray-900 mb-2">
          Page Not Found
        </h1>
        <p className="text-gray-500 text-base max-w-sm mx-auto">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 w-full max-w-lg">
        {quickLinks.map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <Icon size={18} className="text-indigo-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900">{label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all"
      >
        <ArrowLeft size={15} /> Go Back
      </button>

      <p className="text-xs text-gray-400 mt-8">
        TestFree • Free Quiz Platform
      </p>
    </div>
  );
}
