import React, { useState, useEffect, useRef } from 'react';
import {
    X, Mic, MicOff, Video as VideoIcon, VideoOff,
    PhoneOff, Sparkles, Send, SkipForward, Hand,
    MessageCircle, Ghost, Info, Shuffle, Heart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

// Omegle-style Discover Chat Page
export const Discover: React.FC = () => {
    const { currentUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const chatMode = searchParams.get('mode') as 'video' | 'text' || 'video';
    const chatScope = searchParams.get('scope') as 'campus' | 'global' || 'campus';

    // Unique session ID for this tab to allow matching with self/multiple tabs
    const [sessionId] = useState(() => `sess_${Math.random().toString(36).substr(2, 9)}`);

    const [isSearching, setIsSearching] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<{ sender: string, text: string }[]>([]);
    const [inputText, setInputText] = useState('');

    // WebRTC State
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [hasLiked, setHasLiked] = useState(false);
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [matchReveal, setMatchReveal] = useState<{ myName: string, partnerName: string } | null>(null);
    const [showMatchReveal, setShowMatchReveal] = useState(false);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const channelRef = useRef<any>(null); // Supabase broadcast channel

    // Refs to avoid stale closures in broadcast handlers
    const isSearchingRef = useRef(isSearching);
    const isConnectedRef = useRef(isConnected);
    const isConnectingRef = useRef(false);
    const socketRef = useRef<Socket | null>(null);
    const activeChannelNameRef = useRef<string | null>(null);

    useEffect(() => { isSearchingRef.current = isSearching; }, [isSearching]);
    useEffect(() => { isConnectedRef.current = isConnected; }, [isConnected]);

    // Re-sync lobby when currentUser becomes available
    useEffect(() => {
        if (currentUser?.id && socketRef.current?.connected && isSearchingRef.current) {
            console.log('[Matchmaking] Re-syncing lobby with userId:', currentUser.id);
            socketRef.current.emit('join_lobby', {
                scope: chatScope,
                mode: chatMode,
                sessionId,
                userId: currentUser.id
            });
        }
    }, [currentUser, chatMode, chatScope, sessionId]);

    // Auto-start discovery based on mode when page loads
    useEffect(() => {
        startSearch(chatMode, chatScope);
        return () => {
            stopConnection();
        };
    }, [chatMode, chatScope]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const startSearch = async (mode: 'video' | 'text', scope: 'campus' | 'global') => {
        setIsSearching(true);
        setIsConnected(false);
        setMessages([{ sender: 'System', text: `Searching for a ${scope === 'campus' ? 'campus student' : 'stranger'} for ${mode === 'video' ? 'video' : 'text'} chat...` }]);

        if (!supabase) {
            setMessages(prev => [...prev, { sender: 'System', text: 'Error: Database connection missing.' }]);
            return;
        }

        // Matchmaking via Socket.io
        const apiUrl = import.meta.env.VITE_API_URL;

        // If we are in production but API_URL is missing or pointing to localhost, 
        // fallback immediately to Supabase Broadcast.
        if (import.meta.env.PROD && (!apiUrl || apiUrl.includes('localhost'))) {
            console.warn('[Matchmaking] No production API URL provided, falling back to Supabase Broadcast');
            setupSupabaseFallback(scope, mode);
            return;
        }

        const socket = io(apiUrl || 'http://localhost:5000');
        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('[Matchmaking] Connected to Socket.io');
            if (currentUser?.id) {
                console.log('[Matchmaking] Joining lobby with userId:', currentUser.id);
                socket.emit('join_lobby', { scope, mode, sessionId, userId: currentUser.id });
            } else {
                console.warn('[Matchmaking] No currentUser available at connect, waiting...');
            }
        });

        socket.on('match_found', ({ peerId, peerUserId, channelName, initiator }) => {
            console.log('[Matchmaking] Match found!', { peerId, peerUserId, channelName, initiator });
            activeChannelNameRef.current = channelName;
            setPartnerId(peerUserId);
            connectToStranger(mode, channelName, initiator);
        });

        socket.on('receive_message', ({ text, sender }) => {
            console.log('[Chat] Received message:', text, 'from:', sender);
            setMessages(prev => [...prev, { sender: 'Stranger', text }]);
        });

        socket.on('match_reveal', ({ users }) => {
            console.log('[Matchmaking] Mutual match! Revealing names:', users);

            // In testing, myId might equal partnerId. 
            // We search for partner preferentially as anyone NOT me.
            const partner = users.find((u: any) => u.id !== currentUser?.id) || users[0];
            const me = users.find((u: any) => u.id === currentUser?.id) || users[1];

            if (me && partner) {
                setMatchReveal({ myName: me.name, partnerName: partner.name });
                setShowMatchReveal(true);
                showToast(`It's a Match! Names revealed: ${me.name} & ${partner.name}`, 'success');
            }
        });

        socket.on('connect_error', (err) => {
            console.error('[Matchmaking] Socket.io connection error:', err);
            // Fallback to Supabase if socket fails
            setupSupabaseFallback(scope, mode);
        });
    };

    const setupSupabaseFallback = (scope: string, mode: string) => {
        console.log('[Matchmaking] Attempting Supabase Broadcast fallback...');
        const lobbyName = `discover_lobby_${scope}_${mode}`;
        const channel = supabase!.channel(lobbyName);
        channelRef.current = channel;

        channel
            .on('broadcast', { event: 'match_searching' }, ({ payload }) => {
                if (payload.sessionId !== sessionId && isSearchingRef.current && !isConnectedRef.current && !isConnectingRef.current) {
                    if (sessionId < payload.sessionId) {
                        const sortedIds = [sessionId, payload.sessionId].sort();
                        channel.send({
                            type: 'broadcast',
                            event: 'match_request',
                            payload: {
                                fromSessionId: sessionId,
                                toSessionId: payload.sessionId,
                                channelName: `discover_room_${sortedIds[0]}_${sortedIds[1]}`
                            }
                        });
                    }
                }
            })
            .on('broadcast', { event: 'match_request' }, ({ payload }) => {
                if (payload.toSessionId === sessionId && isSearchingRef.current && !isConnectedRef.current && !isConnectingRef.current) {
                    channel.send({
                        type: 'broadcast',
                        event: 'match_accept',
                        payload: { sessionId, toSessionId: payload.fromSessionId, channelName: payload.channelName }
                    });
                    connectToStranger(mode as any, payload.channelName, false);
                }
            })
            .on('broadcast', { event: 'match_accept' }, ({ payload }) => {
                if (payload.toSessionId === sessionId && isSearchingRef.current && !isConnectedRef.current && !isConnectingRef.current) {
                    connectToStranger(mode as any, payload.channelName, true);
                }
            })
            .subscribe(async (status) => {
                console.log('[Matchmaking] Supabase Fallback Status:', status);
                if (status === 'SUBSCRIBED') {
                    const interval = setInterval(() => {
                        if (isSearchingRef.current && !isConnectedRef.current && !isConnectingRef.current) {
                            channel.send({ type: 'broadcast', event: 'match_searching', payload: { sessionId } });
                        } else {
                            clearInterval(interval);
                        }
                    }, 2000);
                }
            });
    };

    const connectToStranger = async (mode: 'video' | 'text', channelName: string, initiator: boolean) => {
        if (isConnectedRef.current || isConnectingRef.current) {
            console.log('[Matchmaking] Already connected or connecting, ignoring duplicate request');
            return;
        }

        try {
            console.log('[Matchmaking] Transitioning to connected state for channel:', channelName);
            activeChannelNameRef.current = channelName;
            isConnectingRef.current = true;
            setIsConnected(true);
            setIsSearching(false);

            // If we are in fallback mode (no socket), we need to subscribe to the specific room channel
            let signalingChannel = null;
            if (!socketRef.current && supabase) {
                console.log('[Matchmaking] Subscribing to Supabase signaling channel:', channelName);
                signalingChannel = supabase.channel(channelName);
                channelRef.current = signalingChannel; // Keep track for cleanup
            }

            await initWebRTC(channelName, mode, initiator, signalingChannel);

            isConnectingRef.current = false;
            setMessages(prev => [...prev, { sender: 'System', text: 'You are now chatting with a stranger. Say hi!' }]);
        } catch (err) {
            console.error('[Matchmaking] Connection failed:', err);
            isConnectingRef.current = false;
            setIsConnected(false);
            showToast('Connection failed. Try again.', 'error');
            handleNext();
        }
    };

    const initWebRTC = async (channelName: string, mode: 'video' | 'text', initiator: boolean, signalingChannel?: any) => {
        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };

        const pc = new RTCPeerConnection(configuration);
        pcRef.current = pc;

        // Helper to send signals
        const sendSignal = (signal: any) => {
            if (socketRef.current) {
                socketRef.current.emit('webrtc_signal', { room: channelName, signal });
            } else if (signalingChannel) {
                signalingChannel.send({
                    type: 'broadcast',
                    event: 'webrtc_signal',
                    payload: { signal }
                });
            }
        };

        // Handle incoming tracks
        pc.ontrack = (event) => {
            console.log('[WebRTC] Received remote track');
            setRemoteStream(event.streams[0]);
            const remoteVideo = document.getElementById('remote-video-discover') as HTMLVideoElement;
            if (remoteVideo) {
                remoteVideo.srcObject = event.streams[0];
            }
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignal({ type: 'candidate', candidate: event.candidate });
            }
        };

        const handleSignal = async (signal: any) => {
            if (!pcRef.current) return;

            if (signal.type === 'offer') {
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal));
                const answer = await pcRef.current.createAnswer();
                await pcRef.current.setLocalDescription(answer);
                sendSignal(answer);
            } else if (signal.type === 'answer') {
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal));
            } else if (signal.type === 'candidate') {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(signal.candidate));
            }
        };

        // Setup Signaling listener
        if (socketRef.current) {
            socketRef.current.on('webrtc_signal', ({ signal }) => handleSignal(signal));
        } else if (signalingChannel) {
            signalingChannel
                .on('broadcast', { event: 'webrtc_signal' }, ({ payload }: any) => handleSignal(payload.signal))
                .on('broadcast', { event: 'send_message' }, ({ payload }: any) => {
                    // Also handle text messages via broadcast if no socket
                    setMessages(prev => [...prev, { sender: 'Stranger', text: payload.text }]);
                })
                .on('broadcast', { event: 'match_reveal' }, ({ payload }: any) => {
                    // Handle mutual match reveal via broadcast fallback
                    console.log('[Matchmaking] Received match_reveal via broadcast:', payload.users);
                    const partnerProfile = payload.users.find((u: any) => u.id !== currentUser?.id) || payload.users[1];
                    const myProfile = payload.users.find((u: any) => u.id === currentUser?.id) || payload.users[0];

                    if (myProfile && partnerProfile) {
                        setMatchReveal({ myName: myProfile.name, partnerName: partnerProfile.name });
                        setShowMatchReveal(true);
                        showToast(`It's a Match! Names revealed: ${myProfile.name} & ${partnerProfile.name}`, 'success');
                    }
                })
                .subscribe();
        }

        // Add local tracks
        if (mode === 'video') {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                setLocalStream(stream);
                stream.getTracks().forEach(track => pc.addTrack(track, stream));

                const localVideo = document.getElementById('local-video-discover') as HTMLVideoElement;
                if (localVideo) {
                    localVideo.srcObject = stream;
                }
            } catch (err) {
                console.error('Error accessing media devices:', err);
                showToast('Could not access camera/mic', 'error');
            }
        }

        if (initiator) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendSignal(offer);
        }
    };

    const handleNext = () => {
        stopConnection();
        // Short delay to ensure cleanup before restart
        setTimeout(() => startSearch(chatMode, chatScope), 500);
    };

    const stopConnection = () => {
        localStream?.getTracks().forEach(track => track.stop());
        setLocalStream(null);
        setRemoteStream(null);

        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }

        if (socketRef.current) {
            socketRef.current.off('webrtc_signal');
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        if (channelRef.current) {
            supabase?.removeChannel(channelRef.current);
            channelRef.current = null;
        }
        setIsConnected(false);
        setIsSearching(false);
        setPartnerId(null);
        setHasLiked(false);
        setMatchReveal(null);
        setShowMatchReveal(false);
        setMessages([]);
    };

    const handleLike = async () => {
        if (!currentUser || !partnerId || hasLiked) return;

        try {
            console.log(`[Like] Action received: ${currentUser.id} -> ${partnerId} (Room: ${activeChannelNameRef.current})`);
            setHasLiked(true);

            const apiUrl = import.meta.env.VITE_API_URL;
            const useBackend = !(import.meta.env.PROD && (!apiUrl || apiUrl.includes('localhost')));

            if (useBackend) {
                const response = await fetch(`${apiUrl || 'http://localhost:5000'}/api/accept-match`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        myId: currentUser.id,
                        targetId: partnerId,
                        room: activeChannelNameRef.current
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Failed to like');
                }
                const data = await response.json();
                if (data.success) {
                    showToast(data.isMutual ? 'It\'s a Match!' : 'Liked! If they like back, it\'s a match!', 'success');
                }
            } else {
                // Supabase Direct Fallback
                if (!supabase) throw new Error('Database client missing');

                // 1. Insert 'like' swipe
                await supabase.from('swipes').upsert({
                    liker_id: currentUser.id,
                    target_id: partnerId,
                    action: 'like'
                }, { onConflict: 'liker_id,target_id' });

                // 2. Check for mutual match
                const { data: reciprocalSwipe } = await supabase
                    .from('swipes')
                    .select('*')
                    .eq('liker_id', partnerId)
                    .eq('target_id', currentUser.id)
                    .eq('action', 'like')
                    .single();

                if (reciprocalSwipe) {
                    console.log(`[Matchmaking] Mutual match! ${currentUser.id} <-> ${partnerId}`);

                    // 3. Create match and notifications
                    const [user_a, user_b] = [currentUser.id, partnerId].sort();
                    await supabase.from('matches').upsert({ user_a, user_b }, { onConflict: 'user_a,user_b' });

                    await supabase.from('notifications').upsert([
                        { user_id: currentUser.id, type: 'match', title: "It's a Match!", message: 'You have a new match!', from_user_id: partnerId },
                        { user_id: partnerId, type: 'match', title: "It's a Match!", message: 'You have a new match!', from_user_id: currentUser.id }
                    ]);

                    // 4. Get profiles for reveal
                    const { data: profiles } = await supabase.from('profiles').select('id, real_name').in('id', [currentUser.id, partnerId]);

                    if (profiles) {
                        const myProfile = profiles.find(p => p.id === currentUser.id);
                        const partnerProfile = profiles.find(p => p.id === partnerId);

                        const revealData = {
                            users: [
                                { id: currentUser.id, name: myProfile?.real_name || 'Someone' },
                                { id: partnerId, name: partnerProfile?.real_name || 'Someone' }
                            ]
                        };

                        // 5. Reveal to SELF
                        setMatchReveal({
                            myName: myProfile?.real_name || 'Me',
                            partnerName: partnerProfile?.real_name || 'Stranger'
                        });
                        setShowMatchReveal(true);
                        showToast(`It's a Match! Names revealed!`, 'success');

                        // 6. Broadcast to PARTNER
                        if (channelRef.current) {
                            channelRef.current.send({
                                type: 'broadcast',
                                event: 'match_reveal',
                                payload: revealData
                            });
                        }
                    }
                } else {
                    showToast('Liked! If they like back, it\'s a match!', 'success');
                }
            }
        } catch (err: any) {
            console.error('[Like] Error details:', err);
            setHasLiked(false);
            showToast(err.message || 'Failed to send like', 'error');
        }
    };

    const handleExit = () => {
        stopConnection();
        navigate('/discover');
    };

    const sendMessage = () => {
        if (!inputText.trim() || !activeChannelNameRef.current) return;

        const messageText = inputText.trim();
        setMessages(prev => [...prev, { sender: 'You', text: messageText }]);
        setInputText('');

        // Send to peer
        if (socketRef.current) {
            socketRef.current.emit('send_message', {
                room: activeChannelNameRef.current,
                text: messageText,
                sender: sessionId
            });
        } else if (channelRef.current) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'send_message',
                payload: { text: messageText, sender: sessionId }
            });
        }
    };

    const toggleMute = () => {
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = isMuted;
                setIsMuted(!isMuted);
            }
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            const videoTrack = localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = isVideoOff;
                setIsVideoOff(!isVideoOff);
            }
        }
    };

    return (
        <div className="h-full w-full bg-black flex flex-col md:flex-row overflow-hidden text-white font-sans">

            {/* Video Section */}
            <div className={`flex-[3] relative bg-gray-900/50 flex flex-col p-4 gap-4 transition-all duration-500 ${chatMode === 'text' ? 'hidden md:flex opacity-20 pointer-events-none grayscale' : ''}`}>

                {/* Remote Video (Stranger) */}
                <div className="flex-1 relative rounded-3xl overflow-hidden border-2 border-white/5 bg-black shadow-2xl min-h-[300px]">
                    <video id="remote-video-discover" autoPlay playsInline className="w-full h-full object-cover" />

                    {!remoteStream && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 backdrop-blur-sm z-10 p-6 text-center">
                            {isSearching ? (
                                <div className="space-y-6">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full border-4 border-neon/20 border-t-neon animate-spin shadow-[0_0_30px_rgba(255,0,127,0.3)]"></div>
                                        <Shuffle className="w-10 h-10 text-neon absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Searching...</h2>
                                        <p className="text-gray-400 text-sm">Finding someone new from campus</p>
                                    </div>
                                    <button
                                        onClick={handleExit}
                                        className="text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-[0.2em]"
                                    >
                                        Cancel & Exit
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2">
                                        <VideoOff className="text-gray-600" />
                                    </div>
                                    <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Waiting for partner...</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Stranger Info Overlay */}
                    {remoteStream && (
                        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs font-bold uppercase tracking-wider">
                                {matchReveal ? matchReveal.partnerName : 'Stranger'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Local Video (Self) */}
                <div className="h-1/3 md:h-1/2 relative rounded-3xl overflow-hidden border-2 border-neon/30 bg-black shadow-2xl group">
                    <video id="local-video-discover" autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />

                    {/* Self Controls Overlay */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
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

                    {!localStream && !isSearching && !isConnected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                            <VideoIcon className="w-12 h-12 text-gray-700" />
                        </div>
                    )}
                </div>

                {/* Action Bar (Bottom Mobile) */}
                {(isConnected || isSearching) && (
                    <div className="flex gap-4 z-30">
                        {isConnected && (
                            <>
                                <button
                                    onClick={handleNext}
                                    className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 border border-white/10 group"
                                >
                                    <SkipForward className="group-hover:translate-x-1 transition-transform" />
                                    Next Stranger
                                </button>

                                <button
                                    onClick={handleLike}
                                    disabled={hasLiked}
                                    className={`px-6 py-4 rounded-2xl transition-all border flex items-center justify-center gap-2 font-bold ${hasLiked
                                        ? 'bg-red-500 text-white border-red-500'
                                        : 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white'
                                        }`}
                                >
                                    <Heart className={hasLiked ? 'fill-current' : ''} size={20} />
                                    {hasLiked ? 'Liked' : 'Like'}
                                </button>
                            </>
                        )}

                        <button
                            onClick={stopConnection}
                            className="px-6 py-4 bg-gray-500/10 hover:bg-gray-500 text-gray-500 hover:text-white font-bold rounded-2xl transition-all border border-gray-500/30"
                        >
                            {isConnected ? 'Stop' : 'Cancel'}
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
                                {msg.sender === 'Stranger' && matchReveal ? matchReveal.partnerName : msg.sender}
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

            {/* Match Reveal Overlay */}
            {showMatchReveal && matchReveal && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in duration-500">
                    <div className="relative text-center p-8 max-w-lg w-full transform animate-in zoom-in-95 duration-700">
                        {/* Celebration Particles */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none h-screen w-screen -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
                            {[...Array(30)].map((_, i) => (
                                <div
                                    key={i}
                                    className="absolute animate-float-up"
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        bottom: `-50px`,
                                        animationDelay: `${Math.random() * 3}s`,
                                        color: i % 2 === 0 ? '#FF007F' : '#00F3FF'
                                    }}
                                >
                                    <Heart size={Math.random() * 30 + 10} fill="currentColor" />
                                </div>
                            ))}
                        </div>

                        <div className="relative z-10">
                            <Sparkles className="w-24 h-24 text-neon mx-auto mb-6 animate-bounce drop-shadow-[0_0_30px_rgba(255,0,127,0.8)]" />

                            <h2 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon to-blue-400 uppercase tracking-tighter mb-8 italic leading-none">
                                It's a Match!
                            </h2>

                            <div className="flex items-center justify-center gap-8 mb-12">
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">You</p>
                                    <p className="text-3xl font-black text-white">{matchReveal.myName}</p>
                                </div>
                                <div className="h-16 w-[1px] bg-gradient-to-b from-transparent via-white/40 to-transparent"></div>
                                <div className="text-left">
                                    <p className="text-[10px] font-bold text-neon uppercase tracking-widest mb-1">Matched With</p>
                                    <p className="text-3xl font-black text-white">{matchReveal.partnerName}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <button
                                    onClick={() => setShowMatchReveal(false)}
                                    className="w-full py-5 bg-neon text-white font-black rounded-2xl shadow-[0_0_50px_rgba(255,0,127,0.5)] hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-[0.2em]"
                                >
                                    Keep Chatting
                                </button>
                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.3em] animate-pulse">
                                    Connection Secured • Names Revealed
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div >
    );
};

export default Discover;
