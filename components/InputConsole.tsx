
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { enhancePrompt } from '../services/gemini';

interface InputConsoleProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onEnhanceChange?: (isEnhancing: boolean) => void;
}

const InputConsole: React.FC<InputConsoleProps> = ({ onSendMessage, isLoading, onEnhanceChange }) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (onEnhanceChange) {
      onEnhanceChange(isEnhancing);
    }
  }, [isEnhancing, onEnhanceChange]);

  const handleSubmit = () => {
    if (!input.trim() || isLoading || isEnhancing) return;
    onSendMessage(input);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleEnhance = async () => {
    if (!input.trim() || isEnhancing || isLoading) return;
    setIsEnhancing(true);
    try {
      const enhanced = await enhancePrompt(input);
      setInput(enhanced);
    } catch (e) {
      console.error(e);
    } finally {
      setIsEnhancing(false);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  return (
    <div className="relative group max-w-4xl mx-auto w-full">
       <div className={`
         relative flex items-end gap-3 bg-black/40 backdrop-blur-2xl border transition-all duration-500 rounded-[32px] p-2
         ${isEnhancing ? 'animate-slow-glow' : isFocused ? 'border-white/30 shadow-[0_0_40px_rgba(255,255,255,0.05)]' : 'border-white/10 hover:border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.02)]'}
       `}>
          <button 
            onClick={handleEnhance}
            disabled={!input.trim() || isEnhancing || isLoading}
            className="pb-2 pl-2 group-hover:scale-110 transition-transform disabled:opacity-50 disabled:group-hover:scale-100"
            title="Enhance prompt"
          >
             <div className={`
               w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500
               ${isEnhancing ? "text-blue-400 rotate-180 scale-110" : isLoading ? "text-white" : "text-white/40 hover:text-white/80"}
             `}>
               <Sparkles size={20} className={isEnhancing ? "animate-pulse" : ""} strokeWidth={2} />
             </div>
          </button>
          
          <textarea
            ref={textareaRef}
            value={input}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? "Synthesizing..." : isEnhancing ? "Enhancing your vision..." : "Describe your vision..."}
            disabled={isLoading || isEnhancing}
            className="w-full bg-transparent text-white text-[15px] placeholder:text-white/30 focus:outline-none resize-none py-3 max-h-32 font-medium leading-relaxed disabled:opacity-50"
            rows={1}
          />

          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading || isEnhancing}
            className={`
              p-3 rounded-full transition-all duration-300 mb-0.5 mr-0.5
              ${input.trim() && !isLoading && !isEnhancing
                ? 'bg-white text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-105' 
                : 'bg-white/5 text-white/20 cursor-not-allowed'}
            `}
          >
             <Send size={18} strokeWidth={2.5} className={input.trim() && !isLoading && !isEnhancing ? "translate-x-0.5" : ""} />
          </button>
       </div>
    </div>
  );
};

export default InputConsole;
