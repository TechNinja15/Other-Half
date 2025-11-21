
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Onboarding } from './pages/Onboarding';
import { Home } from './pages/Home';
import { Matches } from './pages/Matches';
import { Chat } from './pages/Chat';
import { Notifications } from './pages/Notifications';
import { VirtualDate } from './pages/VirtualDate';
import { Profile } from './pages/Profile';
import { Developers } from './pages/Developers';
import { Confessions } from './pages/Confessions';
import { About, Careers, Contact, Privacy, Terms, Safety, Guidelines } from './pages/StaticPages';
import { IntroAnimation } from './components/IntroAnimation';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-neon">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    // Check if we've already shown intro this session (optional, here we show it every refresh for effect as requested)
    // const hasShown = sessionStorage.getItem('hasShownIntro');
    // if (hasShown) setShowIntro(false);
  }, []);

  const handleIntroComplete = () => {
    // sessionStorage.setItem('hasShownIntro', 'true');
    setShowIntro(false);
  };

  if (showIntro) {
    return <IntroAnimation onComplete={handleIntroComplete} />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/developers" element={<Developers />} />
      
      {/* Static Pages */}
      <Route path="/about" element={<About />} />
      <Route path="/careers" element={<Careers />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/safety" element={<Safety />} />
      <Route path="/guidelines" element={<Guidelines />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/home" element={<Home />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/chat/:id" element={<Chat />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/virtual-date" element={<VirtualDate />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/confessions" element={<Confessions />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
