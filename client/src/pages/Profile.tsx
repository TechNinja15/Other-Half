
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';
import { authService } from '../services/auth';
import { NeonButton, NeonInput } from '../components/Common';
import { Edit2, Camera, Save, Ghost, User, GraduationCap, CheckCircle2, AlertTriangle, LogOut, ChevronDown, Settings } from 'lucide-react';
import { APP_NAME, AVATAR_PRESETS, CHHATTISGARH_COLLEGES } from '../constants';

export const Profile: React.FC = () => {
  const { currentUser, updateProfile, logout } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

  const startEditing = () => {
    if (!currentUser) return;
    setEditForm(currentUser);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = () => {
    if (!editForm) return;
    updateProfile(editForm);
    setIsEditingProfile(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await authService.uploadAvatar(file);
      setEditForm(prev => ({ ...prev, avatar: base64 }));
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar bg-black text-white">
      <div className="p-6 pb-32 md:pb-10 max-w-3xl mx-auto">
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black text-white">My Profile</h2>
          {!isEditingProfile && (
            <button 
              onClick={startEditing} 
              className="flex items-center gap-2 text-xs md:text-sm font-bold text-neon border border-neon px-4 py-2 rounded-full hover:bg-neon hover:text-white transition-all"
            >
              <Edit2 className="w-4 h-4" /> <span>Edit</span>
            </button>
          )}
        </div>
        
        {isEditingProfile ? (
          <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-3xl animate-fade-in">
             <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Edit2 className="w-5 h-5 text-neon" /> Edit Details</h3>
             
             <div className="flex flex-col items-center mb-8">
                <div className="relative w-24 h-24 rounded-full bg-gray-800 border-2 border-neon overflow-hidden group cursor-pointer">
                   <img src={editForm.avatar || currentUser?.avatar} alt="Avatar" className="w-full h-full object-cover" />
                   <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>
                <span className="text-xs text-gray-400 mt-2">Tap to change photo</span>
                
                <div className="flex gap-2 mt-4 overflow-x-auto w-full justify-center no-scrollbar">
                  {AVATAR_PRESETS.slice(0, 5).map((avatar, i) => (
                    <button 
                      key={i}
                      onClick={() => setEditForm({...editForm, avatar})}
                      className={`w-10 h-10 rounded-full border-2 flex-shrink-0 overflow-hidden ${editForm.avatar === avatar ? 'border-neon' : 'border-gray-700'}`}
                    >
                      <img src={avatar} alt="" className="w-full h-full bg-gray-800" />
                    </button>
                  ))}
                </div>
             </div>

             <div className="space-y-4">
               <div>
                 <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Real Name</label>
                 <NeonInput value={editForm.realName} onChange={e => setEditForm({...editForm, realName: e.target.value})} />
               </div>
               <div>
                  <label className="text-xs text-gray-500 uppercase font-bold block mb-1">University</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-gray-900 border-2 border-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:border-neon appearance-none h-[52px] pr-10 text-sm"
                      value={editForm.university}
                      onChange={e => setEditForm({...editForm, university: e.target.value})}
                    >
                      {CHHATTISGARH_COLLEGES.map(college => (
                        <option key={college} value={college}>{college}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Branch</label>
                   <NeonInput value={editForm.branch} onChange={e => setEditForm({...editForm, branch: e.target.value})} />
                 </div>
                 <div>
                   <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Year</label>
                   <div className="relative">
                    <select 
                      className="w-full bg-gray-900 border-2 border-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:border-neon appearance-none h-[52px] pr-10"
                      value={editForm.year}
                      onChange={e => setEditForm({...editForm, year: e.target.value})}
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
                 <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Bio</label>
                 <textarea 
                   className="w-full bg-gray-900 border-2 border-gray-800 text-white px-4 py-3 rounded-xl outline-none focus:border-neon h-24 resize-none"
                   value={editForm.bio}
                   onChange={e => setEditForm({...editForm, bio: e.target.value})}
                 />
               </div>
               
               <div className="flex gap-3 pt-4">
                  <NeonButton onClick={handleSaveProfile} className="flex-1 flex items-center justify-center gap-2">
                     <Save className="w-4 h-4" /> Save
                  </NeonButton>
                  <NeonButton variant="secondary" onClick={() => setIsEditingProfile(false)} className="flex-1">
                     Cancel
                  </NeonButton>
               </div>
             </div>
          </div>
        ) : (
          // Display Mode
          <div className="bg-gray-900/50 border border-gray-800 p-5 md:p-8 rounded-3xl relative overflow-hidden mb-8 shadow-lg">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <Ghost className="w-32 h-32" />
            </div>
            
            <div className="relative z-10">
                {/* Identity Header */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 mb-6 text-center md:text-left">
                  <div className="relative">
                    <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-neon overflow-hidden bg-black shadow-[0_0_15px_rgba(255,0,127,0.3)]">
                      {currentUser?.avatar ? (
                        <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600"><User className="w-10 h-10" /></div>
                      )}
                    </div>
                    {currentUser?.isVerified && (
                      <div className="absolute bottom-0 right-0 bg-black rounded-full p-1 border border-gray-800">
                        <CheckCircle2 className="w-5 h-5 text-green-500 fill-black" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-500 text-[10px] uppercase tracking-[0.2em] mb-1 font-bold">Identity</p>
                    <h3 className="text-3xl md:text-4xl font-black text-white mb-1 truncate">{currentUser?.realName}</h3>
                    <p className="text-neon font-mono text-sm bg-neon/10 inline-block px-2 py-0.5 rounded">{currentUser?.anonymousId}</p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="bg-black/40 rounded-2xl p-4 mb-6 backdrop-blur-sm border border-gray-800/50">
                   <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                      <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-xs border border-gray-700">{currentUser?.gender}</span>
                      <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-xs border border-gray-700">{currentUser?.branch}</span>
                      <span className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-xs border border-gray-700">{currentUser?.year}</span>
                   </div>
                   <div className="flex items-start justify-center md:justify-start gap-2 text-gray-400 border-t border-gray-700/50 pt-3 text-center md:text-left">
                      <GraduationCap className="w-4 h-4 text-neon mt-0.5 flex-shrink-0" />
                      <span className="text-xs font-medium leading-relaxed">{currentUser?.university || "University not set"}</span>
                   </div>
                </div>

                {/* Bio */}
                <div className="mb-6">
                  <h4 className="text-xs text-gray-500 uppercase font-bold mb-2 tracking-wider">Bio</h4>
                  <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-800/50">
                    <p className="text-gray-200 italic text-sm leading-relaxed">"{currentUser?.bio || "No bio set yet. Click edit to add one!"}"</p>
                  </div>
                </div>

                {/* Interests */}
                <div>
                  <h4 className="text-xs text-gray-500 uppercase font-bold mb-2 tracking-wider">Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentUser?.interests && currentUser.interests.length > 0 ? currentUser.interests.map(i => (
                        <span key={i} className="text-neon text-xs bg-neon/10 px-3 py-1.5 rounded-full border border-neon/20 font-bold">#{i}</span>
                    )) : (
                      <span className="text-gray-500 text-xs italic">No interests added.</span>
                    )}
                  </div>
                </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 gap-3 mb-8">
          <NeonButton variant="secondary" className="w-full justify-start group h-12" onClick={() => alert('Settings not implemented in demo.')}>
             <Settings className="w-4 h-4 mr-3 text-gray-400 group-hover:text-neon transition-colors" /> 
             <span className="mr-auto text-sm">Account Settings</span>
          </NeonButton>
          
          <NeonButton variant="secondary" className="w-full justify-start group h-12" onClick={() => alert('Report submitted.')}>
            <AlertTriangle className="w-4 h-4 mr-3 text-gray-400 group-hover:text-neon transition-colors" /> 
            <span className="mr-auto text-sm">Report an Issue</span>
          </NeonButton>
          
          <NeonButton variant="danger" className="w-full justify-start mt-2 h-12" onClick={logout}>
            <LogOut className="w-4 h-4 mr-3" /> <span className="mr-auto text-sm">Logout</span>
          </NeonButton>
        </div>

        <div className="text-center pb-4">
           <Ghost className="w-6 h-6 text-gray-800 mx-auto mb-2" />
           <p className="text-gray-700 text-[10px] font-mono">ID: {currentUser?.id}</p>
           <p className="text-gray-600 text-xs mt-1">Version 1.2.0 • {APP_NAME}</p>
        </div>
      </div>
    </div>
  );
};
