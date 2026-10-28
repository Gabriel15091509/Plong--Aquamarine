const crypto = require("crypto");
const BaseService = require("./BaseService");
const SortieRepository = require("../repositories/SortieRepository");
const InscriptionRepository = require("../repositories/InscriptionRepository");
const identiteClient = require("../utils/serviceClients/identiteClient");
const vieAssociativeClient = require("../utils/serviceClients/vieAssociativeClient");
const {
  isNiveauCompatible,
  isTypeNiveauCompatible,
  profondeurMaxPourNiveau,
  NIVEAU_MIN_PAR_TYPE_SORTIE,
} = require("../utils/roleScope");
const { withAdherent } = require("../utils/enrichAdherents");
const {
  sendSortieReminderEmail,
  sendSortieModifieeEmail,
  sendReconfirmationInscriptionEmail,
  sendSortieAnnuleeMeteoEmail,
  sendPropositionsReprogrammationEmail,
  sendAlerteMeteoDouteuseEmail,
  sendSortieSansInscriptionEmail,
  sendSortieSousRemplieEmail,
} = require("../utils/email");
const { getForecastForDate, evaluerDanger } = require("../utils/meteoClient");
const { sortiesSeChevauchent } = require("../utils/sortieOverlap");
const { NotFoundError, ValidationError, ForbiddenError } = require("../utils/errors");

// Le test météo automatique se joue en deux phases (jamais en continu) :
//   - 3 tests sur 3 jours différents, nominalement J-5, J-4, J-3 (voir
//     ETAPES_TEST_AUTO) : chaque jour, UN SEUL test pas encore fait est joué
//     (voir testerUneEtapeAuto) — jamais plus d'un par passage de cron,
//     jamais rejoué. La décision (annuler ou non) ne tombe qu'après le 3e
//     test, sur la base des motifs accumulés au fil des 3 :
//     "dangereux" dès qu'au moins un des trois l'a détecté. Motif figé (voir
//     PREFIXE_MOTIF_ANNULATION_METEO) si annulation.
//     (Une sortie créée avec moins de 5 jours de marge compresse
//     naturellement ses 3 tests sur les jours disponibles, dans le même
//     ordre — voir la sélection de l'étape dans testerUneEtapeAuto.)
//   - à J-1 (JOURS_ALERTE_HUMAINE), si la sortie n'a pas déjà été annulée à
//     l'issue des 3 tests : re-test, mais sans jamais annuler
//     automatiquement — trop proche du jour J pour une décision purement
//     algorithmique. En cas de doute, l'organisateur est simplement
//     prévenu ; c'est à lui de décider.
// FENETRE_METEO_JOURS élargit la requête d'un jour de marge (voir
// findPlanifieesAVenirAvecCoordonnees) pour absorber un cron manqué un jour
// donné sans jamais rejouer un test déjà fait (voir meteo_test_j5_fait /
// meteo_test_j4_fait / meteo_test_j3_fait / meteo_alerte_j1_envoyee).
const JOURS_TEST_1 = 5;
const JOURS_ALERTE_HUMAINE = 1;
const FENETRE_METEO_JOURS = JOURS_TEST_1 + 1;
// Délai d'alerte "sortie sans inscription" (voir
// alerterSortiesSansInscription) : volontairement plus large que
// JOURS_ALERTE_HUMAINE — contrairement à la météo, ici il n'y a rien à
// tester automatiquement, l'alerte part dès que la sortie entre dans cette
// fenêtre ET reste sans aucune inscription, une seule fois (voir
// Sortie.alerte_sans_inscription_envoyee).
const JOURS_ALERTE_SANS_INSCRIPTION = 3;
// Délai + seuil de l'alerte "sortie sous-remplie" (voir
// alerterSortiesSousRemplies) : fenêtre volontairement courte (J-1/J-0,
// contrairement aux 3 jours de l'alerte "sans inscription" ci-dessus) — plus
// on se rapproche du départ, plus un faible remplissage devient un signal
// fort plutôt qu'un simple "les gens s'inscrivent tard". SEUIL_REMPLISSAGE
// exprimé en fraction de nb_places (0.5 = 50 %), pas en nombre absolu
// d'inscrits : une sortie à 2 places avec 1 inscrit (50 %) n'est pas dans
// la même situation qu'une sortie à 8 places avec 1 inscrit (12 %).
const JOURS_ALERTE_REMPLISSAGE = 1;
const SEUIL_REMPLISSAGE = 0.5;
// Champ booléen + libellé associé pour chacune des 3 étapes auto, dans
// l'ordre où elles doivent être jouées.
const ETAPES_TEST_AUTO = [
  { champ: "meteo_test_j5_fait", label: "J-5" },
  { champ: "meteo_test_j4_fait", label: "J-4" },
  { champ: "meteo_test_j3_fait", label: "J-3" },
];
// Dates alternatives proposées à l'organisateur d'une sortie annulée pour
// météo : jusqu'à PROPOSITIONS_MAX dates, cherchées jour par jour (même
// heure que la sortie annulée) sur une fenêtre de PROPOSITIONS_FENETRE_JOURS.
const PROPOSITIONS_MAX = 3;
const PROPOSITIONS_FENETRE_JOURS = 21;
// Préfixe du motif_annulation posé par verifierMeteoEtAnnulerSiDangereux —
// réutilisé par getPrevisionMeteo pour reconnaître une annulation météo et
// ne jamais y ré-afficher un badge "Conditions favorables" contradictoire
// (la prévision a pu être révisée depuis, ou un relevé observé après coup
// peut différer de la prévision qui a motivé l'annulation à l'époque).
const PREFIXE_MOTIF_ANNULATION_METEO = "Annulation automatique (météo défavorable)";
// Annulation manuelle (voir annulerPourMeteo) : déclenchée par le
// président/moniteur depuis la fiche sortie, typiquement suite à l'alerte
// J-1 (sendAlerteMeteoDouteuseEmail) qui ne déclenche jamais d'annulation
// automatique elle-même. Préfixe distinct du cas automatique ci-dessus,
// mais reconnu au même titre par estMotifAnnulationMeteo ci-dessous (même
// affichage "Annulée pour météo" côté fiche sortie).
const PREFIXE_MOTIF_ANNULATION_METEO_MANUELLE = "Annulation manuelle (météo dangereuse)";
const PREFIXES_MOTIF_ANNULATION_METEO = [
  PREFIXE_MOTIF_ANNULATION_METEO,
  PREFIXE_MOTIF_ANNULATION_METEO_MANUELLE,
];

// Reconnaît un motif_annulation posé par l'un des deux chemins d'annulation
// météo (auto ou manuel) et en extrait la partie "motifs" (après le " : "
// initial, sans le point final) — utilisé par getPrevisionMeteo pour ne
// jamais afficher un verdict recalculé qui contredirait la décision déjà
// prise. Renvoie `null` si le motif ne vient pas d'une annulation météo.
function motifAnnulationMeteo(motifAnnulation) {
  const prefixe = PREFIXES_MOTIF_ANNULATION_METEO.find((p) =>
    motifAnnulation?.startsWith(p),
  );
  if (!prefixe) return null;
  return motifAnnulation.slice(prefixe.length + 3).replace(/\.$/, "");
}

function formatSortieLabel(sortie) {
  const date = sortie?.date_heure
    ? new Date(sortie.date_heure).toLocaleDateString("fr-FR")
    : "";
  return `${sortie?.site || sortie?.lieu || "Sortie"} du ${date}`;
}

// Champs de logistique dont la modification, sur une sortie encore
// "Planifiée", justifie de prévenir les inscrits déjà enregistrés (email +
// notification in-app, voir SortieService.update/notifierModificationSortie)
// — un changement purement administratif ou interne (motif_annulation, les
// indicateurs meteo_test_*, alerte_remplissage_envoyee...) ne les concerne
// pas. Valeur = libellé affiché dans l'email et le détail de la notification.
const CHAMPS_NOTIFIABLES_MODIFICATION = {
  date_heure: "Date et heure",
  duree_estimee: "Durée estimée",
  lieu: "Lieu",
  site: "Site",
  type: "Type d'activité",
  niveau_requis: "Niveau requis",
  profondeur_max: "Profondeur max",
  nb_places: "Nombre de places",
  tarif_adherent: "Tarif",
};

// `data` (payload de mise à jour) peut arriver en chaînes/nombres bruts du
// formulaire, `sortie[champ]` en types Sequelize déjà castés (Date pour
// date_heure, number pour les colonnes numériques) — une comparaison stricte
// (`!==`) déclencherait donc une fausse détection de changement sur quasiment
// tous les champs. date_heure compare des timestamps, le reste une
// représentation texte.
function valeurChampModifiee(champ, ancienne, nouvelle) {
  if (nouvelle === undefined) return false;
  if (champ === "date_heure") {
    const a = ancienne ? new Date(ancienne).getTime() : null;
    const b = nouvelle ? new Date(nouvelle).getTime() : null;
    return a !== b;
  }
  return String(ancienne ?? "") !== String(nouvelle ?? "");
}

// Nombre de jours calendaires (pas d'heures) restant avant la sortie —
// même logique de troncature à minuit que meteoClient, pour que "J-3"/"J-1"
// désignent un jour précis plutôt qu'une fenêtre glissante de 72h/24h.
function joursAvantSortie(dateHeure) {
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);
  const cible = new Date(dateHeure);
  cible.setHours(0, 0, 0, 0);
  return Math.round((cible - aujourdhui) / 86400000);
}

