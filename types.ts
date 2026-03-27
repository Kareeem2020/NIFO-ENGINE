
export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isThinking?: boolean; // If true, the model is currently processing this step
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  code: string;
  timestamp: number;
}

export interface SystemStatus {
  model: string;
  latency: number;
  status: 'idle' | 'thinking' | 'streaming' | 'error';
}
