// Seed formation-service : Formation (60), Competence (150),
// FormationSpecialite (40), Seance (~300). Dépend de identite-service et
// activites-service (backend/scripts/seed-data/*.json) — à lancer APRÈS
// ceux-là, depuis ce dossier (`cd backend/formation-service && node
// scripts/seedFormation.js`).
const { sequelize, Formation, Competence, FormationSpecialite, Seance } = require("../src/models");
const {
  readSeedData,
  writeSeedData,
  randomInt,
  randomFloat,
  pick,
  pickWeighted,
  pastDate,
  betweenDates,
  addDays,
  toDateOnly,
} = require("../../scripts/seedHelpers");

const CONFIG = { FORMATIONS: 60, COMPETENCES: 150, SPECIALITES: 40, SEANCES: 300 };

const NIVEAUX_FORMATION = ["N1", "N2", "N3", "N4", "MF1"];
// Le niveau visé par une formation est le niveau juste au-dessus du niveau
// actuel de l'adhérent (identite-service) — pas un niveau déjà acquis.
const NEXT_NIVEAU_MAP = {
  "Baptême": "N1",
  "Niveau 1": "N2",
  "Niveau 2": "N3",
  "Niveau 3": "N4",
  "Niveau 4": "MF1",
  Moniteur: "MF1",
};

function inRange(date, from, to) {
  const t = new Date(date).getTime();
  return t >= new Date(from).getTime() && t <= new Date(to).getTime();
}
const STATUT_FORMATION_WEIGHTS = [
  ["En cours", 0.3], ["Terminée", 0.5], ["Abandonnée", 0.08], ["Suspendue", 0.07], ["Ajournée", 0.05],
];
const APPRECIATIONS = ["Insuffisant", "Satisfaisant", "Bien", "Excellent"];
const STATUT_PAIEMENT_WEIGHTS = [["En attente", 0.15], ["Partiel", 0.15], ["Payé", 0.65], ["Annulé", 0.05]];
const LIBELLES_COMPETENCES = [
  "Maîtrise de la flottabilité", "Gestion du lestage", "Orientation subaquatique",
  "Communication en plongée", "Gestion du stress", "Palmage efficace",
  "Plongée de nuit", "Plongée profonde", "Plongée dans le courant",
  "Secourisme aquatique", "Réanimation", "Gestion des risques", "Vidage de masque",
  "Remontée assistée", "Sauvetage en surface",
];
const TYPES_SPECIALITE = ["Nitrox", "Plongée profonde", "Plongée nocturne", "Photo sous-marine"];
const STATUT_SPECIALITE_WEIGHTS = [["En cours", 0.4], ["Terminée", 0.5], ["Abandonnée", 0.1]];
const STATUT_SEANCE_WEIGHTS = [["Réalisée", 0.65], ["Planifiée", 0.25], ["Absence", 0.1]];

