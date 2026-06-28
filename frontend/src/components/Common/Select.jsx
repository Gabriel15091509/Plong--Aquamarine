import React, { useState } from "react";
import { FiChevronDown, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const Select = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Sélectionner...",
  displayKey = "name",
  valueKey = "id",
  error,
  required = false,
  disabled = false,
  className = "",
  showClear = false,
  isLoading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt[valueKey] === value);

  const handleSelect = (option) => {
    onChange(option[valueKey]);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setIsOpen(false);
  };

  const renderOption = (option) => {
    const displayValue =
      option[displayKey] ||
      option.name ||
      option.nom ||
      option.prenom ||
      option.email ||
      option.title ||
      option.label;
    const subtitle =
      option.email ||
      option.prenom ||
      option.description ||
      option.site ||
      option.lieu ||
      option.role;

    return (
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-800">
          {displayValue}
        </span>
        {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
          className={`w-full px-4 py-2.5 text-left border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
            error ? "border-red-500" : "border-gray-300"
          } ${disabled || isLoading ? "bg-gray-100 cursor-not-allowed" : "bg-white hover:border-primary-400"}`}
          disabled={disabled || isLoading}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 truncate">
              {isLoading ? (
                <span className="text-gray-400">Chargement...</span>
              ) : selectedOption ? (
                renderOption(selectedOption)
              ) : (
                <span className="text-gray-400">{placeholder}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {showClear && value && !isLoading && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1 hover:bg-gray-100 rounded-full"
                >
                  <FiX className="w-4 h-4 text-gray-400" />
                </button>
              )}
              <FiChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "transform rotate-180" : ""}`}
              />
            </div>
          </div>
        </button>

        <AnimatePresence>
          {isOpen && !disabled && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
              style={{ maxHeight: "300px" }}
            >
              <div className="overflow-y-auto max-h-60">
                {options.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">Aucune option disponible</p>
                  </div>
                ) : (
                  options.map((option, index) => (
                    <motion.button
                      key={option[valueKey] || index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => handleSelect(option)}
                      className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                        option[valueKey] === value ? "bg-primary-50" : ""
                      }`}
                    >
                      {renderOption(option)}
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Select;