// Cherche, jour par jour à partir du lendemain de la sortie annulée et à la
// même heure, des créneaux qui ne chevauchent aucune autre sortie existante
// (sortieOverlap.sortiesSeChevauchent, cf. son en-tête pour la définition du
// chevauchement) — s'arrête dès PROPOSITIONS_MAX trouvées. Ne vérifie pas la
// météo des dates proposées : celles au-delà de FENETRE_METEO_JOURS ne sont
// de toute façon pas encore prévisibles, et une date choisie sera de toute
// façon revérifiée par ce même cron une fois dans sa fenêtre.
async function proposerNouvellesDates(sortieAnnulee, sortieRepository) {
  const autres = await sortieRepository.findAutresPourChevauchement(
    sortieAnnulee.id_sortie,
  );
  const propositions = [];
  for (
    let i = 1;
    i <= PROPOSITIONS_FENETRE_JOURS && propositions.length < PROPOSITIONS_MAX;
    i++
  ) {
    const candidate = new Date(sortieAnnulee.date_heure);
    candidate.setDate(candidate.getDate() + i);
    const candidateSortie = {
      date_heure: candidate,
      duree_estimee: sortieAnnulee.duree_estimee,
    };
    const chevauche = autres.some((autre) =>
      sortiesSeChevauchent(candidateSortie, autre),
    );
    if (!chevauche) propositions.push(candidate);
  }
  return propositions;
}

class SortieService extends BaseService {
  constructor() {
    const repository = new SortieRepository();
    super(repository);
    this.sortieRepository = repository;
    this.inscriptionRepository = new InscriptionRepository();
  }

  async filterByNiveauForUser(sorties, user) {
    const adherent = await identiteClient.getAdherentForUser(user);
    if (!adherent) return sorties;
    return sorties.filter((s) =>
      isNiveauCompatible(adherent.niveau, s.niveau_requis),
    );
  }

  // Places réellement disponibles = nb_places - inscriptions Confirmée.
  // On retire le détail des inscriptions de la réponse : seul le compte
  // importe ici, pas les coordonnées des inscrits.
  attachCapacity(sortieInstance) {
    const plain = sortieInstance.toJSON ? sortieInstance.toJSON() : sortieInstance;
    const nb_inscrits = (plain.inscriptions || []).filter(
      (i) => i.statut === "Confirmée",
    ).length;
    delete plain.inscriptions;
    // Jamais le contenu des photos dans la réponse générale (liste, fiche) :
    // seuls les participants doivent pouvoir les voir (voir
    // assertCanAccessPhotos), et cette méthode alimente des endpoints
    // ouverts à tout authentifié (ex. la liste des sorties, parcourue par
    // n'importe quel adhérent avant même de s'inscrire). Seul le compte
    // (utile pour afficher un badge "12 photos" sans rien dévoiler) est
    // conservé ; le détail complet ne se récupère que via
    // GET /sorties/:id/photos, qui applique le vrai contrôle d'accès.
    const photos_count = Array.isArray(plain.photos) ? plain.photos.length : 0;
    delete plain.photos;
    return {
      ...plain,
      nb_inscrits,
      places_disponibles: Math.max((plain.nb_places || 0) - nb_inscrits, 0),
      photos_count,
    };
  }

  // Empêche de désigner un moniteur encadrant de deux sorties dont les
  // créneaux se chevauchent : sans ce garde-fou côté API, seul le grisage du
  // formulaire (SortieForm.jsx, purement visuel) dissuadait le président —
  // rien n'empêchait un double-booking via l'API directe, ni même via le
  // formulaire d'édition (auparavant non revalidé du tout, voir update()
  // ci-dessous). Même définition du chevauchement que
  // proposerNouvellesDates plus haut (sortieOverlap.sortiesSeChevauchent,
  // intervalle semi-ouvert [date_heure, date_heure + duree_estimee[).
  // `id_sortie_exclue` : la sortie elle-même en modification (absent à la
  // création). Ne vérifie rien si aucune date n'est encore connue — rien à
  // comparer.
  async findEncadrantOverlapErrors(encadrants, candidate, id_sortie_exclue) {
    if (!Array.isArray(encadrants) || encadrants.length === 0) return [];
    if (!candidate?.date_heure) return [];
    const autres = await this.sortieRepository.findAutresAvecEncadrants(id_sortie_exclue);
    const errors = [];
    for (const idMoniteur of encadrants) {
      const conflit = autres.find(
        (autre) =>
          Array.isArray(autre.encadrants) &&
          autre.encadrants.includes(idMoniteur) &&
          sortiesSeChevauchent(candidate, autre),
      );
      if (conflit) {
        errors.push({
          field: "encadrants",
          message: `Moniteur #${idMoniteur} est déjà encadrant de "${formatSortieLabel(conflit)}", qui chevauche ce créneau`,
        });
      }
    }
    return errors;
  }

  // Un moniteur ne peut gérer (modifier/supprimer/annuler pour météo,
  // pointage...) QUE les sorties où il est lui-même désigné encadrant
  // (Sortie.encadrants, liste d'id_moniteur choisie par le président à la
  // planification) — le président garde un accès total, quel que soit son
  // propre id_moniteur (pas besoin d'être désigné). Avant ce garde-fou,
  // `authorize(ROLES.PRESIDENT_MONITEUR)` sur les routes ne vérifiait que le
  // rôle générique : n'importe quel moniteur du club pouvait agir sur
  // n'importe quelle sortie, y compris celles confiées à un autre — voir
  // aussi le filtre "Encadrant" retiré de la vue "Sorties que j'encadre"
  // côté frontend (SortiesPage.jsx) pour le même motif.
  async assertCanManageSortie(sortie, user) {
    if (!user || user.role === "president") return;
    if (user.role !== "moniteur") {
      throw new ForbiddenError(
        "Seuls le président et les moniteurs désignés encadrants peuvent gérer cette sortie",
      );
    }
    const moniteur = await identiteClient.getMoniteurByUserId(user.id);
    const estEncadrantDesigne =
      moniteur &&
      Array.isArray(sortie.encadrants) &&
      sortie.encadrants.includes(moniteur.id_moniteur);
    if (!estEncadrantDesigne) {
      throw new ForbiddenError(
        "Seul le président ou un encadrant désigné sur cette sortie peut la gérer",
      );
    }
  }

  // Contrairement à assertCanManageSortie ci-dessus (gestion complète de la
  // sortie, réservée président/encadrant désigné), ici c'est délibérément
  // plus large : voir/ajouter des photos doit rester possible à tout
  // adhérent qui a réellement participé (inscription "Confirmée"), pas
  // seulement au staff qui l'a organisée — ce sont eux qui les ont prises.
  // Le président et le moniteur désigné encadrant gardent un accès total
  // (modération), même s'ils n'étaient pas eux-mêmes du voyage.
  async assertCanAccessPhotos(sortie, user) {
    if (!user) return;
    if (user.role === "president") return;
    if (user.role === "moniteur") {
      const moniteur = await identiteClient.getMoniteurByUserId(user.id);
      if (
        moniteur &&
        Array.isArray(sortie.encadrants) &&
        sortie.encadrants.includes(moniteur.id_moniteur)
      ) {
        return;
      }
    }
    const adherent = await identiteClient.getAdherentForUser(user);
    const inscription =
      adherent &&
      (await this.inscriptionRepository.findByAdherentAndSortie(
        adherent.num_adherent,
        sortie.id_sortie,
      ));
    if (inscription && inscription.statut === "Confirmée") return;
    throw new ForbiddenError(
      "Seuls les participants de cette sortie peuvent voir ses photos",
    );
  }

  async getPhotos(id, user) {
    const sortie = await this.sortieRepository.findById(id);
    if (!sortie) throw new NotFoundError("Sortie non trouvée");
    await this.assertCanAccessPhotos(sortie, user);
    return sortie.photos || [];
  }

  // `urls` : plusieurs liens à la fois (un par ligne côté formulaire) —
  // ajoutés en un seul appel plutôt qu'un aller-retour par photo. Chaque
  // lien vide (ligne blanche laissée dans le formulaire) est silencieusement
  // ignoré ; l'erreur ne porte que sur "aucun lien exploitable du tout".
  async addPhotos(id, urls, user) {
    const sortie = await this.sortieRepository.findById(id);
    if (!sortie) throw new NotFoundError("Sortie non trouvée");
    await this.assertCanAccessPhotos(sortie, user);

    const liens = (Array.isArray(urls) ? urls : [urls])
      .map((u) => String(u || "").trim())
      .filter(Boolean);
    if (liens.length === 0) {
      throw new ValidationError("Au moins un lien photo est requis");
    }

    const horodatage = new Date().toISOString();
    const nouvelles = liens.map((url) => ({
      id: crypto.randomUUID(),
      url,
      ajoute_par_user_id: user?.id ?? null,
      // Recopié au moment de l'ajout (pas une relation vers le compte) :
      // reste affichable même si ce compte est supprimé plus tard, voir le
      // même choix pour Sortie.encadrants/moniteurMap côté frontend.
      ajoute_par_nom: user?.name || "Un participant",
      date_ajout: horodatage,
    }));
    const photos = [...(sortie.photos || []), ...nouvelles];
    await this.sortieRepository.update(id, { photos });
    return photos;
  }

