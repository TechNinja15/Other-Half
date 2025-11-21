
import React, { useEffect, useState } from 'react';
import { MatchProfile, ChatSession } from '../types';
import { dataService } from '../services/data';
import { Heart, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Matches: React.FC = () => {
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setMatches(dataService.getMatches());
  }, []);

  const getLastMessage = (matchId: string) => {
    const session = dataService.getChatSession(matchId);
    if (session && session.messages.length > 0) {
      return session.messages[session.messages.length - 1].text;
    }
    return "Start a conversation...";
  };

  return (
    <div className="h-full flex flex-col bg-black/50 backdrop-blur-sm md:bg-transparent">
      <div className="p-6 border-b border-gray-900">
        <h2 className="text-3xl font-black flex items-center gap-3">
          Matches <span className="bg-neon text-white text-sm rounded-full px-2 py-0.5 align-middle font-mono">{matches.length}</span>
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 pb-24 md:pb-4">
        {matches.length === 0 ? (
          <div className="text-gray-500 text-center mt-20 flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-900 rounded-full flex items-center justify-center mb-4">
               <Heart className="w-10 h-10 text-gray-700" />
            </div>
            <p className="text-lg font-medium">No matches yet.</p>
            <p className="text-sm mt-2">Start swiping to find your other half.</p>
            <button 
               onClick={() => navigate('/home')}
               className="mt-6 text-neon font-bold hover:underline"
            >
              Go to Discover
            </button>
          </div>
        ) : (
          matches.map(match => (
            <div 
              key={match.id} 
              onClick={() => navigate(`/chat/${match.id}`)}
              className="bg-gray-900/50 hover:bg-gray-800 p-4 rounded-2xl border border-gray-800 flex items-center justify-between hover:border-neon/50 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center border border-gray-700 group-hover:border-neon relative overflow-hidden bg-gray-800">
                  {match.avatar ? (
                    <img src={match.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-gray-400 group-hover:text-neon text-lg">{match.anonymousId.substring(5)}</span>
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></span>
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg group-hover:text-neon transition-colors flex items-center gap-2">
                    {match.realName} <span className="text-xs font-normal text-gray-600">({match.anonymousId})</span>
                  </h3>
                  <p className="text-xs text-gray-500 font-mono uppercase mb-0.5">{match.university}</p>
                  <p className="text-xs text-gray-500 font-mono uppercase">{match.branch} • {match.year}</p>
                  <p className="text-xs text-gray-400 mt-1 truncate max-w-[150px] md:max-w-[200px]">
                    {getLastMessage(match.id)}
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-full bg-gray-800 group-hover:bg-neon/20 group-hover:text-neon transition-colors">
                 <MessageCircle className="w-5 h-5" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
