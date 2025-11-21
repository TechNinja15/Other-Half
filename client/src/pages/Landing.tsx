
import React from 'react';
import { Ghost, Heart, Shield, ArrowRight, Instagram, Twitter } from 'lucide-react';
import { NeonButton } from '../components/Common';
import { useNavigate, Link } from 'react-router-dom';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const onEnter = () => navigate('/login');

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-neon selection:text-white relative overflow-hidden flex flex-col">
      {/* Background Elements - Slowed Down */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-neon opacity-20 blur-[150px] rounded-full animate-pulse-slow mix-blend-screen" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600 opacity-10 blur-[150px] rounded-full animate-pulse-slow mix-blend-screen" style={{ animationDelay: '2s' }} />
      
      {/* Floating Blobs */}
      <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-purple-500 opacity-10 blur-[80px] rounded-full animate-blob" />
      <div className="absolute bottom-1/3 left-1/4 w-40 h-40 bg-neon opacity-10 blur-[80px] rounded-full animate-blob" style={{ animationDelay: '4s' }} />

      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(50, 50, 50, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(50, 50, 50, 0.5) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>

      <nav className="relative z-20 px-6 py-8 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <Ghost className="w-8 h-8 text-neon" />
          <span className="text-2xl font-black tracking-tighter">OTHER<span className="text-neon">HALF</span></span>
        </div>
        <div className="hidden md:flex gap-8 text-sm font-bold text-gray-400 uppercase tracking-widest">
          <a href="#features" className="hover:text-neon transition-colors">Features</a>
          <Link to="/safety" className="hover:text-neon transition-colors">Safety</Link>
        </div>
        <NeonButton onClick={onEnter} variant="secondary" className="text-xs px-6">
          Log In
        </NeonButton>
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900/80 border border-neon/30 mb-8 animate-fade-in-up">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">Exclusively for University Students</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter leading-none animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          FIND YOUR <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon via-purple-500 to-blue-500 drop-shadow-[0_0_30px_rgba(255,0,127,0.5)]">
            OTHER HALF
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          The anonymous dating experience designed for campus life. 
          Connect based on vibes, verify with email, reveal when you're ready.
        </p>

        <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <button 
            onClick={onEnter}
            className="group relative px-10 py-6 bg-neon text-white font-black text-xl uppercase tracking-widest rounded-full overflow-hidden hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(255,0,127,0.6)]"
          >
            <span className="relative z-10 flex items-center gap-3">
              Find Your Other Half <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </button>
        </div>

        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 max-w-6xl mx-auto w-full px-4">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-8 rounded-3xl hover:border-neon/50 transition-all group">
            <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-neon/20 group-hover:text-neon transition-colors">
              <Shield className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Verified Students Only</h3>
            <p className="text-gray-400">No bots, no randoms. We verify every user via their official .edu email address.</p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-8 rounded-3xl hover:border-neon/50 transition-all group">
            <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-neon/20 group-hover:text-neon transition-colors">
              <Ghost className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Total Anonymity</h3>
            <p className="text-gray-400">Your photos and name stay hidden. Chat, vibe, and reveal only when you trust them.</p>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 p-8 rounded-3xl hover:border-neon/50 transition-all group">
            <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-neon/20 group-hover:text-neon transition-colors">
              <Heart className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3">Smart Matching</h3>
            <p className="text-gray-400">Our AI analyzes interests and campus vibes to find someone you'll actually click with.</p>
          </div>
        </div>
      </main>

      {/* Footer Section */}
      <footer className="relative z-10 border-t border-gray-900 bg-black/80 backdrop-blur-xl pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center gap-2 mb-4 cursor-pointer" onClick={() => navigate('/')}>
                        <Ghost className="w-6 h-6 text-neon" />
                        <span className="font-black tracking-tighter text-xl text-white">OTHER<span className="text-neon">HALF</span></span>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-sm mb-6">
                        The safest way to meet people on campus. Built for students, by students. 
                        Find your vibe without the pressure.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-neon hover:text-white transition-all">
                            <Instagram className="w-5 h-5" />
                        </a>
                        <a href="#" className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-neon hover:text-white transition-all">
                            <Twitter className="w-5 h-5" />
                        </a>
                        <Link to="/about" className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-gray-400 hover:bg-neon hover:text-white transition-all">
                             <Ghost className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
                
                <div>
                    <h4 className="text-white font-bold uppercase tracking-widest text-sm mb-6">Company</h4>
                    <ul className="space-y-3 text-sm text-gray-500">
                        <li><Link to="/about" className="hover:text-neon transition-colors">About Us</Link></li>
                        <li><Link to="/developers" className="hover:text-neon transition-colors">Meet the Developers</Link></li>
                        <li><Link to="/careers" className="hover:text-neon transition-colors">Careers</Link></li>
                        <li><Link to="/contact" className="hover:text-neon transition-colors">Contact</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-bold uppercase tracking-widest text-sm mb-6">Legal</h4>
                    <ul className="space-y-3 text-sm text-gray-500">
                        <li><Link to="/privacy" className="hover:text-neon transition-colors">Privacy Policy</Link></li>
                        <li><Link to="/terms" className="hover:text-neon transition-colors">Terms of Service</Link></li>
                        <li><Link to="/safety" className="hover:text-neon transition-colors">Safety Tips</Link></li>
                        <li><Link to="/guidelines" className="hover:text-neon transition-colors">Community Guidelines</Link></li>
                    </ul>
                </div>
            </div>

            <div className="border-t border-gray-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-gray-600 text-xs">&copy; {new Date().getFullYear()} Other Half Inc. All rights reserved.</p>
                <p className="text-gray-500 text-xs font-medium flex items-center gap-1">
                    Built with <Heart className="w-3 h-3 text-neon fill-current animate-pulse" /> by The Dev Team
                </p>
            </div>
        </div>
      </footer>
    </div>
  );
};