async function seed() {
  await sequelize.authenticate();
  console.log("✅ [formation] connexion établie");

  await sequelize.query(
    "TRUNCATE TABLE formation.formations, formation.competences, formation.formations_specialites, formation.seances RESTART IDENTITY CASCADE",
  );
  console.log("✅ [formation] tables vidées");

  const identite = readSeedData("identite");
  const activites = readSeedData("activites");

  // ==================== FORMATIONS ====================
  const formations = [];
  for (let i = 0; i < CONFIG.FORMATIONS; i++) {
    const dateDebut = pastDate(2);
    const dateFinPrevue = addDays(dateDebut, randomInt(30, 180));
    const statut = pickWeighted(STATUT_FORMATION_WEIGHTS);
    const nbSeancesPrevues = randomInt(6, 16);
    const montantTotal = randomFloat(80, 400);
    const statutPaiement = pickWeighted(STATUT_PAIEMENT_WEIGHTS);
    const numAdherent = pick(identite.adherentIds);
    formations.push({
      num_adherent: numAdherent,
      id_moniteur: pick(identite.moniteurIds),
      niveau_vise: NEXT_NIVEAU_MAP[identite.adherentNiveauMap[numAdherent]] || pick(NIVEAUX_FORMATION),
      date_debut: dateDebut,
      date_fin_prevue: dateFinPrevue,
      date_fin_reelle: statut === "Terminée" ? betweenDates(dateDebut, dateFinPrevue) : null,
      date_examen_brevet: statut === "Terminée" ? toDateOnly(betweenDates(dateDebut, dateFinPrevue)) : null,
      statut,
      nb_seances_prevues: nbSeancesPrevues,
      nb_seances_realisees: statut === "Terminée" ? nbSeancesPrevues : randomInt(0, nbSeancesPrevues - 1),
      commentaire_moniteur: Math.random() > 0.4 ? pick([
        "Bonne progression, continue ainsi.",
        "Doit travailler la gestion de la flottabilité.",
        "Très à l'aise, prêt pour le niveau suivant.",
        "A besoin de séances supplémentaires en profondeur.",
        "Excellent relationnel avec le groupe.",
      ]) : null,
      appreciation_moniteur: statut === "Terminée" ? pick(APPRECIATIONS) : null,
      montant_total: montantTotal,
      montant_paye: statutPaiement === "Payé" ? montantTotal : statutPaiement === "Partiel" ? randomFloat(10, montantTotal - 10) : 0,
      statut_paiement: statutPaiement,
    });
  }
  await Formation.bulkCreate(formations);
  console.log(`✅ [formation] ${formations.length} formations créées`);

  const formationRows = await Formation.findAll({
    attributes: ["id_formation", "date_debut", "date_fin_prevue", "num_adherent", "montant_total", "montant_paye"],
  });
  const formationIdList = formationRows.map((f) => f.id_formation);

  // ==================== COMPETENCES ====================
  const competences = [];
  for (let i = 0; i < CONFIG.COMPETENCES; i++) {
    const acquise = Math.random() > 0.35;
    competences.push({
      id_formation: pick(formationIdList),
      libelle: pick(LIBELLES_COMPETENCES),
      niveau_requis: pick(NIVEAUX_FORMATION),
      acquise,
      date_validation: acquise ? pastDate(1) : null,
      validee_par: acquise ? `Moniteur #${pick(identite.moniteurIds)}` : null,
    });
  }
  await Competence.bulkCreate(competences);
  console.log(`✅ [formation] ${competences.length} compétences créées`);

  // ==================== FORMATIONS SPECIALITES ====================
  const specialites = [];
  for (let i = 0; i < CONFIG.SPECIALITES; i++) {
    const dateDebut = pastDate(1);
    specialites.push({
      num_adherent: pick(identite.adherentIds),
      id_moniteur: pick(identite.moniteurIds),
      type_specialite: pick(TYPES_SPECIALITE),
      date_debut: dateDebut,
      date_obtention_prevue: toDateOnly(addDays(dateDebut, randomInt(30, 120))),
      statut: pickWeighted(STATUT_SPECIALITE_WEIGHTS),
      commentaire: Math.random() > 0.6 ? "Spécialité en bonne voie." : null,
    });
  }
  await FormationSpecialite.bulkCreate(specialites);
  console.log(`✅ [formation] ${specialites.length} spécialités créées`);

  // ==================== SEANCES ====================
  const seances = [];
  for (let i = 0; i < CONFIG.SEANCES; i++) {
    const formation = pick(formationRows);
    let typeSeance = pick(["Théorique", "Pratique"]);
    const statutSeance = pickWeighted(STATUT_SEANCE_WEIGHTS);
    let idSortie = null;
    let dateSeance;
    if (typeSeance === "Pratique") {
      // Une séance pratique se déroule sur une vraie sortie déjà réalisée,
      // et qui tombe dans la période de la formation — sinon pas de séance
      // pratique cohérente possible pour cette formation, on bascule en
      // Théorique plutôt que d'inventer un lien incohérent.
      const candidates = activites.sortieDoneIdList.filter((id) =>
        inRange(activites.sortieDateMap[id], formation.date_debut, formation.date_fin_prevue),
      );
      if (candidates.length > 0) {
        idSortie = pick(candidates);
        dateSeance = activites.sortieDateMap[idSortie];
      } else {
        typeSeance = "Théorique";
        dateSeance = betweenDates(formation.date_debut, formation.date_fin_prevue);
      }
    } else {
      dateSeance = betweenDates(formation.date_debut, formation.date_fin_prevue);
    }
    seances.push({
      id_formation: formation.id_formation,
      id_sortie: idSortie,
      date_seance: toDateOnly(dateSeance),
      type_seance: typeSeance,
      contenu: pick([
        "Théorie des tables de plongée",
        "Gestion de la décompression",
        "Exercices de flottabilité",
        "Orientation sous-marine",
        "Procédures de sécurité",
        "Assistance et sauvetage",
        "Utilisation de l'ordinateur de plongée",
        "Biologie marine",
      ]),
      statut: statutSeance,
      commentaire: statutSeance === "Absence" ? "Absence non justifiée." : null,
    });
  }
  await Seance.bulkCreate(seances);
  console.log(`✅ [formation] ${seances.length} séances créées`);

  writeSeedData("formation", {
    formationIdList,
    formationsById: Object.fromEntries(
      formationRows.map((f) => [
        f.id_formation,
        {
          num_adherent: f.num_adherent,
          montant_restant: Math.max(0, parseFloat(f.montant_total || 0) - parseFloat(f.montant_paye || 0)),
        },
      ]),
    ),
  });

  console.log("🎉 [formation] seed terminé");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ [formation] erreur de seed :", err);
  process.exit(1);
});
