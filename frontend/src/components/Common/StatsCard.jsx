import React from "react";
import { motion } from "framer-motion";
import { FiArrowUp, FiArrowDown } from "react-icons/fi";

const StatsCard = ({
  title,
  value,
  icon: Icon,
  bgColor = "bg-blue-50 dark:bg-blue-900/20",
  textColor = "text-blue-600 dark:text-blue-400",
  subValue,
  trend,
  trendUp,
  badge,
  badgeColor = "text-gray-500 dark:text-slate-400",
}) => {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-300 p-5"
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 ${bgColor}`}
        >
          <Icon className={`w-5 h-5 ${textColor}`} />
        </div>
        <p className="text-sm font-medium text-gray-500 dark:text-slate-400 truncate">
          {title}
        </p>
      </div>

      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-4 truncate">
        {value}
      </p>

      {trend ? (
        <span
          className={`inline-flex items-center gap-0.5 text-xs font-semibold mt-2 ${
            trendUp
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {trendUp ? (
            <FiArrowUp className="w-3 h-3" />
          ) : (
            <FiArrowDown className="w-3 h-3" />
          )}
          {trend}
        </span>
      ) : badge ? (
        <span className={`inline-block text-xs font-semibold mt-2 ${badgeColor}`}>
          {badge}
        </span>
      ) : null}

      {subValue && (
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 truncate">
          {subValue}
        </p>
      )}
    </motion.div>
  );
};

export default StatsCard;
