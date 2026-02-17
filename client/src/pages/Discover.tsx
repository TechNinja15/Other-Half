import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC, {
    IAgoraRTCRemoteUser,
    ICameraVideoTrack,
    IMicrophoneAudioTrack
} from 'agora-rtc-sdk-ng';
import {
    X, Mic, MicOff, Video as VideoIcon, VideoOff,
    PhoneOff, Sparkles, Send, SkipForward, Hand,
    MessageCircle, Ghost, Info, Shuffle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

// Omegle-style Discover Page
export const Discover: React.FC = () => {
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [isSearching, setIsSearching] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<{ sender: string, text: string }[]>([]);
    const [inputText, setInputText] = useState('');

    // Agora State
    const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
    const [remoteUser, setRemoteUser] = useState<IAgoraRTCRemoteUser | null>(null);
    const [client] = useState(() => AgoraRTC.createClient({ mode: 'rtc', codec: 'h264' }));

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const startSearch = async () => {
        setIsSearching(true);
        setMessages([{ sender: 'System', text: 'Looking for someone special...' }]);

        // Simulate matchmaking delay
        setTimeout(async () => {
            await connectToStranger();
        }, 2000);
    };

    const connectToStranger = async () => {
        try {
            // In a real app, you'd fetch a token/channel from your server
            // For this demo, we'll use a random channel or the user ID
            const mockChannel = `discover_${Math.floor(Math.random() * 1000)}`;

            // Initialize Agora
            await initAgora(mockChannel);

            setIsSearching(false);
            setIsConnected(true);
            setMessages(prev => [...prev, { sender: 'System', text: 'You are now chatting with a stranger. Say hi!' }]);
        } catch (err) {
            console.error('Matchmaking failed:', err);
            showToast('Connection failed. Try again.', 'error');
            setIsSearching(false);
        }
    };

    const initAgora = async (channelName: string) => {
        const appId = import.meta.env.VITE_AGORA_APP_ID || ''; // Should be in .env
        if (!appId) {
            showToast('Agora App ID missing. Check .env', 'error');
            // return;
        }

        try {
            client.on('user-published', async (user, mediaType) => {
                await client.subscribe(user, mediaType);
                if (mediaType === 'video') {
                    setRemoteUser(user);
                    user.videoTrack?.play('remote-video-discover');
                }
                if (mediaType === 'audio') {
                    user.audioTrack?.play();
                }
            });

            client.on('user-left', () => {
                setRemoteUser(null);
                handleNext();
            });

            // Join with a null token for now (if security is disabled in Agora console)
            // Note: Real apps need a token from server
            // await client.join(appId, channelName, null, null);

            const [audio, video] = await AgoraRTC.createMicrophoneAndCameraTracks();
            setLocalAudioTrack(audio);
            setLocalVideoTrack(video);

            // await client.publish([audio, video]);
            video.play('local-video-discover');
        } catch (err) {
            console.error('Agora init error:', err);
            throw err;
        }
    };

    const handleNext = () => {
        stopConnection();
        startSearch();
    };

    const stopConnection = () => {
        localAudioTrack?.close();
        localVideoTrack?.close();
        client.leave();
        setRemoteUser(null);
        setIsConnected(false);
        setIsSearching(false);
        setMessages([]);
    };

    const sendMessage = () => {
        if (!inputText.trim()) return;
        setMessages(prev => [...prev, { sender: 'You', text: inputText }]);
        setInputText('');

        // Auto-reply for "stranger" effect in demo
        setTimeout(() => {
            const replies = [
                "Hey! What's up?",
                "Nice to meet you!",
                "What uniroversity are you from?",
                "Cool neon theme right?",
                "Haha that's funny.",
                "I'm just chilling, you?"
            ];
            setMessages(prev => [...prev, { sender: 'Stranger', text: replies[Math.floor(Math.random() * replies.length)] }]);
        }, 1000);
    };

    const toggleMute = () => {
        if (localAudioTrack) {
            localAudioTrack.setEnabled(isMuted);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localVideoTrack) {
            localVideoTrack.setEnabled(isVideoOff);
            setIsVideoOff(!isVideoOff);
        }
    };

    return (
        <div className="h-full w-full bg-black flex flex-col md:flex-row overflow-hidden text-white font-sans">

            {/* Video Section */}
            <div className="flex-[3] relative bg-gray-900/50 flex flex-col p-4 gap-4">

                {/* Remote Video (Stranger) */}
                <div className="flex-1 relative rounded-3xl overflow-hidden border-2 border-white/5 bg-black shadow-2xl min-h-[300px]">
                    <div id="remote-video-discover" className="w-full h-full object-cover" />

                    {!remoteUser && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm z-10 p-6 text-center">
                            {isSearching ? (
                                <div className="space-y-6">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full border-4 border-neon/20 border-t-neon animate-spin shadow-[0_0_30px_rgba(255,0,127,0.3)]"></div>
                                        <Ghost className="w-10 h-10 text-neon absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Searching...</h2>
                                        <p className="text-gray-400 text-sm">Finding someone new from campus</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 max-w-sm">
                                    <div className="w-20 h-20 bg-neon/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-neon/30 shadow-[0_0_20px_rgba(255,0,127,0.2)] animate-pulse">
                                        <Shuffle className="w-10 h-10 text-neon" />
                                    </div>
                                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Ready to meet?</h2>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Click start to begin a random video chat with another student.
                                        Stay safe and have fun!
                                    </p>
                                    <button
                                        onClick={startSearch}
                                        className="w-full py-4 bg-neon text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,0,127,0.5)] uppercase tracking-widest text-lg"
                                    >
                                        Start Discovery
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Stranger Info Overlay */}
                    {remoteUser && (
                        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs font-bold uppercase tracking-wider">Stranger</span>
                        </div>
                    )}
                </div>

                {/* Local Video (Self) */}
                <div className="h-1/3 md:h-1/2 relative rounded-3xl overflow-hidden border-2 border-neon/30 bg-black shadow-2xl group">
                    <div id="local-video-discover" className="w-full h-full object-cover transform scale-X-[-1]" />

                    {/* Self Controls Overlay */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20 opacity-100 transition-opacity">
                        <button
                            onClick={toggleMute}
                            className={`p-3 rounded-full backdrop-blur-md transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-black/40 text-white hover:bg-neon'}`}
                        >
                            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                        <button
                            onClick={toggleVideo}
                            className={`p-3 rounded-full backdrop-blur-md transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-black/40 text-white hover:bg-neon'}`}
                        >
                            {isVideoOff ? <VideoOff size={20} /> : <VideoIcon size={20} />}
                        </button>
                    </div>

                    {!localVideoTrack && !isSearching && !isConnected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                            <VideoIcon className="w-12 h-12 text-gray-700" />
                        </div>
                    )}
                </div>

                {/* Action Bar (Bottom Mobile) */}
                {isConnected && (
                    <div className="flex gap-4 z-30">
                        <button
                            onClick={handleNext}
                            className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 border border-white/10 group"
                        >
                            <SkipForward className="group-hover:translate-x-1 transition-transform" />
                            Next Stranger
                        </button>
                        <button
                            onClick={stopConnection}
                            className="px-6 py-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-bold rounded-2xl transition-all border border-red-500/30"
                        >
                            Stop
                        </button>
                    </div>
                )}
            </div>

            {/* Chat Section */}
            <div className="flex-[2] h-full bg-black border-l border-white/5 flex flex-col">

                {/* Chat Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="text-neon w-5 h-5 text-neon drop-shadow-[0_0_8px_rgba(255,0,127,0.5)]" />
                        <h3 className="font-bold uppercase tracking-tighter">Live Chat</h3>
                    </div>
                    <button onClick={() => navigate('/home')} className="text-gray-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}>
                            <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${msg.sender === 'You' ? 'text-neon' :
                                msg.sender === 'Stranger' ? 'text-blue-400' : 'text-gray-500'
                                }`}>
                                {msg.sender}
                            </span>
                            <div className={`max-w-[85%] px-4 py-2 rounded-2xl text-sm ${msg.sender === 'You'
                                ? 'bg-neon/10 border border-neon/20 text-white rounded-tr-none shadow-[0_0_15px_rgba(255,0,127,0.1)]'
                                : msg.sender === 'Stranger'
                                    ? 'bg-gray-900 border border-white/5 text-gray-200 rounded-tl-none'
                                    : 'bg-white/5 text-gray-400 italic text-center w-full rounded-lg border-none'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* Input area */}
                <div className="p-4 bg-black/50 backdrop-blur-lg border-t border-white/5">
                    <div className="relative flex items-center gap-2">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Type a message..."
                            disabled={!isConnected}
                            className="w-full bg-gray-900 border border-white/10 rounded-2xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-neon/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!inputText.trim() || !isConnected}
                            className="absolute right-2 p-2 bg-neon rounded-xl text-white shadow-lg shadow-neon/20 disabled:opacity-50 transition-all hover:scale-110 active:scale-95"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-600 font-bold uppercase tracking-tighter pl-1">
                        <Info size={12} />
                        <span>Keep it respectful. Follow campus guidelines.</span>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Discover;