  async removePhoto(id, photoId, user) {
    const sortie = await this.sortieRepository.findById(id);
    if (!sortie) throw new NotFoundError("Sortie non trouvée");
    await this.assertCanAccessPhotos(sortie, user);

    const photos = sortie.photos || [];
    const photo = photos.find((p) => p.id === photoId);
    if (!photo) throw new NotFoundError("Photo non trouvée");

    // Chacun peut retirer SES PROPRES photos ; retirer celle d'un autre
    // participant reste réservé à la modération (président/encadrant
    // désigné), même règle d'accès que la gestion de la sortie elle-même.
    const estAuteur = user && photo.ajoute_par_user_id === user.id;
    if (!estAuteur) {
      await this.assertCanManageSortie(sortie, user);
    }

    const restantes = photos.filter((p) => p.id !== photoId);
    await this.sortieRepository.update(id, { photos: restantes });
    return restantes;
  }

  async getAll(user = null) {
    const sorties = await this.sortieRepository.findAllWithInscriptionCounts();
    const filtered = await this.filterByNiveauForUser(sorties, user);
    return filtered.map((s) => this.attachCapacity(s));
  }

  async getUpcomingSorties(user = null) {
    const sorties =
      await this.sortieRepository.findUpcomingWithInscriptionCounts();
    const filtered = await this.filterByNiveauForUser(sorties, user);
    return filtered.map((s) => this.attachCapacity(s));
  }

  // Adherent (identite-service) a quitté ce schéma : chaque inscription est
  // recomposée avec `.adherent` via identiteClient, dédupliqué par
  // num_adherent distinct.
  async getSortiesWithInscriptions(authHeader) {
    const sorties = await this.sortieRepository.findAllWithInscriptions();
    return await Promise.all(
      sorties.map(async (sortie) => {
        const plain = sortie.toJSON();
        plain.inscriptions = await withAdherent(plain.inscriptions, { authHeader });
        return plain;
      }),
    );
  }

  async getAvailablePlaces() {
    const sorties = await this.sortieRepository.findAllWithInscriptions();
    return sorties.map((sortie) => ({
      ...sortie.toJSON(),
      placesDisponibles:
        sortie.nb_places -
        (sortie.inscriptions?.filter((i) => i.statut === "Confirmée").length ||
          0),
    }));
  }

  // Contrat attendu par DashboardPage.jsx (carte "Sorties") : total,
  // planifiees, enCours, terminees, annulees sont lus tels quels (voir le
  // useMemo statsData, branche `typeof sortieStats.data === "object"`) — ne
  // pas retirer un de ces champs sans mettre à jour le frontend en même
  // temps, sous peine de voir resurgir le bug "stats à 0" déjà corrigé une
  // fois (planifiees/enCours manquaient initialement).
  async getSortieStats() {
    const sorties = await this.sortieRepository.findAll();
    const now = new Date();
    return {
      total: sorties.length,
      // Comptes par statut réel (Sortie.statut) — ce que le tableau de
      // bord affiche ("X planifiées • Y en cours • Z terminées").
      planifiees: sorties.filter((s) => s.statut === "Planifiée").length,
      enCours: sorties.filter((s) => s.statut === "En cours").length,
      terminees: sorties.filter((s) => s.statut === "Terminée").length,
      annulees: sorties.filter((s) => s.statut === "Annulée").length,
      // Comptes par date (conservés pour compatibilité éventuelle).
      aVenir: sorties.filter(
        (s) => new Date(s.date_heure) > now && s.statut !== "Annulée",
      ).length,
      passees: sorties.filter(
        (s) => new Date(s.date_heure) < now && s.statut !== "Annulée",
      ).length,
    };
  }

  // Détails d'une sortie avec ses inscriptions (adhérent recomposé par HTTP)
  async getSortieDetails(id, authHeader) {
    const sortie = await this.sortieRepository.findByIdWithInscriptions(id);
    if (!sortie) return null;
    const plain = sortie.toJSON();
    plain.inscriptions = await withAdherent(plain.inscriptions, { authHeader });
    return plain;
  }

  // Pour le pointage : adhérent + "checker" (qui a pointé) recomposés par HTTP
  async getPointageBySortie(id_sortie, authHeader) {
    const sortie = await this.sortieRepository.findByIdWithPointage(id_sortie);
    if (!sortie) throw new Error("Sortie non trouvée");

    const plain = sortie.toJSON();
    plain.inscriptions = await withAdherent(plain.inscriptions, { authHeader });

    const checkerCache = new Map();
    plain.inscriptions = await Promise.all(
      plain.inscriptions.map(async (inscription) => {
        if (inscription.presence_check_by) {
          if (!checkerCache.has(inscription.presence_check_by)) {
            checkerCache.set(
              inscription.presence_check_by,
              identiteClient.getUserBasicById(inscription.presence_check_by),
            );
          }
          inscription.checker = await checkerCache.get(inscription.presence_check_by);
        }
        return inscription;
      }),
    );

    plain.inscriptions.sort((a, b) => {
      const nomA = a.adherent?.nom || "";
      const nomB = b.adherent?.nom || "";
      return nomA.localeCompare(nomB);
    });

    return plain;
  }

  computePointageStats(sortie) {
    const inscriptions = sortie.inscriptions || [];
    return {
      total: inscriptions.length,
      present: inscriptions.filter((i) => i.presence && i.presence_checked)
        .length,
      absent: inscriptions.filter((i) => !i.presence && i.presence_checked)
        .length,
      notChecked: inscriptions.filter((i) => !i.presence_checked).length,
    };
  }

  async getById(id) {
    const sortie = await this.sortieRepository.findByIdWithInscriptions(id);
    if (!sortie) return null;
    const capacity = this.attachCapacity(sortie);
    // attachCapacity retire `.inscriptions` : on ne recompose donc pas les
    // adhérents ici (non utilisés par le détail léger d'une sortie).
    return capacity;
  }

  // profondeur_max défensif : le formulaire web le pré-remplit déjà (voir
  // PROFONDEUR_MAX_PAR_NIVEAU côté frontend), mais un appelant direct de
  // l'API (script, autre client) peut l'omettre — dans ce cas seulement, on
  // le déduit du niveau requis plutôt que de laisser la valeur non fournie
  // échouer sur la contrainte NOT NULL du modèle. Une valeur explicitement
  // fournie n'est jamais écrasée (un site précis peut être moins profond
  // que le max théorique du niveau).
  async create(data) {
    const payload = { ...data };
    if (payload.profondeur_max == null && payload.niveau_requis) {
      const suggestion = profondeurMaxPourNiveau(payload.niveau_requis);
      if (suggestion != null) payload.profondeur_max = suggestion;
    }
    return await this.sortieRepository.create(payload);
  }

  // Une fois qu'une sortie a quitté le statut "Planifiée" (passage manuel à
  // "En cours"), ses informations (lieu, horaires, tarifs...) ne doivent
  // plus être modifiables : les adhérents se sont déjà inscrits/organisés
  // sur cette base. Seul le champ `statut` lui-même reste modifiable, pour
  // permettre la suite du cycle de vie (En cours -> Terminée) — même
  // principe que PalanqueeService.assertPalanqueeModifiable et
  // AdhesionService.update (verrou une fois validé).
  //
  // L'annulation (statut -> "Annulée") est un cas à part, restreint à
  // "Planifiée" uniquement : une fois "En cours", des inscrits sont déjà
  // partis en mer/sur site — annuler après coup n'a plus de sens (voir
  // SortieDetails.jsx/SortiesPage.jsx, où le bouton "Annuler" n'est même
  // plus proposé passé ce stade). Une sortie "Terminée"/déjà "Annulée" ne
  // peut pas non plus être (re-)annulée — seule la suppression reste alors
  // possible (cf. delete() ci-dessous).
  assertSortieModifiable(sortie, data = {}) {
    if (data.statut === "Annulée" && sortie.statut !== "Planifiée") {
      throw new Error(
        'Seule une sortie encore "Planifiée" peut être annulée.',
      );
    }
    if (sortie.statut === "Planifiée") return;
    const champsModifies = Object.keys(data).filter((key) => key !== "statut");
    if (champsModifies.length > 0) {
      throw new Error(
        'Cette sortie a quitté le statut "Planifiée" : seul son statut peut encore être modifié.',
      );
    }
  }

