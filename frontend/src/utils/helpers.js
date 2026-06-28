import { format, formatDistance, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

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

export const formatCurrency = (amount) => {
  if (!amount) return "0,00 €";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
};

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
