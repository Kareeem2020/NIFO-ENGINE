
import React from 'react';
import { Box, Eye, Cpu, Menu, History } from 'lucide-react';
import Logo from './Logo';

interface NavbarProps {
  onToggleSidebar: () => void;
  onToggleActionHistory: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onToggleActionHistory }) => {
  return (
    <nav className="h-16 border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="w-10 h-10 flex items-center justify-center">
          <Logo className="w-full h-full" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-[16px] font-bold tracking-wider text-white leading-none bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">NIFO ENGINE</h1>
          <span className="text-[10px] text-white/50 font-bold tracking-[0.2em] uppercase pt-1">Studio Architecture</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-3">
         <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-white shadow-sm">
            <Cpu size={14} className="animate-pulse text-white/60" />
            <span>GEMINI 3.1 PRO</span>
         </div>
         <button 
           onClick={onToggleActionHistory}
           className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-white/30 hover:bg-white/5 text-[13px] font-medium transition-all duration-300 text-white/60 hover:text-white"
         >
            <History size={16} strokeWidth={2} />
            <span className="hidden sm:inline">Action History</span>
         </button>
         <button className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 hover:border-white/30 hover:bg-white/5 text-[13px] font-medium transition-all duration-300 text-white/60 hover:text-white">
            <Box size={16} strokeWidth={2} />
            <span className="hidden sm:inline">Templates</span>
         </button>
         <button className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-[13px] font-semibold transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105">
            <Eye size={16} strokeWidth={2} className="group-hover:rotate-180 transition-transform duration-500" />
            <span className="hidden sm:inline">Preview Active</span>
         </button>
      </div>
    </nav>
  );
};

export default Navbar;
