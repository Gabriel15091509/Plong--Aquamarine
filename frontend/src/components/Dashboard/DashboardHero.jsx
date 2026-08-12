import React from "react";
import { motion } from "framer-motion";
import Logo from "../Common/Logo";

// Bannière d'en-tête du tableau de bord, factorisée pour que la vue "staff"
// (statistiques du club) et la vue "adhérent" (fiche personnelle) gardent
// exactement le même habillage visuel — seules les données affichées
// diffèrent selon le rôle.
const DashboardHero = ({ title, subtitle, quickStats = [] }) => {
  return (
    <div className="relative rounded-3xl h-[200px] md:h-[240px] shadow-2xl overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&fit=crop')`,
          backgroundPosition: "center 60%",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-800/60 to-slate-900/40 z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 z-10" />

      <div className="absolute inset-0 opacity-[0.06] z-0 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl z-10 pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl z-10 pointer-events-none" />

      <div className="relative z-20 h-full flex flex-col justify-center px-6 md:px-10 lg:px-14">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex items-center gap-4 md:gap-6"
        >
          <div className="hidden sm:flex items-center justify-center w-14 h-14 md:w-[72px] md:h-[72px] bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl flex-shrink-0 hover:scale-105 hover:bg-white/20 transition-all duration-300">
            <Logo size="lg" className="flex-shrink-0" />
          </div>

          <div className="hidden sm:block w-px h-12 bg-gradient-to-b from-white/30 via-white/10 to-transparent" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <h1 className="text-white text-xl md:text-3xl lg:text-4xl font-bold tracking-tight drop-shadow-2xl">
                {title}
              </h1>
              <span className="text-[10px] md:text-xs font-semibold text-white/90 bg-white/20 backdrop-blur-md px-3 md:px-4 py-1 rounded-full shadow-lg border border-white/20 hover:bg-white/30 transition-all duration-300">
                Dashboard
              </span>
            </div>
            <p className="text-white/80 text-xs md:text-sm lg:text-base font-light tracking-wide mt-0.5 md:mt-1 flex items-center gap-2 drop-shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              {subtitle}
            </p>
          </div>

          <div className="hidden lg:block text-right flex-shrink-0">
            <p className="text-white/50 text-[10px] font-medium tracking-[0.15em] drop-shadow-lg uppercase">
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <div className="flex items-center justify-end gap-2 mt-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-white/30 text-[8px] font-light tracking-[0.25em] uppercase">
                En direct
              </span>
            </div>
          </div>
        </motion.div>

        {quickStats.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.25 }}
            className="flex flex-wrap items-center gap-2 md:gap-3 mt-3 md:mt-4 pt-3 md:pt-4 border-t border-white/10"
          >
            {quickStats.map(({ icon: Icon, label, colorClass }, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 md:gap-2 bg-white/10 backdrop-blur-md px-3 md:px-4 py-1 md:py-1.5 rounded-full border border-white/10 hover:bg-white/20 hover:border-white/20 transition-all duration-300 cursor-default"
              >
                <Icon className={`w-3 h-3 md:w-3.5 md:h-3.5 ${colorClass || "text-white/90"}`} />
                <span className="text-white/90 text-[10px] md:text-xs font-medium tracking-wider whitespace-nowrap">
                  {label}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default DashboardHero;
