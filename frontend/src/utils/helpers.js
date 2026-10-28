import { format, formatDistance, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  STATUT_SORTIE,
  NIVEAU_OPTIONS,
  NIVEAU_MIN_PAR_TYPE_SORTIE,
  SEUILS_APPRECIATION_MONITEUR,
} from "./constants";

// Une sortie déjà en cours, terminée ou annulée ne doit plus pouvoir être
// choisie dans un select "avant sortie" (inscription, attribution matériel,
// incident...) : seules les sorties encore à venir restent sélectionnables.
const STATUTS_SORTIE_NON_SELECTIONNABLES = [
  STATUT_SORTIE.EN_COURS,
  STATUT_SORTIE.TERMINEE,
  STATUT_SORTIE.ANNULEE,
];

// Courant de surface météo (km/h, Open-Meteo marine) -> valeur de
// COURANT_OPTIONS. Seuils en nœuds convertis en km/h (1 kn = 1,852 km/h) :
// <0,2 Nul, <0,5 Faible, <1 Modéré, <2 Fort, sinon Très fort. Renvoie null
// si la météo n'a pas de relevé (hors zone/fenêtre) : on ne préremplit rien.
export const courantDepuisVitesse = (kmh) => {
  if (typeof kmh !== "number" || Number.isNaN(kmh)) return null;
  if (kmh < 0.4) return "Nul";
  if (kmh < 0.9) return "Faible";
  if (kmh < 1.9) return "Modéré";
  if (kmh < 3.7) return "Fort";
  return "Très fort";
};

export const isSortieSelectionnable = (sortie) =>
  !STATUTS_SORTIE_NON_SELECTIONNABLES.includes(sortie?.statut);

// À l'inverse : un constat "après sortie" (PlongeeForm : plongeon déjà
// réalisé — profondeur/durée ne sont connues qu'une fois la sortie en cours
// ou terminée ; IncidentForm : incident survenu pendant ou juste après une
// sortie) doit au contraire pouvoir cibler une sortie "Terminée"/"En cours"
// — c'est même le cas le plus fréquent. Seule une sortie annulée ne peut
// jamais avoir donné lieu à un vrai plongeon ni à un incident en mer.
// Utiliser isSortieSelectionnable ci-dessus ici masquait justement les
// sorties "Terminée"/"En cours" — donc le cas le plus courant — du select.
export const isSortieUtilisablePourConstat = (sortie) =>
  sortie?.statut !== STATUT_SORTIE.ANNULEE;

// Miroir de MaterielService.checkAvailability / MaterielRepository.
// findAvailableMateriel côté materiel-service : un matériel n'est
// proposable dans un select d'attribution que s'il est en bon état, sans
// révision technique en retard, ET physiquement au club (pas déjà prêté à
// quelqu'un d'autre, pas à l'atelier — voir LOCALISATION_MATERIEL_OPTIONS).
// Utilisé en filtre d'affichage côté formulaire ; le backend reste
// l'autorité finale (AttributionService.create revérifie tout à la
// création).
export const isMaterielDisponible = (materiel) => {
  if (!materiel) return false;
  const bonEtat = materiel.etat === "Bon" || materiel.etat === "Neuf";
  const disponibleAuClub = materiel.localisation === "Local";
  const echeanceDepassee =
    materiel.date_prochaine_echeance &&
    new Date(materiel.date_prochaine_echeance) < new Date();
  return bonEtat && disponibleAuClub && !echeanceDepassee;
};

