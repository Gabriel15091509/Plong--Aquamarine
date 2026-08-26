import adherentService from "../services/Adherent/adherentService";
import sortieService from "../services/Sortie/sortieService";
import formationService from "../services/Formation/formationService";
import materielService from "../services/Materiel/materielService";
import plongeeService from "../services/Plongee/plongeeService";
import adhesionService from "../services/Adhesion/adhesionService";
import certificatService from "../services/CertificatMedical/certificatService";
import inscriptionService from "../services/Inscription/inscriptionService";
import competenceService from "../services/Formation/competenceService";
import specialiteFormationService from "../services/Formation/specialiteFormationService";
import palanqueeService from "../services/Palanquee/palanqueeService";
import attributionService from "../services/Attribution/attributionService";
import incidentService from "../services/Incident/incidentService";
import moniteurService from "../services/Moniteur/moniteurService";
import paiementService from "../services/Paiement/paiementService";
import presidentService from "../services/President/presidentService";
import reparationService from "../services/Reparation/reparationService";
import tresorierService from "../services/Tresorier/tresorierService";
import userService from "../services/User/userService";
import dashboardService from "../services/Dashboard/dashboardService";

// Après connexion (ou au chargement si déjà connecté), on va chercher les
// listes principales en arrière-plan pour qu'elles soient déjà en cache
// (service worker, voir sw.js — route dédiée "api-offline-dataset") même si
// l'utilisateur n'a pas encore ouvert ces pages — sans ça, la consultation
// hors-ligne ne couvrirait que les pages réellement visitées avant la
// coupure. Chaque appel est indépendant : un rôle qui n'a pas accès à une
// liste (403) ne doit pas bloquer les autres. `key` doit correspondre à
// l'URL préchargée ("/api/<key>") — à garder synchronisé avec
// OFFLINE_DATASET_PATHS dans sw.js.
//
// Couvre toutes les entités "liste complète, pas de paramètre requis" du
// frontend, pour que chaque module reste consultable hors-ligne — à
// l'exception volontaire des alertes/notifications : leur volume ("c'est
// très nombreux") a justifié une pagination dédiée côté serveur
// (AlerteService.getAllPaginated, page /notifications) précisément pour
// éviter de charger la liste complète d'un coup ; les reprécharger ici en
// entier réintroduirait le problème que cette pagination a résolu.
const PREFETCH_ENTRIES = [
  { key: "adherents", call: () => adherentService.getAll() },
  { key: "sorties", call: () => sortieService.getAll() },
  { key: "formations", call: () => formationService.getAll() },
  { key: "materiels", call: () => materielService.getAll() },
  { key: "plongees", call: () => plongeeService.getAll() },
  { key: "adhesions", call: () => adhesionService.getAll() },
  { key: "certificats-medicaux", call: () => certificatService.getAll() },
  { key: "inscriptions", call: () => inscriptionService.getAll() },
  { key: "competences", call: () => competenceService.getAll() },
  { key: "specialites-formation", call: () => specialiteFormationService.getAll() },
  { key: "palanquees", call: () => palanqueeService.getAll() },
  { key: "attributions", call: () => attributionService.getAll() },
  { key: "incidents", call: () => incidentService.getAll() },
  { key: "moniteurs", call: () => moniteurService.getAll() },
  { key: "paiements", call: () => paiementService.getAll() },
  { key: "president", call: () => presidentService.getAll() },
  { key: "reparations", call: () => reparationService.getAll() },
  { key: "tresoriers", call: () => tresorierService.getAll() },
  { key: "users", call: () => userService.getAll() },
  { key: "dashboard/trends", call: () => dashboardService.getTrends() },
  { key: "dashboard/indicateurs", call: () => dashboardService.getIndicateurs() },
];

// Horodatage/succès du dernier préchargement par entité, persisté pour
// survivre à un rechargement — lu par OfflineBanner.jsx pour indiquer
// concrètement depuis quand les données hors-ligne sont à jour, plutôt que
// d'avaler silencieusement les échecs comme avant.
const STATUS_STORAGE_KEY = "offline_prefetch_status";

function readStatus() {
  try {
    return JSON.parse(localStorage.getItem(STATUS_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function recordPrefetchResult(key, ok) {
  const status = readStatus();
  // En cas d'échec, on garde le dernier succès connu (s'il existe) : seul
  // le statut "ok" bascule à false, pour ne pas effacer un "à jour depuis"
  // encore valide à cause d'un échec ponctuel (service momentanément
  // indisponible) alors que les données précédemment chargées sont toujours
  // là et consultables.
  status[key] = { ...(status[key] || {}), ok, ...(ok ? { at: Date.now() } : {}) };
  try {
    localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(status));
  } catch {
    // Quota localStorage dépassé ou navigation privée stricte : tant pis,
    // l'indicateur sera juste absent, pas bloquant pour la consultation
    // hors-ligne elle-même (qui repose sur le cache du service worker, pas
    // sur ce statut).
  }
}

// Exporté pour OfflineBanner.jsx.
export function getPrefetchStatus() {
  return readStatus();
}

export function prefetchForOffline() {
  if (!navigator.onLine) return;
  for (const { key, call } of PREFETCH_ENTRIES) {
    call()
      .then(() => recordPrefetchResult(key, true))
      .catch(() => {
        // Rôle sans accès à cette liste, ou service momentanément
        // indisponible — la consultation hors-ligne sera juste incomplète
        // pour cette entrée, pas bloquante pour le reste.
        recordPrefetchResult(key, false);
      });
  }
}

let onlineListenerRegistered = false;

// Rejoue le préchargement à chaque retour réseau, pas seulement au login :
// sans ça, une session restée ouverte plusieurs jours (onglet jamais fermé)
// ne rafraîchissait jamais ses données hors-ligne au-delà du chargement
// initial, jusqu'à expiration du cache. Garde module-level pour ne
// s'enregistrer qu'une fois même si appelé plusieurs fois (même pattern que
// `let socket = null` dans services/api.js).
export function registerOfflinePrefetchOnReconnect() {
  if (onlineListenerRegistered) return;
  onlineListenerRegistered = true;
  window.addEventListener("online", prefetchForOffline);
}
