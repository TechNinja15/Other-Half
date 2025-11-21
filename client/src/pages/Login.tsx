
import React, { useState } from 'react';
import { RotateCcw, Ghost, Mail, ArrowRight } from 'lucide-react';
import { NeonInput, NeonButton } from '../components/Common';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleEmailContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes('@') && email.includes('.')) {
      // Direct navigation to onboarding for demo purposes (skipping code verification)
      navigate('/onboarding', { state: { email } });
    } else {
      alert('Please enter a valid email address.');
    }
  };

  const handleSocialLogin = (provider: 'google' | 'apple') => {
    // Simulation of social auth
    const mockEmail = provider === 'google' ? 'user@gmail.com' : 'user@icloud.com';
    navigate('/onboarding', { state: { email: mockEmail } });
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black p-6 relative overflow-hidden pb-20">
      {/* Background Animations - Slowed */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-neon opacity-10 blur-[150px] rounded-full animate-pulse-slow" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600 opacity-10 blur-[150px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }} />
      
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 text-gray-500 hover:text-white flex items-center gap-2 z-20 transition-colors"
      >
        <RotateCcw className="w-4 h-4" /> Back to Home
      </button>

      <div className="w-full max-w-md z-10 bg-gray-900/50 backdrop-blur-xl p-8 rounded-3xl border border-gray-800 shadow-2xl my-auto animate-fade-in">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-700 shadow-neon-sm">
            <Ghost className="w-8 h-8 text-neon" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">
            Welcome <span className="text-neon">Back</span>
          </h1>
          <p className="text-gray-400 text-sm">Sign in to find your other half.</p>
        </div>

        <div className="space-y-4 mb-8">
          <button 
            onClick={() => handleSocialLogin('google')}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-3.5 rounded-xl hover:bg-gray-200 transition-all active:scale-95"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <button 
            onClick={() => handleSocialLogin('apple')}
            className="w-full flex items-center justify-center gap-3 bg-gray-800 text-white font-bold py-3.5 rounded-xl border border-gray-700 hover:bg-gray-700 transition-all active:scale-95"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.45-1.62 4.75-1.43 1.05.1 1.93.49 2.47 1.19-2.19 1.32-1.82 3.93.2 5.03-.17.53-.39 1.07-.65 1.58-.67 1.31-1.45 2.58-1.85 3.86zM12.01 4.7c-.15 1.25-1.11 2.36-2.13 2.42-.99.12-2.25-.88-2.13-2.28.12-1.17 1.19-2.27 2.22-2.29.92-.07 2.17.89 2.04 2.15z" />
            </svg>
            Continue with Apple
          </button>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="h-[1px] bg-gray-800 flex-1"></div>
          <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Or Email</span>
          <div className="h-[1px] bg-gray-800 flex-1"></div>
        </div>

        <form onSubmit={handleEmailContinue} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <NeonInput 
              type="email" 
              placeholder="name@example.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="pl-12"
            />
          </div>
          <NeonButton className="w-full flex items-center justify-center gap-2">
            Continue <ArrowRight className="w-5 h-5" />
          </NeonButton>
        </form>

        <div className="mt-8 text-center">
           <p className="text-xs text-gray-500">By clicking continue, you agree to our <span className="text-neon cursor-pointer hover:underline">Terms</span> and <span className="text-neon cursor-pointer hover:underline">Privacy Policy</span>.</p>
        </div>
      </div>
    </div>
  );
};