// Même règle que isNiveauCompatible côté backend (activites-service/src/
// utils/roleScope.js NIVEAU_ORDER — ordre identique à NIVEAU_OPTIONS ici) :
// un adhérent peut s'inscrire à une sortie dont le niveau requis est
// inférieur ou égal au sien. Utilisé par InscriptionForm.jsx pour ne
// proposer, dans le select "Sortie", que celles compatibles avec
// l'adhérent concerné (soi-même, ou celui choisi par le président/moniteur)
// — le backend reste l'autorité finale (rejette toute incompatibilité à la
// création), ceci n'est qu'un filtre d'affichage pour éviter de proposer un
// choix qui sera de toute façon refusé.
export const isNiveauCompatible = (adherentNiveau, niveauRequis) => {
  if (!niveauRequis) return true;
  const requisIdx = NIVEAU_OPTIONS.indexOf(niveauRequis);
  if (requisIdx === -1) return true;
  const possedeIdx = NIVEAU_OPTIONS.indexOf(adherentNiveau);
  return possedeIdx >= requisIdx;
};

// Même règle que isTypeNiveauCompatible côté backend (activites-service/src/
// utils/roleScope.js) : un type de sortie n'est pas compatible avec
// n'importe quel niveau requis (ex. "Plongée technique" exige un minimum
// d'autonomie, "Baptême" est réservé aux non-plongeurs — voir
// NIVEAU_MIN_PAR_TYPE_SORTIE, constants.js). Utilisé par SortieForm.jsx pour
// ne proposer, dans le select "Niveau requis", que les niveaux compatibles
// avec le type choisi — le backend reste l'autorité finale.
export const isTypeNiveauCompatible = (type, niveauRequis) => {
  if (!type || !niveauRequis) return true;
  if (type === "Baptême") return niveauRequis === "Baptême";
  const min = NIVEAU_MIN_PAR_TYPE_SORTIE[type];
  if (!min) return true;
  const minIdx = NIVEAU_OPTIONS.indexOf(min);
  const niveauIdx = NIVEAU_OPTIONS.indexOf(niveauRequis);
  if (minIdx === -1 || niveauIdx === -1) return true;
  return niveauIdx >= minIdx;
};

// Heure de fin estimée = date_heure + duree_estimee (colonne TIME, servie
// en "HH:MM" ou "HH:MM:SS" selon qu'elle vient du formulaire ou de l'API) —
// utilisée pour savoir quand proposer de clôturer une sortie ("À terminer"),
// plus fiable que l'heure de départ seule (une sortie qui vient de démarrer
// ne doit pas être signalée comme "à terminer").
export const getFinEstimeeSortie = (sortie) => {
  if (!sortie?.date_heure) return null;
  const debut = new Date(sortie.date_heure);
  if (Number.isNaN(debut.getTime())) return null;
  const [heures = 0, minutes = 0] = (sortie.duree_estimee || "00:00")
    .split(":")
    .map(Number);
  return new Date(debut.getTime() + (heures * 60 + minutes) * 60 * 1000);
};

// "À terminer" (SortiesPage.jsx, SortieDetails.jsx) : la durée estimée est
// dépassée mais le statut n'a pas été mis à jour manuellement — passage
// "Planifiée" -> "En cours" désormais automatique (SortieService
// .demarrerSortiesEchues, backend), mais "En cours" -> "Terminée" reste une
// décision humaine (l'heure estimée n'est qu'une estimation, pas une
// certitude que la plongée est bien finie).
export const sortieDoitEtreCloturee = (sortie) => {
  const finEstimee = getFinEstimeeSortie(sortie);
  if (!finEstimee) return false;
  return (
    finEstimee < new Date() &&
    [STATUT_SORTIE.PLANIFIEE, STATUT_SORTIE.EN_COURS].includes(sortie?.statut)
  );
};

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

// NOUVEAU - Formatage de l'heure uniquement
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

// NOUVEAU - Formatage pour les inputs date (YYYY-MM-DD)
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

// NOUVEAU - Formatage pour les inputs datetime-local
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

// NOUVEAU - Vérifier si une date est aujourd'hui
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

// NOUVEAU - Vérifier si une date est passée
export const isPast = (date) => {
  if (!date) return false;
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return d < new Date();
  } catch {
    return false;
  }
};

