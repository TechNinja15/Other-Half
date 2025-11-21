
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Ghost, Shield, Heart, Mail, Briefcase, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';

// --- Shared Layout Component ---
const PageLayout: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-neon selection:text-white p-6 pb-20 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-neon/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-500 hover:text-neon transition-colors mb-8 group"
        >
          <RotateCcw className="w-4 h-4 group-hover:-rotate-90 transition-transform" /> Back to Home
        </button>

        <div className="flex items-center gap-4 mb-12">
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-800 shadow-neon-sm">
            {icon}
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">{title}</h1>
        </div>

        <div className="bg-gray-900/30 border border-gray-800 rounded-3xl p-8 md:p-12 backdrop-blur-sm animate-fade-in leading-relaxed text-gray-300 space-y-6">
          {children}
        </div>

        <div className="mt-12 text-center text-gray-600 text-xs">
          &copy; {new Date().getFullYear()} Other Half Inc. All rights reserved.
        </div>
      </div>
    </div>
  );
};

// --- Page Components ---

export const About: React.FC = () => (
  <PageLayout title="About Us" icon={<Ghost className="w-8 h-8 text-neon" />}>
    <p className="text-xl text-white font-bold mb-4">We believe dating shouldn't be a popularity contest.</p>
    <p>
      Other Half was born in a dorm room with a simple mission: to bring connection back to campus life without the pressure of superficial swiping.
    </p>
    <p>
      Traditional dating apps force you to market yourself like a product. We wanted to create a space where your personality, your major, your weird hobbies, and your vibe speak louder than your profile picture. By verifying student status, we ensure a safe community of peers. By keeping things anonymous initially, we let you be your true self.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
      <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
        <h3 className="text-neon font-bold mb-2">Authenticity</h3>
        <p className="text-sm">Real students, verified via .edu emails. No bots.</p>
      </div>
      <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
        <h3 className="text-neon font-bold mb-2">Privacy</h3>
        <p className="text-sm">You control when to reveal your identity.</p>
      </div>
      <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700">
        <h3 className="text-neon font-bold mb-2">Safety</h3>
        <p className="text-sm">End-to-end encrypted chats and calls.</p>
      </div>
    </div>
  </PageLayout>
);

export const Careers: React.FC = () => (
  <PageLayout title="Careers" icon={<Briefcase className="w-8 h-8 text-neon" />}>
    <h2 className="text-2xl font-bold text-white mb-4">Join the Ghost Crew</h2>
    <p className="mb-6">
      We are a small, passionate team of developers, designers, and love engineers building the next generation of social discovery.
    </p>
    
    <div className="p-8 bg-gray-800/30 rounded-2xl border border-gray-700 text-center">
      <Ghost className="w-12 h-12 text-gray-600 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-white mb-2">No Open Positions</h3>
      <p className="text-gray-400">
        We aren't hiring right now, but we are always looking for talented campus ambassadors. 
        If you think you can bring Other Half to your university, drop us a line!
      </p>
    </div>
  </PageLayout>
);

export const Contact: React.FC = () => (
  <PageLayout title="Contact Us" icon={<Mail className="w-8 h-8 text-neon" />}>
    <p className="mb-8">Have a question, a bug report, or a success story? We'd love to hear from you.</p>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-6 bg-gray-800/50 rounded-2xl border border-gray-700 hover:border-neon transition-colors cursor-pointer group">
        <h3 className="text-white font-bold mb-2 group-hover:text-neon transition-colors">Support</h3>
        <p className="text-sm mb-4">For account issues and bug reports.</p>
        <a href="mailto:support@otherhalf.app" className="text-neon text-sm font-mono">support@otherhalf.app</a>
      </div>
      
      <div className="p-6 bg-gray-800/50 rounded-2xl border border-gray-700 hover:border-neon transition-colors cursor-pointer group">
        <h3 className="text-white font-bold mb-2 group-hover:text-neon transition-colors">Partnerships</h3>
        <p className="text-sm mb-4">For campus events and collabs.</p>
        <a href="mailto:partners@otherhalf.app" className="text-neon text-sm font-mono">partners@otherhalf.app</a>
      </div>
    </div>
  </PageLayout>
);

