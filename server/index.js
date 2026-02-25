import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = pkg;
import { createClient } from '@supabase/supabase-js';
import { Server } from 'socket.io';

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = parseInt(process.env.PORT || '5000', 10);

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://othrhalff.in',
    'https://www.othrhalff.in',
    'https://othrhalff.vercel.app',
    'https://otherhalf.vercel.app',
    'https://www.otherhalf.vercel.app',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

const io = new Server(server, {
  cors: corsOptions
});

// Simple in-memory matchmaking lobby
const lobbies = {
  'campus_video': [],
  'campus_text': [],
  'global_video': [],
  'global_text': []
};

// --- Routes ---

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) return res.json({ status: 'warning' });
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.from('profiles').select('count').limit(1);
    res.json({ status: 'ok', supabase: error ? 'error' : 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Accept Match API
app.post('/api/accept-match', async (req, res) => {
  try {
    const { myId, targetId, room } = req.body;
    console.log(`[Like] Action received: ${myId} -> ${targetId} (Room: ${room})`);

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) throw new Error('Supabase credentials missing');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Insert 'like' swipe
    await supabase.from('swipes').upsert({ liker_id: myId, target_id: targetId, action: 'like' }, { onConflict: 'liker_id,target_id' });

    // 2. Check for mutual match
    const { data: reciprocalSwipe } = await supabase.from('swipes').select('*').eq('liker_id', targetId).eq('target_id', myId).eq('action', 'like').single();

    if (reciprocalSwipe) {
      console.log(`[Matchmaking] Mutual match! ${myId} <-> ${targetId}`);
      const [user_a, user_b] = [myId, targetId].sort();
      await supabase.from('matches').upsert({ user_a, user_b }, { onConflict: 'user_a,user_b' });

      await supabase.from('notifications').upsert([
        { user_id: myId, type: 'match', title: "It's a Match!", message: 'You have a new match!', from_user_id: targetId },
        { user_id: targetId, type: 'match', title: "It's a Match!", message: 'You have a new match!', from_user_id: myId }
      ]);

      const { data: profiles } = await supabase.from('profiles').select('id, real_name').in('id', [myId, targetId]);
      if (profiles) {
        const myProfile = profiles.find(p => p.id === myId);
        const targetProfile = profiles.find(p => p.id === targetId);

        // Use provided room name as priority, fallback to generated one
        const roomName = room || `discover_room_${[myId, targetId].sort().join('_')}`;
        console.log(`[Matchmaking] Emitting match_reveal to room: ${roomName}`);

        io.to(roomName).emit('match_reveal', {
          users: [
            { id: myId, name: myProfile?.real_name || 'Someone' },
            { id: targetId, name: targetProfile?.real_name || 'Someone' }
          ]
        });
      }
    }
    res.json({ success: true, isMutual: !!reciprocalSwipe });
  } catch (error) {
    console.error('[Like] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Socket Events
io.on('connection', (socket) => {
  socket.on('join_lobby', ({ scope, mode, sessionId, userId }) => {
    const lobbyKey = `${scope}_${mode}`;
    const lobby = lobbies[lobbyKey];
    if (!lobby) return;

    const waitingUser = lobby.find(u => u.sessionId !== sessionId);
    if (waitingUser) {
      const channelName = `discover_room_${[sessionId, waitingUser.sessionId].sort().join('_')}`;
      socket.join(channelName);
      const peerSocket = io.sockets.sockets.get(waitingUser.socketId);
      if (peerSocket) peerSocket.join(channelName);

      io.to(socket.id).emit('match_found', { peerId: waitingUser.sessionId, peerUserId: waitingUser.userId, channelName, initiator: true });
      io.to(waitingUser.socketId).emit('match_found', { peerId: sessionId, peerUserId: userId, channelName, initiator: false });

      const index = lobby.indexOf(waitingUser);
      if (index > -1) lobby.splice(index, 1);
    } else {
      lobby.push({ socketId: socket.id, sessionId, userId });
    }
  });

  socket.on('send_message', ({ room, text, sender }) => {
    socket.to(room).emit('receive_message', { text, sender });
  });

  // WebRTC Signaling
  socket.on('webrtc_signal', ({ room, signal }) => {
    // Relay the signal (offer, answer, or ice-candidate) to everyone else in the room
    socket.to(room).emit('webrtc_signal', { signal, from: socket.id });
  });

  socket.on('disconnect', () => {
    Object.keys(lobbies).forEach(k => lobbies[k] = lobbies[k].filter(u => u.socketId !== socket.id));
  });
});

server.listen(port, () => console.log(`Server running on port ${port}`));