// NOUVEAU - Vérifier si une date est future
export const isFuture = (date) => {
  if (!date) return false;
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return d > new Date();
  } catch {
    return false;
  }
};

// Nombre de jours calendaires (pas d'heures) avant `date` — troncature à
// minuit pour que "aujourd'hui"/"demain" ne dépendent pas de l'heure
// actuelle (même logique que côté backend, voir meteoClient.js). Utilisé
// par le compte à rebours de ProchaineSortieCard.
export const joursRestants = (date) => {
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const cible = new Date(date);
  cible.setHours(0, 0, 0, 0);
  return Math.round((cible - aujourdhui) / 86400000);
};

// Texte convivial du compte à rebours à partir de joursRestants — pour une
// date déjà passée (jours < 0), appelant a la responsabilité de ne pas
// l'afficher (le sens d'un "compte à rebours" n'existe que pour l'avenir).
export const formatCompteARebours = (jours) =>
  jours <= 0 ? "Aujourd'hui" : jours === 1 ? "Demain" : `Dans ${jours} jours`;

// Table WMO simplifiée (codes utilisés par Open-Meteo) — voir meteoClient.js
// côté backend pour les seuils de dangerosité associés. Partagée entre
// SortieDetails.jsx (prévision détaillée) et SortieWeatherBadge.jsx
// (pastille compacte J-3/J0 dans SortiesPage) pour n'avoir qu'une seule
// source de vérité sur le libellé des codes.
export const WEATHER_CODE_LABELS = {
  0: "Ciel dégagé",
  1: "Peu nuageux",
  2: "Partiellement nuageux",
  3: "Couvert",
  45: "Brouillard",
  48: "Brouillard givrant",
  51: "Bruine légère",
  53: "Bruine",
  55: "Bruine forte",
  61: "Pluie légère",
  63: "Pluie",
  65: "Pluie forte",
  80: "Averses légères",
  81: "Averses",
  82: "Averses violentes",
  95: "Orage",
  96: "Orage avec grêle",
  99: "Orage violent avec grêle",
};

export function weatherCodeLabel(code) {
  if (code === null || code === undefined) return null;
  return WEATHER_CODE_LABELS[code] || `Code météo ${code}`;
}

// NOUVEAU - Formater une durée en minutes/secondes
export const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return "-";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h${mins > 0 ? ` ${mins}min` : ""}`;
  }
  return `${mins}min`;
};

// NOUVEAU - Formater un numéro de téléphone
export const formatPhoneNumber = (phone) => {
  if (!phone) return "-";
  const cleaned = phone.replace(/\s/g, "");
  if (cleaned.length === 10) {
    return cleaned.replace(/(.{2})/g, "$1 ").trim();
  }
  return phone;
};

// Moyenne des notes de séance /20 d'une formation — seules les séances
// "Réalisée" ET notées comptent (une absence n'entre jamais dans le calcul :
// ni comme 0, ni comme une valeur manquante à combler). `null` tant
// qu'aucune séance n'a encore de note, pour distinguer "pas encore de
// données" de "moyenne de 0".
export const computeNoteMoyenneSeances = (seances) => {
  const notees = (seances || []).filter(
    (s) => s.statut === "Réalisée" && s.note !== null && s.note !== undefined,
  );
  if (notees.length === 0) return null;
  const total = notees.reduce((sum, s) => sum + Number(s.note), 0);
  return total / notees.length;
};

// Suggère une appréciation moniteur à partir d'une moyenne /20 (voir
// SEUILS_APPRECIATION_MONITEUR) — une simple proposition à pré-remplir,
// jamais une décision : le moniteur choisit toujours la valeur finale.
export const suggestAppreciationMoniteur = (moyenne) => {
  if (moyenne === null || moyenne === undefined) return null;
  const palier = SEUILS_APPRECIATION_MONITEUR.find((p) => moyenne >= p.seuil);
  return palier ? palier.appreciation : null;
};
