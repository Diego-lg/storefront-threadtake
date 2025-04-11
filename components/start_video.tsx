"use client";

import { useState, useRef } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";

export default function ShowcaseVideo() {
  const [isPlaying, setIsPlaying] = useState(true); // Default to playing
  const [isMuted, setIsMuted] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoLoaded = () => {
    setIsLoaded(true);
    if (videoRef.current && isPlaying) {
      videoRef.current.play().catch((err) => {
        console.warn("Autoplay failed:", err);
      });
    }
  };

  return (
    <div className="relative aspect-video w-full bg-black">
      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="h-12 w-12 animate-pulse rounded-full border-2 border-white/20 border-t-white"></div>
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        className="h-full w-full object-cover filter grayscale"
        muted={isMuted}
        loop
        autoPlay // Autoplay attribute
        playsInline
        onLoadedData={handleVideoLoaded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source
          src="https://pub-167bcbb6797c48d686d7dacfba94f17f.r2.dev/uploads/Untitled%20video%20-%20Made%20with%20Clipchamp%20(1).mp4"
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>

      {/* Video overlay with gradient */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-4">
        <div className="text-xs uppercase tracking-widest text-white/60">
          Design
        </div>
        {/* Play/Pause button */}
        <button onClick={togglePlay} className="text-white">
          {isPlaying ? <Pause /> : <Play />}
        </button>
      </div>
    </div>
  );
}
