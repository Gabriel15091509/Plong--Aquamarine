import React from "react";
import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: "easeOut" },
};

const SectionCard = ({ id, title, icon: Icon, headerExtra, children, className = "" }) => (
  <motion.div
    id={id}
    variants={fadeInUp}
    className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6 scroll-mt-24 transition-shadow ${className}`}
  >
    <div className="flex items-center justify-between mb-5 gap-3">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
        <span className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400">
          <Icon className="w-5 h-5" />
        </span>
        {title}
      </h3>
      {headerExtra}
    </div>
    <div className="space-y-2">{children}</div>
  </motion.div>
);

export default SectionCard;
