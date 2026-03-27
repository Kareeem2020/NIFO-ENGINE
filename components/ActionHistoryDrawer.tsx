import React from 'react';
import { X, History, FileCode, CheckCircle2, Terminal } from 'lucide-react';
import { Message } from '../types';

interface ActionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
}

const ActionHistoryDrawer: React.FC<ActionHistoryDrawerProps> = ({ isOpen, onClose, messages }) => {
  if (!isOpen) return null;

  const extractPlan = (content: string) => {
    const match = content.match(/```plan\s*([\s\S]*?)```/i);
    if (match) return match[1].trim();
    const unclosedMatch = content.match(/```plan\s*([\s\S]*)/i);
    return unclosedMatch ? unclosedMatch[1].trim() : null;
  };

  const parsePlanData = (planText: string) => {
    const actionMatch = planText.match(/Action:\s*(.+)/i);
    const action = actionMatch ? actionMatch[1].trim() : 'System Update';
    
    const filesMatch = planText.match(/Files:\n([\s\S]+)/i);
    let files: string[] = [];
    if (filesMatch) {
      files = filesMatch[1]
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('-'))
        .map(l => l.replace(/^-/, '').trim());
    }
    
    return { action, files };
  };

  const actions = messages
    .filter(m => m.role === 'model')
    .map(m => {
      const planText = extractPlan(m.content);
      return planText ? { ...parsePlanData(planText), timestamp: m.timestamp } : null;
    })
    .filter(Boolean) as { action: string, files: string[], timestamp: number }[];

  return (
    <div className="absolute inset-y-0 right-0 w-80 bg-[#111111]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl z-50 flex flex-col animate-enter-user">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2 text-white">
          <History size={18} className="text-white/60" />
          <h2 className="font-semibold text-[14px] tracking-wide">Action History</h2>
        </div>
        <button onClick={onClose} className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
          <X size={16} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {actions.length === 0 ? (
          <div className="text-center text-white/40 text-[13px] mt-10">
            No actions recorded yet.
          </div>
        ) : (
          <div className="relative border-l border-white/10 ml-3 space-y-8 pb-8">
            {actions.map((action, idx) => (
              <div key={idx} className="relative pl-6">
                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-[#27c93f] shadow-[0_0_10px_rgba(39,201,63,0.5)]"></div>
                
                <div className="flex flex-col gap-1 mb-2">
                  <span className="text-[11px] text-white/40 font-mono">
                    {new Date(action.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-[14px] font-medium text-white/90">
                    {action.action}
                  </span>
                </div>
                
                {action.files.length > 0 && (
                  <div className="bg-black/40 rounded-xl border border-white/5 p-2 space-y-1">
                    {action.files.map((file, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2 text-[12px] text-white/60 font-mono px-2 py-1">
                        <FileCode size={12} className="text-white/40" />
                        <span>{file}</span>
                        <CheckCircle2 size={12} className="text-[#27c93f] ml-auto" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionHistoryDrawer;
