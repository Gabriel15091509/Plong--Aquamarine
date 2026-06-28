import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSearch,
  FiFilter,
  FiX,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

const AdvancedSearch = ({
  searchTerm,
  onSearchChange,
  filter,
  onFilterChange,
  filterOptions,
  placeholder = "Rechercher...",
  additionalFilters = null,
  onClearFilters,
  showFilter = true,
}) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Barre de recherche */}
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtre principal */}
        {showFilter && filterOptions && (
          <div className="flex gap-2">
            <select
              value={filter}
              onChange={(e) => onFilterChange(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white/50 backdrop-blur-sm transition-all min-w-[140px]"
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Bouton filtres avancés */}
        {additionalFilters && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 rounded-xl border transition-all flex items-center gap-2 ${
              showFilters
                ? "bg-primary-500 text-white border-primary-500"
                : "bg-white/50 text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <FiFilter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtres</span>
            {showFilters ? (
              <FiChevronUp className="w-4 h-4" />
            ) : (
              <FiChevronDown className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Bouton effacer */}
        {(searchTerm || filter !== "all") && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm font-medium"
          >
            Effacer les filtres
          </button>
        )}
      </div>

      {/* Filtres avancés */}
      <AnimatePresence>
        {showFilters && additionalFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {additionalFilters}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedSearch;
