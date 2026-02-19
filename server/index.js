import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import pkg from 'agora-access-token';
const { RtcTokenBuilder, RtcRole } = pkg;
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);

// CORS Configuration - Allow both production and development origins
const corsOptions = {
  origin: [
    'http://localhost:5173', // Local Vite dev server
    'http://localhost:3000', // Alternative local port
    'https://testing-of-client.vercel.app', // Old Production frontend
    'https://othrhalff.in', // New Domain
    'https://www.othrhalff.in', // New Domain (www)
    'https://othrhalff.vercel.app', // New Vercel Domain
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.json({
        status: 'warning',
        message: 'Supabase credentials partially missing in server env'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Attempt a simple query to check connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);

    res.json({
      status: 'ok',
      supabase: error ? 'error' : 'connected',
      supabaseError: error ? error.message : null,
      env: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey && supabaseKey !== 'placeholder-service-key'
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// Agora: Generate RTC Token for Video/Audio Call
app.post('/api/agora-token', async (req, res) => {
  try {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      console.warn('[AgoraToken] Credentials missing in environment');
      throw new Error('Agora credentials not configured');
    }

    // Use channelName from body if provided, else generate unique one
    const channelName = req.body.channelName || `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[AgoraToken] Generating token for channel: ${channelName}`);

    // Use a simple uid (0 means auto-assign)
    const uid = 0;

    // Token valid for 24 hours
    const expirationTimeInSeconds = 86400;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Generate token with publisher role (can send and receive)
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    console.log(`[AgoraToken] Successfully generated token for ${channelName}`);
    res.json({
      token,
      channelName,
      appId,
      uid: uid.toString()
    });
  } catch (error) {
    console.error('[AgoraToken] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Agora: Initiate Call with Database Session
app.post('/api/initiate-call', async (req, res) => {
  try {
    const { receiverId, matchId } = req.body;

    if (!receiverId || !matchId) {
      return res.status(400).json({ error: 'receiverId and matchId are required' });
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      throw new Error('Agora credentials not configured');
    }

    // Generate unique channel name
    const channelName = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const uid = 0;
    const expirationTimeInSeconds = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Generate token
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );

    // Return call session info (caller will insert into Supabase)
    res.json({
      channelName,
      token,
      appId,
      uid: uid.toString()
    });
  } catch (error) {
    console.error('Error initiating call:', error);
    res.status(500).json({ error: error.message });
  }
});

// Accept Match API (for Service Worker)
app.post('/api/accept-match', async (req, res) => {
  try {
    const { myId, targetId, room } = req.body;

    if (!myId || !targetId) {
      return res.status(400).json({ success: false, error: 'Missing myId or targetId' });
    }

    if (myId === targetId) {
      console.warn(`[Like] User ${myId} liked themselves. Allowing for testing purposes.`);
      // We don't return 400 here to allow the user to test the UI flow on their own.
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    // FIX: Use the Service Role Key to bypass RLS for background actions
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials missing in server env (Check SUPABASE_SERVICE_ROLE_KEY)');
    }

    // Initialize with Service Role Key
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`[Like] Attempting like from ${myId} to ${targetId} in room ${room}`);

    if (!myId || !targetId) {
      return res.status(400).json({ success: false, error: 'Missing myId or targetId' });
    }

    // 1. Insert 'like' swipe
    const { error: swipeError } = await supabase.from('swipes').upsert({
      liker_id: myId,
      target_id: targetId,
      action: 'like'
    }, { onConflict: 'liker_id,target_id' });

    if (swipeError) {
      console.error('[Like] Supabase error:', swipeError);
      throw swipeError;
    }

    // 2. Check for mutual match
    const { data: reciprocalSwipe, error: reciprocalError } = await supabase
      .from('swipes')
      .select('*')
      .eq('liker_id', targetId)
      .eq('target_id', myId)
      .eq('action', 'like')
      .single();

    if (reciprocalSwipe && !reciprocalError) {
      console.log(`[Matchmaking] Mutual match detected between ${myId} and ${targetId}`);

      // Fetch names for reveal
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, real_name')
        .in('id', [myId, targetId]);

      if (profileError) {
        console.error('[Like] Match found but profile fetch failed:', profileError);
      } else if (profiles) {
        const myProfile = profiles.find(p => p.id === myId);
        const targetProfile = profiles.find(p => p.id === targetId);

        // Notify via Socket.io
        const roomName = `discover_room_${[myId, targetId].sort().join('_')}`;
        // We need to find the room name. In Discover mode, we use sessionId-based names.
        // The client currently uses sessionId for rooms. We should probably use the roomId from the request if provided.
        const { room } = req.body;

        io.to(room || roomName).emit('match_reveal', {
          users: [
            { id: myId, name: myProfile?.real_name || 'Someone' },
            { id: targetId, name: targetProfile?.real_name || 'Someone' }
          ]
        });
      }
    }

    res.json({ success: true, message: 'Match accepted', isMutual: !!reciprocalSwipe });

  } catch (error) {
    console.error('[Like] Endpoint crash:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      detail: error.stack
    });
  }
});


app.get('/', (req, res) => {
  res.send('Backend API is running. Use the Vercel Frontend to interact.');
});

import { Server } from 'socket.io';

const server = http.createServer(app);
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

io.on('connection', (socket) => {
  console.log('User connected to socket:', socket.id);

  socket.on('join_lobby', ({ scope, mode, sessionId, userId }) => {
    const lobbyKey = `${scope}_${mode}`;
    const lobby = lobbies[lobbyKey];

    if (!lobby) return;

    // Check if we already have someone waiting
    const waitingUser = lobby.find(u => u.sessionId !== sessionId);

    if (waitingUser) {
      // Small delay to simulate finding someone
      setTimeout(() => {
        // MATCH FOUND!
        const channelName = `discover_room_${[sessionId, waitingUser.sessionId].sort().join('_')}`;

        // Ensure both sockets join the room for chat
        socket.join(channelName);
        const peerSocket = io.sockets.sockets.get(waitingUser.socketId);
        if (peerSocket) peerSocket.join(channelName);

        // Notify both users
        io.to(socket.id).emit('match_found', {
          peerId: waitingUser.sessionId,
          peerUserId: waitingUser.userId,
          channelName,
          initiator: true
        });
        io.to(waitingUser.socketId).emit('match_found', {
          peerId: sessionId,
          peerUserId: userId,
          channelName,
          initiator: false
        });

        // Remove matched user from lobby
        const index = lobby.indexOf(waitingUser);
        if (index > -1) lobby.splice(index, 1);
      }, 1000);
    } else {
      // Add self to lobby
      lobby.push({ socketId: socket.id, sessionId, userId });
      console.log(`User ${sessionId} (${userId}) waiting in ${lobbyKey}`);
    }
  });

  socket.on('send_message', ({ room, text, sender }) => {
    console.log(`[Chat] Message in ${room} from ${sender}: ${text}`);
    // Broadcast to the room EXCEPT sender
    socket.to(room).emit('receive_message', { text, sender });
  });

  socket.on('disconnect', () => {
    // Remove from all lobbies
    Object.keys(lobbies).forEach(key => {
      lobbies[key] = lobbies[key].filter(u => u.socketId !== socket.id);
    });
    console.log('User disconnected:', socket.id);
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
