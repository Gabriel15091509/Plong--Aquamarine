import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiX, FiChevronDown } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from './LoadingSpinner';

const AsyncSelect = ({
  label,
  value,
  onChange,
  options = [],
  isLoading = false,
  placeholder = 'Sélectionner...',
  searchPlaceholder = 'Rechercher...',
  displayKey = 'name',
  valueKey = 'id',
  error,
  required = false,
  disabled = false,
  className = '',
  onSearch = null,
  minSearchLength = 2,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);

  // Filtrer les options quand la recherche change
  useEffect(() => {
    if (searchTerm.length >= minSearchLength || searchTerm.length === 0) {
      if (onSearch && searchTerm.length >= minSearchLength) {
        onSearch(searchTerm);
      } else {
        const filtered = options.filter(opt => {
          const displayValue = opt[displayKey]?.toString().toLowerCase() || '';
          return displayValue.includes(searchTerm.toLowerCase());
        });
        setFilteredOptions(filtered);
      }
    }
  }, [searchTerm, options, displayKey, onSearch, minSearchLength]);

  // Trouver l'option sélectionnée
  const selectedOption = options.find(opt => opt[valueKey] === value);

  // Gérer la sélection
  const handleSelect = (option) => {
    onChange(option[valueKey]);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Rendu de l'option
  const renderOption = (option) => {
    const displayValue = option[displayKey] || option.name || option.nom || option.prenom || option.email || option.title || option.label;
    const subtitle = option.email || option.prenom || option.description || option.site || option.lieu;
    
    return (
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-800">{displayValue}</span>
        {subtitle && (
          <span className="text-xs text-gray-500">{subtitle}</span>
        )}
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input de sélection */}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full px-4 py-2.5 text-left border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-primary-400'}`}
          disabled={disabled}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 truncate">
              {selectedOption ? (
                renderOption(selectedOption)
              ) : (
                <span className="text-gray-400">{placeholder}</span>
              )}
            </div>
            <FiChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
          </div>
        </button>

        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && !disabled && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
              style={{ maxHeight: '300px' }}
            >
              {/* Barre de recherche */}
              <div className="sticky top-0 bg-white p-2 border-b border-gray-100">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Liste des options */}
              <div className="overflow-y-auto max-h-60">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : filteredOptions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">Aucun résultat trouvé</p>
                  </div>
                ) : (
                  filteredOptions.map((option, index) => (
                    <motion.button
                      key={option[valueKey] || index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => handleSelect(option)}
                      className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                        option[valueKey] === value ? 'bg-primary-50' : ''
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

      {/* Message d'erreur */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default AsyncSelect;