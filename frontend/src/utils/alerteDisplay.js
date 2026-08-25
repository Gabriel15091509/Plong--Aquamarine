import {
  FiBell,
  FiAlertCircle,
  FiCalendar,
  FiDollarSign,
  FiAward,
} from "react-icons/fi";

// Icône/couleur et description associées à chaque type d'Alerte — centralisé
// ici (plutôt que dupliqué entre le dropdown de Header.jsx et la page
// "Toutes les notifications", NotificationsPage.jsx) pour que les deux
// affichages restent identiques sans copier-coller à maintenir en double.
const ALERT_ICONS = {
  "Certificat expiré": {
    icon: FiAlertCircle,
    color: "text-red-500",
    bg: "bg-red-50 dark:bg-red-900/30",
  },
  "Certificat expire bientot": {
    icon: FiCalendar,
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-900/30",
  },
  "Adhésion expirée": {
    icon: FiAlertCircle,
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-900/30",
  },
  "Adhesion expire bientot": {
    icon: FiCalendar,
    color: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-900/30",
  },
  "Paiement en retard": {
    icon: FiDollarSign,
    color: "text-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-900/30",
  },
  Formation: {
    icon: FiAward,
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-900/30",
  },
  "Materiel en retard": {
    icon: FiAlertCircle,
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-900/30",
  },
  "Inactivite plongee": {
    icon: FiCalendar,
    color: "text-gray-500",
    bg: "bg-gray-50 dark:bg-gray-700",
  },
};

const ALERT_DEFAULT_ICON = {
  icon: FiBell,
  color: "text-gray-500",
  bg: "bg-gray-50 dark:bg-gray-700",
};

export const getAlertIcon = (type) => ALERT_ICONS[type] || ALERT_DEFAULT_ICON;

const ALERT_DESCRIPTIONS = {
  "Certificat expiré": "Le certificat médical a expiré",
  "Certificat expire bientot": "Le certificat médical expire dans moins de 30 jours",
  "Adhésion expirée": "L'adhésion est arrivée à expiration",
  "Adhesion expire bientot": "L'adhésion expire dans moins de 30 jours",
  "Paiement en retard": "Un paiement est en attente",
  Formation: "Une formation est disponible",
  "Materiel en retard": "Du matériel emprunté n'a pas été retourné à temps",
  "Inactivite plongee": "Aucune plongée enregistrée depuis longtemps",
};

export const getAlertDescription = (alerte) =>
  ALERT_DESCRIPTIONS[alerte.type] || alerte.type;
