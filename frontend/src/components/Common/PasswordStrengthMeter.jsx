import React from "react";
import { FiCheck, FiX } from "react-icons/fi";
import { evaluatePasswordStrength } from "../../utils/passwordStrength";

// Jauge de robustesse affichée sous un champ "nouveau mot de passe" — barre
// de progression + liste des critères (voir utils/passwordStrength.js pour
// les règles, partagées avec la validation qui bloque la soumission tant
// qu'elles ne sont pas toutes réunies). N'affiche rien tant que le champ est
// vide : pas de barre rouge avant même que l'utilisateur ait commencé à
// taper.
const PasswordStrengthMeter = ({ password }) => {
  if (!password) return null;

  const { criteria, percent, label, barColor, textColor } =
    evaluatePasswordStrength(password);

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className={`text-xs font-semibold ${textColor} flex-shrink-0`}>
          {label}
        </span>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
        {criteria.map((critere) => (
          <li
            key={critere.id}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              critere.passed
                ? "text-green-600 dark:text-green-400"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {critere.passed ? (
              <FiCheck className="w-3.5 h-3.5 flex-shrink-0" />
            ) : (
              <FiX className="w-3.5 h-3.5 flex-shrink-0" />
            )}
            {critere.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordStrengthMeter;
