import React from "react";
import {
  STATUT_SORTIE,
  STATUT_INSCRIPTION,
  STATUT_PAIEMENT,
  STATUT_FORMATION,
} from "../../utils/constants";

// ✅ Configuration complète des statuts (sans icônes)
const statusConfig = {
  // 📌 Statuts des sorties
  [STATUT_SORTIE.PLANIFIEE]: {
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800/30",
    label: STATUT_SORTIE.PLANIFIEE,
  },
  [STATUT_SORTIE.EN_COURS]: {
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    border: "border-green-200 dark:border-green-800/30",
    label: STATUT_SORTIE.EN_COURS,
  },
  [STATUT_SORTIE.TERMINEE]: {
    color: "bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-600",
    label: STATUT_SORTIE.TERMINEE,
  },
  [STATUT_SORTIE.ANNULEE]: {
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    border: "border-red-200 dark:border-red-800/30",
    label: STATUT_SORTIE.ANNULEE,
  },

  // 📌 Statuts des inscriptions
  [STATUT_INSCRIPTION.EN_ATTENTE]: {
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    border: "border-yellow-200 dark:border-yellow-800/30",
    label: STATUT_INSCRIPTION.EN_ATTENTE,
  },
  [STATUT_INSCRIPTION.CONFIRMEE]: {
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    border: "border-green-200 dark:border-green-800/30",
    label: STATUT_INSCRIPTION.CONFIRMEE,
  },
  [STATUT_INSCRIPTION.LISTE_ATTENTE]: {
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800/30",
    label: STATUT_INSCRIPTION.LISTE_ATTENTE,
  },

  // 📌 Statuts des adhérents
  Actif: {
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    border: "border-green-200 dark:border-green-800/30",
    label: "Actif",
  },
  Inactif: {
    color: "bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-600",
    label: "Inactif",
  },
  Suspendu: {
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800/30",
    label: "Suspendu",
  },

  // 📌 Statuts des paiements
  [STATUT_PAIEMENT.PAYE]: {
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    border: "border-green-200 dark:border-green-800/30",
    label: STATUT_PAIEMENT.PAYE,
  },
  [STATUT_PAIEMENT.PARTIEL]: {
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    border: "border-yellow-200 dark:border-yellow-800/30",
    label: STATUT_PAIEMENT.PARTIEL,
  },
  Remboursé: {
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800/30",
    label: "Remboursé",
  },

  // 📌 Statuts des certificats
  Expiré: {
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    border: "border-red-200 dark:border-red-800/30",
    label: "Expiré",
  },
  Valide: {
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    border: "border-green-200 dark:border-green-800/30",
    label: "Valide",
  },

  // 📌 Statuts des formations
  [STATUT_FORMATION.ABANDONNEE]: {
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    border: "border-red-200 dark:border-red-800/30",
    label: STATUT_FORMATION.ABANDONNEE,
  },
  [STATUT_FORMATION.SUSPENDUE]: {
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800/30",
    label: STATUT_FORMATION.SUSPENDUE,
  },

  // 📌 Statuts du matériel
  Neuf: {
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    border: "border-green-200 dark:border-green-800/30",
    label: "Neuf",
  },
  Bon: {
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800/30",
    label: "Bon",
  },
  Usagé: {
    color:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    border: "border-yellow-200 dark:border-yellow-800/30",
    label: "Usagé",
  },
  "À réparer": {
    color:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800/30",
    label: "À réparer",
  },
  "Hors service": {
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    border: "border-red-200 dark:border-red-800/30",
    label: "Hors service",
  },
};

const StatusBadge = ({ status, showLabel = true }) => {
  // ✅ Si status est undefined ou null, afficher un badge par défaut
  if (!status) {
    return (
      <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full border border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-400">
        Inconnu
      </span>
    );
  }

  const config = statusConfig[status];

  // ✅ Si le statut n'est pas trouvé dans la config, afficher un badge par défaut
  if (!config) {
    return (
      <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full border border-gray-200 bg-gray-100 text-gray-600 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-400">
        {status}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full border ${config.color} ${config.border} transition-all hover:opacity-80`}
    >
      {showLabel && config.label}
    </span>
  );
};

export default StatusBadge;
