import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { getSession, clearSession, getNotifications, getLiveOnlineCount } from '../../lib/store';
import { Menu, X, LogOut, Shield, Bell, MessageCircle, Briefcase, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const [session, setSession] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const notifRef = useRef(null);
  const moreRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const s = getSession();
    setSession(s);
    if (s) setNotifs(getNotifications(s.id));
    setOnlineCount(getLiveOnlineCount());
    const interval = setInterval(() => setOnlineCount(getLiveOnlineCount()), 20000);
    return () => clearInterval(interval);
  }, [router.pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
      if (moreRef.current && !moreRef.current.contains(e.target)) setShowMore(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    clearSession();
    setSession(null);
    router.push('/');
    setMenuOpen(false);
  };

  const isActive = (path) => router.pathname === path || router.pathname.startsWith(path + '/');

  const navLink = "px-3 py-2 text-sm font-medium rounded-lg transition-all";
  const activeClass = "text-indigo-600 bg-indigo-50";
  const inactiveClass = "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50";

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-14 gap-1">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mr-3 group flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow group-hover:shadow-md transition-all">
              <span className="text-white font-black text-sm leading-none">T</span>
            </div>
            <span className="font-black text-lg tracking-tight">
              <span className="text-indigo-600">Test</span><span className="text-purple-600">Free</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-0.5 flex-1">
            <Link href="/" className={`${navLink} ${isActive('/') && router.pathname === '/' ? activeClass : inactiveClass}`}>
              Home
            </Link>
            <Link href="/jobs" className={`${navLink} ${isActive('/jobs') ? activeClass : inactiveClass} flex items-center gap-1`}>
              <Briefcase size={13} /> Naukri
            </Link>
            <Link href="/topics" className={`${navLink} ${isActive('/topics') ? activeClass : inactiveClass}`}>
              Topics
            </Link>
            <Link href="/leaderboard" className={`${navLink} ${isActive('/leaderboard') ? activeClass : inactiveClass}`}>
              🏆 Rank
            </Link>
            <Link href="/community" className={`${navLink} ${isActive('/community') ? activeClass : inactiveClass} flex items-center gap-1`}>
              <MessageCircle size={13} /> Community
            </Link>

            {session && (
              <>
                <Link href="/dashboard" className={`${navLink} ${isActive('/dashboard') ? activeClass : inactiveClass}`}>
                  Dashboard
                </Link>

                {/* More dropdown */}
                <div className="relative" ref={moreRef}>
                  <button
                    onClick={() => setShowMore(!showMore)}
                    className={`${navLink} ${inactiveClass} flex items-center gap-1`}
                  >
                    More <ChevronDown size={13} className={`transition-transform ${showMore ? 'rotate-180' : ''}`} />
                  </button>
                  {showMore && (
                    <div className="absolute left-0 top-10 w-44 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                      <Link href="/analytics" onClick={() => setShowMore(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                        📊 Analytics
                      </Link>
                      <Link href="/history" onClick={() => setShowMore(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                        🕐 Quiz History
                      </Link>
                      <Link href="/profile" onClick={() => setShowMore(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors">
                        👤 Profile
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2 ml-auto">
            {/* Online badge */}
            <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              {onlineCount} online
            </div>

            {session ? (
              <>
                {/* Admin Panel Button - always visible for admin */}
                {session.role === 'admin' && (
                  <Link href="/admin2"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors">
                    <Shield size={13} /> Admin Panel
                  </Link>
                )}

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                  <button onClick={() => setShowNotifs(!showNotifs)}
                    className="relative p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                    <Bell size={16} />
                    {notifs.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                        {notifs.length}
                      </span>
                    )}
                  </button>
                  {showNotifs && (
                    <div className="absolute right-0 top-10 w-72 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <span className="font-semibold text-sm text-gray-900">Notifications</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{notifs.length} new</span>
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        {notifs.map(n => (
                          <div key={n.id} className="px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                            <p className="text-sm text-gray-800">{n.msg}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* User avatar */}
                <Link href="/profile"
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                    {session.avatar}
                  </div>
                  <span className="text-sm font-medium max-w-20 truncate">{session.name.split(' ')[0]}</span>
                </Link>

                <button onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Logout">
                  <LogOut size={15} />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login"
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  Login
                </Link>
                <Link href="/auth/register"
                  className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors ml-auto">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-2 space-y-0.5">
            <Link href="/" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all">
              🏠 Home
            </Link>
            <Link href="/jobs" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all">
              💼 Naukri
            </Link>
            <Link href="/topics" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all">
              📚 Topics
            </Link>
            <Link href="/leaderboard" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all">
              🏆 Leaderboard
            </Link>
            <Link href="/community" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all">
              💬 Community
            </Link>

            {session ? (
              <>
                <div className="h-px bg-gray-100 my-1" />
                <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all">
                  📊 Dashboard
                </Link>
                <Link href="/analytics" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all">
                  📈 Analytics
                </Link>
                <Link href="/history" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all">
                  🕐 Quiz History
                </Link>
                <Link href="/profile" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all">
                  👤 Profile
                </Link>
                {session.role === 'admin' && (
                  <>
                    <div className="h-px bg-gray-100 my-1" />
                    <Link href="/admin2" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all">
                      🛡️ Admin Panel
                    </Link>
                  </>
                )}
                <div className="h-px bg-gray-100 my-1" />
                <button onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all">
                  🚪 Logout
                </button>
              </>
            ) : (
              <>
                <div className="h-px bg-gray-100 my-1" />
                <Link href="/auth/login" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 rounded-lg transition-all">
                  Login
                </Link>
                <Link href="/auth/register" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                  Sign Up Free
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
