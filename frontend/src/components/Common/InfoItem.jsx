import React from "react";
import { motion } from "framer-motion";

const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: "easeOut" },
};

const InfoItem = ({
  icon: Icon,
  label,
  value,
  highlight = false,
  avatarUrl,
  children,
}) => (
  <motion.div
    variants={fadeInUp}
    className={`flex items-start gap-4 p-4 rounded-xl transition-colors duration-150 ${
      highlight
        ? "bg-cyan-50/70 dark:bg-cyan-950/20"
        : "hover:bg-gray-50 dark:hover:bg-gray-800/30"
    }`}
  >
    <div
      className={`mt-0.5 w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 ${
        avatarUrl
          ? ""
          : highlight
            ? "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400"
            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
      }`}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <Icon className="w-5 h-5" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {label}
      </p>
      {children || (
        <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
          {value || "Non défini"}
        </p>
      )}
    </div>
  </motion.div>
);

export default InfoItem;
