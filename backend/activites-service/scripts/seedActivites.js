// Seed activites-service : Sorties (500), Inscriptions, Palanquees, Composer,
// Plongees, Attributions, Incidents. Dépend des données déjà
// écrites par identite-service et materiel-service (backend/scripts/
// seed-data/*.json) — à lancer APRÈS ces deux-là, depuis ce dossier
// (`cd backend/activites-service && node scripts/seedActivites.js`).
const {
  sequelize,
  Sortie,
  Inscription,
  Plongee,
  Palanquee,
  Composer,
  Attribution,
  Incident,
} = require("../src/models");
const {
  readSeedData,
  writeSeedData,
  randomInt,
  randomFloat,
  pick,
  pickMultiple,
  pickWeighted,
  randomSentence,
  pastDate,
  recentDate,
  soonDate,
  addDays,
} = require("../../scripts/seedHelpers");
const { construirePalanquees, construirePlongee } = require("./coherenceHelpers");

const CONFIG = {
  SORTIES: 500,
  INSCRIPTIONS: 3000,
  // Pas de PALANQUEES/COMPOSER/PLONGEES à compte fixe : ils DÉCOULENT des
  // inscriptions "Confirmée" pointées présentes de chaque sortie réalisée
  // (voir la section PALANQUEES plus bas et coherenceHelpers.js).
  ATTRIBUTIONS: 600,
  INCIDENTS: 40,
};

const TYPES_SORTIE = [
  "Plongée d'exploration", "Baptême", "Formation", "Plongée technique",
  "Nettoyage", "Sortie bateau", "Plongée de nuit",
];
const NIVEAUX = ["Baptême", "Niveau 1", "Niveau 2", "Niveau 3", "Niveau 4", "Moniteur"];
// Même ordre que NIVEAUX : sert à ne faire participer à une sortie que des
// adhérents dont le niveau est au moins celui requis (un Niveau 4 peut
// suivre une sortie Baptême, l'inverse non).
const NIVEAU_ORDER = NIVEAUX;

// Même grille que SortieService.isTypeNiveauCompatible/
// NIVEAU_MIN_PAR_TYPE_SORTIE (utils/roleScope.js) : un type de sortie n'est
// pas compatible avec n'importe quel niveau requis (ex. "Plongée technique"
// exige un minimum d'autonomie, "Baptême" est réservé aux non-plongeurs).
// "Baptême" est un cas à part, seul niveau compatible avec ce type — voir
// niveauxCompatiblesAvecType ci-dessous.
const NIVEAU_MIN_PAR_TYPE_SORTIE = {
  "Baptême": "Baptême",
  "Formation": "Baptême",
  "Sortie bateau": "Baptême",
  "Nettoyage": "Baptême",
  "Plongée d'exploration": "Niveau 1",
  "Plongée de nuit": "Niveau 1",
  "Plongée technique": "Niveau 2",
};

function niveauxCompatiblesAvecType(type) {
  if (type === "Baptême") return ["Baptême"];
  const min = NIVEAU_MIN_PAR_TYPE_SORTIE[type] || "Baptême";
  return NIVEAU_ORDER.slice(NIVEAU_ORDER.indexOf(min));
}

function buildEligibleByNiveau(adherentIds, adherentNiveauMap) {
  const byNiveau = {};
  for (const niveauRequis of NIVEAU_ORDER) {
    const minIdx = NIVEAU_ORDER.indexOf(niveauRequis);
    const eligible = adherentIds.filter(
      (id) => NIVEAU_ORDER.indexOf(adherentNiveauMap[id]) >= minIdx,
    );
    byNiveau[niveauRequis] = eligible.length > 0 ? eligible : adherentIds;
  }
  return byNiveau;
}
const STATUT_SORTIE_WEIGHTS = [
  ["Planifiée", 0.35], ["En cours", 0.05], ["Terminée", 0.5], ["Annulée", 0.1],
];
const STATUT_INSCRIPTION_WEIGHTS = [
  ["Confirmée", 0.55], ["En attente", 0.15], ["Liste d'attente", 0.15], ["Annulée", 0.15],
];
const ETAT_MATERIEL = ["Neuf", "Bon", "Usagé", "À réparer", "Hors service"];

