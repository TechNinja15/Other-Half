
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { NeonInput, NeonButton } from '../components/Common';
import { Ghost, Upload, Lock, ChevronDown } from 'lucide-react';
import { AVATAR_PRESETS, MOCK_INTERESTS, CHHATTISGARH_COLLEGES } from '../constants';
import { authService } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

export const Onboarding: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || 'student@university.edu';

  const [tempProfile, setTempProfile] = useState<Partial<UserProfile>>({ 
    interests: [], 
    gender: 'Male',
    university: CHHATTISGARH_COLLEGES[0],
    avatar: AVATAR_PRESETS[0]
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await authService.uploadAvatar(file);
      setTempProfile(prev => ({ ...prev, avatar: base64 }));
    }
  };

  const toggleInterest = (interest: string) => {
    setTempProfile(prev => {
      const current = prev.interests || [];
      if (current.includes(interest)) return { ...prev, interests: current.filter(i => i !== interest) };
      if (current.length >= 5) return prev;
      return { ...prev, interests: [...current, interest] };
    });
  };

  const handleCreateProfile = () => {
    const newUser: UserProfile = {
      id: `u${Date.now()}`,
      anonymousId: `User#${Math.floor(Math.random() * 10000).toString(16).toUpperCase()}`,
      realName: tempProfile.realName || 'Anonymous Student',
      gender: tempProfile.gender || 'Male',
      university: tempProfile.university || CHHATTISGARH_COLLEGES[0],
      universityEmail: email,
      isVerified: true,
      branch: tempProfile.branch || 'General',
      year: tempProfile.year || 'Freshman',
      interests: tempProfile.interests || [],
      bio: tempProfile.bio || '',
      avatar: tempProfile.avatar || AVATAR_PRESETS[0]
    };
    
    login(newUser);
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
       <div className="w-full max-w-2xl bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl border border-gray-800 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-white text-center">Create Your Persona</h2>
            
            <div className="flex flex-col items-center mb-6">
              <label className="block text-sm text-gray-400 mb-3">Choose Avatar or Upload Photo</label>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-neon overflow-hidden relative group">
                  {tempProfile.avatar ? (
                    <img src={tempProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Ghost className="w-12 h-12 text-gray-600 m-auto mt-5" />
                  )}
                  <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Upload className="w-6 h-6 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto max-w-full pb-2 custom-scrollbar">
                {AVATAR_PRESETS.map((avatar, i) => (
                  <button 
                    key={i}
                    onClick={() => setTempProfile({...tempProfile, avatar})}
                    className={`w-10 h-10 rounded-full border-2 overflow-hidden flex-shrink-0 ${tempProfile.avatar === avatar ? 'border-neon scale-110' : 'border-gray-700 opacity-50 hover:opacity-100'}`}
                  >
                    <img src={avatar} alt={`Preset ${i}`} className="w-full h-full bg-gray-800" />
                  </button>
                ))}
              </div>
            </div>

            <div>
                <label className="block text-sm text-gray-400 mb-1">College / University</label>
                <div className="relative">
                  <select 
                    className="w-full bg-gray-900 border-2 border-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:border-neon appearance-none h-[52px] pr-10"
                    value={tempProfile.university}
                    onChange={e => setTempProfile({...tempProfile, university: e.target.value})}
                  >
                    {CHHATTISGARH_COLLEGES.map(college => (
                      <option key={college} value={college}>{college}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Real Name</label>
                <NeonInput 
                  value={tempProfile.realName || ''} 
                  onChange={e => setTempProfile({...tempProfile, realName: e.target.value})} 
                  placeholder="Jane Doe"
                />
                <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1"><Lock className="w-3 h-3" /> Hidden until match</p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Gender</label>
                <div className="relative">
                  <select 
                    className="w-full bg-gray-900 border-2 border-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:border-neon appearance-none h-[52px] pr-10"
                    value={tempProfile.gender}
                    onChange={e => setTempProfile({...tempProfile, gender: e.target.value})}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Branch / Major</label>
                <NeonInput 
                  value={tempProfile.branch || ''} 
                  onChange={e => setTempProfile({...tempProfile, branch: e.target.value})} 
                  placeholder="e.g., CS"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Year</label>
                <div className="relative">
                  <select 
                    className="w-full bg-gray-900 border-2 border-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:border-neon appearance-none h-[52px] pr-10"
                    onChange={e => setTempProfile({...tempProfile, year: e.target.value})}
                  >
                    <option>Freshman</option>
                    <option>Sophomore</option>
                    <option>Junior</option>
                    <option>Senior</option>
                    <option>Grad</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Interests (Max 5)</label>
              <div className="flex flex-wrap gap-2">
                {MOCK_INTERESTS.map(interest => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${
                      (tempProfile.interests || []).includes(interest)
                        ? 'bg-neon border-neon text-white shadow-neon-sm'
                        : 'bg-transparent border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Anonymous Bio</label>
              <textarea 
                className="w-full bg-gray-900 border-2 border-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:border-neon h-24 resize-none"
                placeholder="Describe yourself without revealing your name..."
                onChange={e => setTempProfile({...tempProfile, bio: e.target.value})}
              />
            </div>

            <NeonButton className="w-full" onClick={handleCreateProfile}>Enter The Void</NeonButton>
          </div>
       </div>
    </div>
  );
};
