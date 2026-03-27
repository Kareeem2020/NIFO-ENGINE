
import React, { useState, useEffect } from 'react';
import { RotateCw, Code, Smartphone, Monitor, Loader2, Tablet, Download, Terminal, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { SystemStatus } from '../types';

interface PreviewPanelProps {
  code: string;
  status?: SystemStatus['status'];
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

type ViewportMode = 'mobile' | 'tablet' | 'desktop';

const PreviewPanel: React.FC<PreviewPanelProps> = ({ code, status = 'idle', onUndo, onRedo, canUndo = false, canRedo = false }) => {
  const [viewport, setViewport] = useState<ViewportMode>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
  const [logs, setLogs] = useState<{level: string, message: string}[]>([]);
  const [showConsole, setShowConsole] = useState(false);

  const handleRefresh = () => setRefreshKey(k => k + 1);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'CONSOLE') {
        setLogs(prev => [...prev, { level: e.data.level, message: e.data.args.join(' ') }]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    setLogs([]);
  }, [code, refreshKey]);

  const handleDownload = () => {
    if (!code) return;
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nifo-app.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Inject console interceptor into the iframe code
  const injectedCode = code ? `
    <script>
      (function() {
        const _log = console.log;
        const _warn = console.warn;
        const _error = console.error;
        console.log = (...args) => { window.parent.postMessage({type: 'CONSOLE', level: 'log', args: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a))}, '*'); _log(...args); };
        console.warn = (...args) => { window.parent.postMessage({type: 'CONSOLE', level: 'warn', args: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a))}, '*'); _warn(...args); };
        console.error = (...args) => { window.parent.postMessage({type: 'CONSOLE', level: 'error', args: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a))}, '*'); _error(...args); };
        window.onerror = (msg, url, line, col, error) => { window.parent.postMessage({type: 'CONSOLE', level: 'error', args: [\`\${msg} (\${line}:\${col})\`]}, '*'); return false; };
      })();
    </script>
    ${code}
  ` : '';

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-transparent relative overflow-hidden">
       {/* High-fidelity Toolbar */}
       <div className="h-14 border-b border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-between px-4 select-none z-20 relative">
          <div className="flex items-center gap-2 group">
             <div className="w-3 h-3 rounded-full bg-white/20 hover:bg-[#ff5f56] transition-colors duration-300"></div>
             <div className="w-3 h-3 rounded-full bg-white/20 hover:bg-[#ffbd2e] transition-colors duration-300"></div>
             <div className="w-3 h-3 rounded-full bg-white/20 hover:bg-[#27c93f] transition-colors duration-300"></div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
             <button onClick={onUndo} disabled={!canUndo} className={`p-1.5 rounded-full transition-colors ${canUndo ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-white/20 cursor-not-allowed'}`} title="Undo (Time Machine)">
               <ChevronLeft size={16} strokeWidth={2.5} />
             </button>
             <button onClick={onRedo} disabled={!canRedo} className={`p-1.5 rounded-full transition-colors ${canRedo ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-white/20 cursor-not-allowed'}`} title="Redo (Time Machine)">
               <ChevronRight size={16} strokeWidth={2.5} />
             </button>
          </div>

          <div className="flex-1 max-w-md mx-4 flex justify-center">
            <div className="px-6 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/60 flex items-center justify-center gap-2 transition-all hover:bg-white/10 cursor-default w-full max-w-[300px]">
                <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                <span className="tracking-wide">localhost:3000</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-white/60">
             <div className="flex items-center bg-white/5 rounded-full p-0.5 border border-white/10">
                <button 
                  onClick={() => setViewport('mobile')}
                  className={`p-1.5 rounded-full transition-colors ${viewport === 'mobile' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                  title="Mobile View"
                >
                  <Smartphone size={14} strokeWidth={2.5} />
                </button>
                <button 
                  onClick={() => setViewport('tablet')}
                  className={`p-1.5 rounded-full transition-colors ${viewport === 'tablet' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                  title="Tablet View"
                >
                  <Tablet size={14} strokeWidth={2.5} />
                </button>
                <button 
                  onClick={() => setViewport('desktop')}
                  className={`p-1.5 rounded-full transition-colors ${viewport === 'desktop' ? 'bg-white/20 text-white shadow-sm' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                  title="Desktop View"
                >
                  <Monitor size={14} strokeWidth={2.5} />
                </button>
             </div>
             <div className="w-px h-4 bg-white/10"></div>
             <button onClick={() => setShowConsole(!showConsole)} className={`p-1.5 rounded-full transition-colors ${showConsole ? 'text-[#ffbd2e] bg-white/10' : 'hover:text-white hover:bg-white/10'}`} title="Developer Console">
               <Terminal size={14} strokeWidth={2.5} />
             </button>
             <button onClick={handleDownload} disabled={!code} className={`p-1.5 rounded-full transition-colors ${code ? 'hover:text-white hover:bg-white/10' : 'text-white/20 cursor-not-allowed'}`} title="Download Code">
               <Download size={14} strokeWidth={2.5} />
             </button>
             <RotateCw onClick={handleRefresh} size={14} strokeWidth={2.5} className="hover:text-white cursor-pointer transition-transform active:rotate-180 duration-500 ml-1" />
          </div>
       </div>

       {/* Iframe Container */}
       <div className={`flex-1 relative flex flex-col min-h-0 overflow-auto ${viewport !== 'desktop' ? 'items-center justify-center p-4 md:p-8 bg-black/20' : 'bg-transparent'}`}>
         {status === 'thinking' || (status === 'streaming' && !code) ? (
           /* Loading Skeleton State */
           <div className="absolute inset-0 bg-transparent p-8 flex flex-col gap-6 animate-pulse z-10">
             {/* Skeleton Header */}
             <div className="flex items-center justify-between">
               <div className="w-32 h-8 bg-white/5 rounded-full shadow-sm"></div>
               <div className="flex gap-4">
                 <div className="w-16 h-8 bg-white/5 rounded-full shadow-sm"></div>
                 <div className="w-16 h-8 bg-white/5 rounded-full shadow-sm"></div>
                 <div className="w-8 h-8 bg-white/5 rounded-full shadow-sm"></div>
               </div>
             </div>
             
             {/* Skeleton Hero */}
             <div className="w-full h-48 bg-white/5 rounded-3xl mt-4 shadow-sm"></div>
             
             {/* Skeleton Content Grid */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
               <div className="h-32 bg-white/5 rounded-3xl shadow-sm"></div>
               <div className="h-32 bg-white/5 rounded-3xl shadow-sm"></div>
               <div className="h-32 bg-white/5 rounded-3xl shadow-sm"></div>
             </div>
             
             {/* Loading Indicator Overlay */}
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-md">
               <div className="bg-black/60 p-6 rounded-3xl border border-white/10 flex flex-col items-center gap-4 shadow-[0_0_40px_rgba(255,255,255,0.05)] backdrop-blur-xl">
                 <Loader2 className="w-8 h-8 text-white animate-spin" />
                 <p className="text-sm font-medium tracking-wide text-white">Synthesizing Reality...</p>
               </div>
             </div>
           </div>
         ) : code ? (
           <div 
             className={`relative transition-all duration-500 ease-in-out flex-shrink-0 bg-white overflow-hidden
               ${viewport === 'mobile' ? 'w-[375px] h-[812px] rounded-[40px] border-[12px] border-[#1a1a1a] shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10' : ''}
               ${viewport === 'tablet' ? 'w-[768px] h-[1024px] rounded-[32px] border-[12px] border-[#1a1a1a] shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10' : ''}
               ${viewport === 'desktop' ? 'w-full h-full border-none' : ''}
             `}
             style={{
                maxHeight: viewport !== 'desktop' ? '100%' : 'none',
                maxWidth: viewport !== 'desktop' ? '100%' : 'none',
             }}
           >
             <iframe
               key={refreshKey}
               srcDoc={injectedCode}
               title="Live Preview"
               className="w-full h-full border-none bg-white animate-enter duration-700"
               sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
             />
           </div>
         ) : (
           /* Premium "Void" State */
           <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-transparent">
             <div className="relative z-10 flex flex-col items-center gap-6 opacity-80 animate-enter">
                 <div className="w-24 h-24 rounded-full border border-white/10 bg-white/5 flex items-center justify-center relative z-10 shadow-[0_0_30px_rgba(255,255,255,0.05)] backdrop-blur-xl">
                    <Code size={36} className="text-white/60" strokeWidth={1.5} />
                 </div>
                 <div className="flex flex-col items-center gap-3">
                     <p className="text-sm font-medium tracking-widest text-white/60 uppercase">Ready to Build</p>
                 </div>
             </div>
           </div>
         )}
         
         {/* Developer Console Drawer */}
         {showConsole && code && (
           <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-[#1a1a1a]/95 backdrop-blur-xl border-t border-white/10 flex flex-col z-30 animate-enter-bot">
             <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/20">
               <div className="flex items-center gap-2 text-xs font-medium text-white/60 uppercase tracking-widest">
                 <Terminal size={12} />
                 <span>Developer Console</span>
               </div>
               <div className="flex items-center gap-2">
                 <button onClick={() => setLogs([])} className="text-xs text-white/40 hover:text-white transition-colors px-2">Clear</button>
                 <button onClick={() => setShowConsole(false)} className="text-white/40 hover:text-white transition-colors">
                   <X size={14} />
                 </button>
               </div>
             </div>
             <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-2">
               {logs.length === 0 ? (
                 <div className="text-white/30 italic">No logs yet...</div>
               ) : (
                 logs.map((log, i) => (
                   <div key={i} className={`flex gap-3 ${log.level === 'error' ? 'text-[#ff5f56]' : log.level === 'warn' ? 'text-[#ffbd2e]' : 'text-white/80'}`}>
                     <span className="opacity-50 select-none">[{new Date().toLocaleTimeString()}]</span>
                     <span className="break-all">{log.message}</span>
                   </div>
                 ))
               )}
             </div>
           </div>
         )}
       </div>
    </div>
  );
};

export default PreviewPanel;