// Spots réels de la côte ouest de La Réunion, autour de Saint-Leu (siège du
// club) — coordonnées approximatives, avec un peu de bruit par sortie pour
// éviter des marqueurs strictement identiques sur la carte.
const SITES = [
  { site: "Le Cap La Houssaye", lieu: "Saint-Paul", lat: -21.0186, lng: 55.2317 },
  { site: "Boucan Canot", lieu: "Saint-Gilles-les-Bains", lat: -21.0499, lng: 55.2196 },
  { site: "Passe de l'Ermitage", lieu: "Saint-Gilles-les-Bains", lat: -21.0714, lng: 55.2213 },
  { site: "Planch'Alizés", lieu: "Saint-Leu", lat: -21.1556, lng: 55.2775 },
  { site: "La Pointe au Sel", lieu: "Saint-Leu", lat: -21.1892, lng: 55.2867 },
  { site: "Trou d'Eau", lieu: "Saint-Leu", lat: -21.1731, lng: 55.2828 },
  { site: "Souris Chaude", lieu: "Saint-Leu", lat: -21.1664, lng: 55.2841 },
  { site: "La Corne", lieu: "Saint-Leu", lat: -21.1610, lng: 55.2801 },
  { site: "Colorado", lieu: "L'Étang-Salé", lat: -21.2649, lng: 55.3241 },
  { site: "Tombant des Aigrettes", lieu: "Saint-Gilles-les-Bains", lat: -21.0662, lng: 55.2181 },
];

function jitter(v, amp = 0.004) {
  return parseFloat((v + (Math.random() - 0.5) * amp).toFixed(6));
}

function randomDureeEstimee() {
  const h = randomInt(1, 2);
  const m = pick([0, 15, 30, 45]);
  return `${h}:${String(m).padStart(2, "0")}:00`;
}

