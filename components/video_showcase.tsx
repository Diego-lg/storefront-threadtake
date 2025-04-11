// Add this directive at the very top to mark the component as a Client Component
"use client";

import React, { useRef, useState } from "react";

export function VideoShowcase() {
  // Ref to access the video element directly
  const videoRef = useRef<HTMLVideoElement>(null);
  // State to track whether the video is currently playing
  const [isPlaying, setIsPlaying] = useState(true); // Start playing by default

  // Function to toggle video play/pause state
  const toggleVideo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause(); // Pause the video if it's playing
      } else {
        videoRef.current.play(); // Play the video if it's paused
      }
      setIsPlaying(!isPlaying); // Update the playing state
    }
  };

  return (
    // Outer container for the video showcase section
    // Apply white background by default, black background when 'dark' class is present
    // Added transition for smoother color changes
    <div className="py-24 bg-background transition-colors duration-300">
      {" "}
      {/* <-- MODIFIED THIS LINE */}
      {/* Max width container with padding */}
      <div className="max-w-7xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          {/* Apply light/dark text colors (these should still work well) */}
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-300">
            Crafted with Passion
          </h2>
          {/* Apply light/dark text colors (these should still work well) */}
          <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto transition-colors duration-300">
            Watch how our premium t-shirts are crafted with attention to every
            detail, from fabric selection to the final stitch.
          </p>
        </div>

        {/* Video player container */}
        <div
          className="relative aspect-video rounded-2xl overflow-hidden group cursor-pointer shadow-lg dark:shadow-xl" // Added subtle shadow
          onClick={toggleVideo} // Toggle video on click anywhere on the video area
        >
          {/* HTML video element */}
          <video
            ref={videoRef}
            muted // Mute the video by default
            loop // Loop the video
            autoPlay // Start playing automatically
            playsInline // Ensure video plays inline on mobile devices
            className="w-full h-full object-cover" // Ensure video fills container
          >
            {/* Video source */}
            <source
              src="https://pub-167bcbb6797c48d686d7dacfba94f17f.r2.dev/uploads/theadheaven.mp4"
              type="video/mp4"
            />
            {/* Fallback text if the browser doesn't support the video tag */}
            Your browser does not support the video tag.
          </video>

          {/* Optional: Overlay with play/pause button (could also be styled for dark mode if added) */}
          {/* 
          <div className="absolute inset-0 bg-black bg-opacity-20 dark:bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
             // Add Play/Pause Icon here, potentially changing color based on dark mode
          </div> 
          */}
        </div>
      </div>
    </div>
  );
}

// Export the component as default if needed, or keep it as a named export
// export default VideoShowcase;
