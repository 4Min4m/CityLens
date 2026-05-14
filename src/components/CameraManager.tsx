import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, RefreshCw, X } from 'lucide-react';

interface CameraManagerProps {
  onCapture: (imageData: string) => void;
  isProcessing: boolean;
}

export const CameraManager: React.FC<CameraManagerProps> = ({ onCapture, isProcessing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsActive(true);
        setError(null);
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Please allow camera access to identify landmarks.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const captureFrame = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        onCapture(imageData);
      }
    }
  }, [onCapture]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col items-center justify-center">
      {error ? (
        <div className="text-white p-6 text-center">
          <p className="mb-4">{error}</p>
          <button 
            onClick={startCamera}
            className="px-6 py-2 bg-white text-black rounded-full font-medium"
          >
            Wait, let me fix it
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Scanning Animation */}
          {isProcessing && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-full h-1 bg-white/20 absolute top-1/2 -translate-y-1/2 animate-scan" />
              <div className="absolute inset-0 border-4 border-white/20 m-12" />
            </div>
          )}

          <div className="absolute bottom-12 flex items-center gap-6">
            <button
              id="capture-btn"
              onClick={captureFrame}
              disabled={isProcessing || !isActive}
              className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center transition-transform active:scale-95 ${isProcessing ? 'opacity-50' : 'opacity-100'}`}
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                {isProcessing ? (
                  <RefreshCw className="w-8 h-8 text-black animate-spin" />
                ) : (
                  <Camera className="w-8 h-8 text-black" />
                )}
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
