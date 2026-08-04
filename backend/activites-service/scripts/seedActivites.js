// Seed activites-service : Sorties (500), Inscriptions, Plongees,
// Palanquees, Composer, Attributions, Incidents. Dépend des données déjà
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

const CONFIG = {
  SORTIES: 500,
  INSCRIPTIONS: 3000,
  PALANQUEES: 750,
  PLONGEES: 2250,
  COMPOSER: 2250,
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
const VISIBILITES = ["Très bonne", "Bonne", "Moyenne", "Mauvaise"];
const COURANTS = ["Nul", "Faible", "Modéré", "Fort"];

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
  console.log("✅ [activites] connexion établie");

  await sequelize.query(
    "TRUNCATE TABLE activites.sorties, activites.inscriptions, activites.plongees, activites.palanquees, activites.composer, activites.attributions, activites.incidents RESTART IDENTITY CASCADE",
  );
  console.log("✅ [activites] tables vidées");

  const identite = readSeedData("identite");
  const materiel = readSeedData("materiel");
  const eligibleByNiveau = buildEligibleByNiveau(identite.adherentIds, identite.adherentNiveauMap);
  // Rôles de palanquée réservés à des plongeurs expérimentés.
  const experimentedAdherents = eligibleByNiveau["Niveau 3"];

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
    sorties.push({
      date_heure: dateSortie,
      lieu: spot.lieu,
      site: spot.site,
      type: pick(TYPES_SORTIE),
      niveau_requis: pick(NIVEAUX),
      nb_places: randomInt(4, 16),
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
  console.log(`✅ [activites] ${sorties.length} sorties créées`);

  const sortieRows = await Sortie.findAll({
    attributes: ["id_sortie", "statut", "date_heure", "niveau_requis", "profondeur_max"],
  });
  const sortieIdList = sortieRows.map((s) => s.id_sortie);
  const sortieDateMap = Object.fromEntries(sortieRows.map((s) => [s.id_sortie, s.date_heure]));
  const sortieNiveauMap = Object.fromEntries(sortieRows.map((s) => [s.id_sortie, s.niveau_requis]));
  const sortieProfondeurMap = Object.fromEntries(sortieRows.map((s) => [s.id_sortie, s.profondeur_max]));
  const sortieDoneIdList = sortieRows
    .filter((s) => ["Terminée", "En cours"].includes(s.statut))
    .map((s) => s.id_sortie);

  // ==================== INSCRIPTIONS ====================
  const inscriptions = [];
  for (let i = 0; i < CONFIG.INSCRIPTIONS; i++) {
    const idSortie = pick(sortieIdList);
    const statut = pickWeighted(STATUT_INSCRIPTION_WEIGHTS);
    const estDone = sortieDoneIdList.includes(idSortie);
    inscriptions.push({
      num_adherent: pick(eligibleByNiveau[sortieNiveauMap[idSortie]]),
      id_sortie: idSortie,
      statut,
      rang_liste_attente: statut === "Liste d'attente" ? randomInt(1, 6) : null,
      presence: estDone ? Math.random() > 0.15 : false,
      presence_checked: estDone,
      presence_check_time: estDone ? sortieDateMap[idSortie] : null,
      date_confirmation: statut === "Confirmée" ? pastDate(1) : null,
      date_inscription: pastDate(1),
      montant_paye: statut === "Confirmée" ? randomFloat(0, 20) : 0,
      paye: statut === "Confirmée" && Math.random() > 0.2,
    });
  }
  await Inscription.bulkCreate(inscriptions);
  console.log(`✅ [activites] ${inscriptions.length} inscriptions créées`);

  // ==================== PALANQUEES (sorties déjà réalisées uniquement) ====================
  const palanquees = [];
  for (let i = 0; i < CONFIG.PALANQUEES; i++) {
    const idSortie = pick(sortieDoneIdList);
    const profondeurSortie = sortieProfondeurMap[idSortie] || 20;
    palanquees.push({
      id_sortie: idSortie,
      nom_palanquee: `Palanquée ${String.fromCharCode(65 + randomInt(0, 4))}`,
      id_moniteur_encadrant: Math.random() > 0.1 ? pick(identite.moniteurIds) : null,
      profondeur_max_realisee: Math.min(randomInt(5, 38), profondeurSortie),
      duree_reelle: randomInt(25, 60),
      id_guide_palanquee: Math.random() > 0.5 ? pick(experimentedAdherents) : null,
      id_secouriste: Math.random() > 0.6 ? pick(experimentedAdherents) : null,
      statut: "Terminée",
      date_cloture: sortieDateMap[idSortie],
    });
  }
  await Palanquee.bulkCreate(palanquees);
  console.log(`✅ [activites] ${palanquees.length} palanquées créées`);

  const palanqueeRows = await Palanquee.findAll({ attributes: ["id_palanquee", "id_sortie"] });
  const palanqueeIdList = palanqueeRows.map((p) => p.id_palanquee);
  const palanqueeSortieMap = Object.fromEntries(palanqueeRows.map((p) => [p.id_palanquee, p.id_sortie]));

  // ==================== PLONGEES ====================
  const plongees = [];
  for (let i = 0; i < CONFIG.PLONGEES; i++) {
    const idPalanquee = pick(palanqueeIdList);
    const idSortie = palanqueeSortieMap[idPalanquee];
    const profondeurSortie = sortieProfondeurMap[idSortie] || 20;
    plongees.push({
      num_adherent: pick(eligibleByNiveau[sortieNiveauMap[idSortie]]),
      id_sortie: idSortie,
      id_palanquee: idPalanquee,
      date: sortieDateMap[idSortie],
      profondeur_max: Math.min(randomInt(5, 38), profondeurSortie),
      duree: randomInt(25, 60),
      temperature_eau: randomFloat(19, 28, 1),
      visibilite: pick(VISIBILITES),
      courant: pick(COURANTS),
      type_plongee: pick(TYPES_SORTIE),
      observations_faune: Math.random() > 0.3 ? randomSentence(6, 16) : null,
      id_moniteur_validateur: Math.random() > 0.25 ? pick(identite.moniteurIds) : null,
      lien_photos: Math.random() > 0.7
        ? `https://images.unsplash.com/photo-${Math.random().toString(36).slice(2, 15)}`
        : null,
    });
  }
  await Plongee.bulkCreate(plongees);
  console.log(`✅ [activites] ${plongees.length} plongées créées`);

  // ==================== COMPOSER ====================
  const seen = new Set();
  const composer = [];
  let attempts = 0;
  while (composer.length < CONFIG.COMPOSER && attempts < CONFIG.COMPOSER * 5) {
    attempts++;
    const idPalanquee = pick(palanqueeIdList);
    const idSortie = palanqueeSortieMap[idPalanquee];
    const numAdherent = pick(eligibleByNiveau[sortieNiveauMap[idSortie]]);
    const key = `${idPalanquee}-${numAdherent}`;
    if (seen.has(key)) continue;
    seen.add(key);
    composer.push({ id_palanquee: idPalanquee, num_adherent: numAdherent });
  }
  await Composer.bulkCreate(composer);
  console.log(`✅ [activites] ${composer.length} compositions de palanquées créées`);

  // ==================== ATTRIBUTIONS (matériel, sorties déjà réalisées) ====================
  const attributions = [];
  for (let i = 0; i < CONFIG.ATTRIBUTIONS; i++) {
    const idSortie = pick(sortieDoneIdList);
    const dateAttribution = sortieDateMap[idSortie];
    const dejaRetourne = Math.random() > 0.25;
    attributions.push({
      num_inventaire: pick(materiel.materielIds),
      num_adherent: pick(identite.adherentIds),
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
  console.log(`✅ [activites] ${attributions.length} attributions créées`);

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
  console.log(`✅ [activites] ${incidents.length} incidents créés`);

  writeSeedData("activites", {
    sortieIdList,
    sortieDoneIdList,
    sortieDateMap,
  });

  console.log("🎉 [activites] seed terminé");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ [activites] erreur de seed :", err);
  process.exit(1);
});
