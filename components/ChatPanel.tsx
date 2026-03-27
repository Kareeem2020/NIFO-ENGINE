
import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../types';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Bot, User, FileCode, ArrowRight, Loader2, Lightbulb, CheckCircle2, BrainCircuit, ChevronDown, Clock } from 'lucide-react';
import InputConsole from './InputConsole';
import Logo from './Logo';

const LiveTimer = ({ isRunning }: { isRunning: boolean }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <span className="font-mono text-[11px] text-white/40 flex items-center gap-1">
      <Clock size={10} /> {formatTime(seconds)}
    </span>
  );
};

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  status: 'idle' | 'thinking' | 'streaming' | 'error';
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, status }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    // If user scrolls up more than 50px from bottom, disable auto-scroll
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAutoScrollEnabled(isNearBottom);
  };

  useEffect(() => {
    if (isAutoScrollEnabled) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, status, isAutoScrollEnabled]);

  // Helper to remove plan and think blocks from display text
  const cleanContent = (content: string) => {
    // Replace closed plan and think blocks
    let cleaned = content.replace(/```plan\s*[\s\S]*?```/gi, '');
    cleaned = cleaned.replace(/<think>\s*[\s\S]*?<\/think>/gi, '');
    
    // Replace unclosed plan and think blocks at the end of the string
    cleaned = cleaned.replace(/```plan\s*[\s\S]*$/gi, '');
    cleaned = cleaned.replace(/<think>\s*[\s\S]*$/gi, '');
    
    return cleaned.trim();
  };

  const extractThought = (content: string) => {
    const match = content.match(/<think>\s*([\s\S]*?)<\/think>/i);
    if (match) return match[1].trim();
    
    // Fallback to unclosed think block
    const unclosedMatch = content.match(/<think>\s*([\s\S]*)/i);
    return unclosedMatch ? unclosedMatch[1].trim() : null;
  };

  const hasCodeBlock = (content: string) => /```(?:html|xml|javascript)?/i.test(content) || content.includes('<!DOCTYPE html>') || content.includes('<html');
  
  const extractPlan = (content: string) => {
    // Try to match a closed plan block
    const match = content.match(/```plan\s*([\s\S]*?)```/i);
    if (match) return match[1].trim();
    
    // Fallback to unclosed plan block
    const unclosedMatch = content.match(/```plan\s*([\s\S]*)/i);
    return unclosedMatch ? unclosedMatch[1].trim() : null;
  };

  const parsePlanData = (planText: string) => {
    const actionMatch = planText.match(/Action:\s*(.+)/i);
    const action = actionMatch ? actionMatch[1].trim() : 'Working...';
    
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

  return (
    <div className={`w-full flex-1 flex flex-col min-h-0 bg-transparent relative transition-all duration-1000 ${isEnhancing ? 'shadow-[inset_0_0_100px_rgba(100,200,255,0.15)]' : ''}`}>
      {isEnhancing && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] animate-[float_8s_ease-in-out_infinite]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-[float_10s_ease-in-out_infinite_reverse]"></div>
        </div>
      )}
      {/* Messages Area */}
      <div 
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-y-contain p-4 md:p-6 space-y-8 scroll-smooth pb-24 md:pb-4 flex flex-col relative z-10"
      >
        {messages.length === 0 && (
           <div className="flex-1 flex flex-col items-center justify-center opacity-0 animate-enter-bot duration-700 delay-100 min-h-[50vh]">
             <div className="relative group cursor-pointer w-20 h-20 mb-6">
               <Logo className="w-full h-full" />
             </div>
             <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 mb-2 tracking-widest uppercase">NIFO ENGINE</h2>
             <p className="text-white/50 text-[15px] max-w-[260px] text-center leading-relaxed">
               Describe your vision. I will build it in real-time.
             </p>
           </div>
        )}

        {messages.map((msg, idx) => {
          const thoughtText = msg.role === 'model' ? extractThought(msg.content) : null;
          const planText = msg.role === 'model' ? extractPlan(msg.content) : null;
          const planData = planText ? parsePlanData(planText) : null;
          const isLastMessage = idx === messages.length - 1;
          const isGenerating = isLastMessage && status === 'streaming';

          return (
            <div 
              key={msg.id} 
              className={`flex flex-col gap-2 ${msg.role === 'user' ? 'animate-enter-user items-end' : 'animate-fade-in-up items-start'}`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {msg.role === 'user' ? (
                <div className="max-w-[85%] rounded-[24px] px-6 py-4 text-[15px] leading-relaxed bg-white/10 text-white font-medium rounded-br-sm backdrop-blur-md border border-white/5 shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                  {msg.content}
                </div>
              ) : (
                <div className="w-full max-w-full text-white/90">
                  {/* Reasoning Trace */}
                  {thoughtText && (
                    <details className={`group mb-6 w-full max-w-md bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md transition-all duration-300 open:bg-black/40 ${isGenerating && !planData ? 'animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.05)]' : ''}`} open={isGenerating && !planData}>
                      <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                        <BrainCircuit size={16} className={`transition-colors ${isGenerating && !planData ? 'text-white' : 'text-white/60 group-open:text-white/90'}`} />
                        <span className={`text-[13px] font-medium transition-colors ${isGenerating && !planData ? 'text-white' : 'text-white/60 group-open:text-white/90'}`}>
                          Thought Process
                        </span>
                        {isGenerating && !planData && <LiveTimer isRunning={true} />}
                        <ChevronDown size={14} className="text-white/40 ml-auto transition-transform duration-300 group-open:rotate-180" />
                      </summary>
                      <div className="px-4 pb-4 pt-1 text-[13px] leading-relaxed text-white/50 font-mono whitespace-pre-wrap border-t border-white/5">
                        {thoughtText}
                      </div>
                    </details>
                  )}

                  {/* Action Block */}
                  {planData && (
                    <div className="mb-6 w-full max-w-md">
                      <div className="flex items-center gap-2 text-white/40 text-[13px] mb-3 font-medium">
                        <span>NIFO ENGINE V1</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          {isGenerating && <Loader2 size={12} className="animate-spin" />}
                          <span className={isGenerating ? 'text-white/80' : ''}>
                            {isGenerating ? (planData.files.length > 0 ? 'Refining Code Extraction' : 'Reasoning Trace') : 'Completed'}
                          </span>
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-white text-[15px] font-medium mb-3">
                        <Lightbulb size={18} className="text-white/60" />
                        <span>{planData.action}</span>
                      </div>
                      
                      {planData.files.length > 0 && (
                        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 space-y-0.5 shadow-[0_0_20px_rgba(255,255,255,0.02)]">
                          <div className="px-3 py-1.5 text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1">Plan Manifest</div>
                          {planData.files.map((file, i) => (
                            <div key={i} className="flex items-center justify-between text-[14px] px-4 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                              <span className="text-white/70 font-mono text-[13px]">{file}</span>
                              {isGenerating && i === planData.files.length - 1 ? (
                                <Loader2 size={16} className="text-white/40 animate-spin" />
                              ) : (
                                <CheckCircle2 size={16} className="text-[#27c93f] animate-enter-user" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed">
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <details className="group mt-4 bg-black/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md transition-all duration-300">
                              <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden bg-white/5 hover:bg-white/10 transition-colors">
                                <FileCode size={16} className="text-white/60 group-open:text-white/90 transition-colors" />
                                <span className="text-[13px] font-medium text-white/60 group-open:text-white/90 transition-colors">
                                  View Source Code ({match[1]})
                                </span>
                                <ChevronDown size={14} className="text-white/40 ml-auto transition-transform duration-300 group-open:rotate-180" />
                              </summary>
                              <div className="border-t border-white/5">
                                <SyntaxHighlighter
                                  style={vscDarkPlus as any}
                                  language={match[1]}
                                  PreTag="div"
                                  customStyle={{
                                    margin: 0,
                                    padding: '1rem',
                                    background: 'transparent',
                                    borderRadius: '0',
                                    border: 'none',
                                    overflowX: 'auto'
                                  }}
                                  {...props}
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              </div>
                            </details>
                          ) : (
                            <code className="bg-white/10 rounded-md px-1.5 py-0.5" {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {cleanContent(msg.content)}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {status === 'thinking' && (
           <div className="flex items-center gap-3 py-4 px-2 animate-enter-bot">
              <div className="flex gap-2 items-center bg-white/5 px-5 py-3 rounded-full border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.02)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.5s_infinite]"></div>
                <div className="w-2 h-2 rounded-full bg-white/80 thinking-dot shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                <div className="w-2 h-2 rounded-full bg-white/80 thinking-dot shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                <div className="w-2 h-2 rounded-full bg-white/80 thinking-dot shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
              </div>
              <span className="text-[13px] text-white/60 font-medium tracking-widest uppercase animate-pulse">Synthesizing</span>
           </div>
        )}
        
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-transparent pb-24 md:pb-4 relative z-20">
         <InputConsole onSendMessage={onSendMessage} isLoading={status !== 'idle' && status !== 'error'} onEnhanceChange={setIsEnhancing} />
      </div>
    </div>
  );
};

export default ChatPanel;
