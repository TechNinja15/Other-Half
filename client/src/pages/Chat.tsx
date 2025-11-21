
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatSession, Message, MatchProfile, CallType } from '../types';
import { dataService } from '../services/data';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { generateIceBreaker } from '../services/geminiService';
import { X, Phone, Video, ShieldBan, Zap, Ghost, Send } from 'lucide-react';

export const Chat: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { startCall } = useCall();
  
  const [match, setMatch] = useState<MatchProfile | null>(null);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    
    const matches = dataService.getMatches();
    const foundMatch = matches.find(m => m.id === id);
    
    if (foundMatch) {
      setMatch(foundMatch);
      setSession(dataService.getChatSession(id));
    } else {
      navigate('/matches');
    }
  }, [id, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !id || !currentUser) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      text: messageInput,
      timestamp: Date.now()
    };

    dataService.addMessage(id, newMessage);
    // Force update local session state
    setSession(prev => prev ? { ...prev, messages: [...prev.messages, newMessage] } : null);
    setMessageInput('');
  };

  const handleIceBreaker = async () => {
    if (!currentUser || !match) return;
    const suggestion = await generateIceBreaker(currentUser.interests, match);
    setMessageInput(suggestion);
  };

  const handleBlockUser = () => {
    if (!confirm("Are you sure you want to block this user? This action cannot be undone.") || !id) return;
    dataService.removeMatch(id);
    navigate('/matches');
  };

  if (!match || !session) return null;

  return (
    <div className="flex flex-col h-full bg-black relative">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/matches')} className="md:hidden text-gray-400 hover:text-white p-2">
              <X className="w-6 h-6" />
            </button>
            
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center overflow-hidden border border-gray-600">
                  {match.avatar ? (
                    <img src={match.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold text-gray-300">{match.anonymousId.slice(-2)}</span>
                  )}
               </div>
               <div>
                  <h3 className="font-bold text-white leading-tight">{match.realName}</h3>
                  <p className="text-[10px] text-neon uppercase tracking-widest font-bold">
                    {match.anonymousId} • Online
                  </p>
               </div>
            </div>
          </div>
          
          <div className="flex gap-2">
             <button 
               onClick={() => startCall(CallType.AUDIO, match.realName)} 
               className="p-3 bg-gray-800/50 rounded-full text-gray-300 hover:text-neon hover:bg-neon/10 transition-all"
               title="Voice Call"
             >
                <Phone className="w-5 h-5" />
             </button>
             <button 
               onClick={() => startCall(CallType.VIDEO, match.realName)} 
               className="p-3 bg-gray-800/50 rounded-full text-gray-300 hover:text-neon hover:bg-neon/10 transition-all"
               title="Video Call"
             >
                <Video className="w-5 h-5" />
             </button>
             <button 
               onClick={handleBlockUser}
               className="p-3 bg-gray-800/50 rounded-full text-red-400 hover:text-red-600 hover:bg-red-900/20 transition-all ml-2"
               title="Block User"
             >
                <ShieldBan className="w-5 h-5" />
             </button>
          </div>
        </div>

        <div className="bg-gray-900/30 py-1 text-center border-b border-gray-800/50">
           <p className="text-[10px] text-gray-400 flex items-center justify-center gap-2 uppercase tracking-widest">
             <Zap className="w-3 h-3 text-yellow-500" />
             Encrypted Session • Auto-delete in 48h
           </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-dots-pattern pb-24">
          {session.messages.length === 0 && (
             <div className="text-center py-10 animate-fade-in">
               <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-800 overflow-hidden">
                  {match.avatar ? (
                    <img src={match.avatar} alt="Match" className="w-full h-full object-cover opacity-50" />
                  ) : (
                    <Ghost className="w-8 h-8 text-gray-600" />
                  )}
               </div>
               <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">You matched based on common interests in <span className="text-white font-bold">{match.interests[0]}</span>. Say hello!</p>
               
               <button 
                 onClick={handleIceBreaker}
                 className="group text-xs border border-neon text-neon px-6 py-3 rounded-full hover:bg-neon hover:text-white transition-all flex items-center gap-2 mx-auto font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(255,0,127,0.2)]"
               >
                 <Zap className="w-4 h-4 group-hover:animate-pulse" /> Generate Ice Breaker
               </button>
             </div>
          )}
          {session.messages.map((msg, idx) => {
            const isMe = msg.senderId === currentUser?.id;
            const showTimestamp = idx === 0 || (msg.timestamp - session.messages[idx-1].timestamp > 60000 * 5);
            
            return (
              <div key={msg.id} className="animate-fade-in-up">
                {showTimestamp && (
                  <div className="text-center my-4">
                    <span className="text-[10px] text-gray-700 font-mono bg-gray-900 px-2 py-1 rounded">
                      {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-lg relative ${
                    isMe 
                      ? 'bg-neon text-white rounded-tr-none shadow-[0_0_15px_rgba(255,0,127,0.15)]' 
                      : 'bg-gray-800 text-gray-100 rounded-tl-none border border-gray-700'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-black border-t border-gray-800 pb-safe absolute bottom-0 left-0 right-0">
           <div className="flex gap-3 items-end max-w-4xl mx-auto">
             <div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl px-4 py-2 focus-within:border-neon focus-within:shadow-neon-sm transition-all flex items-center gap-2">
               <input 
                 value={messageInput}
                 onChange={e => setMessageInput(e.target.value)}
                 onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                 placeholder="Type a message..."
                 className="flex-1 bg-transparent text-white outline-none py-2 resize-none"
                 autoComplete="off"
               />
             </div>
             <button 
                onClick={handleSendMessage} 
                disabled={!messageInput.trim()}
                className="p-4 bg-neon rounded-full text-white hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100 shadow-neon"
             >
               <Send className="w-5 h-5" />
             </button>
           </div>
        </div>
    </div>
  );
};
