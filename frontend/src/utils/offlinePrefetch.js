import adherentService from "../services/Adherent/adherentService";
import sortieService from "../services/Sortie/sortieService";
import formationService from "../services/Formation/formationService";
import materielService from "../services/Materiel/materielService";
import plongeeService from "../services/Plongee/plongeeService";
import adhesionService from "../services/Adhesion/adhesionService";
import certificatService from "../services/CertificatMedical/certificatService";
import inscriptionService from "../services/Inscription/inscriptionService";

// Après connexion (ou au chargement si déjà connecté), on va chercher les
// listes principales en arrière-plan pour qu'elles soient déjà en cache
// (service worker, voir sw.js) même si l'utilisateur n'a pas encore ouvert
// ces pages — sans ça, la consultation hors-ligne ne couvrirait que les
// pages réellement visitées avant la coupure. Chaque appel est indépendant :
// un rôle qui n'a pas accès à une liste (403) ne doit pas bloquer les autres.
const PREFETCH_CALLS = [
  () => adherentService.getAll(),
  () => sortieService.getAll(),
  () => formationService.getAll(),
  () => materielService.getAll(),
  () => plongeeService.getAll(),
  () => adhesionService.getAll(),
  () => certificatService.getAll(),
  () => inscriptionService.getAll(),
];

export function prefetchForOffline() {
  if (!navigator.onLine) return;
  for (const call of PREFETCH_CALLS) {
    call().catch(() => {
      // Silencieux : rôle sans accès à cette liste, ou service momentanément
      // indisponible — la consultation hors-ligne sera juste incomplète pour
      // cette entrée, pas bloquante pour le reste.
    });
  }
}
