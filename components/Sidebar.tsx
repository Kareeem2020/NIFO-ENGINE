import React from 'react';
import { Clock, MessageSquare, Plus, Trash2, X } from 'lucide-react';
import { Session } from '../types';

interface SidebarProps {
  sessions: Session[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  isOpen,
  onClose
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar Container */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#0a0a0a] border-r border-white/10 flex flex-col transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${!isOpen ? 'md:w-0 md:border-none md:overflow-hidden' : 'md:w-64'}
      `}>
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <h2 className="text-white/80 font-medium text-sm flex items-center gap-2">
            <Clock size={16} />
            App History
          </h2>
          <button 
            onClick={onClose}
            className="md:hidden text-white/50 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={() => {
              onNewSession();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-sm font-medium transition-all duration-200 group"
          >
            <Plus size={16} className="text-white/60 group-hover:text-white transition-colors" />
            New App
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-y-contain p-3 space-y-1 scroll-smooth">
          {sessions.length === 0 ? (
            <div className="text-center text-white/40 text-xs py-8 px-4">
              No previous apps found. Start building!
            </div>
          ) : (
            sessions.map(session => (
              <div 
                key={session.id}
                className={`
                  group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200
                  ${currentSessionId === session.id 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white/90'}
                `}
                onClick={() => {
                  onSelectSession(session.id);
                  if (window.innerWidth < 768) onClose();
                }}
              >
                <MessageSquare size={14} className={currentSessionId === session.id ? 'text-white' : 'text-white/40'} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {session.title || 'Untitled App'}
                  </div>
                  <div className="text-[10px] text-white/30 mt-0.5">
                    {new Date(session.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-white/40 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all"
                  title="Delete App"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;