async function seed() {
  await sequelize.authenticate();
  console.log("[activites] connexion établie");

  await sequelize.query(
    "TRUNCATE TABLE activites.sorties, activites.inscriptions, activites.plongees, activites.palanquees, activites.composer, activites.attributions, activites.incidents RESTART IDENTITY CASCADE",
  );
  console.log("[activites] tables vidées");

  const identite = readSeedData("identite");
  const materiel = readSeedData("materiel");
  const eligibleByNiveau = buildEligibleByNiveau(identite.adherentIds, identite.adherentNiveauMap);

  // ==================== SORTIES ====================
  const sorties = [];
  for (let i = 0; i < CONFIG.SORTIES; i++) {
    const statut = pickWeighted(STATUT_SORTIE_WEIGHTS);
    let dateSortie;
    if (statut === "Terminée" || statut === "Annulée") {
      dateSortie = pastDate(1);
    } else if (statut === "En cours") {
      dateSortie = recentDate(1);
    } else {
      dateSortie = soonDate(120);
    }
    const dateOuverture = addDays(dateSortie, -randomInt(7, 37));
    const spot = pick(SITES);
    const hasCoords = Math.random() > 0.15;
    const tarifAdherent = randomFloat(0, 20);
    // niveau_requis tiré UNIQUEMENT parmi les niveaux compatibles avec le
    // type déjà choisi (voir niveauxCompatiblesAvecType ci-dessus) — avant
    // ce correctif, les deux étaient tirés indépendamment et produisaient
    // régulièrement des combinaisons absurdes (ex. "Baptême" exigeant
    // "Niveau 4"), désormais rejetées par SortieService si on tentait de les
    // modifier telles quelles.
    const type = pick(TYPES_SORTIE);
    sorties.push({
      date_heure: dateSortie,
      lieu: spot.lieu,
      site: spot.site,
      type,
      niveau_requis: pick(niveauxCompatiblesAvecType(type)),
      nb_places: randomInt(4, 12), // RG4 : 12 plongeurs max par sortie (réglementation)
      profondeur_max: randomInt(6, 40),
      duree_estimee: randomDureeEstimee(),
      statut,
      description_site: randomSentence(10, 24),
      date_ouverture_inscriptions: dateOuverture,
      condition_affectation: randomSentence(6, 14),
      tarif_adherent: tarifAdherent,
      tarif_non_adherent: Math.random() > 0.3 ? randomFloat(tarifAdherent + 10, tarifAdherent + 35) : null,
      latitude: hasCoords ? jitter(spot.lat) : null,
      longitude: hasCoords ? jitter(spot.lng) : null,
      encadrants: pickMultiple(identite.moniteurIds, 1, 2),
      created_by: identite.presidentId,
    });
  }
  await Sortie.bulkCreate(sorties);
  console.log(`[activites] ${sorties.length} sorties créées`);

  const sortieRows = await Sortie.findAll({
    attributes: ["id_sortie", "statut", "date_heure", "niveau_requis", "profondeur_max", "nb_places", "encadrants", "type"],
    raw: true,
  });
  const sortieIdList = sortieRows.map((s) => s.id_sortie);
  const sortieDateMap = Object.fromEntries(sortieRows.map((s) => [s.id_sortie, s.date_heure]));
  const sortieNiveauMap = Object.fromEntries(sortieRows.map((s) => [s.id_sortie, s.niveau_requis]));
  const sortieNbPlacesMap = Object.fromEntries(sortieRows.map((s) => [s.id_sortie, s.nb_places]));
  const sortieDoneIdList = sortieRows
    .filter((s) => ["Terminée", "En cours"].includes(s.statut))
    .map((s) => s.id_sortie);

  // ==================== INSCRIPTIONS ====================
  // Nombre d'inscriptions "Confirmée" déjà attribuées à chaque sortie —
  // suit le même invariant que InscriptionWaitlistService en usage réel
  // ("Confirmée" ≤ nb_places, le surplus va en "Liste d'attente") : sans ce
  // suivi, statut est tiré au hasard indépendamment du nombre déjà présent,
  // et une sortie à 4 places pouvait se retrouver avec 7 inscriptions
  // "Confirmée" (badge "7/4 places" absurde dans SortiesPage.jsx).
  const confirmeesParSortie = {};
  // Un adhérent ne s'inscrit qu'une fois par sortie (InscriptionService le
  // refuse en usage réel) : suivi des couples déjà tirés.
  const dejaInscrits = new Set();
  const inscriptions = [];
  for (let i = 0; i < CONFIG.INSCRIPTIONS; i++) {
    const idSortie = pick(sortieIdList);
    let statut = pickWeighted(STATUT_INSCRIPTION_WEIGHTS);
    const nbPlaces = sortieNbPlacesMap[idSortie] || 0;
    const dejaConfirmees = confirmeesParSortie[idSortie] || 0;
    if (statut === "Confirmée" && dejaConfirmees >= nbPlaces) {
      statut = "Liste d'attente";
    }
    if (statut === "Confirmée") {
      confirmeesParSortie[idSortie] = dejaConfirmees + 1;
    }
    // Un pointage ne peut réellement exister que pour une inscription
    // "Confirmée" (voir SortieService.enregistrerPointage, qui ignore
    // silencieusement toute autre statut) : simuler un historique de
    // présence sur une inscription Annulée/En attente/Liste d'attente
    // produit une donnée qu'aucune action de moniteur n'a jamais pu créer.
    const estPointable =
      sortieDoneIdList.includes(idSortie) && statut === "Confirmée";
    const eligibles = eligibleByNiveau[sortieNiveauMap[idSortie]];
    let numAdherent = pick(eligibles);
    for (let essai = 0; essai < 30 && dejaInscrits.has(`${idSortie}|${numAdherent}`); essai++) {
      numAdherent = pick(eligibles);
    }
    if (dejaInscrits.has(`${idSortie}|${numAdherent}`)) {
      // Plus aucun adhérent libre pour cette sortie : on saute ce tirage
      // plutôt que de créer un doublon.
      if (statut === "Confirmée") confirmeesParSortie[idSortie] -= 1;
      continue;
    }
    dejaInscrits.add(`${idSortie}|${numAdherent}`);
    inscriptions.push({
      num_adherent: numAdherent,
      id_sortie: idSortie,
      statut,
      rang_liste_attente: statut === "Liste d'attente" ? randomInt(1, 6) : null,
      presence: estPointable ? Math.random() > 0.15 : false,
      presence_checked: estPointable,
      presence_check_time: estPointable ? sortieDateMap[idSortie] : null,
      date_confirmation: statut === "Confirmée" ? pastDate(1) : null,
      date_inscription: pastDate(1),
      montant_paye: statut === "Confirmée" ? randomFloat(0, 20) : 0,
      paye: statut === "Confirmée" && Math.random() > 0.2,
    });
  }
  await Inscription.bulkCreate(inscriptions);
  console.log(`[activites] ${inscriptions.length} inscriptions créées`);

  // ==================== PALANQUEES / COMPOSER / PLONGEES ====================
  // Générées PAR SORTIE réalisée à partir des inscriptions "Confirmée"
  // pointées présentes (voir coherenceHelpers.js) : un plongeur n'est composé
  // que s'il est réellement inscrit et présent (donc jamais plus de plongeurs
  // que de places), dans une seule palanquée de la sortie, avec le ratio
  // encadrant/plongeur de PalanqueeService.computeMaxRatio, des noms uniques
  // (A, B, C…) et un encadrant pris parmi ceux désignés sur la sortie.
  // C'est Composer qui fait foi pour "qui est dans quelle palanquée" ; la
  // plongée de chaque membre en découle (même schéma que PalanqueeService.
  // creerPlongeeBrouillon en production).
  const presentsParSortie = {};
  for (const insc of inscriptions) {
    if (insc.statut !== "Confirmée" || !insc.presence) continue;
    (presentsParSortie[insc.id_sortie] ||= []).push({
      num_adherent: insc.num_adherent,
      niveau: identite.adherentNiveauMap[insc.num_adherent] || "Niveau 1",
    });
  }
  const sortiesParId = Object.fromEntries(sortieRows.map((row) => [row.id_sortie, row]));
  const sortiesAvecPresents = sortieDoneIdList.filter(
    (id) => (presentsParSortie[id] || []).length > 0,
  );

  let nbPalanquees = 0;
  let nbCompositions = 0;
  for (const idSortie of sortiesAvecPresents) {
    const sortie = sortiesParId[idSortie];
    for (const { palanquee, membres } of construirePalanquees(sortie, presentsParSortie[idSortie])) {
      const creee = await Palanquee.create(palanquee);
      await Composer.bulkCreate(
        membres.map((m) => ({
          id_palanquee: creee.id_palanquee,
          num_adherent: m.num_adherent,
          niveau_au_moment: m.niveau,
        })),
      );
      await Plongee.bulkCreate(membres.map((m) => construirePlongee(sortie, creee, m)));
      nbPalanquees += 1;
      nbCompositions += membres.length;
    }
  }
  console.log(`[activites] ${nbPalanquees} palanquées, ${nbCompositions} compositions/plongées créées`);

  // ==================== ATTRIBUTIONS (matériel, sorties déjà réalisées) ====================
  // Un prêt "actif" (date_retour_reel: null) ne peut pas viser un matériel
  // déjà prêté ailleurs (AttributionService.create : findActiveByMateriel)
  // ni un matériel actuellement en réparation dans materiel-service
  // (checkAvailability) — deux règles déjà appliquées en usage réel mais que
  // Attribution.bulkCreate contourne ici, même motif que les autres correctifs
  // de seed cette session. materielEnReparation vient du seed matériel
  // (readSeedData("materiel")) ; materielAvecAttributionActive est
  // reconstruit au fil de cette boucle. Un tirage qui ne trouve aucun
  // matériel libre après 20 essais retombe sur un prêt déjà rendu plutôt que
  // de sauter la ligne (CONFIG.ATTRIBUTIONS reste un compte exact — même
  // principe que la redirection vers "Liste d'attente" côté Inscriptions).
  const materielEnReparation = new Set(materiel.materielEnReparationIds || []);
  const materielAvecAttributionActive = new Set();
  const attributions = [];
  // Prêt attribué à un adhérent réellement présent sur la sortie (sinon un
  // "Matériel attribué" pouvait viser quelqu'un qui n'y avait pas plongé).
  for (let i = 0; i < CONFIG.ATTRIBUTIONS; i++) {
    const idSortie = pick(sortiesAvecPresents);
    const dateAttribution = sortieDateMap[idSortie];
    let numInventaire = pick(materiel.materielIds);
    let dejaRetourne = Math.random() > 0.25;
    if (!dejaRetourne) {
      let tentative = 0;
      while (
        (materielAvecAttributionActive.has(numInventaire) || materielEnReparation.has(numInventaire)) &&
        tentative < 20
      ) {
        numInventaire = pick(materiel.materielIds);
        tentative++;
      }
      if (materielAvecAttributionActive.has(numInventaire) || materielEnReparation.has(numInventaire)) {
        dejaRetourne = true;
      } else {
        materielAvecAttributionActive.add(numInventaire);
      }
    }
    attributions.push({
      num_inventaire: numInventaire,
      num_adherent: pick(presentsParSortie[idSortie]).num_adherent,
      id_sortie: idSortie,
      date_attribution: dateAttribution,
      etat_depart: pick(["Bon", "Très bon", "Neuf"]),
      etat_retour: dejaRetourne ? pick(ETAT_MATERIEL) : null,
      date_retour_prevue: addDays(dateAttribution, randomInt(1, 7)),
      date_retour_reel: dejaRetourne ? addDays(dateAttribution, randomInt(1, 7)) : null,
      constat_deterioration: Math.random() > 0.7 ? randomSentence(5, 12) : null,
      montant_caution: Math.random() > 0.5 ? randomFloat(20, 150) : null,
      statut_caution: dejaRetourne ? pick(["Remboursée", "Conservée", "Partiellement conservée"]) : pick(["Aucune", "Payée"]),
    });
  }
  await Attribution.bulkCreate(attributions);
  console.log(`[activites] ${attributions.length} attributions créées`);

  // ==================== INCIDENTS ====================
  const incidents = [];
  for (let i = 0; i < CONFIG.INCIDENTS; i++) {
    const idSortie = pick(sortieDoneIdList);
    const cloture = Math.random() > 0.3;
    incidents.push({
      id_sortie: idSortie,
      date_heure: sortieDateMap[idSortie],
      type: pick(["Materiel", "Medical", "Meteo", "Autre"]),
      description: randomSentence(10, 22),
      mesures_prises: cloture ? randomSentence(5, 14) : null,
      cloture,
      date_cloture: cloture ? addDays(sortieDateMap[idSortie], randomInt(0, 3)) : null,
      declared_by: identite.presidentId,
    });
  }
  await Incident.bulkCreate(incidents);
  console.log(`[activites] ${incidents.length} incidents créés`);

  writeSeedData("activites", {
    sortieIdList,
    sortieDoneIdList,
    sortieDateMap,
  });

  console.log("[activites] seed terminé");
  process.exit(0);
}

seed().catch((err) => {
  console.error("[activites] erreur de seed :", err);
  process.exit(1);
});
