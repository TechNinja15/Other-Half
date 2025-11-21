
import { MatchProfile, Notification } from './types';

export const MOCK_INTERESTS = [
  "Coding", "Gaming", "Anime", "Music", "Art", "Photography", 
  "Reading", "Travel", "Fitness", "Coffee", "Startups", "AI"
];

export const AVATAR_PRESETS = [
  // Female-leaning seeds (Indices 0-3)
  "https://api.dicebear.com/9.x/notionists/svg?seed=Lola",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Zoe",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Mila",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Sara",
  // Male-leaning seeds (Indices 4-7)
  "https://api.dicebear.com/9.x/notionists/svg?seed=Leo",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Ryan",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Caleb",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Nathan"
];

export const CHHATTISGARH_COLLEGES = [
  "National Institute of Technology (NIT), Raipur",
  "Indian Institute of Management (IIM), Raipur",
  "Indian Institute of Technology (IIT), Bhilai",
  "International Institute of Information Technology (IIIT), Naya Raipur",
  "Hidayatullah National Law University (HNLU), Raipur",
  "All India Institute of Medical Sciences (AIIMS), Raipur",
  "Pt. Ravishankar Shukla University (PRSU), Raipur",
  "Chhattisgarh Swami Vivekanand Technical University (CSVTU), Bhilai",
  "Guru Ghasidas Vishwavidyalaya (GGU), Bilaspur",
  "Indira Gandhi Krishi Vishwavidyalaya (IGKV), Raipur",
  "Kushabhau Thakre Journalism University (KTUJM), Raipur",
  "Ayush and Health Sciences University of Chhattisgarh, Raipur",
  "OP Jindal University, Raigarh",
  "ITM University, Raipur",
  "MATS University, Raipur",
  "Kalinga University, Raipur",
  "Amity University, Raipur",
  "ICFAI University, Raipur",
  "ISBM University, Gariyaband",
  "Dr. C.V. Raman University, Bilaspur",
  "Shri Shankaracharya Professional University, Bhilai",
  "AAFT University, Raipur",
  "Shri Rawatpura Sarkar University, Raipur",
  "Bhilai Institute of Technology (BIT), Bhilai",
  "Rungta College of Engineering and Technology, Bhilai",
  "Government Engineering College (GEC), Raipur",
  "Government Engineering College (GEC), Bilaspur",
  "Government Engineering College (GEC), Jagdalpur",
  "Pt. J.N.M. Medical College, Raipur",
  "Other"
];

export const MOCK_MATCHES: MatchProfile[] = [
  {
    id: 'm1',
    anonymousId: 'User#X92A',
    realName: 'Sarah Chen',
    gender: 'Female',
    university: 'National Institute of Technology (NIT), Raipur',
    branch: 'Computer Science',
    year: 'Junior',
    interests: ['AI', 'Sci-Fi', 'Coffee'],
    bio: 'Looking for a study buddy who loves neural networks.',
    matchPercentage: 95,
    distance: '0.5 miles',
    isVerified: true,
    avatar: AVATAR_PRESETS[0] // Lola
  },
  {
    id: 'm2',
    anonymousId: 'User#B44Z',
    realName: 'Marcus Cole',
    gender: 'Male',
    university: 'AAFT University, Raipur',
    branch: 'Fine Arts',
    year: 'Senior',
    interests: ['Photography', 'Indie Music', 'Travel'],
    bio: 'I capture moments. Let’s find some neon lights.',
    matchPercentage: 88,
    distance: '1.2 miles',
    isVerified: true,
    avatar: AVATAR_PRESETS[4] // Leo
  },
  {
    id: 'm3',
    anonymousId: 'User#L88Q',
    realName: 'Alex Rivera',
    gender: 'Male',
    university: 'Indian Institute of Technology (IIT), Bhilai',
    branch: 'Mechanical Eng',
    year: 'Sophomore',
    interests: ['Robotics', 'Formula 1', 'Gym'],
    bio: 'Building things that move fast.',
    matchPercentage: 82,
    distance: 'Campus Dorm A',
    isVerified: true,
    avatar: AVATAR_PRESETS[5] // Ryan
  },
  {
    id: 'm4',
    anonymousId: 'User#K22P',
    realName: 'Emily Watson',
    gender: 'Female',
    university: 'Pt. Ravishankar Shukla University (PRSU), Raipur',
    branch: 'Psychology',
    year: 'Freshman',
    interests: ['Reading', 'Meditation', 'Jazz'],
    bio: 'Trying to understand how minds work.',
    matchPercentage: 75,
    distance: 'Library',
    isVerified: true,
    avatar: AVATAR_PRESETS[2] // Mila
  },
  {
    id: 'm5',
    anonymousId: 'User#J77T',
    realName: 'Jessica Lee',
    gender: 'Female',
    university: 'AIIMS, Raipur',
    branch: 'Biology',
    year: 'Senior',
    interests: ['Hiking', 'Photography', 'Sushi'],
    bio: 'Nature lover and science geek.',
    matchPercentage: 90,
    distance: '2.0 miles',
    isVerified: true,
    avatar: AVATAR_PRESETS[1] // Zoe
  },
  {
    id: 'm6',
    anonymousId: 'User#D99R',
    realName: 'David Kim',
    gender: 'Male',
    university: 'IIM Raipur',
    branch: 'Economics',
    year: 'Junior',
    interests: ['Finance', 'Basketball', 'Stocks'],
    bio: 'Stonks only go up. Lets hoop.',
    matchPercentage: 85,
    distance: '1.0 miles',
    isVerified: true,
    avatar: AVATAR_PRESETS[6] // Caleb
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    title: "It's a Match!",
    message: "You and User#X92A liked each other. Start chatting now!",
    timestamp: Date.now() - 1000 * 60 * 5,
    read: false,
    type: 'match'
  },
  {
    id: 'n2',
    title: "Welcome to Other Half",
    message: "Your student profile has been verified. You can now start swiping.",
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    read: true,
    type: 'system'
  },
  {
    id: 'n3',
    title: "New Feature",
    message: "Video calls are now end-to-end encrypted for your safety.",
    timestamp: Date.now() - 1000 * 60 * 60 * 48,
    read: true,
    type: 'system'
  }
];

export const APP_NAME = "Other Half";
