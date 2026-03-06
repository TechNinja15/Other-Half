import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, AlertCircle, Play, Pause, Search, Music, X, Hash, Users, Copy, PlusCircle, LogIn, LogOut, MessageSquare, Send, Mic, MicOff, Video, VideoOff, Loader } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Peer, { DataConnection } from 'peerjs';
import { useAuth } from '../../context/AuthContext';
import { analytics } from '../../utils/analytics';

type DateMode = 'landing' | 'create_room' | 'join_room' | 'room';

interface Track {
    id: string;
    song: string;
    singers: string;
    image: string;
    media_url: string;
    duration: string;
}

interface PeerStream {
    peerId: string;
    stream: MediaStream;
}

const StreamVideo = ({ stream, muted = false, mirrored }: { stream: MediaStream, muted?: boolean, mirrored: boolean }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);
    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            className="w-full h-full object-cover"
            style={{ transform: mirrored ? 'rotateY(180deg)' : 'none' }}
        />
    );
};

export const MusicDate = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<DateMode>('landing');
    const [roomName, setRoomName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Music State
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<Track[]>([]);
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);

    const audioRef = useRef<HTMLAudioElement>(null);

    // Peer & WebRTC State
    const [myPeerId, setMyPeerId] = useState<string>('');
    const [peers, setPeers] = useState<PeerStream[]>([]);
    const [peerNames, setPeerNames] = useState<Record<string, string>>({});
    const [isHost, setIsHost] = useState(false);
    const [myStream, setMyStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const { currentUser } = useAuth();
    const displayName = currentUser?.realName || currentUser?.anonymousId || 'Anonymous';

    // Chat State
    const [showChat, setShowChat] = useState(false);
    const [messages, setMessages] = useState<{ user: string, text: string }[]>([
        { user: 'System', text: 'Welcome to the Music Jam!' }
    ]);
    const [newMessage, setNewMessage] = useState('');

    const peerInstance = useRef<Peer | null>(null);
    const connections = useRef<{ [key: string]: DataConnection }>({});

    // References for callbacks
    const currentTrackRef = useRef(currentTrack);
    const isPlayingRef = useRef(isPlaying);
    useEffect(() => {
        currentTrackRef.current = currentTrack;
        isPlayingRef.current = isPlaying;
    }, [currentTrack, isPlaying]);

    // Initialize Peer
    useEffect(() => {
        if (roomCode) {
            if (peerInstance.current) {
                peerInstance.current.destroy();
            }

            const initPeer = async () => {
                try {
                    let stream: MediaStream;
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    } catch (err) {
                        console.warn("Media Access Failed", err);
                        const canvas = document.createElement('canvas');
                        const videoTrack = canvas.captureStream(30).getVideoTracks()[0];
                        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                        const audioTrack = audioCtx.createMediaStreamDestination().stream.getAudioTracks()[0];
                        stream = new MediaStream([videoTrack, audioTrack]);
                    }
                    setMyStream(stream);

                    const newPeerId = isHost ? roomCode : undefined;
                    const peer = newPeerId ? new Peer(newPeerId) : new Peer();

                    peer.on('open', (id) => {
                        setMyPeerId(id);
                        if (isHost) {
                            analytics.virtualDateStart('Music Jam');
                        } else {
                            analytics.virtualDateJoin();
                            connectToPeer(roomCode, stream, peer);
                        }
                    });

                    peer.on('call', (call) => {
                        call.answer(stream);
                        call.on('stream', (remoteStream) => {
                            setPeers(prev => prev.find(p => p.peerId === call.peer) ? prev : [...prev, { peerId: call.peer, stream: remoteStream }]);
                        });
                        call.on('close', () => setPeers(prev => prev.filter(p => p.peerId !== call.peer)));
                    });

                    peer.on('connection', setupDataConnection);
                    peerInstance.current = peer;

                } catch (err: any) {
                    setError(`System Error: ${err.message}`);
                }
            };
            initPeer();

            return () => {
                peerInstance.current?.destroy();
                setPeers([]);
                if (myStream) myStream.getTracks().forEach(track => track.stop());
            };
        }
    }, [roomCode, isHost]);

    const connectToPeer = (targetId: string, stream: MediaStream, peer: Peer) => {
        const call = peer.call(targetId, stream);
        const conn = peer.connect(targetId, { reliable: true });

        setupDataConnection(conn);

        call.on('stream', (remoteStream) => {
            setPeers(prev => prev.find(p => p.peerId === targetId) ? prev : [...prev, { peerId: targetId, stream: remoteStream }]);
        });
        call.on('close', () => setPeers(prev => prev.filter(p => p.peerId !== targetId)));
    };

    const setupDataConnection = (conn: DataConnection) => {
        conn.on('open', () => {
            connections.current[conn.peer] = conn;
            conn.send({ type: 'IDENTITY', payload: { name: displayName } });

            if (isHost) {
                if (currentTrackRef.current) {
                    conn.send({ type: 'SYNC_PLAYER', action: 'track', payload: currentTrackRef.current });
                    if (isPlayingRef.current) {
                        conn.send({ type: 'SYNC_PLAYER', action: 'play' });
                        if (audioRef.current) {
                            conn.send({ type: 'SYNC_PLAYER', action: 'seek', time: audioRef.current.currentTime });
                        }
                    }
                }
            }
        });

        conn.on('data', (data: any) => handleDataMessage(data, conn.peer));
        conn.on('close', () => {
            setPeers(prev => prev.filter(p => p.peerId !== conn.peer));
            delete connections.current[conn.peer];
        });
    };

    const handleDataMessage = (data: any, senderId: string) => {
        if (data.type === 'IDENTITY') {
            setPeerNames(prev => ({ ...prev, [senderId]: data.payload.name }));
        } else if (data.type === 'CHAT') {
            const senderName = peerNames[senderId] || senderId.substring(0, 5);
            setMessages(prev => [...prev, { user: senderName, text: data.text }]);
        } else if (data.type === 'SYNC_PLAYER') {
            if (data.action === 'track') {
                setCurrentTrack(data.payload);
            } else if (data.action === 'play') {
                setIsPlaying(true);
            } else if (data.action === 'pause') {
                setIsPlaying(false);
            } else if (data.action === 'seek' && audioRef.current) {
                audioRef.current.currentTime = data.time;
            } else if (data.action === 'time_update' && audioRef.current) {
                const diff = Math.abs(audioRef.current.currentTime - data.time);
                if (diff > 1.5) audioRef.current.currentTime = data.time;
            }
        }
    };

    const broadcastData = (data: any) => {
        Object.values(connections.current).forEach(conn => {
            if (conn.open) conn.send(data);
        });
    };

    const broadcastSync = (action: string, payload: any = {}) => {
        if (!isHost) return;
        broadcastData({ type: 'SYNC_PLAYER', action, ...payload });
    };

    // Audio Sync Effects
    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Audio play error", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, currentTrack]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isHost && isPlaying) {
            interval = setInterval(() => {
                if (audioRef.current) {
                    broadcastSync('time_update', { time: audioRef.current.currentTime });
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isHost, isPlaying]);

    // Search JioSaavn API
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`https://saavnapi-nine.vercel.app/result/?query=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setSearchResults(data);
            } else {
                setSearchResults([]);
            }
        } catch (err) {
            setError('Failed to search music. Try again.');
        } finally {
            setIsSearching(false);
        }
    };

    const playSelectedTrack = (track: Track) => {
        setCurrentTrack(track);
        setIsPlaying(true);
        broadcastSync('track', { payload: track });
        broadcastSync('play');
    };

    const handlePlayPause = () => {
        if (!currentTrack) return;
        const newPlayingState = !isPlaying;
        setIsPlaying(newPlayingState);
        broadcastSync(newPlayingState ? 'play' : 'pause');
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isHost || !audioRef.current) return;
        const newTime = Number(e.target.value);
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
        broadcastSync('seek', { time: newTime });
    };

    const generateRoomCode = () => {
        const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const numbers = '0123456789';
        let code = '';
        for (let i = 0; i < 3; i++) code += letters.charAt(Math.floor(Math.random() * letters.length));
        code += '-';
        for (let i = 0; i < 3; i++) code += numbers.charAt(Math.floor(Math.random() * numbers.length));
        return code;
    };

    const handleCreateRoom = () => {
        if (!roomName.trim()) {
            setError('Please enter a room name');
            return;
        }
        setIsConnecting(true);
        setRoomCode(generateRoomCode());
        setIsHost(true);
        setMode('room');
        setTimeout(() => setIsConnecting(false), 1000);
    };

    const handleJoinRoom = () => {
        const formatted = joinCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (formatted.length !== 6) {
            setError('Please enter a valid room code (e.g., ABC-123)');
            return;
        }
        setRoomCode(`${formatted.slice(0, 3)}-${formatted.slice(3, 6)}`);
        setRoomName('Joined Room');
        setIsHost(false);
        setMode('room');
    };

    const toggleMute = () => {
        if (myStream) {
            myStream.getAudioTracks().forEach(t => t.enabled = !t.enabled);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (myStream) {
            myStream.getVideoTracks().forEach(t => t.enabled = !t.enabled);
            setIsVideoOff(!isVideoOff);
        }
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        setMessages([...messages, { user: displayName, text: newMessage }]);
        broadcastData({ type: 'CHAT', text: newMessage });
        setNewMessage('');
    };

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    if (mode === 'landing') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full bg-black relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none -z-0 animate-pulse" style={{ animationDuration: '4s' }} />

                <button onClick={() => navigate('/virtual-date')} className="absolute top-6 left-6 p-3 bg-gray-900/50 hover:bg-gray-800 rounded-full transition-colors z-20 border border-gray-800">
                    <ArrowLeft className="w-6 h-6 text-gray-400 hover:text-white" />
                </button>

                <div className="text-center mb-16 relative z-10">
                    <h2 className="text-5xl md:text-7xl font-black mb-4 text-white tracking-tighter">
                        SOUL <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-600">SYNC</span>
                    </h2>
                    <p className="text-gray-400 max-w-md mx-auto">Listen to your favorite tracks together in perfect harmony.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full px-4 max-w-2xl relative z-10">
                    <button onClick={() => setMode('create_room')} className="group flex flex-col items-center p-10 bg-gray-900/40 backdrop-blur-md hover:bg-gray-800/80 border-2 border-gray-800 hover:border-violet-500 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/20">
                        <div className="p-6 rounded-full bg-violet-500/10 text-violet-500 mb-6 group-hover:scale-110 transition-transform shadow-lg">
                            <PlusCircle className="w-12 h-12" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Create Jam</h3>
                        <p className="text-gray-400 text-sm">Host a new music session</p>
                    </button>

                    <button onClick={() => setMode('join_room')} className="group flex flex-col items-center p-10 bg-gray-900/40 backdrop-blur-md hover:bg-gray-800/80 border-2 border-gray-800 hover:border-indigo-500 rounded-3xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20">
                        <div className="p-6 rounded-full bg-indigo-500/10 text-indigo-500 mb-6 group-hover:scale-110 transition-transform shadow-lg">
                            <LogIn className="w-12 h-12" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Join Jam</h3>
                        <p className="text-gray-400 text-sm">Enter a room code</p>
                    </button>
                </div>
            </div>
        );
    }

    if (mode === 'create_room' || mode === 'join_room') {
        const isCreate = mode === 'create_room';
        return (
            <div className="flex flex-col items-center justify-center min-h-screen w-full bg-black relative px-4">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
                <button onClick={() => setMode('landing')} className="absolute top-6 left-6 p-3 bg-gray-900/50 hover:bg-gray-800 rounded-full z-20 border border-gray-800">
                    <ArrowLeft className="w-6 h-6 text-gray-400 hover:text-white" />
                </button>

                <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 w-full max-w-md shadow-2xl relative z-10">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">{isCreate ? 'Create Jam Room' : 'Join Jam Room'}</h2>
                        <p className="text-sm text-gray-400">{isCreate ? 'Give your room a fun name' : 'Enter the host\'s code'}</p>
                    </div>
                    {error && <div className="mb-4 text-red-500 text-sm text-center bg-red-500/10 py-2 rounded-xl">{error}</div>}
                    <div className="space-y-4">
                        {isCreate ? (
                            <input type="text" value={roomName} onChange={e => setRoomName(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleCreateRoom()} placeholder="e.g., Midnight Vibes 🌙" maxLength={30} className="w-full bg-black/50 border-2 border-gray-700 rounded-xl px-4 py-4 text-white focus:border-violet-500 focus:outline-none transition-colors" autoFocus />
                        ) : (
                            <input type="text" value={joinCode} onChange={e => {
                                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                                setJoinCode(val.length === 3 && !val.includes('-') ? val + '-' : val.slice(0, 7));
                            }} onKeyPress={e => e.key === 'Enter' && handleJoinRoom()} placeholder="ABC-123" className="w-full bg-black/50 border-2 border-gray-700 rounded-xl px-4 py-4 text-center text-2xl tracking-widest text-white focus:border-indigo-500 focus:outline-none transition-colors font-mono" autoFocus />
                        )}
                        <button onClick={isCreate ? handleCreateRoom : handleJoinRoom} disabled={isConnecting} className={`w-full bg-gradient-to-r text-white font-bold py-4 rounded-xl shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center gap-2 ${isCreate ? 'from-violet-500 to-indigo-500 shadow-violet-500/20' : 'from-indigo-500 to-purple-500 shadow-indigo-500/20'}`}>
                            {isConnecting ? <Loader className="w-5 h-5 animate-spin" /> : (isCreate ? 'Start Jam' : 'Join Jam')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full bg-[#050510] text-white overflow-hidden font-sans relative">
            <audio ref={audioRef} src={currentTrack?.media_url} onTimeUpdate={handleTimeUpdate} onEnded={() => { setIsPlaying(false); broadcastSync('pause'); }} />

            {/* Header */}
            <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/40 backdrop-blur-md z-20">
                <div className="flex items-center gap-4 border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 rounded-full">
                    <span className="font-bold text-gray-200">{roomName}</span>
                    <div className="w-px h-4 bg-white/20" />
                    <span className="font-mono text-neon font-bold flex items-center gap-1 cursor-pointer">
                        <Hash className="w-3 h-3" /> {roomCode}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowChat(!showChat)} className={`p-2 rounded-xl transition-colors ${showChat ? 'bg-violet-500/20 text-violet-400' : 'hover:bg-gray-800 text-gray-400'}`}>
                        <MessageSquare className="w-5 h-5" />
                    </button>
                    <button onClick={() => setMode('landing')} className="p-2 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Content */}
                <div className="flex-1 flex flex-col relative w-full">

                    {/* Visualizer Background */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none overflow-hidden">
                        <div className={`w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 blur-[150px] transition-transform duration-[10s] ${isPlaying ? 'scale-110 animate-pulse' : 'scale-90 opacity-10'}`} />
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-8 z-10 flex flex-col h-full">
                        {/* Currently Playing Card */}
                        <div className="w-full max-w-2xl mx-auto bg-gray-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl flex flex-col md:flex-row gap-8 items-center md:items-start mb-8 transition-all">
                            <div className="relative w-48 h-48 md:w-64 md:h-64 shrink-0 shadow-2xl rounded-2xl overflow-hidden shadow-violet-900/50">
                                {currentTrack ? (
                                    <img src={currentTrack.image.replace('150x150', '500x500')} alt={currentTrack.song} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-800 flex items-center justify-center border border-gray-700">
                                        <Music className="w-16 h-16 text-gray-600" />
                                    </div>
                                )}
                                {isPlaying && (
                                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <div className="flex gap-1.5 h-8 items-end">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className="w-1.5 bg-neon rounded-full animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 w-full flex flex-col items-center md:items-start text-center md:text-left">
                                <h1 className="text-3xl md:text-5xl font-black text-white mb-2 line-clamp-2">{currentTrack?.song || 'Select a track'}</h1>
                                <p className="text-lg text-violet-300 mb-8">{currentTrack?.singers || 'JioSaavnAPI Jam'}</p>

                                {/* Playback Controls */}
                                <div className="w-full mt-auto">
                                    <input
                                        type="range"
                                        min="0"
                                        max={currentTrack ? Number(currentTrack.duration) : 100}
                                        value={currentTime}
                                        onChange={handleProgressChange}
                                        disabled={!isHost || !currentTrack}
                                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500 mb-2"
                                    />
                                    <div className="flex justify-between text-xs text-gray-400 font-mono">
                                        <span>{formatTime(currentTime)}</span>
                                        <span>{currentTrack ? formatTime(Number(currentTrack.duration)) : '0:00'}</span>
                                    </div>

                                    <div className="flex items-center justify-center gap-6 mt-6">
                                        <button
                                            onClick={handlePlayPause}
                                            disabled={!isHost || !currentTrack}
                                            className="w-16 h-16 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-xl shadow-white/10"
                                        >
                                            {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                                        </button>
                                        {!isHost && <p className="absolute bottom-4 text-xs text-gray-500">Only host can control playback</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Search Section (Host Only) */}
                        {isHost && (
                            <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col min-h-0">
                                <form onSubmit={handleSearch} className="relative mb-6">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        placeholder="Search for a song..."
                                        className="w-full bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 shadow-xl"
                                    />
                                </form>

                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pb-20">
                                    {isSearching && (
                                        <div className="flex justify-center p-8"><Loader className="w-8 h-8 text-violet-500 animate-spin" /></div>
                                    )}
                                    {searchResults.map((track) => (
                                        <div key={track.id} onClick={() => playSelectedTrack(track)} className="flex items-center gap-4 bg-black/40 hover:bg-white/10 p-3 rounded-2xl cursor-pointer transition-colors border border-transparent hover:border-white/10 group">
                                            <img src={track.image} alt={track.song} className="w-12 h-12 rounded-lg object-cover shadow-md" />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-white font-bold truncate group-hover:text-violet-300 transition-colors">{track.song}</h4>
                                                <p className="text-gray-400 text-sm truncate">{track.singers}</p>
                                            </div>
                                            <button className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Play className="w-4 h-4 fill-current ml-0.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Panel */}
                {showChat && (
                    <div className="w-80 border-l border-white/5 bg-gray-950/80 backdrop-blur-xl flex flex-col z-30 shadow-2xl">
                        <div className="h-14 border-b border-white/5 flex items-center justify-between px-4">
                            <span className="font-bold text-gray-300 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-violet-400" /> Chat</span>
                            <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex flex-col ${msg.user === displayName ? 'items-end' : 'items-start'}`}>
                                    <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${msg.user === displayName ? 'bg-violet-600 text-white rounded-br-sm' : 'bg-gray-800 text-gray-200 rounded-bl-sm'}`}>
                                        {msg.text}
                                    </div>
                                    <span className="text-[10px] text-gray-500 mt-1 px-1">{msg.user}</span>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border-t border-white/5 bg-black">
                            <form onSubmit={handleSendMessage} className="relative">
                                <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:border-violet-500" />
                                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-violet-400 hover:bg-violet-500/20 rounded-lg transition-colors"><Send className="w-4 h-4" /></button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Video Grids Overlay */}
            <div className="absolute bottom-6 left-6 right-6 pointer-events-none flex items-end gap-4 z-40">
                {myStream && (
                    <div className="w-32 h-24 md:w-48 md:h-32 bg-gray-900 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl relative pointer-events-auto shadow-black/50">
                        <StreamVideo stream={myStream} muted={true} mirrored={true} />
                        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                            <span className="text-xs font-bold text-white bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-md">You</span>
                            <div className="flex gap-1">
                                <button onClick={toggleMute} className={`p-1.5 rounded-md backdrop-blur-md ${isMuted ? 'bg-red-500/80 text-white' : 'bg-black/50 text-gray-300'}`}>{isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}</button>
                                <button onClick={toggleVideo} className={`p-1.5 rounded-md backdrop-blur-md ${isVideoOff ? 'bg-red-500/80 text-white' : 'bg-black/50 text-gray-300'}`}>{isVideoOff ? <VideoOff className="w-3 h-3" /> : <Video className="w-3 h-3" />}</button>
                            </div>
                        </div>
                    </div>
                )}
                {peers.map(peer => (
                    <div key={peer.peerId} className="w-32 h-24 md:w-48 md:h-32 bg-gray-900 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl relative pointer-events-auto shadow-black/50">
                        <StreamVideo stream={peer.stream} mirrored={true} />
                        <span className="absolute bottom-2 left-2 text-xs font-bold text-white bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-md">{peerNames[peer.peerId] || 'Peer'}</span>
                    </div>
                ))}
            </div>

            {/* Global Error Toast */}
            {error && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-red-500/90 backdrop-blur-md text-white font-medium flex items-center gap-2 shadow-2xl z-50 animate-fade-in-down pointer-events-auto">
                    <AlertCircle className="w-5 h-5" /> {error}
                    <button onClick={() => setError(null)} className="ml-2 hover:bg-black/20 p-1 rounded-full"><X className="w-4 h-4" /></button>
                </div>
            )}
        </div>
    );
};

export default MusicDate;
