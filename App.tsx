
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import ChatPanel from './components/ChatPanel';
import PreviewPanel from './components/PreviewPanel';
import Sidebar from './components/Sidebar';
import ActionHistoryDrawer from './components/ActionHistoryDrawer';
import { Message, SystemStatus, Session } from './types';
import { streamResponse } from './services/gemini';
import { MessageSquare, LayoutTemplate } from 'lucide-react';

const STORAGE_KEY = 'nifo_engine_sessions';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<SystemStatus['status']>('idle');
  const [currentCode, setCurrentCode] = useState<string>('');
  const [mobileTab, setMobileTab] = useState<'chat' | 'preview'>('chat');
  
  // Session Management
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isActionHistoryOpen, setIsActionHistoryOpen] = useState(false);
  
  // Time Machine State
  const [codeHistory, setCodeHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Load sessions on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          // Optionally load the most recent session
          // handleSelectSession(parsed[0].id);
        }
      } catch (e) {
        console.error('Failed to parse sessions', e);
      }
    }
  }, []);

  // Save current session when it changes
  useEffect(() => {
    if (messages.length === 0) return;

    const sessionIdToUse = currentSessionId || Date.now().toString();
    if (!currentSessionId) {
      setCurrentSessionId(sessionIdToUse);
    }

    setSessions(prev => {
      const existingIdx = prev.findIndex(s => s.id === sessionIdToUse);
      const title = messages[0]?.content.slice(0, 30) + (messages[0]?.content.length > 30 ? '...' : '') || 'New App';
      
      let newSessions;
      if (existingIdx >= 0) {
        newSessions = [...prev];
        newSessions[existingIdx] = {
          ...newSessions[existingIdx],
          messages,
          code: currentCode,
          title
        };
      } else {
        const newSession: Session = {
          id: sessionIdToUse,
          title,
          messages,
          code: currentCode,
          timestamp: Date.now()
        };
        newSessions = [newSession, ...prev];
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
      return newSessions;
    });
  }, [messages, currentCode, currentSessionId]);

  const handleNewSession = useCallback(() => {
    setMessages([]);
    setCurrentCode('');
    setCurrentSessionId(Date.now().toString());
    setStatus('idle');
    setCodeHistory([]);
    setHistoryIndex(-1);
  }, []);

  const handleSelectSession = useCallback((id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      setMessages(session.messages);
      setCurrentCode(session.code);
      setCurrentSessionId(session.id);
      setStatus('idle');
      setCodeHistory(session.code ? [session.code] : []);
      setHistoryIndex(session.code ? 0 : -1);
    }
  }, [sessions]);

  const handleDeleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const newSessions = prev.filter(s => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions));
      return newSessions;
    });
    if (currentSessionId === id) {
      handleNewSession();
    }
  }, [currentSessionId, handleNewSession]);

  // Robust code extraction to handle streaming state
  const extractCode = (content: string) => {
    // Fast path: find the last ```
    const lastBackticks = content.lastIndexOf('```');
    if (lastBackticks === -1) {
      // No backticks, check for raw HTML
      const htmlIndex = content.indexOf('<!DOCTYPE html>');
      if (htmlIndex !== -1) return content.slice(htmlIndex);
      const htmlTagIndex = content.indexOf('<html');
      if (htmlTagIndex !== -1) return content.slice(htmlTagIndex);
      return null;
    }

    // Find all blocks safely without catastrophic backtracking
    const blocks = [];
    const regex = /```([a-z]*)\n([\s\S]*?)(?:```|$)/gi;
    let match;
    while ((match = regex.exec(content)) !== null) {
      if (match[1].toLowerCase() !== 'plan') {
        blocks.push(match[2].trim());
      }
    }
    
    if (blocks.length > 0) {
      return blocks[blocks.length - 1]; // Return the last valid block
    }

    // Fallback for raw HTML after think block
    const lastThink = content.lastIndexOf('</think>');
    const searchContent = lastThink !== -1 ? content.slice(lastThink + 8) : content;
    const htmlIndex = searchContent.indexOf('<!DOCTYPE html>');
    if (htmlIndex !== -1) return searchContent.slice(htmlIndex);
    const htmlTagIndex = searchContent.indexOf('<html');
    if (htmlTagIndex !== -1) return searchContent.slice(htmlTagIndex);

    return null;
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setStatus('thinking');
    setCurrentCode('');

    // Switch to preview view on mobile when generating
    if (window.innerWidth < 768) {
        setMobileTab('preview');
    }

    const aiMsgId = (Date.now() + 1).toString();
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    
    let fullContent = '';
    let firstChunkReceived = false;
    let lastMessageUpdateTime = 0;
    let lastCodeExtractTime = 0;

    try {
      const stream = streamResponse(history, text);

      for await (const chunk of stream) {
        fullContent += chunk;
        const now = Date.now();

        if (!firstChunkReceived) {
          setStatus('streaming');
          firstChunkReceived = true;
          setMessages(prev => [...prev, {
            id: aiMsgId,
            role: 'model',
            content: fullContent,
            timestamp: Date.now()
          }]);
          lastMessageUpdateTime = now;
          lastCodeExtractTime = now;
        } else {
          // Throttle message updates to every 100ms to prevent React re-render lag
          if (now - lastMessageUpdateTime > 100) {
            setMessages(prev => prev.map(m => 
              m.id === aiMsgId ? { ...m, content: fullContent } : m
            ));
            lastMessageUpdateTime = now;
          }
          
          // Throttle code extraction to every 500ms (heavy regex operation)
          if (now - lastCodeExtractTime > 500) {
            const extracted = extractCode(fullContent);
            if (extracted) setCurrentCode(extracted);
            lastCodeExtractTime = now;
          }
        }
      }
      
      // Final update to ensure everything is caught up
      setMessages(prev => prev.map(m => 
        m.id === aiMsgId ? { ...m, content: fullContent } : m
      ));
      const finalExtracted = extractCode(fullContent);
      if (finalExtracted) {
        setCurrentCode(finalExtracted);
        // Add to Time Machine history
        setCodeHistory(prev => {
          const newHistory = [...prev.slice(0, historyIndex + 1), finalExtracted];
          setHistoryIndex(newHistory.length - 1);
          return newHistory;
        });
      }
      
      setStatus('idle');
    } catch (e) {
      setStatus('error');
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: "I encountered an error while connecting to the neural core. Please try again.",
        timestamp: Date.now()
      }]);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentCode(codeHistory[newIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < codeHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentCode(codeHistory[newIndex]);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-black text-white overflow-hidden font-sans">
      <Navbar 
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} 
        onToggleActionHistory={() => setIsActionHistoryOpen(prev => !prev)}
      />
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <Sidebar 
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <ActionHistoryDrawer 
          isOpen={isActionHistoryOpen} 
          onClose={() => setIsActionHistoryOpen(false)} 
          messages={messages} 
        />

        {/* Left: Chat */}
        <div className={`
            relative z-10 flex flex-col min-h-0 w-full md:w-[450px] flex-shrink-0 transition-all duration-500 ease-in-out border-r border-white/10 bg-black/40 backdrop-blur-xl
            ${mobileTab === 'preview' ? 'hidden md:flex' : 'flex-1 md:flex-none'}
        `}>
            <ChatPanel messages={messages} onSendMessage={handleSendMessage} status={status} />
        </div>

        {/* Right: Preview */}
        <div className={`
            relative z-10 flex-1 flex flex-col min-h-0 transition-all duration-500 ease-in-out bg-[#050505]
            ${mobileTab === 'chat' ? 'hidden md:flex' : 'flex'}
        `}>
            <PreviewPanel 
              code={currentCode} 
              status={status} 
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={historyIndex > 0}
              canRedo={historyIndex < codeHistory.length - 1}
            />
        </div>

        {/* Mobile Floating Toggle */}
        <div className="md:hidden absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 p-1.5 rounded-full bg-black/80 backdrop-blur-2xl border border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            <button 
              onClick={() => setMobileTab('chat')}
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-medium transition-all duration-300
                ${mobileTab === 'chat' 
                  ? 'bg-white text-black shadow-md' 
                  : 'text-white/60 hover:text-white'}
              `}
            >
              <MessageSquare size={16} strokeWidth={2} />
              <span>Architect</span>
            </button>
            <button 
              onClick={() => setMobileTab('preview')}
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-medium transition-all duration-300
                ${mobileTab === 'preview' 
                  ? 'bg-white text-black shadow-md' 
                  : 'text-white/60 hover:text-white'}
              `}
            >
              <LayoutTemplate size={16} strokeWidth={2} />
              <span>Reality</span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default App;
