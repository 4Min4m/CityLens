import { useState, useCallback } from 'react';
import { CameraManager } from './components/CameraManager';
import { AROverlay } from './components/AROverlay';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, MapPin, Navigation } from 'lucide-react';

interface ResultData {
  landmarkName: string;
  history: string;
  narrationScript: string;
  sources: Array<{ title: string; url: string }>;
}

export default function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = useCallback(async (imageData: string) => {
    setIsProcessing(true);
    setError(null);
    try {
      // Step 1: Recognize landmark
      const recRes = await fetch('/api/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });
      const recData = await recRes.json();
      
      if (!recRes.ok) {
        if (recRes.status === 429) {
           throw new Error('QUOTA_EXHAUSTED');
        }
        throw new Error(recData.error || 'Failed to recognize landmark');
      }
      
      const landmarkText = recData.result;
      const landmarkName = landmarkText.split('\n')[0].replace(/[#*]/g, '').trim();

      // Step 2 & 3: Fetch history and narration in one go
      const detRes = await fetch('/api/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landmarkName }),
      });
      const detData = await detRes.json();
      if (!detRes.ok) {
        if (detRes.status === 429) {
          throw new Error('QUOTA_EXHAUSTED');
        }
        throw new Error(detData.error || 'Failed to fetch landmark details');
      }

      setResult({
        landmarkName,
        history: detData.history,
        narrationScript: detData.narration,
        sources: detData.sources || [],
      });
    } catch (err: any) {
      console.error(err);
      if (err.message === 'QUOTA_EXHAUSTED') {
        setError('Quota exceeded for the current API key. Try switching to a billing-enabled key in the Settings > Secrets panel.');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="h-screen w-full bg-black font-sans selection:bg-white selection:text-black">
      {/* Background/Camera Layer */}
      <div className="absolute inset-0 z-0">
        <CameraManager onCapture={handleCapture} isProcessing={isProcessing} />
      </div>

      {/* UI Overlay Layer */}
      <div className="relative z-10 h-full w-full pointer-events-none flex flex-col">
        {/* Header */}
        <header className="p-6 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center shadow-2xl">
              <Navigation size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tighter uppercase italic">CityLens</h1>
              <div className="flex items-center gap-1.5 opacity-50">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-white uppercase tracking-widest font-mono">Live AR Mode</span>
              </div>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-4 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
             <MapPin size={14} className="text-white/40" />
             <span className="text-xs text-white/60 font-medium">Urban Explorer Beta</span>
          </div>
        </header>

        {/* Status messages */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="mx-auto mt-4 px-6 py-3 bg-red-500/90 backdrop-blur-md text-white rounded-2xl text-sm font-medium pointer-events-auto flex items-center gap-3"
            >
              <span>{error}</span>
              <button onClick={reset} className="underline underline-offset-4 opacity-80 hover:opacity-100 transition-opacity">Dismiss</button>
            </motion.div>
          )}

          {isProcessing && (
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="mx-auto mt-4 px-6 py-3 bg-white/10 backdrop-blur-md text-white rounded-2xl text-sm font-medium flex items-center gap-3"
            >
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span className="tracking-wide">Analyzing focal point...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detection Result AR Overlay */}
        {result && (
          <div className="absolute inset-0 pointer-events-none">
            <AROverlay 
              {...result} 
              onReset={reset} 
            />
          </div>
        )}

        {/* Viewfinder helper */}
        {!result && !isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="relative"
             >
                <div className="w-64 h-64 border border-white/20 rounded-3xl" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/40 font-mono text-[10px] uppercase tracking-[0.2em] text-center">
                  <Camera size={24} className="opacity-20 mb-2" />
                  Align Landmark<br/>within frame
                </div>
                
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-white/60 rounded-tl-xl" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-white/60 rounded-tr-xl" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-white/60 rounded-bl-xl" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-white/60 rounded-br-xl" />
             </motion.div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
        @keyframes scan {
          0% { top: 30%; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 70%; opacity: 0; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
