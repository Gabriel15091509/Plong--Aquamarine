import React from "react";
import { motion } from "framer-motion";

const VideoBackground = ({ children, className = "" }) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Vidéo de fond */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        poster="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1920&fit=crop"
      >
        <source
          src="https://cdn.pixabay.com/video/2020/12/09/56738-478035803_large.mp4"
          type="video/mp4"
        />
        {/* Fallback image si la vidéo ne charge pas */}
        <img
          src="https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&fit=crop"
          alt="Récif corallien et plongée sous-marine"
          className="absolute inset-0 w-full h-full object-cover object-[center_60%]"
        />
      </video>

      {/* Overlay pour améliorer la lisibilité */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/60 via-primary-800/40 to-ocean-900/60" />

      {/* Contenu */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default VideoBackground;
