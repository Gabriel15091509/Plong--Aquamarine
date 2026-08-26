// Secours hors-ligne pour useGetById : une fiche jamais consultée
// individuellement (donc jamais mise en cache HTTP en tant que telle) reste
// malgré tout affichable hors-ligne, à partir de la LISTE complète déjà
// préchargée et mise en cache durablement (voir utils/offlinePrefetch.js et
// sw.js, cache "api-offline-dataset") — contrairement au cache React Query
// (en mémoire, vidé à chaque rechargement), ce cache HTTP survit à un
// rechargement de page : ça fonctionne donc même en arrivant directement
// sur une fiche jamais visitée pendant cette session.
//
// Ne s'active que sur un vrai échec réseau (pas de réponse HTTP du tout,
// error.response absent — voir l'intercepteur de services/api.js) : une
// vraie erreur serveur (404 fiche supprimée, 403 rôle non autorisé...) doit
// remonter telle quelle, pas être masquée par un faux "non trouvé" silencieux.
//
// Les champs présents uniquement sur la fiche détaillée (relations,
// agrégats calculés type nb_plongees_reelles) resteront absents du secours
// — les pages de détail gèrent déjà ce cas (valeurs "Non renseigné"/
// "Indisponible" plutôt qu'un plantage), voir AdherentDetails.jsx.
export async function getByIdWithOfflineFallback(service, id, idField) {
  try {
    return await service.getById(id);
  } catch (error) {
    if (error.response) throw error;
    try {
      const list = await service.getAll();
      const found = (list?.data || []).find(
        (item) => String(item?.[idField]) === String(id),
      );
      if (found) return { success: true, data: found };
    } catch {
      // Liste elle aussi indisponible (jamais préchargée, rôle sans accès,
      // vraiment aucune connexion même pour la liste) — on retombe sur
      // l'erreur d'origine ci-dessous plutôt que d'en avaler une seconde.
    }
    throw error;
  }
}
