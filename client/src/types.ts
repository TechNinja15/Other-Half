
export interface UserProfile {
  id: string;
  anonymousId: string;
  realName: string;
  gender: string;
  university: string;
  universityEmail: string;
  branch: string;
  year: string;
  interests: string[];
  bio: string;
  isVerified: boolean;
  avatar?: string;
  isPremium?: boolean; // New field for premium status
}

export interface MatchProfile extends Omit<UserProfile, 'universityEmail'> {
  matchPercentage: number;
  distance: string;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface ChatSession {
  matchId: string;
  userA: string;
  userB: string;
  messages: Message[];
  lastUpdated: number;
  isRevealed: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  type: 'match' | 'message' | 'system';
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  timestamp: number;
}

export interface Confession {
  id: string;
  userId: string; // Anonymous ID of poster
  text: string;
  imageUrl?: string;
  timestamp: number;
  likes: number; // Kept for backwards compatibility/total count
  reactions?: Record<string, number>; // New: e.g. { '🔥': 5, '😂': 2 }
  comments: Comment[];
  university: string;
}

export enum CallType {
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO'
}
