
import React, { useState, useRef, useEffect } from 'react';
import { ICONS, MODELS } from '../constants';
import { getAI, encode, decode, decodeAudioData } from '../services/gemini';
import { LiveServerMessage, Modality } from '@google/genai';
import { AudioVisualizer } from './AudioVisualizer';

export const LiveView: React.FC = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [isError, setIsError] = useState(false);
  
  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.input.close();
      audioContextRef.current.output.close();
      audioContextRef.current = null;
    }
    setIsSessionActive(false);
  };

  const startSession = async () => {
    try {
      setIsError(false);
      const ai = getAI();
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = { input: inputCtx, output: outputCtx };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: MODELS.LIVE,
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle output audio
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const audioCtx = audioContextRef.current?.output;
              if (audioCtx) {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioCtx.currentTime);
                const buffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
                const source = audioCtx.createBufferSource();
                source.buffer = buffer;
                source.connect(audioCtx.destination);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                sourcesRef.current.add(source);
                source.onended = () => sourcesRef.current.delete(source);
              }
            }

            // Handle transcription
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setTranscription(prev => [...prev.slice(-10), `Model: ${text}`]);
            }
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setTranscription(prev => [...prev.slice(-10), `You: ${text}`]);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Session Error:', e);
            setIsError(true);
            stopSession();
          },
          onclose: () => {
            setIsSessionActive(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: 'You are a helpful, high-energy creative assistant. Talk about design, AI, and aesthetics.',
          outputAudioTranscription: {},
          inputAudioTranscription: {},
        }
      });

      sessionRef.current = await sessionPromise;
      setIsSessionActive(true);
    } catch (err) {
      console.error(err);
      setIsError(true);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto h-full flex flex-col items-center justify-center space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-outfit font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
          Live Studio
        </h1>
        <p className="text-gray-500 max-w-lg mx-auto">
          Low-latency, natural voice conversations with Gemini 2.5 Pro. Experience AI in real-time.
        </p>
      </div>

      <div className="relative">
        <div className={`absolute -inset-8 bg-indigo-500/20 blur-3xl rounded-full transition-opacity duration-1000 ${isSessionActive ? 'opacity-100' : 'opacity-0'}`} />
        <button
          onClick={isSessionActive ? stopSession : startSession}
          className={`relative z-10 w-48 h-48 rounded-full flex flex-col items-center justify-center gap-4 transition-all duration-500 border-4 ${
            isSessionActive 
              ? 'bg-red-500/10 border-red-500/50 text-red-500 scale-105 shadow-[0_0_50px_rgba(239,68,68,0.2)]' 
              : 'bg-indigo-600 border-indigo-500 text-white hover:scale-105 hover:bg-indigo-500 shadow-[0_0_50px_rgba(79,70,229,0.3)]'
          }`}
        >
          {isSessionActive ? (
            <>
              <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center" />
              <span className="font-bold uppercase tracking-widest text-xs">End Session</span>
            </>
          ) : (
            <>
              <ICONS.Microphone className="w-12 h-12" />
              <span className="font-bold uppercase tracking-widest text-xs">Start Talking</span>
            </>
          )}
        </button>
      </div>

      <div className="w-full max-w-2xl">
        <AudioVisualizer isListening={isSessionActive} />
        
        {isError && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
            <ICONS.Alert className="w-5 h-5 shrink-0" />
            <p>Connection failed. Please ensure your API key is valid and you've granted microphone permissions.</p>
          </div>
        )}

        <div className="mt-8 space-y-2 max-h-48 overflow-y-auto pr-4 scroll-smooth">
          {transcription.map((line, i) => (
            <div key={i} className={`p-3 rounded-xl text-sm ${line.startsWith('You:') ? 'bg-indigo-500/5 border border-indigo-500/10 text-indigo-300' : 'bg-gray-900 border border-gray-800 text-gray-300'}`}>
              {line}
            </div>
          ))}
          {transcription.length === 0 && !isSessionActive && (
            <p className="text-center text-gray-600 text-xs italic">Live transcript will appear here...</p>
          )}
        </div>
      </div>
    </div>
  );
};