  async update(id, data, user = null, authHeader = null) {
    const sortie = await this.sortieRepository.findById(id);
    if (!sortie) throw new Error("Sortie non trouvée");
    await this.assertCanManageSortie(sortie, user);
    this.assertSortieModifiable(sortie, data);
    // Revalidé à chaque modification qui touche à l'un de ces 3 champs, pas
    // à chaque appel de update() (validateSortieData, jamais appelée ici
    // auparavant) : un changement de date, de durée OU d'encadrants peut à
    // lui seul créer un chevauchement qui n'existait pas avant — donc
    // recalculé sur les valeurs EFFECTIVES (celles fournies, sinon celles
    // déjà en base) UNIQUEMENT quand l'un des 3 est effectivement fourni.
    // Sans cette garde, un simple changement de statut (ex. "Marquer
    // terminée", qui n'envoie que { statut }) revalidait un chevauchement
    // encadrant/date déjà en place depuis la planification d'origine — donc
    // jamais nouveau — et bloquait une action qui n'a rien à voir avec
    // l'encadrement (incident réel : passage à "Terminée" impossible sur
    // une sortie dont l'encadrant chevauchait une autre sortie de longue
    // date).
    if (
      data.encadrants !== undefined ||
      data.date_heure !== undefined ||
      data.duree_estimee !== undefined
    ) {
      const encadrantsOverlapErrors = await this.findEncadrantOverlapErrors(
        data.encadrants !== undefined ? data.encadrants : sortie.encadrants,
        {
          date_heure: data.date_heure !== undefined ? data.date_heure : sortie.date_heure,
          duree_estimee:
            data.duree_estimee !== undefined ? data.duree_estimee : sortie.duree_estimee,
        },
        id,
      );
      if (encadrantsOverlapErrors.length > 0) {
        throw new Error(encadrantsOverlapErrors.map((e) => e.message).join(" "));
      }
    }
    // Même garde que l'encadrement ci-dessus, mais basée sur un VRAI
    // changement (valeurChampModifiee), pas seulement sur la présence du
    // champ dans le payload : le formulaire d'édition renvoie systématique-
    // ment l'objet complet (type ET niveau_requis inclus, même non
    // touchés), donc `!== undefined` re-validerait une combinaison déjà en
    // place à CHAQUE modification, y compris pour corriger un simple lieu —
    // exactement le même piège que l'encadrement (voir plus haut). Une
    // combinaison déjà incohérente en base (donnée historique, antérieure à
    // ce garde-fou) reste donc éditable tant qu'on ne touche ni au type ni
    // au niveau requis eux-mêmes.
    if (
      valeurChampModifiee("type", sortie.type, data.type) ||
      valeurChampModifiee("niveau_requis", sortie.niveau_requis, data.niveau_requis)
    ) {
      const effectiveType = data.type !== undefined ? data.type : sortie.type;
      const effectiveNiveau =
        data.niveau_requis !== undefined ? data.niveau_requis : sortie.niveau_requis;
      if (!isTypeNiveauCompatible(effectiveType, effectiveNiveau)) {
        throw new Error(
          effectiveType === "Baptême"
            ? 'Une sortie "Baptême" doit avoir "Baptême" comme niveau requis (réservée aux non-plongeurs).'
            : `Le niveau requis "${effectiveNiveau}" n'est pas compatible avec le type "${effectiveType}" (minimum : "${NIVEAU_MIN_PAR_TYPE_SORTIE[effectiveType]}").`,
        );
      }
    }
    // Capturés avant l'update : une fois sortie.update(data) passé, l'ancien
    // statut/les anciennes valeurs ne sont plus lisibles sur cette même
    // instance (mutée en place).
    const demarreMaintenant = data.statut === "En cours" && sortie.statut !== "En cours";
    const ancienStatut = sortie.statut;
    const champsModifies = Object.keys(CHAMPS_NOTIFIABLES_MODIFICATION).filter((champ) =>
      valeurChampModifiee(champ, sortie[champ], data[champ]),
    );
    await sortie.update(data);
    if (demarreMaintenant) {
      await this.annulerInscriptionsNonConfirmees(id);
    }
    // Notifier les inscrits déjà enregistrés (email + notification in-app) :
    // seulement si la sortie reste "Planifiée" après la modification — un
    // changement qui coïncide avec une sortie de ce statut (annulation,
    // passage "En cours"...) relève d'un autre flux/message, pas d'une
    // simple modif de logistique — et qu'au moins un champ de logistique a
    // réellement changé (évite de notifier sur un enregistrement sans
    // changement réel, ex. juste re-soumettre le formulaire tel quel).
    if (ancienStatut === "Planifiée" && sortie.statut === "Planifiée" && champsModifies.length > 0) {
      await this.notifierModificationSortie(sortie, champsModifies, authHeader);
    }
    return sortie;
  }

  // Voir le garde-fou dans update() ci-dessus pour les conditions de
  // déclenchement. "Déjà inscrit" = même critère que la notification
  // d'annulation météo (annulerPourMeteo ci-dessous) : toute inscription non
  // annulée, pas seulement les "Confirmée" — une demande encore "En attente"
  // ou en "Liste d'attente" reste concernée par un changement de logistique.
  async notifierModificationSortie(sortie, champsModifies, authHeader) {
    const sortieAvecInscriptions = await this.sortieRepository.findByIdWithInscriptions(
      sortie.id_sortie,
    );
    const inscrits = (sortieAvecInscriptions?.inscriptions || []).filter(
      (i) => i.statut !== "Annulée",
    );
    if (inscrits.length === 0) return;

    const label = formatSortieLabel(sortie);
    const libellesChamps = champsModifies.map((champ) => CHAMPS_NOTIFIABLES_MODIFICATION[champ]);
    // Alerte.detail est limité à 100 caractères côté modèle (vie-associative-
    // service) — tronqué ici plutôt que de laisser l'API rejeter l'appel.
    const detail = `${label} — ${libellesChamps.join(", ")}`.slice(0, 100);

    for (const inscription of inscrits) {
      try {
        const adherent = await identiteClient.getAdherentById(inscription.num_adherent, authHeader);
        if (!adherent) continue;
        if (adherent.email) {
          await sendSortieModifieeEmail({
            to: adherent.email,
            adherentName: `${adherent.prenom} ${adherent.nom}`,
            sortieLabel: label,
            champsModifies: libellesChamps,
          });
        }
        await vieAssociativeClient.createAlerte(inscription.num_adherent, "Sortie modifiée", {
          detail,
          referenceType: "Sortie",
          referenceId: sortie.id_sortie,
        });
      } catch (error) {
        console.error(
          `Erreur notification modification sortie (inscription ${inscription.id_inscription}):`,
          error.message,
        );
      }
    }
  }

  // `user` par défaut à null (et non requis) : bulkDelete (BaseService)
  // rejoue this.delete(id, user, authHeader) pour chaque id, mais
  // this.delete garde une signature compatible avec un appel direct sans
  // user (scripts, tests) — dans ce cas assertCanManageSortie ne fait rien
  // (voir son garde `if (!user) return`).
  async delete(id, user = null) {
    const sortie = await this.sortieRepository.findById(id);
    if (!sortie) throw new Error("Sortie non trouvée");
    await this.assertCanManageSortie(sortie, user);
    // "En cours" est le seul statut où la suppression reste refusée : des
    // inscrits sont déjà partis en mer/sur site, un destroy silencieux ne
    // les prévient pas — voir assertSortieModifiable ci-dessus pour
    // l'annulation, réservée elle à "Planifiée". "Planifiée", "Terminée" et
    // "Annulée" restent toutes supprimables (avant que ça ne commence, ou
    // nettoyage d'un enregistrement final) — même règle que
    // SortieDetails.jsx/SortiesPage.jsx.
    if (sortie.statut === "En cours") {
      throw new Error(
        "Cette sortie est en cours : suppression impossible.",
      );
    }
    await sortie.destroy();
    return true;
  }

  // Le pointage n'a de sens que tant que la sortie est encore au stade
  // "Planifiée" : une fois "En cours", "Terminée" ou "Annulée" (changement
  // manuel de statut par le président/moniteur), il ne doit plus être
  // possible de pointer, modifier ou annuler un pointage — même principe que
  // PalanqueeService.assertPalanqueeModifiable et le garde-fou déjà en place
  // sur les inscriptions (InscriptionService.createInscription).
  assertSortiePlanifiee(sortie) {
    if (sortie.statut !== "Planifiée") {
      throw new Error(
        "Le pointage n'est possible que pour une sortie encore planifiée",
      );
    }
  }

  async enregistrerPointage(id_sortie, inscriptions, userId, authHeader, user) {
    const sortie = await this.sortieRepository.findById(id_sortie);
    if (!sortie) throw new Error("Sortie non trouvée");
    // Même garde-fou que replanifier/annulerPourMeteo : un moniteur ne peut
    // pointer que les sorties où il est lui-même désigné encadrant — sans
    // ça, un moniteur quelconque pouvait pointer présent/absent (donc
    // déclencher la constitution automatique de palanquées juste en
    // dessous) sur une sortie confiée à un autre, la route n'étant gardée
    // que par `authenticate` (voir sortieRoutes.js).
    await this.assertCanManageSortie(sortie, user);
    this.assertSortiePlanifiee(sortie);

    const dateSortie = new Date(sortie.date_heure);
    const today = new Date();
    dateSortie.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    if (dateSortie > today)
      throw new Error("Impossible de pointer une sortie future");

    const results = [];
    for (const insc of inscriptions) {
      const inscription = await this.inscriptionRepository.findById(insc.id);
      if (!inscription) continue;
      // Seules les inscriptions "Confirmée" de CETTE sortie sont pointables
      // — une inscription "Annulée"/"En attente"/"Liste d'attente", ou
      // rattachée à une autre sortie, ne doit jamais pouvoir être marquée
      // présente/absente (le frontend ne les propose plus non plus, voir
      // SortiePointage.jsx, mais l'API doit refuser même appelée
      // directement).
      if (inscription.id_sortie !== id_sortie || inscription.statut !== "Confirmée") {
        continue;
      }

      // Un inscrit qui n'a pas commencé à régler le tarif de la sortie ne
      // peut pas être pointé présent : le paiement doit avoir débuté avant
      // que la sortie ne débute pour lui. Il reste possible de le pointer
      // absent, ou de l'exclure du groupe (cancelInscription) si rien n'a
      // été réglé du tout.
      if (
        insc.presence &&
        Number(inscription.montant_du) > 0 &&
        Number(inscription.montant_paye || 0) <= 0
      ) {
        const adherent = await identiteClient.getAdherentById(inscription.num_adherent, authHeader);
        const nom = adherent
          ? `${adherent.prenom} ${adherent.nom}`
          : `l'inscrit #${inscription.num_adherent}`;
        throw new Error(
          `Impossible de pointer ${nom} présent : aucun paiement n'a encore été enregistré pour cette sortie.`,
        );
      }

      const updated = await this.inscriptionRepository.update(insc.id, {
        presence: insc.presence,
        presence_checked: true,
        presence_check_time: new Date(),
        presence_check_by: userId,
        absence_reason: insc.absence_reason || null,
        absence_justified: insc.absence_justified || false,
      });
      results.push(updated);

      // Constitution automatique des palanquées : dès qu'un membre est
      // pointé présent, on le rattache à une palanquée ouverte de cette
      // sortie (ou on en crée une) — best-effort, ne doit jamais faire
      // échouer le pointage lui-même.
      if (insc.presence) {
        try {
          const PalanqueeService = require("./PalanqueeService");
          await new PalanqueeService().autoConstituerPourPresence(
            id_sortie,
            inscription.num_adherent,
            userId,
            authHeader,
          );
        } catch (error) {
          console.error(
            `Erreur constitution auto palanquée (inscription ${insc.id}):`,
            error.message,
          );
        }
      }
    }
    return results;
  }

