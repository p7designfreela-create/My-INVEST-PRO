
import React, { useState } from 'react';
import { ICONS } from '../constants';
import { generateImage } from '../services/gemini';
import { GeneratedImage } from '../types';

export const ImageView: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<GeneratedImage[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const url = await generateImage(prompt);
      const newImg: GeneratedImage = {
        id: Date.now().toString(),
        url,
        prompt,
        timestamp: new Date()
      };
      setHistory(prev => [newImg, ...prev]);
      setPrompt('');
    } catch (error: any) {
      alert(`Error generating image: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-800 space-y-4">
        <h2 className="text-xl font-outfit font-bold text-white">Create Visuals</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A futuristic cybernetic city with neon lights..."
            className="flex-1 bg-gray-900 border border-gray-700 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shrink-0"
          >
            {isLoading ? <ICONS.Spinner className="w-5 h-5" /> : <ICONS.Image className="w-5 h-5" />}
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && !history.some(h => h.id === 'loading') && (
          <div className="aspect-square bg-gray-900 border border-gray-800 rounded-3xl flex flex-col items-center justify-center gap-4 animate-pulse">
            <ICONS.Spinner className="w-8 h-8 text-indigo-500" />
            <span className="text-gray-400 text-sm">Synthesizing image...</span>
          </div>
        )}
        {history.map((img) => (
          <div key={img.id} className="group relative aspect-square bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 hover:border-indigo-500/50 transition-all">
            <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
              <p className="text-sm text-white line-clamp-2 mb-2 font-medium">{img.prompt}</p>
              <button 
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = img.url;
                  link.download = `generated-${img.id}.png`;
                  link.click();
                }}
                className="w-full py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-white text-xs font-bold transition-all"
              >
                Download Image
              </button>
            </div>
          </div>
        ))}
        {history.length === 0 && !isLoading && (
          <div className="col-span-full py-20 text-center space-y-3">
            <ICONS.Image className="w-12 h-12 text-gray-700 mx-auto" />
            <p className="text-gray-500">Your generated masterpieces will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};
