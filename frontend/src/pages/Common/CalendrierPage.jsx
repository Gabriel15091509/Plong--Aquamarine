import React from "react";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiAnchor,
  FiSun,
  FiCloud,
  FiDroplet,
  FiMapPin,
} from "react-icons/fi";
import SortieCalendar from "../../components/Sortie/SortieCalendar";
import { useTheme } from "../../context/ThemeContext";

const CalendrierPage = () => {
  const { theme } = useTheme();

  // Animations d'entrée
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24,
      },
    },
  };

  const floatVariants = {
    animate: {
      y: [0, -10, 0],
      rotate: [0, 2, -2, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* En-tête avec animation et décoration */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-5 sm:p-8 text-white shadow-2xl"
      >
        {/* Décoration de fond */}
        <div className="absolute inset-0 opacity-10">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 L100,0 L100,100 L0,100 Z"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
            <circle cx="20" cy="20" r="15" fill="white" opacity="0.3" />
            <circle cx="80" cy="80" r="20" fill="white" opacity="0.2" />
            <circle cx="50" cy="50" r="25" fill="white" opacity="0.1" />
          </svg>
        </div>

        {/* Bulles flottantes */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            x: [0, 15, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-10 right-20 w-20 h-20 bg-white/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            y: [0, 20, 0],
            x: [0, -15, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute bottom-10 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl"
        />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div
              variants={floatVariants}
              animate="animate"
              className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg"
            >
              <FiCalendar className="w-8 h-8" />
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight"
              >
                Calendrier des sorties
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-blue-100 text-sm md:text-base mt-1"
              >
                Visualisez toutes les sorties du club
              </motion.p>
            </div>
          </div>

          {/* Badge d'information */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center gap-3 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-2xl"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <FiAnchor className="w-5 h-5" />
            </motion.div>
            <span className="text-sm font-medium">Toutes les sorties</span>
          </motion.div>
        </div>
      </motion.div>

      

      {/* Le calendrier avec animation d'entrée */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <SortieCalendar />
      </motion.div>

      {/* Footer informatif avec animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
            Planifiée
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            En cours
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-gray-500 rounded-full"></span>
            Terminée
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            Annulée
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
          <FiDroplet className="w-4 h-4 text-blue-400" />
          <span>Cliquez sur une sortie pour voir les détails</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CalendrierPage;
