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
        className="absolute inset-0 w-full h-full object-cover scale-105"
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

      {/* Overlay dégradé pour meilleure lisibilité */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-800/50 to-slate-900/70 z-10" />

      {/* Overlay secondaire pour plus de profondeur */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20 z-10" />

      {/* Motif de fond subtil */}
      <div className="absolute inset-0 opacity-5 z-10 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern
              id="grid-pattern"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      {/* Reflet lumineux en haut à droite */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl z-10 pointer-events-none" />

      {/* Reflet lumineux en bas à gauche */}
      <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl z-10 pointer-events-none" />

      {/* Contenu */}
      <div className="relative z-20">{children}</div>
    </div>
  );
};

export default VideoBackground;
