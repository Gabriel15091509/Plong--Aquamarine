import React, { useState, useRef, useEffect } from "react";
import { FiSearch, FiChevronDown, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const SearchableSelect = ({
  options = [],
  value = "",
  onChange,
  placeholder = "Rechercher...",
  label = "",
  error = "",
  disabled = false,
  className = "",
  getOptionLabel = (option) => option.label || option,
  getOptionValue = (option) => option.value || option,
  renderOption = null,
  id = "",
  name = "",
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  const filteredOptions = options.filter((option) => {
    const label = getOptionLabel(option).toLowerCase();
    return label.includes(searchTerm.toLowerCase());
  });

  const selectedOption = options.find(
    (option) => getOptionValue(option) === value,
  );

  const handleSelect = (option) => {
    const optionValue = getOptionValue(option);
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(-1);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm("");
        setHighlightedIndex(-1);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    }
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(-1);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const item = listRef.current.children[highlightedIndex];
      if (item) {
        item.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        closeDropdown();
        break;
      case "Tab":
        closeDropdown();
        break;
      default:
        break;
    }
  };

  const inputClasses = `w-full pl-11 pr-4 py-3 text-sm border-2 rounded-xl focus:outline-none transition-all duration-300 bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${
    error
      ? "border-red-400 focus:border-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.1)]"
      : isOpen
        ? "border-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.15)]"
        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
  } ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 tracking-tight">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className={inputClasses} onClick={toggleDropdown}>
        <div className="flex items-center">
          <div className="flex-1 min-w-0">
            {isOpen ? (
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className={`text-sm truncate block ${
                  selectedOption
                    ? "text-gray-900 dark:text-white"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {selectedOption ? getOptionLabel(selectedOption) : placeholder}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            {value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FiX className="w-4 h-4 text-gray-400" />
              </button>
            )}
            <FiChevronDown
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="relative">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                  Aucun résultat trouvé
                </div>
              ) : (
                <ul
                  ref={listRef}
                  className="divide-y divide-gray-100 dark:divide-gray-800 max-h-56 overflow-y-auto"
                >
                  {filteredOptions.map((option, index) => {
                    const isSelected = getOptionValue(option) === value;
                    const isHighlighted = index === highlightedIndex;

                    return (
                      <li
                        key={getOptionValue(option)}
                        className={`px-4 py-2.5 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400"
                            : isHighlighted
                              ? "bg-gray-50 dark:bg-gray-800"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                        onClick={() => handleSelect(option)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        {renderOption ? (
                          renderOption(option)
                        ) : (
                          <span className="text-sm text-gray-900 dark:text-white">
                            {getOptionLabel(option)}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
          <span className="w-1 h-1 bg-red-500 rounded-full" />
          {error}
        </p>
      )}
    </div>
  );
};

export default SearchableSelect;