export const Privacy: React.FC = () => (
  <PageLayout title="Privacy Policy" icon={<FileText className="w-8 h-8 text-neon" />}>
    <div className="space-y-6 text-sm">
      <p className="text-xs text-gray-500 font-mono">Last Updated: March 15, 2024</p>
      
      <section>
        <h3 className="text-lg font-bold text-white mb-2">1. Introduction</h3>
        <p>Other Half ("we", "us") respects your privacy. This policy explains how we handle your data. In short: we only collect what's needed to verify you and match you.</p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2">2. Data We Collect</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>University Email:</strong> Used strictly for verification. It is never shown to other users.</li>
          <li><strong>Profile Data:</strong> Your interests, major, year, and bio.</li>
          <li><strong>Usage Data:</strong> Swipes and match interactions to improve our algorithm.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2">3. Anonymity</h3>
        <p>Your "Real Name" and "Avatar" are hidden until a match occurs. We do not sell your personal data to third parties.</p>
      </section>
    </div>
  </PageLayout>
);

export const Terms: React.FC = () => (
  <PageLayout title="Terms of Service" icon={<FileText className="w-8 h-8 text-neon" />}>
    <div className="space-y-6 text-sm">
      <p className="text-xs text-gray-500 font-mono">Last Updated: March 15, 2024</p>

      <section>
        <h3 className="text-lg font-bold text-white mb-2">1. Acceptance</h3>
        <p>By using Other Half, you agree to these terms. You must be a currently enrolled university student to use this service.</p>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2">2. User Conduct</h3>
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Harass, bully, or intimidate other users.</li>
          <li>Share inappropriate or illegal content.</li>
          <li>Attempt to reverse engineer the anonymity features.</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-bold text-white mb-2">3. Account Termination</h3>
        <p>We reserve the right to ban any account that violates our community guidelines without notice.</p>
      </section>
    </div>
  </PageLayout>
);

export const Safety: React.FC = () => (
  <PageLayout title="Safety Tips" icon={<Shield className="w-8 h-8 text-neon" />}>
    <div className="space-y-6">
      <div className="flex gap-4">
        <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
        <div>
          <h3 className="text-white font-bold mb-1">Keep it on the app</h3>
          <p className="text-sm">Don't move to other messaging platforms until you feel completely comfortable. Our chat and calls are encrypted.</p>
        </div>
      </div>

      <div className="flex gap-4">
        <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
        <div>
          <h3 className="text-white font-bold mb-1">Meet in public</h3>
          <p className="text-sm">If you decide to meet in person, always choose a public place on campus, like the library, student center, or a busy coffee shop.</p>
        </div>
      </div>

      <div className="flex gap-4">
        <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0" />
        <div>
          <h3 className="text-white font-bold mb-1">Guard your info</h3>
          <p className="text-sm">Even after matching, be careful about sharing your dorm room number, financial info, or home address.</p>
        </div>
      </div>

      <div className="mt-8 p-4 bg-neon/10 border border-neon/30 rounded-xl">
        <p className="text-neon font-bold text-sm text-center">
          If you ever feel unsafe, use the "Block & Report" button in the chat menu immediately.
        </p>
      </div>
    </div>
  </PageLayout>
);

export const Guidelines: React.FC = () => (
  <PageLayout title="Guidelines" icon={<Heart className="w-8 h-8 text-neon" />}>
    <div className="space-y-8">
      <p className="text-lg font-medium text-white">
        Other Half is designed to be a safe, fun, and inclusive space. To keep it that way, we ask everyone to follow these simple rules.
      </p>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 mt-1" />
          <div>
            <h3 className="text-white font-bold">Be Respectful</h3>
            <p className="text-sm text-gray-400">Treat others how you want to be treated. Ghosting happens, but rudeness is a choice.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 mt-1" />
          <div>
            <h3 className="text-white font-bold">Be Honest</h3>
            <p className="text-sm text-gray-400">You are anonymous, not fake. Represent your interests and major truthfully.</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 mt-1" />
          <div>
            <h3 className="text-white font-bold">Zero Tolerance for Hate</h3>
            <p className="text-sm text-gray-400">Racism, sexism, homophobia, and transphobia result in an immediate and permanent IP ban.</p>
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
);
