
import React, { useState } from 'react';
import { ICONS } from '../constants';
import { startVideoGeneration, pollVideoStatus } from '../services/gemini';
import { GeneratedVideo } from '../types';

export const VideoView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<GeneratedVideo[]>([]);
  const [apiKeyReady, setApiKeyReady] = useState(false);

  const checkApiKey = async () => {
    // According to SDK docs, we might need a special dialog for Veo
    if (typeof (window as any).aistudio?.hasSelectedApiKey === 'function') {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await (window as any).aistudio.openSelectKey();
      }
    }
    setApiKeyReady(true);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    
    await checkApiKey();
    setIsGenerating(true);
    
    const tempId = Date.now().toString();
    const newVideo: GeneratedVideo = {
      id: tempId,
      url: '',
      prompt,
      status: 'pending',
      timestamp: new Date()
    };
    
    setHistory(prev => [newVideo, ...prev]);
    const currentPrompt = prompt;
    setPrompt('');

    try {
      const op = await startVideoGeneration(currentPrompt);
      const finishedOp = await pollVideoStatus(op);
      
      const downloadLink = finishedOp.response?.generatedVideos?.[0]?.video?.uri;
      const downloadResp = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      const videoBlob = await downloadResp.blob();
      const videoUrl = URL.createObjectURL(videoBlob);

      setHistory(prev => prev.map(v => v.id === tempId ? { ...v, url: videoUrl, status: 'completed' } : v));
    } catch (error: any) {
      console.error(error);
      setHistory(prev => prev.map(v => v.id === tempId ? { ...v, status: 'failed' } : v));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="bg-indigo-900/10 p-6 rounded-3xl border border-indigo-500/20 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <ICONS.Video className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-outfit font-bold text-white">Video Synthesis (Veo)</h2>
        </div>
        <p className="text-gray-400 text-sm">Generate cinematic 720p videos. Note: Video generation takes 2-5 minutes.</p>
        
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A cosmic nebula swirling around a lone astronaut..."
            className="flex-1 bg-gray-900 border border-gray-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shrink-0"
          >
            {isGenerating ? <ICONS.Spinner className="w-5 h-5" /> : <ICONS.Video className="w-5 h-5" />}
            {isGenerating ? 'Synthesizing...' : 'Create Video'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {history.map((vid) => (
          <div key={vid.id} className="bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 flex flex-col">
            <div className="aspect-video bg-black flex items-center justify-center relative">
              {vid.status === 'completed' ? (
                <video src={vid.url} controls className="w-full h-full" />
              ) : vid.status === 'failed' ? (
                <div className="text-center space-y-2">
                  <ICONS.Alert className="w-10 h-10 text-red-500 mx-auto" />
                  <p className="text-red-400 text-sm font-medium">Generation Failed</p>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-indigo-400 text-sm font-bold uppercase tracking-widest">Processing</p>
                    <p className="text-gray-500 text-xs">Aesthetics take time. Hang tight!</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6">
              <p className="text-white font-medium text-sm mb-4">"{vid.prompt}"</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{vid.timestamp.toLocaleDateString()}</span>
                <span className={`px-3 py-1 rounded-full border ${
                  vid.status === 'completed' ? 'border-green-500/30 text-green-500 bg-green-500/5' :
                  vid.status === 'failed' ? 'border-red-500/30 text-red-500 bg-red-500/5' :
                  'border-indigo-500/30 text-indigo-500 bg-indigo-500/5'
                }`}>
                  {vid.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
