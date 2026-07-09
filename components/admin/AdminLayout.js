import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getSession, clearSession } from '../../lib/store';
import {
  LayoutDashboard, Users, BookOpen, FileText, MessageSquare,
  Bell, BarChart2, Shield, LogOut, Menu, X, Brain, Activity,
  ChevronRight, ExternalLink, BookMarked, Wifi, Briefcase
} from 'lucide-react';

const NAV = [
  { href: '/admin2', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin2/jobs', label: '💼 Naukri Manager', icon: Briefcase },
  { href: '/admin2/users', label: 'User Management', icon: Users },
  { href: '/admin2/quizzes', label: 'Quiz Management', icon: BookOpen },
  { href: '/admin2/pdfs', label: 'PDF Library', icon: FileText },
  { href: '/admin2/chat', label: 'Chat Moderation', icon: MessageSquare },
  { href: '/admin2/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin2/results', label: 'Results & Analytics', icon: BarChart2 },
  { href: '/admin2/logs', label: 'Activity Logs', icon: Activity },
];

export default function AdminLayout({ children, title = 'Admin Panel' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== 'admin') { router.push('/admin2/login'); return; }
    setSession(s);
    setOnlineCount(Math.floor(Math.random() * 80) + 15);
    const interval = setInterval(() => setOnlineCount(Math.floor(Math.random() * 80) + 15), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push('/admin2/login');
  };

  const isActive = (href, exact) => {
    if (exact) return router.pathname === href;
    return router.pathname.startsWith(href);
  };

  const BG = '#0f1117';
  const SIDEBAR = '#13161f';
  const BORDER = '#1e2433';

  return (
    <div className="min-h-screen flex" style={{ background: BG, color: '#e2e8f0' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/70 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto flex-shrink-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: SIDEBAR, borderRight: `1px solid ${BORDER}` }}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b" style={{ borderColor: BORDER }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
              <span className="text-white font-black text-base leading-none">T</span>
            </div>
            <div>
              <div className="font-display font-black text-base leading-tight tracking-tight">
                <span className="text-indigo-400">Test</span><span className="text-purple-400">Free</span>
              </div>
              <div className="text-xs text-indigo-400 font-semibold">Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Live badge */}
        <div className="mx-4 mt-3 px-3 py-2 rounded-xl flex items-center gap-2" style={{ background: '#0f1117', border: `1px solid ${BORDER}` }}>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
          <span className="text-xs text-green-400 font-medium">{onlineCount} students online</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV.map(item => {
            const active = isActive(item.href, item.exact);
            return (
              <Link key={item.href} href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                  ${active
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'}`}>
                <item.icon size={16} className={active ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'} />
                {item.label}
                {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
              </Link>
            );
          })}

          <div className="pt-3 mt-3 border-t" style={{ borderColor: BORDER }}>
            <Link href="/admin2/pdf-upload-ai"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all">
              <Brain size={16} />
              AI PDF Extractor
              <span className="ml-auto text-xs bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full font-semibold">AI</span>
            </Link>
            <Link href="/" target="_blank"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all mt-0.5">
              <ExternalLink size={16} />
              View Website
            </Link>
          </div>
        </nav>

        {/* User footer */}
        {session && (
          <div className="px-4 pb-4 pt-2 border-t" style={{ borderColor: BORDER }}>
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {session.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">{session.name}</p>
                <p className="text-xs text-indigo-400 font-medium">Admin</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all">
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Top bar */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 flex-shrink-0" style={{ background: SIDEBAR, borderBottom: `1px solid ${BORDER}` }}>
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-white transition-colors flex-shrink-0" style={{ background: '#1e2433' }}>
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <h1 className="font-display font-semibold text-gray-100 truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-xs text-gray-600 hidden sm:block">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
            <div className="w-px h-4 hidden sm:block" style={{ background: BORDER }} />
            <Link href="/admin2/notifications"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors flex-shrink-0" style={{ background: '#1e2433' }}>
              <Bell size={16} />
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-6 w-full max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
