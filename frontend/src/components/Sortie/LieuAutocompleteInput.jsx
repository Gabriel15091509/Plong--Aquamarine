import React, { useEffect, useRef, useState } from "react";
import { FiMapPin } from "react-icons/fi";
import geocodingService from "../../services/Sortie/geocodingService";

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 3;

// Autocomplétion du champ "Lieu" via Nominatim (même API gratuite que le
// géocodage inverse de SortieLocationPicker) : à la saisie, propose des
// suggestions ; au choix, remplit Lieu/Site et recentre la carte via
// onSelect — symétrique du clic sur la carte qui remplit déjà ces champs en
// sens inverse. Le texte tapé reste toujours librement modifiable (aucune
// suggestion n'est imposée), la recherche est juste une aide.
const LieuAutocompleteInput = ({
  value,
  onChange,
  onSelect,
  onFocus,
  onBlur,
  name = "lieu",
  className,
  placeholder,
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const blurTimeoutRef = useRef(null);

  useEffect(
    () => () => {
      clearTimeout(debounceRef.current);
      clearTimeout(blurTimeoutRef.current);
      abortRef.current?.abort();
    },
    [],
  );

  const runSearch = (query) => {
    clearTimeout(debounceRef.current);
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const results = await geocodingService.search(query, {
          signal: controller.signal,
        });
        setSuggestions(results);
        setActiveIndex(-1);
      } catch (error) {
        if (error.name !== "AbortError") setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);
  };

  const handleChange = (e) => {
    onChange(e);
    setIsOpen(true);
    runSearch(e.target.value);
  };

  const handleSelect = (result) => {
    onSelect(result);
    setIsOpen(false);
    setSuggestions([]);
  };

  const handleFocus = (e) => {
    onFocus?.(e);
    clearTimeout(blurTimeoutRef.current);
    if (suggestions.length > 0) setIsOpen(true);
  };

  const handleBlur = (e) => {
    // Laisse le temps au clic sur une suggestion de se déclencher avant de
    // fermer la liste (le blur du champ précède le click sur le bouton).
    blurTimeoutRef.current = setTimeout(() => setIsOpen(false), 150);
    onBlur?.(e);
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const showDropdown = isOpen && (loading || suggestions.length > 0);

  return (
    <div className="relative">
      <input
        type="text"
        name={name}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
      />
      {showDropdown && (
        <ul
          role="listbox"
          className="absolute z-20 w-full mt-1 max-h-64 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg"
        >
          {loading && suggestions.length === 0 && (
            <li className="px-4 py-2.5 text-sm text-gray-400 dark:text-gray-500">
              Recherche...
            </li>
          )}
          {suggestions.map((result, index) => (
            <li key={result.id} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(result)}
                className={`w-full flex items-start gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                  index === activeIndex
                    ? "bg-blue-50 dark:bg-blue-900/30"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                <FiMapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-200 truncate">
                  {result.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LieuAutocompleteInput;