  async modifierPointage(id_inscription, data, userId, user) {
    const inscription =
      await this.inscriptionRepository.findById(id_inscription);
    if (!inscription) throw new Error("Inscription non trouvée");
    const sortie = await this.sortieRepository.findById(inscription.id_sortie);
    // Voir enregistrerPointage : même garde-fou "encadrant désigné".
    if (sortie) await this.assertCanManageSortie(sortie, user);
    if (sortie) this.assertSortiePlanifiee(sortie);
    if (!inscription.presence_checked)
      throw new Error("Cette inscription n'a pas encore été pointée");
    if (
      data.presence &&
      Number(inscription.montant_du) > 0 &&
      Number(inscription.montant_paye || 0) <= 0
    ) {
      throw new Error(
        "Impossible de marquer cet inscrit présent : aucun paiement n'a encore été enregistré pour cette sortie.",
      );
    }
    return await this.inscriptionRepository.update(id_inscription, {
      presence: data.presence,
      absence_reason: data.absence_reason || null,
      absence_justified: data.absence_justified || false,
      presence_check_by: userId,
      presence_check_time: new Date(),
    });
  }

  async annulerPointage(id_inscription, _userId, user) {
    const inscription =
      await this.inscriptionRepository.findById(id_inscription);
    if (!inscription) throw new Error("Inscription non trouvée");
    const sortie = await this.sortieRepository.findById(inscription.id_sortie);
    // Voir enregistrerPointage : même garde-fou "encadrant désigné".
    if (sortie) await this.assertCanManageSortie(sortie, user);
    if (sortie) this.assertSortiePlanifiee(sortie);
    if (!inscription.presence_checked)
      throw new Error("Cette inscription n'a pas encore été pointée");
    return await this.inscriptionRepository.update(id_inscription, {
      presence_checked: false,
      presence: false,
      presence_check_time: null,
      presence_check_by: null,
      absence_reason: null,
      absence_justified: false,
    });
  }

  async validateSortieData(data) {
    const errors = [];
    if (!data.type)
      errors.push({ field: "type", message: "Le type est requis" });
    // Un type de sortie n'est pas compatible avec n'importe quel niveau
    // requis (ex. "Plongée technique" exige un minimum d'autonomie, une
    // sortie "Baptême" est réservée aux non-plongeurs) — voir
    // isTypeNiveauCompatible/NIVEAU_MIN_PAR_TYPE_SORTIE (utils/roleScope.js).
    if (
      data.type &&
      data.niveau_requis &&
      !isTypeNiveauCompatible(data.type, data.niveau_requis)
    ) {
      errors.push({
        field: "niveau_requis",
        message:
          data.type === "Baptême"
            ? 'Une sortie "Baptême" doit avoir "Baptême" comme niveau requis (réservée aux non-plongeurs).'
            : `Le niveau requis "${data.niveau_requis}" n'est pas compatible avec le type "${data.type}" (minimum : "${NIVEAU_MIN_PAR_TYPE_SORTIE[data.type]}").`,
      });
    }
    if (!data.lieu)
      errors.push({ field: "lieu", message: "Le lieu est requis" });
    if (!data.site)
      errors.push({ field: "site", message: "Le site est requis" });
    if (!data.date_heure)
      errors.push({ field: "date_heure", message: "La date est requise" });
    if (!data.nb_places || data.nb_places < 1)
      errors.push({
        field: "nb_places",
        message: "Le nombre de places doit être supérieur à 0",
      });
    // RG4 : 12 plongeurs max par sortie (réglementation) — revalidé
    // côté serveur, la contrainte du champ côté frontend n'empêche pas un
    // appel API direct.
    else if (data.nb_places > 12)
      errors.push({
        field: "nb_places",
        message: "Le nombre de places ne peut pas dépasser 12 (réglementation)",
      });

    const hasLat =
      data.latitude !== undefined && data.latitude !== null && data.latitude !== "";
    const hasLng =
      data.longitude !== undefined && data.longitude !== null && data.longitude !== "";
    if (hasLat !== hasLng) {
      errors.push({
        field: "latitude",
        message: "La latitude et la longitude doivent être renseignées ensemble",
      });
    } else if (hasLat && hasLng) {
      const lat = Number(data.latitude);
      const lng = Number(data.longitude);
      if (Number.isNaN(lat) || lat < -90 || lat > 90)
        errors.push({
          field: "latitude",
          message: "Latitude invalide (doit être comprise entre -90 et 90)",
        });
      if (Number.isNaN(lng) || lng < -180 || lng > 180)
        errors.push({
          field: "longitude",
          message: "Longitude invalide (doit être comprise entre -180 et 180)",
        });
    }

    // Encadrants désignés (planification) : liste d'id_moniteur choisis
    // parmi les moniteurs enregistrés (identite-service) — distinct de
    // l'encadrant par palanquée (Palanquee.id_moniteur_encadrant), qui se
    // décide plus tard, une fois les palanquées constituées. Facultatif à
    // la création (une sortie peut être planifiée avant d'avoir trouvé ses
    // encadrants), mais chaque id fourni doit correspondre à un moniteur
    // réel — sinon l'affichage plantera silencieusement côté détail/liste.
    if (data.encadrants !== undefined && data.encadrants !== null) {
      if (!Array.isArray(data.encadrants)) {
        errors.push({
          field: "encadrants",
          message: "Les encadrants désignés doivent être une liste d'identifiants",
        });
      } else {
        const verifications = await Promise.all(
          data.encadrants.map(async (idMoniteur) => {
            const moniteur = await identiteClient.getMoniteurById(idMoniteur);
            return { idMoniteur, existe: !!moniteur };
          }),
        );
        verifications
          .filter((v) => !v.existe)
          .forEach((v) =>
            errors.push({
              field: "encadrants",
              message: `Moniteur #${v.idMoniteur} introuvable`,
            }),
          );

        errors.push(
          ...(await this.findEncadrantOverlapErrors(data.encadrants, {
            date_heure: data.date_heure,
            duree_estimee: data.duree_estimee,
          })),
        );
      }
    }

    return errors;
  }

  // Même calcul que DashboardService.countTrend dans le monolithe — dupliqué
  // ici pour que activites-service reste seul propriétaire de ses données ;
  // exposé via `GET /sorties/trend` pour que le dashboard (qui vit encore
  // dans le monolithe) puisse le récupérer par HTTP au lieu d'une requête
  // Sequelize directe sur un modèle qui ne lui appartient plus.
  async getTrend() {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastPeriod = new Date(startOfLastMonth);
    endOfLastPeriod.setDate(startOfLastMonth.getDate() + now.getDate());

    const [current, previous] = await Promise.all([
      this.sortieRepository.countInPeriod("date_heure", startOfThisMonth, now),
      this.sortieRepository.countInPeriod("date_heure", startOfLastMonth, endOfLastPeriod),
    ]);

    let percent;
    if (previous === 0) {
      percent = current === 0 ? 0 : 100;
    } else {
      percent = ((current - previous) / previous) * 100;
    }
    const rounded = Math.round(percent);
    return {
      current,
      previous,
      trend: `${rounded >= 0 ? "+" : ""}${rounded}%`,
      trendUp: rounded >= 0,
    };
  }

  // Taux de remplissage moyen des sorties (CDC 3.6.2) : places prises
  // (inscriptions Confirmée) rapportées aux places offertes, pondéré par le
  // nombre de places de chaque sortie plutôt qu'une moyenne simple par
  // sortie (une petite sortie complète ne doit pas peser autant qu'une
  // grande sortie à moitié pleine). Les sorties annulées ou sans place
  // définie n'entrent pas dans le calcul.
  async getTauxRemplissage() {
    const sorties = await this.sortieRepository.findAllWithInscriptionCounts();
    const pertinentes = sorties
      .map((s) => this.attachCapacity(s))
      .filter((s) => s.statut !== "Annulée" && s.nb_places > 0);

    if (pertinentes.length === 0) return 0;

    const totalPlaces = pertinentes.reduce((sum, s) => sum + s.nb_places, 0);
    const totalInscrits = pertinentes.reduce((sum, s) => sum + s.nb_inscrits, 0);

    return totalPlaces > 0 ? Math.round((totalInscrits / totalPlaces) * 100) : 0;
  }

