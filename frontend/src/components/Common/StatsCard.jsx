import React from "react";
import { motion } from "framer-motion";
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";

const StatsCard = ({
  title,
  value,
  icon: Icon,
  color,
  subValue,
  change,
  changeType,
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className="bg-white rounded-2xl shadow-card p-6 transition-all duration-300 hover:shadow-card-hover"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subValue && (
            <p className="text-xs text-gray-500 mt-1 truncate">{subValue}</p>
          )}
          {change && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-xs font-medium ${
                  changeType === "increase"
                    ? "text-green-600"
                    : changeType === "decrease"
                      ? "text-red-600"
                      : "text-gray-400"
                }`}
              >
                {change}
              </span>
              {changeType === "increase" && (
                <FiTrendingUp className="w-3 h-3 text-green-600" />
              )}
              {changeType === "decrease" && (
                <FiTrendingDown className="w-3 h-3 text-red-600" />
              )}
            </div>
          )}
        </div>
        <div
          className={`p-3 rounded-xl bg-gradient-to-r ${color} shadow-lg flex-shrink-0`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;
