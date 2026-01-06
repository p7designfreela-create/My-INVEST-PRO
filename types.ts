
export type AppMode = 'text' | 'image' | 'video' | 'live';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: Date;
}

export interface GeneratedVideo {
  id: string;
  url: string;
  prompt: string;
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
}