  // Passage automatique "Planifiée" -> "En cours" dès que l'heure de départ
  // est atteinte (demande explicite, 2026-08-25 : jusqu'ici purement
  // manuel, et en pratique jamais fait faute de bouton dédié dans l'UI).
  // Appelé par un cron toutes les 5 minutes (voir app.js) — ne touche jamais
  // "Terminée"/"Annulée", qui restent décidés par le staff.
  //
  // Une fois "En cours", les inscriptions pas encore confirmées de chaque
  // sortie démarrée sont annulées automatiquement (demande explicite,
  // 2026-09-07 : voir annulerInscriptionsNonConfirmees) — même règle que le
  // passage manuel à "En cours" via update() ci-dessus.
  async demarrerSortiesEchues() {
    const ids = await this.sortieRepository.demarrerSortiesEchues();
    for (const id of ids) {
      await this.annulerInscriptionsNonConfirmees(id);
    }
    return ids.length;
  }

  // Une sortie "En cours" a déjà démarré : une inscription encore "En
  // attente" ou "Liste d'attente" n'a plus vocation à être confirmée, il
  // n'y a plus d'embarquement possible pour elle. Annulée en bloc plutôt
  // que laissée trainer indéfiniment, sans qu'un organisateur ait à le
  // faire une par une. Contrairement à InscriptionService.cancelInscription
  // (annulation d'UNE inscription par son titulaire ou le staff), pas de
  // promotion depuis la liste d'attente ici : la sortie ayant déjà démarré,
  // il n'y a plus personne à faire monter à la place de qui que ce soit.
  // Best-effort (erreur avalée) : appelée depuis demarrerSortiesEchues
  // (cron) autant que depuis update() (édition manuelle), ni l'un ni
  // l'autre ne doit échouer à cause d'un souci sur les inscriptions liées.
  async annulerInscriptionsNonConfirmees(id_sortie) {
    try {
      await this.inscriptionRepository.annulerNonConfirmeesBySortie(id_sortie);
    } catch (error) {
      console.error(
        `Erreur annulation auto des inscriptions non confirmées (sortie #${id_sortie}):`,
        error.message,
      );
    }
  }

  // Voir replanifier() ci-dessous : remet "En attente" (reconfirmation_
  // requise) chaque inscription "Confirmée" d'une sortie replanifiée après
  // annulation météo — la place n'est plus garantie à la nouvelle date.
  // Best-effort, même motif qu'annulerInscriptionsNonConfirmees ci-dessus :
  // un échec ici laisse les inscriptions "Confirmée" en l'état plutôt que
  // de faire échouer toute la replanification, déjà actée sur la sortie.
  async remettreEnAttenteConfirmeesInscriptions(id_sortie) {
    try {
      await this.inscriptionRepository.remettreEnAttenteConfirmeesBySortie(id_sortie);
    } catch (error) {
      console.error(
        `Erreur remise en attente des inscriptions confirmées (sortie #${id_sortie}):`,
        error.message,
      );
    }
  }

  // Rappel 24h avant sortie (CDC 3.2.2), envoyé aux inscrits Confirmée des
  // sorties du lendemain. Appelé par un cron (voir app.js) — best-effort,
  // un email en échec n'interrompt pas les autres.
  async envoyerRappels(authHeader) {
    const sorties = await this.sortieRepository.findDemainAvecInscriptions();
    let envoyes = 0;

    for (const sortie of sorties) {
      const confirmees = (sortie.inscriptions || []).filter((i) => i.statut === "Confirmée");
      for (const inscription of confirmees) {
        try {
          const adherent = await identiteClient.getAdherentById(inscription.num_adherent, authHeader);
          if (!adherent?.email) continue;
          await sendSortieReminderEmail({
            to: adherent.email,
            adherentName: `${adherent.prenom} ${adherent.nom}`,
            sortieLabel: formatSortieLabel(sortie),
            id_sortie: sortie.id_sortie,
          });
          envoyes += 1;
        } catch (error) {
          console.error(`Erreur rappel sortie (inscription ${inscription.id_inscription}):`, error.message);
        }
      }
    }
    return envoyes;
  }

  // Alerte l'organisateur (Sortie.created_by) qu'une sortie encore
  // "Planifiée" n'a reçu AUCUNE inscription à l'approche de la date —
  // jamais d'annulation automatique ici, contrairement à la météo : 0
  // inscription à J-3 ne prouve pas que la sortie ne se remplira jamais
  // (les gens s'inscrivent parfois tard), la décision d'annuler reste
  // entièrement humaine, comme testerEtAlerterJ1 pour la météo douteuse.
  // Un seul envoi par sortie (alerte_sans_inscription_envoyee) : pas de
  // rappel quotidien tant qu'elle reste sans inscription dans la fenêtre.
  // Appelé par un cron quotidien (voir app.js) — best-effort par sortie :
  // une erreur sur l'une n'interrompt pas le traitement des autres.
  async alerterSortiesSansInscription() {
    const sorties = await this.sortieRepository.findPlanifieesSansAlerteInscriptionAvant(
      JOURS_ALERTE_SANS_INSCRIPTION,
    );
    let alertees = 0;

    for (const sortie of sorties) {
      const inscritsReels = (sortie.inscriptions || []).filter((i) => i.statut !== "Annulée");
      if (inscritsReels.length > 0) continue;

      try {
        // Marqué avant l'envoi (comme testerEtAlerterJ1) : un échec d'email
        // ne doit pas faire rejouer indéfiniment la même alerte chaque jour.
        await this.sortieRepository.update(sortie.id_sortie, {
          alerte_sans_inscription_envoyee: true,
        });

        if (!sortie.created_by) continue;
        const organisateur = await identiteClient.getUserBasicById(sortie.created_by);
        if (!organisateur?.email) continue;

        await sendSortieSansInscriptionEmail({
          to: organisateur.email,
          organisateurName: organisateur.name,
          sortieLabel: formatSortieLabel(sortie),
          id_sortie: sortie.id_sortie,
          joursRestants: Math.max(joursAvantSortie(sortie.date_heure), 0),
        });
        alertees += 1;
      } catch (error) {
        console.error(
          `Erreur alerte sortie sans inscription (sortie ${sortie.id_sortie}):`,
          error.message,
        );
      }
    }
    return alertees;
  }

  // Alerte l'organisateur qu'une sortie encore "Planifiée" reste sous le
  // seuil de remplissage (SEUIL_REMPLISSAGE, en fraction de nb_places) à
  // l'approche du départ (JOURS_ALERTE_REMPLISSAGE = J-1/J-0) — inclut aussi
  // bien "1 seul inscrit sur 8 places" que "0 inscrit", contrairement à
  // alerterSortiesSansInscription (ci-dessus) qui ne couvre que le cas
  // strictement 0 inscrit, plus tôt (J-3). Les deux alertes peuvent donc se
  // déclencher pour la même sortie, à des moments différents — ce n'est pas
  // un doublon : la première est un heads-up précoce, la seconde un rappel
  // plus urgent juste avant le départ. Jamais d'annulation automatique ici
  // non plus : décision entièrement humaine. Un seul envoi par sortie
  // (alerte_remplissage_envoyee), comme alerterSortiesSansInscription.
  // Appelé par un cron quotidien (voir app.js) — best-effort par sortie.
  async alerterSortiesSousRemplies() {
    const sorties = await this.sortieRepository.findPlanifieesSansAlerteRemplissageAvant(
      JOURS_ALERTE_REMPLISSAGE,
    );
    let alertees = 0;

    for (const sortie of sorties) {
      const { nb_inscrits, nb_places } = this.attachCapacity(sortie);
      if (!nb_places || nb_inscrits / nb_places >= SEUIL_REMPLISSAGE) continue;

      try {
        // Marqué avant l'envoi (comme alerterSortiesSansInscription) : un
        // échec d'email ne doit pas faire rejouer indéfiniment la même
        // alerte chaque jour tant que la sortie reste sous le seuil.
        await this.sortieRepository.update(sortie.id_sortie, {
          alerte_remplissage_envoyee: true,
        });

        if (!sortie.created_by) continue;
        const organisateur = await identiteClient.getUserBasicById(sortie.created_by);
        if (!organisateur?.email) continue;

        await sendSortieSousRemplieEmail({
          to: organisateur.email,
          organisateurName: organisateur.name,
          sortieLabel: formatSortieLabel(sortie),
          id_sortie: sortie.id_sortie,
          nbInscrits: nb_inscrits,
          nbPlaces: nb_places,
          tauxPourcent: Math.round((nb_inscrits / nb_places) * 100),
        });
        alertees += 1;
      } catch (error) {
        console.error(
          `Erreur alerte sortie sous-remplie (sortie ${sortie.id_sortie}):`,
          error.message,
        );
      }
    }
    return alertees;
  }

