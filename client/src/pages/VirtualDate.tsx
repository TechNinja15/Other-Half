
import React from 'react';
import { Ghost, Drill, Zap } from 'lucide-react';

export const VirtualDate: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in pb-24 md:pb-8">
      <div className="relative mb-8">
        <Ghost className="w-40 h-40 text-gray-800" />
        <div className="absolute -bottom-2 -right-4 animate-bounce">
          <Drill className="w-20 h-20 text-neon transform -rotate-12" />
        </div>
        <div className="absolute -top-4 right-0 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded animate-pulse">
          WIP
        </div>
      </div>
      <h2 className="text-4xl font-black mb-4 text-white uppercase tracking-tighter">
        Under <span className="text-neon">Construction</span>
      </h2>
      <div className="w-24 h-1 bg-neon mb-8 rounded-full"></div>
      <p className="text-gray-400 text-lg mb-8 max-w-md leading-relaxed">
        Our love engineers are hard at work building a romantic virtual space for your digital dates.
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 rounded-full border border-gray-800 text-gray-500 text-sm">
        <Zap className="w-4 h-4" /> Coming in Version 2.0
      </div>
    </div>
  );
};
