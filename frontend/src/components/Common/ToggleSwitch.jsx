import React from "react";

// Interrupteur on/off générique — d'abord défini localement dans
// ParametresPage.jsx (thème clair/sombre), déplacé ici dès qu'un 2e usage
// (MoniteurAvailabilityToggle.jsx, disponibilité d'un moniteur) l'a justifié.
const ToggleSwitch = ({ checked, onChange, label, disabled = false }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
      checked ? "bg-cyan-600" : "bg-gray-300 dark:bg-gray-700"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

export default ToggleSwitch;