  // Vérifie la météo des sorties "Planifiée" localisées (latitude/longitude
  // renseignées) en deux phases distinctes, jamais en continu :
  //   - 3 tests sur 3 jours différents (voir ETAPES_TEST_AUTO et
  //     testerUneEtapeAuto) : un seul test pas encore fait par passage de
  //     cron. Décision automatique — annule si au moins un des 3 tests a
  //     détecté un danger, motif figé — seulement après le 3e.
  //   - à J-1, si la sortie n'a pas déjà été annulée à l'issue des 3
  //     tests : re-test, mais sans jamais annuler automatiquement (voir
  //     testerEtAlerterJ1) — en cas de doute, l'organisateur est simplement
  //     prévenu, à lui de décider.
  //
  // Appelé par un cron quotidien (voir app.js) — best-effort par sortie :
  // une erreur (API météo indisponible, email en échec...) sur une sortie
  // n'interrompt pas le traitement des autres.
  async verifierMeteoEtAnnulerSiDangereux(authHeader) {
    const sorties = await this.sortieRepository.findPlanifieesAVenirAvecCoordonnees(
      FENETRE_METEO_JOURS,
    );
    let annulees = 0;

    for (const sortie of sorties) {
      try {
        const restant = joursAvantSortie(sortie.date_heure);
        const etapesRestantes = ETAPES_TEST_AUTO.some(({ champ }) => !sortie[champ]);

        if (etapesRestantes && restant > JOURS_ALERTE_HUMAINE) {
          const cancelled = await this.testerUneEtapeAuto(sortie, authHeader);
          if (cancelled) annulees += 1;
        } else if (!sortie.meteo_alerte_j1_envoyee && restant <= JOURS_ALERTE_HUMAINE) {
          // Couvre aussi le cas d'une sortie créée trop tard pour avoir
          // bénéficié des 3 tests (des étapes restent non faites) : trop
          // proche du jour J pour une décision automatique, on bascule
          // directement en alerte seule.
          await this.testerEtAlerterJ1(sortie);
        }
      } catch (error) {
        console.error(
          `Erreur vérification météo (sortie ${sortie.id_sortie}):`,
          error.message,
        );
      }
    }
    return annulees;
  }

  // Joue LE PROCHAIN test non encore fait parmi les 3 (J-5, J-4, J-3, dans
  // cet ordre — voir ETAPES_TEST_AUTO), jamais plus d'un par appel. Accumule
  // ses motifs dans meteo_motifs_detectes si dangereux. Seul le 3e et
  // dernier test (meteo_test_j3_fait) déclenche la décision : annule si au
  // moins un des 3 tests a détecté un danger ("OR" — le choix le plus
  // prudent), fige le motif et notifie (inscrits + organisateur). Renvoie
  // `true` si la sortie a été annulée à l'issue de ce dernier test.
  async testerUneEtapeAuto(sortie, authHeader) {
    const etape = ETAPES_TEST_AUTO.find(({ champ }) => !sortie[champ]);

    const forecast = await getForecastForDate({
      latitude: sortie.latitude,
      longitude: sortie.longitude,
      date: sortie.date_heure,
    });
    const { dangereux, motifs } = evaluerDanger(forecast);

    const motifsAccumules = Array.isArray(sortie.meteo_motifs_detectes)
      ? [...sortie.meteo_motifs_detectes]
      : [];
    if (dangereux) {
      motifsAccumules.push(...motifs.map((m) => `${m} (détecté à ${etape.label})`));
    }

    const estDernierTest = etape.champ === "meteo_test_j3_fait";
    if (!estDernierTest) {
      await this.sortieRepository.update(sortie.id_sortie, {
        [etape.champ]: true,
        meteo_motifs_detectes: motifsAccumules.length ? motifsAccumules : null,
      });
      return false;
    }

    if (motifsAccumules.length === 0) {
      await this.sortieRepository.update(sortie.id_sortie, {
        [etape.champ]: true,
        meteo_motifs_detectes: null,
      });
      return false;
    }

    await this.sortieRepository.update(sortie.id_sortie, {
      [etape.champ]: true,
      meteo_motifs_detectes: motifsAccumules,
      statut: "Annulée",
      motif_annulation: `${PREFIXE_MOTIF_ANNULATION_METEO} : ${motifsAccumules.join(", ")}.`,
    });

    const label = formatSortieLabel(sortie);
    const propositions = await proposerNouvellesDates(sortie, this.sortieRepository);

    const inscrits = (sortie.inscriptions || []).filter((i) => i.statut !== "Annulée");
    for (const inscription of inscrits) {
      try {
        const adherent = await identiteClient.getAdherentById(
          inscription.num_adherent,
          authHeader,
        );
        if (!adherent?.email) continue;
        await sendSortieAnnuleeMeteoEmail({
          to: adherent.email,
          adherentName: `${adherent.prenom} ${adherent.nom}`,
          sortieLabel: label,
          motifs: motifsAccumules,
          propositions,
        });
      } catch (error) {
        console.error(
          `Erreur notification annulation météo (inscription ${inscription.id_inscription}):`,
          error.message,
        );
      }
    }

    if (sortie.created_by) {
      try {
        const organisateur = await identiteClient.getUserBasicById(sortie.created_by);
        if (organisateur?.email) {
          await sendPropositionsReprogrammationEmail({
            to: organisateur.email,
            organisateurName: organisateur.name,
            sortieLabel: label,
            motifs: motifsAccumules,
            propositions,
          });
        }
      } catch (error) {
        console.error(
          `Erreur notification organisateur (sortie ${sortie.id_sortie}):`,
          error.message,
        );
      }
    }

    return true;
  }

  // Test à J-1 : jamais d'annulation automatique à ce stade — seulement une
  // alerte à l'organisateur en cas de doute (dangereux=true), qui décide
  // lui-même (maintien ou annulation manuelle). Marque toutes les étapes
  // comme faites (y compris les 3 tests auto, au cas où une sortie créée
  // trop tard n'ait pas eu le temps de tous les jouer) pour ne jamais rien
  // rejouer.
  async testerEtAlerterJ1(sortie) {
    const forecast = await getForecastForDate({
      latitude: sortie.latitude,
      longitude: sortie.longitude,
      date: sortie.date_heure,
    });
    const { dangereux, motifs } = evaluerDanger(forecast);

    await this.sortieRepository.update(sortie.id_sortie, {
      meteo_test_j5_fait: true,
      meteo_test_j4_fait: true,
      meteo_test_j3_fait: true,
      meteo_alerte_j1_envoyee: true,
    });

    if (!dangereux || !sortie.created_by) return;

    try {
      const organisateur = await identiteClient.getUserBasicById(sortie.created_by);
      if (organisateur?.email) {
        await sendAlerteMeteoDouteuseEmail({
          to: organisateur.email,
          organisateurName: organisateur.name,
          sortieLabel: formatSortieLabel(sortie),
          motifs,
        });
      }
    } catch (error) {
      console.error(
        `Erreur alerte météo J-1 (sortie ${sortie.id_sortie}):`,
        error.message,
      );
    }
  }

  // Annulation manuelle pour météo dangereuse, déclenchée par le président
  // ou un moniteur depuis la fiche sortie (bouton affiché uniquement quand
  // la prévision est jugée dangereuse — voir getPrevisionMeteo côté API,
  // meteo.dangereux côté frontend). Recalcule la dangerosité côté serveur
  // (jamais de confiance aveugle dans ce que le client affichait à l'instant
  // du clic) : refuse si les conditions sont finalement jugées favorables,
  // ou si la sortie n'est plus "Planifiée" (déjà annulée, démarrée...).
  // Même traitement que l'annulation automatique une fois la décision prise
  // : motif figé, inscrits notifiés par email — seul le préfixe du motif
  // diffère (PREFIXE_MOTIF_ANNULATION_METEO_MANUELLE) pour tracer l'origine
  // humaine de la décision.
  async annulerPourMeteo(id, authHeader, user = null) {
    const sortie = await this.sortieRepository.findByIdWithInscriptions(id);
    if (!sortie) throw new NotFoundError("Sortie non trouvée");
    await this.assertCanManageSortie(sortie, user);

    if (sortie.statut !== "Planifiée") {
      throw new ValidationError(
        "Seule une sortie encore planifiée peut être annulée pour cause météorologique.",
      );
    }
    if (sortie.latitude === null || sortie.longitude === null) {
      throw new ValidationError(
        "Aucune position renseignée pour cette sortie : impossible de vérifier la météo.",
      );
    }

    const forecast = await getForecastForDate({
      latitude: sortie.latitude,
      longitude: sortie.longitude,
      date: sortie.date_heure,
    });
    if (!forecast) {
      throw new ValidationError(
        "Prévision météo indisponible pour cette date : annulation refusée.",
      );
    }

    const { dangereux, motifs } = evaluerDanger(forecast);
    if (!dangereux) {
      throw new ValidationError(
        "Les conditions météo ne sont plus jugées dangereuses : annulation refusée.",
      );
    }

    const motifAnnulation = `${PREFIXE_MOTIF_ANNULATION_METEO_MANUELLE} : ${motifs.join(", ")}.`;
    await this.sortieRepository.update(sortie.id_sortie, {
      statut: "Annulée",
      motif_annulation: motifAnnulation,
    });

    const label = formatSortieLabel(sortie);
    const inscrits = (sortie.inscriptions || []).filter((i) => i.statut !== "Annulée");
    for (const inscription of inscrits) {
      try {
        const adherent = await identiteClient.getAdherentById(
          inscription.num_adherent,
          authHeader,
        );
        if (!adherent?.email) continue;
        await sendSortieAnnuleeMeteoEmail({
          to: adherent.email,
          adherentName: `${adherent.prenom} ${adherent.nom}`,
          sortieLabel: label,
          motifs,
        });
      } catch (error) {
        console.error(
          `Erreur notification annulation météo manuelle (inscription ${inscription.id_inscription}):`,
          error.message,
        );
      }
    }

    return this.sortieRepository.findById(sortie.id_sortie);
  }

