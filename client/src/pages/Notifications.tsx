
import React, { useEffect, useState } from 'react';
import { Notification } from '../types';
import { dataService } from '../services/data';
import { Bell, Heart, MessageCircle, Zap } from 'lucide-react';

export const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    setNotifications(dataService.getNotifications());
  }, []);

  const markAllRead = () => {
    dataService.markNotificationsRead();
    setNotifications(dataService.getNotifications());
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="h-full flex flex-col">
        <div className="p-6 border-b border-gray-900 flex items-center justify-between">
          <h2 className="text-3xl font-black flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-neon text-white text-xs rounded-full px-2 py-0.5 animate-pulse font-mono">{unreadCount}</span>
            )}
          </h2>
          <button 
            onClick={markAllRead}
            className="text-xs text-neon hover:text-white transition-colors uppercase font-bold tracking-wider border border-neon/30 hover:bg-neon hover:border-neon px-3 py-1 rounded-full"
          >
            Mark all read
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 pb-24 md:pb-4">
          {notifications.length === 0 ? (
            <div className="text-center py-20 text-gray-600">
              <Bell className="w-16 h-16 mx-auto mb-6 opacity-20" />
              <p>All caught up!</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div 
                key={notif.id}
                className={`p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                  notif.read 
                    ? 'bg-gray-900/30 border-gray-800/50' 
                    : 'bg-gray-900 border-neon/50 shadow-[0_0_15px_rgba(255,0,127,0.05)]'
                }`}
              >
                <div className={`mt-1 p-3 rounded-xl flex-shrink-0 ${
                  notif.type === 'match' ? 'bg-neon/10 text-neon' :
                  notif.type === 'message' ? 'bg-blue-500/10 text-blue-400' :
                  'bg-gray-700/30 text-gray-300'
                }`}>
                  {notif.type === 'match' ? <Heart className="w-5 h-5 fill-current" /> : 
                   notif.type === 'message' ? <MessageCircle className="w-5 h-5" /> :
                   <Zap className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className={`text-base font-bold mb-1 ${notif.read ? 'text-gray-300' : 'text-white'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-gray-600 uppercase tracking-wide font-mono whitespace-nowrap ml-2">
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{notif.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
    </div>
  );
};
