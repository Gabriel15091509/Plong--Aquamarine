import { format, formatDistance, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { STATUT_SORTIE } from "./constants";

// Une sortie déjà en cours, terminée ou annulée ne doit plus pouvoir être
// choisie dans un select (inscription, séance, attribution, incident,
// plongée...) : seules les sorties encore à venir restent sélectionnables.
const STATUTS_SORTIE_NON_SELECTIONNABLES = [
  STATUT_SORTIE.EN_COURS,
  STATUT_SORTIE.TERMINEE,
  STATUT_SORTIE.ANNULEE,
];

export const isSortieSelectionnable = (sortie) =>
  !STATUTS_SORTIE_NON_SELECTIONNABLES.includes(sortie?.statut);

export const formatRelativeTime = (date) => {
  if (!date) return "-";
  try {
    return formatDistance(
      typeof date === "string" ? parseISO(date) : date,
      new Date(),
      {
        addSuffix: true,
        locale: fr,
      },
    );
  } catch {
    return "-";
  }
};

export const formatDate = (date) => {
  if (!date) return "-";
  try {
    return format(
      typeof date === "string" ? parseISO(date) : date,
      "dd/MM/yyyy",
      { locale: fr },
    );
  } catch {
    return "-";
  }
};

export const formatDateTime = (date) => {
  if (!date) return "-";
  try {
    return format(
      typeof date === "string" ? parseISO(date) : date,
      "dd/MM/yyyy HH:mm",
      { locale: fr },
    );
  } catch {
    return "-";
  }
};

// ✅ NOUVEAU - Formatage de l'heure uniquement
export const formatTime = (date) => {
  if (!date) return "-";
  try {
    return format(typeof date === "string" ? parseISO(date) : date, "HH:mm", {
      locale: fr,
    });
  } catch {
    return "-";
  }
};

// ✅ NOUVEAU - Formatage pour les inputs date (YYYY-MM-DD)
export const formatDateForInput = (date) => {
  if (!date) return "";
  try {
    return format(
      typeof date === "string" ? parseISO(date) : date,
      "yyyy-MM-dd",
      { locale: fr },
    );
  } catch {
    return "";
  }
};

// ✅ NOUVEAU - Formatage pour les inputs datetime-local
export const formatDateTimeForInput = (date) => {
  if (!date) return "";
  try {
    return format(
      typeof date === "string" ? parseISO(date) : date,
      "yyyy-MM-dd'T'HH:mm",
      { locale: fr },
    );
  } catch {
    return "";
  }
};

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

export const formatCurrency = (amount) => currencyFormatter.format(amount || 0);

export const getInitials = (nom, prenom) => {
  if (!nom && !prenom) return "?";
  return `${nom?.charAt(0) || ""}${prenom?.charAt(0) || ""}`.toUpperCase();
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

export const capitalize = (str) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const generateColor = (str) => {
  if (!str) return "#3b82f6";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

// ✅ NOUVEAU - Vérifier si une date est aujourd'hui
export const isToday = (date) => {
  if (!date) return false;
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  } catch {
    return false;
  }
};

// ✅ NOUVEAU - Vérifier si une date est passée
export const isPast = (date) => {
  if (!date) return false;
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return d < new Date();
  } catch {
    return false;
  }
};

// ✅ NOUVEAU - Vérifier si une date est future
export const isFuture = (date) => {
  if (!date) return false;
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return d > new Date();
  } catch {
    return false;
  }
};

// ✅ NOUVEAU - Formater une durée en minutes/secondes
export const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return "-";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h${mins > 0 ? ` ${mins}min` : ""}`;
  }
  return `${mins}min`;
};

// ✅ NOUVEAU - Formater un numéro de téléphone
export const formatPhoneNumber = (phone) => {
  if (!phone) return "-";
  const cleaned = phone.replace(/\s/g, "");
  if (cleaned.length === 10) {
    return cleaned.replace(/(.{2})/g, "$1 ").trim();
  }
  return phone;
};
