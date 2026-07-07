import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/layout/Navbar';
import { getSession, getDB } from '../../lib/store';
import { getRooms, getRoomMessages, sendRoomMessage, getOnlineUsers, setUserOnline, getPrivateChat, sendPrivateMessage } from '../../lib/store-extended';
import { MessageCircle, Users, Hash, Send, HelpCircle, Search, Circle, Bell, Smile, X, Lock, ChevronRight, MessageSquare, Wifi } from 'lucide-react';

const EMOJI_LIST = ['👍','🎉','🔥','💯','❓','✅','📚','🤔','😊','👏','🙌','💡'];

function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function Community() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState('general');
  const [privateTarget, setPrivateTarget] = useState(null); // user obj for DM
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isDoubt, setIsDoubt] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [showOnline, setShowOnline] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState({});
  const [dmSearch, setDmSearch] = useState('');
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const inputRef = useRef(null);
  const [notification, setNotification] = useState(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const loadMessages = useCallback(() => {
    if (privateTarget) {
      const msgs = getPrivateChat(session?.id, privateTarget.id);
      setMessages(msgs);
    } else {
      const msgs = getRoomMessages(activeRoom);
      setMessages(msgs);
    }
  }, [activeRoom, privateTarget, session]);

  const loadOnline = useCallback(() => {
    const users = getOnlineUsers();
    setOnlineUsers(users);
  }, []);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.push('/auth/login'); return; }
    setSession(s);
    setRooms(getRooms());
    setUserOnline(s.id, s.name, s.avatar);
    const db = getDB();
    setAllUsers(db.users.filter(u => u.id !== s.id && u.role !== 'admin'));
    const heartbeat = setInterval(() => setUserOnline(s.id, s.name, s.avatar), 30000);
    return () => clearInterval(heartbeat);
  }, []);

  useEffect(() => {
    if (!session) return;
    loadMessages();
    loadOnline();
    pollRef.current = setInterval(() => {
      loadMessages();
      loadOnline();
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [loadMessages, loadOnline, session]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !session || sending) return;
    setSending(true);
    const text = input.trim();
    setInput('');

    if (privateTarget) {
      sendPrivateMessage(session.id, session.name, session.avatar, privateTarget.id, text);
    } else {
      sendRoomMessage(activeRoom, session.id, session.name, session.avatar, text, isDoubt);
      if (isDoubt) setIsDoubt(false);
    }
    loadMessages();
    setSending(false);
    setTimeout(scrollToBottom, 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const switchRoom = (roomId) => {
    setActiveRoom(roomId);
    setPrivateTarget(null);
    setSearch('');
  };

  const openDM = (user) => {
    setPrivateTarget(user);
    setActiveRoom(null);
  };

  const filteredMessages = search
    ? messages.filter(m => m.text.toLowerCase().includes(search.toLowerCase()) || m.userName.toLowerCase().includes(search.toLowerCase()))
    : messages;

  const currentRoomInfo = privateTarget
    ? { name: `DM: ${privateTarget.name}`, icon: '💬', description: 'Private conversation' }
    : rooms.find(r => r.id === activeRoom);

  const isOnline = (userId) => onlineUsers.some(u => u.userId === userId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Notification toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 bg-indigo-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-bounce">
          <Bell size={15} /> {notification}
        </div>
      )}

      <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 py-4 gap-4" style={{ height: 'calc(100vh - 80px)' }}>

        {/* Left Sidebar */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-3">

          {/* Rooms */}
          <div className="card flex-1 p-0 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-display font-bold text-sm text-gray-900 flex items-center gap-2">
                <MessageCircle size={15} className="text-indigo-500" /> Topic Rooms
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {rooms.map(room => {
                const msgs = getRoomMessages(room.id);
                const lastMsg = msgs[msgs.length - 1];
                const isActive = activeRoom === room.id && !privateTarget;
                return (
                  <button key={room.id} onClick={() => switchRoom(room.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 transition-colors flex items-start gap-3 hover:bg-indigo-50 group
                      ${isActive ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''}`}>
                    <span className="text-lg shrink-0">{room.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${isActive ? 'text-indigo-700' : 'text-gray-800'}`}>{room.name}</span>
                        {room.pinned && <span className="text-xs text-indigo-400">📌</span>}
                      </div>
                      {lastMsg && <p className="text-xs text-gray-400 truncate mt-0.5">{lastMsg.userName}: {lastMsg.text}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Messages */}
          <div className="card p-0 overflow-hidden" style={{ maxHeight: '260px' }}>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-display font-bold text-xs text-gray-900 flex items-center gap-1.5">
                <Lock size={13} className="text-indigo-500" /> Direct Messages
              </h2>
            </div>
            <div className="px-3 py-2 border-b border-gray-50">
              <input value={dmSearch} onChange={e => setDmSearch(e.target.value)}
                className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-300"
                placeholder="Search users..." />
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: '160px' }}>
              {allUsers.filter(u => !dmSearch || u.name.toLowerCase().includes(dmSearch.toLowerCase())).map(user => (
                <button key={user.id} onClick={() => openDM(user)}
                  className={`w-full text-left px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-indigo-50 transition-colors flex items-center gap-2.5
                    ${privateTarget?.id === user.id ? 'bg-indigo-50' : ''}`}>
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">{user.avatar}</div>
                    {isOnline(user.id) && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{user.name}</p>
                    <p className="text-xs text-gray-400">{isOnline(user.id) ? 'Online' : 'Offline'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="card flex-1 flex flex-col p-0 overflow-hidden">

            {/* Chat Header */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <span className="text-xl">{currentRoomInfo?.icon || '💬'}</span>
                <div>
                  <h2 className="font-display font-bold text-base text-gray-900">{currentRoomInfo?.name}</h2>
                  <p className="text-xs text-gray-400">{currentRoomInfo?.description}</p>
                </div>
                {privateTarget && isOnline(privateTarget.id) && (
                  <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Online
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Search messages */}
                <div className="relative">
                  <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    className="pl-7 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-indigo-300 w-32"
                    placeholder="Search..." />
                </div>
                <button onClick={() => setShowOnline(!showOnline)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700 font-semibold">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  {onlineUsers.length} online
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1" style={{ minHeight: 0 }}>
              {filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MessageSquare size={40} className="mb-3 opacity-30" />
                  <p className="font-medium">{search ? 'No messages match your search' : 'No messages yet'}</p>
                  <p className="text-sm mt-1">{search ? '' : 'Be the first to say something!'}</p>
                </div>
              ) : (
                filteredMessages.map((m, i) => {
                  const isMe = m.userId === session?.id;
                  const showAvatar = i === 0 || filteredMessages[i - 1].userId !== m.userId;
                  return (
                    <div key={m.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''} ${showAvatar ? 'mt-4' : 'mt-0.5'}`}>
                      {showAvatar && !isMe ? (
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {m.avatar}
                        </div>
                      ) : !isMe ? <div className="w-8 shrink-0" /> : null}

                      <div className={`max-w-xs lg:max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                        {showAvatar && !isMe && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-gray-700">{m.userName}</span>
                            {m.isDoubt && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">❓ Doubt</span>}
                          </div>
                        )}
                        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
                          ${isMe
                            ? 'bg-indigo-600 text-white rounded-br-md'
                            : m.isDoubt
                              ? 'bg-amber-50 text-gray-900 border border-amber-200 rounded-bl-md'
                              : 'bg-white text-gray-900 border border-gray-100 rounded-bl-md shadow-sm'}`}>
                          {m.text}
                        </div>
                        <span className="text-xs text-gray-400 mt-1 px-1">{formatTime(m.ts)}</span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="border-t border-gray-100 px-4 py-3 bg-white">
              {!privateTarget && (
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => setIsDoubt(!isDoubt)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all
                      ${isDoubt ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-gray-100 text-gray-500 hover:bg-amber-50'}`}>
                    <HelpCircle size={12} /> {isDoubt ? 'Posting as Doubt ✓' : 'Mark as Doubt?'}
                  </button>
                  <span className="text-xs text-gray-400">Tag your message as a doubt for faster help</span>
                </div>
              )}
              <div className="flex items-end gap-2">
                <div className="flex-1 border border-gray-200 rounded-2xl overflow-hidden focus-within:border-indigo-400 transition-colors bg-white">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder={privateTarget ? `Message ${privateTarget.name}...` : `Message ${currentRoomInfo?.name || ''}...`}
                    className="w-full px-4 py-2.5 text-sm focus:outline-none resize-none leading-relaxed"
                    style={{ maxHeight: '120px', overflowY: 'auto' }}
                  />
                  {/* Emoji picker */}
                  <div className="flex items-center gap-1 px-3 pb-2">
                    <div className="relative">
                      <button onClick={() => setShowEmoji(!showEmoji)} className="text-gray-400 hover:text-indigo-500 transition-colors">
                        <Smile size={16} />
                      </button>
                      {showEmoji && (
                        <div className="absolute bottom-8 left-0 bg-white border border-gray-200 rounded-xl shadow-xl p-2 flex flex-wrap gap-1 w-48 z-50">
                          {EMOJI_LIST.map(e => (
                            <button key={e} onClick={() => { setInput(i => i + e); setShowEmoji(false); inputRef.current?.focus(); }}
                              className="text-lg hover:bg-gray-100 rounded-lg p-1 transition-colors">{e}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={sendMessage} disabled={!input.trim() || sending}
                  className="w-10 h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all flex-shrink-0">
                  <Send size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5 px-1">Enter to send • Shift+Enter for new line</p>
            </div>
          </div>
        </div>

        {/* Right Sidebar — Online Users */}
        <div className="w-52 flex-shrink-0 hidden lg:flex flex-col gap-3">
          <div className="card flex-1 p-0 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <h2 className="font-display font-bold text-xs text-gray-900">Online Now ({onlineUsers.length})</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {onlineUsers.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No users online</p>
              ) : (
                onlineUsers.map(u => (
                  <div key={u.userId} className="flex items-center gap-2.5 px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <div className="relative">
                      <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">{u.avatar}</div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{u.userName === session?.name ? 'You' : u.userName}</p>
                      <p className="text-xs text-green-600">Active</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Doubt Zone quick stats */}
            <div className="border-t border-gray-100 px-4 py-3 bg-amber-50">
              <p className="text-xs font-semibold text-amber-800 mb-1.5 flex items-center gap-1">
                <HelpCircle size={12} /> Doubt Zone
              </p>
              {(() => {
                const doubts = getRoomMessages('doubts').filter(m => m.isDoubt);
                return <p className="text-xs text-amber-600">{doubts.length} doubt{doubts.length !== 1 ? 's' : ''} posted</p>;
              })()}
              <button onClick={() => switchRoom('doubts')} className="mt-2 text-xs text-amber-700 font-semibold hover:underline">
                Go to Doubt Zone →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
