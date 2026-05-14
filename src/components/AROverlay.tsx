import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Info, ExternalLink, RefreshCw } from 'lucide-react';
import Markdown from 'react-markdown';

interface AROverlayProps {
  landmarkName: string;
  history: string;
  narrationScript: string;
  sources: Array<{ title: string; url: string }>;
  onReset: () => void;
}

export const AROverlay: React.FC<AROverlayProps> = ({ 
  landmarkName, 
  history, 
  narrationScript, 
  sources,
  onReset 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [utterance, setUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(narrationScript);
    u.onend = () => setIsPlaying(false);
    setUtterance(u);

    return () => {
      synth.cancel();
    };
  }, [narrationScript]);

  const toggleNarration = () => {
    const synth = window.speechSynthesis;
    if (isPlaying) {
      synth.cancel();
      setIsPlaying(false);
    } else {
      if (utterance) {
        synth.speak(utterance);
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col pointer-events-none">
      {/* Target Marker */}
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white/60 pointer-events-none"
      >
        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white transform -translate-x-1 -translate-y-1" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white transform translate-x-1 -translate-y-1" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white transform -translate-x-1 translate-y-1" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white transform translate-x-1 translate-y-1" />
      </motion.div>

      {/* Info Panel */}
      <div className="mt-auto p-4 flex flex-col gap-4 pointer-events-auto">
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-white overflow-hidden max-h-[70vh] flex flex-col"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <motion.h2 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold tracking-tight mb-1"
              >
                {landmarkName}
              </motion.h2>
              <span className="text-xs uppercase tracking-widest text-white/40 font-mono">Landmark Detected</span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={toggleNarration}
                className={`p-3 rounded-full ${isPlaying ? 'bg-white text-black' : 'bg-white/10 text-white'} transition-colors`}
              >
                {isPlaying ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`p-3 rounded-full ${showHistory ? 'bg-white text-black' : 'bg-white/10 text-white'} transition-colors`}
              >
                <Info size={20} />
              </button>
              <button
                onClick={onReset}
                className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!showHistory ? (
              <motion.div
                key="narration"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="text-lg leading-relaxed text-white/90"
              >
                {narrationScript}
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="overflow-y-auto flex-1 pr-2 custom-scrollbar"
              >
                <div className="markdown-body text-sm leading-relaxed text-white/80 space-y-4">
                  <Markdown>{history}</Markdown>
                </div>
                
                {sources.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-white/10">
                    <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Sources</p>
                    <div className="flex flex-wrap gap-2">
                      {sources.map((source, i) => (
                        <a 
                          key={i}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-[10px] transition-colors"
                        >
                          {source.title} <ExternalLink size={10} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};
