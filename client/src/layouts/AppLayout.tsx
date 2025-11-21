
import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { Ghost, Search, MessageCircle, Bell, CalendarHeart, User, MessageSquarePlus } from 'lucide-react';
import { APP_NAME } from '../constants';
import { VideoCall } from '../components/VideoCall';
import { CallType } from '../types';
import { dataService } from '../services/data';

export const AppLayout: React.FC = () => {
  const { currentUser } = useAuth();
  const { isCallActive, callType, remoteName, endCall } = useCall();
  const location = useLocation();
  const navigate = useNavigate();
  
  // We can get some realtime data stats for badges here
  const notifications = dataService.getNotifications();
  const matches = dataService.getMatches();
  const unreadNotifs = notifications.filter(n => !n.read).length;

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/home', icon: Search, label: 'Discover' },
    { path: '/matches', icon: MessageCircle, label: 'Messages', badge: matches.length > 0 ? matches.length : undefined },
    { path: '/notifications', icon: Bell, label: 'Notifications', isPulse: unreadNotifs > 0 },
    { path: '/confessions', icon: MessageSquarePlus, label: 'Confessions' },
    { path: '/virtual-date', icon: CalendarHeart, label: 'Virtual Date' },
    { path: '/profile', icon: User, label: 'My Profile' },
  ];

  return (
    <div className="flex h-screen bg-black text-white font-sans overflow-hidden selection:bg-neon selection:text-white">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col border-r border-gray-900 bg-black z-20 relative">
        <div className="p-8">
           <h1 className="text-2xl font-black text-white tracking-tighter flex items-center gap-2 uppercase cursor-pointer" onClick={() => navigate('/home')}>
            <span>Other</span>
            <span className="text-neon">Half</span>
            <Ghost className="w-6 h-6 text-neon" />
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
           {navItems.map((item) => (
             <button 
               key={item.path}
               onClick={() => navigate(item.path)}
               className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 group ${
                 isActive(item.path) ? 'bg-neon/10 text-neon border border-neon/20' : 'text-gray-400 hover:bg-gray-900 hover:text-white'
               }`}
             >
               <item.icon className="w-5 h-5" />
               <span className="font-bold tracking-wide text-sm">{item.label}</span>
               {item.badge && <span className="ml-auto bg-gray-800 text-white text-xs px-2 py-0.5 rounded-full">{item.badge}</span>}
               {item.isPulse && <div className="ml-auto w-2 h-2 rounded-full bg-neon animate-pulse" />}
               {isActive(item.path) && !item.badge && !item.isPulse && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-neon shadow-neon-sm" />}
             </button>
           ))}
        </nav>

        <div className="p-6 border-t border-gray-900">
           <div className="flex items-center gap-3 px-4 py-3 bg-gray-900/50 rounded-xl border border-gray-800">
              <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-gray-800 border border-gray-700">
                 {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                 ) : (
                    <span className="text-white text-xs font-bold">{currentUser?.anonymousId.slice(-2)}</span>
                 )}
              </div>
              <div className="flex-1 overflow-hidden">
                 <p className="text-sm font-bold text-white truncate">{currentUser?.realName}</p>
                 <p className="text-xs text-gray-500">Online</p>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-[#050505]">
        <div className="flex-1 overflow-hidden relative w-full h-full">
          <Outlet />
        </div>

        {/* Mobile Bottom Nav */}
        {!location.pathname.includes('/chat/') && (
          <nav className="md:hidden h-20 bg-black/90 backdrop-blur border-t border-gray-900 flex justify-around items-center px-2 z-40 fixed bottom-0 left-0 right-0 pb-safe">
            <button onClick={() => navigate('/home')} className={`p-2 flex flex-col items-center gap-1 ${isActive('/home') ? 'text-neon' : 'text-gray-600'}`}>
              <div className={`p-1 rounded-xl ${isActive('/home') ? 'bg-neon/10' : ''}`}>
                <Search className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold tracking-wider">DISCOVER</span>
            </button>

            <button onClick={() => navigate('/matches')} className={`p-2 flex flex-col items-center gap-1 ${isActive('/matches') ? 'text-neon' : 'text-gray-600'}`}>
              <div className={`p-1 rounded-xl ${isActive('/matches') ? 'bg-neon/10' : ''}`}>
                <MessageCircle className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold tracking-wider">CHATS</span>
            </button>

            {/* Confessions replaced Notifications here */}
            <button onClick={() => navigate('/confessions')} className={`p-2 flex flex-col items-center gap-1 ${isActive('/confessions') ? 'text-neon' : 'text-gray-600'}`}>
              <div className={`p-1 rounded-xl ${isActive('/confessions') ? 'bg-neon/10' : ''}`}>
                <MessageSquarePlus className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold tracking-wider">CONFESS</span>
            </button>

            <button onClick={() => navigate('/virtual-date')} className={`p-2 flex flex-col items-center gap-1 ${isActive('/virtual-date') ? 'text-neon' : 'text-gray-600'}`}>
              <div className={`p-1 rounded-xl ${isActive('/virtual-date') ? 'bg-neon/10' : ''}`}>
                <CalendarHeart className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold tracking-wider">DATE</span>
            </button>

            <button onClick={() => navigate('/profile')} className={`p-2 flex flex-col items-center gap-1 ${isActive('/profile') ? 'text-neon' : 'text-gray-600'}`}>
              <div className={`p-1 rounded-xl ${isActive('/profile') ? 'bg-neon/10' : ''}`}>
                <User className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold tracking-wider">ME</span>
            </button>
          </nav>
        )}
      </main>

      {/* Global Video Call Overlay */}
      <VideoCall 
        isActive={isCallActive} 
        onEndCall={endCall} 
        remoteName={remoteName}
        isVideo={callType === CallType.VIDEO}
      />
    </div>
  );
};
