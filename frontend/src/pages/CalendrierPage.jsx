import React from 'react';
import { motion } from 'framer-motion';
import { FiCalendar } from 'react-icons/fi';
import SortieCalendar from '../components/Sortie/SortieCalendar';

const CalendrierPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FiCalendar className="w-6 h-6 text-primary-500" />
            Calendrier des sorties
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Visualisez toutes les sorties du club
          </p>
        </div>
      </div>

      <SortieCalendar />
    </motion.div>
  );
};

export default CalendrierPage;