  // Météo affichée sur la fiche sortie (GET /sorties/:id/meteo) — même
  // client et mêmes seuils que verifierMeteoEtAnnulerSiDangereux, mais
  // purement consultatif : ne modifie jamais le statut de la sortie (seul le
  // cron décide d'une annulation). Pour une sortie passée, meteoClient
  // renvoie un relevé observé (pas une prévision) — voir `forecast.historique`.
  // Renvoie `disponible: false` avec une raison lisible plutôt qu'une erreur
  // pour les cas normaux (pas de position renseignée, date hors des fenêtres
  // couvertes) — seule une sortie introuvable renvoie `null`.
  async getPrevisionMeteo(id) {
    const sortie = await this.sortieRepository.findById(id);
    if (!sortie) return null;

    if (sortie.latitude === null || sortie.longitude === null) {
      return {
        disponible: false,
        raison: "Aucune position (latitude/longitude) renseignée pour cette sortie.",
      };
    }

    const forecast = await getForecastForDate({
      latitude: sortie.latitude,
      longitude: sortie.longitude,
      date: sortie.date_heure,
    });
    if (!forecast) {
      const dateSortie = new Date(sortie.date_heure);
      const raison =
        dateSortie < new Date()
          ? "Aucun relevé météo disponible pour cette date (trop ancienne)."
          : "Trop éloignée dans le temps pour une prévision fiable (au-delà de 16 jours).";
      return { disponible: false, raison };
    }

    // Sortie déjà annulée pour météo (auto ou manuelle) : la prévision a pu
    // être révisée depuis (le cron l'évalue jusqu'à FENETRE_METEO_JOURS avant
    // la date, elle peut ensuite s'améliorer), ou le relevé observé après
    // coup peut différer de ce qui a motivé la décision à l'époque. Dans les
    // deux cas, ne jamais recalculer un verdict "Conditions favorables" qui
    // contredirait visuellement le motif_annulation déjà affiché — celui-ci
    // fait foi.
    if (sortie.statut === "Annulée") {
      const motifOriginal = motifAnnulationMeteo(sortie.motif_annulation);
      if (motifOriginal !== null) {
        return {
          disponible: true,
          forecast,
          dangereux: true,
          motifs: motifOriginal ? motifOriginal.split(", ") : [],
          annuleePourMeteo: true,
        };
      }
    }

    const { dangereux, motifs } = evaluerDanger(forecast);
    return { disponible: true, forecast, dangereux, motifs };
  }

  // Propositions de dates de repli affichées sur la fiche sortie pour une
  // sortie annulée météo (auto ou manuelle) — même calcul que celui déjà
  // envoyé par email à l'organisateur (proposerNouvellesDates : jusqu'à
  // PROPOSITIONS_MAX dates, même heure que la sortie annulée, sans
  // chevauchement avec une autre sortie), mais exposé ici comme choix
  // interactif (replanifier() ci-dessous) plutôt que comme simple
  // information à recopier à la main. Chaque proposition est enrichie de
  // sa météo quand elle est déjà prévisible (≤16 jours, getForecastForDate)
  // — au-delà, `meteo: null`, comme le rappelle déjà l'email ("sera
  // revérifiée par le cron une fois dans sa fenêtre").
  async getPropositionsReprogrammation(id) {
    const sortie = await this.sortieRepository.findById(id);
    if (!sortie) throw new NotFoundError("Sortie non trouvée");

    if (sortie.statut !== "Annulée" || motifAnnulationMeteo(sortie.motif_annulation) === null) {
      throw new ValidationError(
        "Cette sortie n'a pas été annulée pour cause météorologique.",
      );
    }

    const dates = await proposerNouvellesDates(sortie, this.sortieRepository);

    return Promise.all(
      dates.map(async (date) => {
        let meteo = null;
        if (sortie.latitude !== null && sortie.longitude !== null) {
          const forecast = await getForecastForDate({
            latitude: sortie.latitude,
            longitude: sortie.longitude,
            date,
          });
          if (forecast) meteo = { ...evaluerDanger(forecast), forecast };
        }
        return { date_heure: date.toISOString(), meteo };
      }),
    );
  }

  // Reprogrammation d'une sortie annulée météo sur l'une des propositions
  // ci-dessus (ou toute autre date choisie manuellement) : remet la sortie
  // "Planifiée" à la nouvelle date, efface le motif d'annulation, et
  // réinitialise tout le cycle de test météo automatique (les 3 tests
  // J-5/J-4/J-3 + l'alerte J-1 doivent rejouer sur CETTE nouvelle date, pas
  // réutiliser des indicateurs déjà posés pour l'ancienne — voir
  // testerUneEtapeAuto). Revérifie le chevauchement (même garde que
  // proposerNouvellesDates) plutôt que de faire confiance à une proposition
  // reçue du frontend : une autre sortie a pu être créée sur ce créneau
  // entre le calcul des propositions et ce choix.
  async replanifier(id, data, user = null, authHeader = null) {
    const sortie = await this.sortieRepository.findByIdWithInscriptions(id);
    if (!sortie) throw new NotFoundError("Sortie non trouvée");
    await this.assertCanManageSortie(sortie, user);

    if (sortie.statut !== "Annulée" || motifAnnulationMeteo(sortie.motif_annulation) === null) {
      throw new ValidationError(
        "Cette sortie n'a pas été annulée pour cause météorologique.",
      );
    }
    if (!data?.date_heure) {
      throw new ValidationError("La nouvelle date est requise.");
    }
    const nouvelleDate = new Date(data.date_heure);
    if (Number.isNaN(nouvelleDate.getTime()) || nouvelleDate <= new Date()) {
      throw new ValidationError("La nouvelle date doit être une date future valide.");
    }

    const autres = await this.sortieRepository.findAutresPourChevauchement(sortie.id_sortie);
    const candidate = { date_heure: nouvelleDate, duree_estimee: sortie.duree_estimee };
    if (autres.some((autre) => sortiesSeChevauchent(candidate, autre))) {
      throw new ValidationError("Cette date chevauche une autre sortie déjà planifiée.");
    }

    await this.sortieRepository.update(sortie.id_sortie, {
      statut: "Planifiée",
      date_heure: nouvelleDate,
      motif_annulation: null,
      meteo_test_j5_fait: false,
      meteo_test_j4_fait: false,
      meteo_test_j3_fait: false,
      meteo_motifs_detectes: null,
      meteo_alerte_j1_envoyee: false,
    });

    await this.remettreEnAttenteConfirmeesInscriptions(sortie.id_sortie);

    const label = formatSortieLabel({ site: sortie.site, lieu: sortie.lieu, date_heure: nouvelleDate });
    // `sortie.inscriptions` a été chargé avant la remise en attente
    // ci-dessus : `inscription.statut` y reflète encore l'ancien statut,
    // ce qui permet justement de distinguer qui doit reconfirmer (était
    // "Confirmée") de qui doit juste être informé (déjà "En attente"/
    // "Liste d'attente", statut inchangé par cette replanification).
    const inscrits = (sortie.inscriptions || []).filter((i) => i.statut !== "Annulée");
    for (const inscription of inscrits) {
      const doitReconfirmer = inscription.statut === "Confirmée";
      try {
        const adherent = await identiteClient.getAdherentById(inscription.num_adherent, authHeader);
        if (!adherent) continue;
        if (adherent.email) {
          if (doitReconfirmer) {
            await sendReconfirmationInscriptionEmail({
              to: adherent.email,
              adherentName: `${adherent.prenom} ${adherent.nom}`,
              sortieLabel: label,
              nouvelleDate,
              id_inscription: inscription.id_inscription,
            });
          } else {
            await sendSortieModifieeEmail({
              to: adherent.email,
              adherentName: `${adherent.prenom} ${adherent.nom}`,
              sortieLabel: label,
              champsModifies: [CHAMPS_NOTIFIABLES_MODIFICATION.date_heure],
            });
          }
        }
        // referenceType "Inscription" (plutôt que "Sortie") quand une
        // reconfirmation est attendue : AlerteDetailsModal.jsx s'appuie
        // dessus pour renvoyer directement vers la fiche inscription (où
        // se trouve le bouton "Reconfirmer"), pas seulement la sortie.
        await vieAssociativeClient.createAlerte(inscription.num_adherent, "Sortie modifiée", {
          detail: (doitReconfirmer
            ? `${label} — reconfirmation requise après replanification météo`
            : `${label} — nouvelle date après annulation météo`
          ).slice(0, 100),
          referenceType: doitReconfirmer ? "Inscription" : "Sortie",
          referenceId: doitReconfirmer ? inscription.id_inscription : sortie.id_sortie,
        });
      } catch (error) {
        console.error(
          `Erreur notification replanification (inscription ${inscription.id_inscription}):`,
          error.message,
        );
      }
    }

    return this.sortieRepository.findById(sortie.id_sortie);
  }
}

module.exports = SortieService;
