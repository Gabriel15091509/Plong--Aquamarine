// Seed finance-service : Paiement (240), Echeancier (35), Echeance
// (~110). Dépend de identite-service (backend/scripts/seed-data/
// identite.json) — à lancer APRÈS celui-là, depuis ce dossier
// (`cd backend/finance-service && node scripts/seedFinance.js`).
const { sequelize, Paiement, Echeancier, Echeance } = require("../src/models");
const {
  readSeedData,
  randomInt,
  randomFloat,
  pick,
  pickWeighted,
  pastDate,
  addDays,
  toDateOnly,
} = require("../../scripts/seedHelpers");

const CONFIG = { PAIEMENTS: 240, ECHEANCIERS: 35 };

const MODES = ["Espèces", "Carte", "Chèque", "Virement"];
const TYPES_PAIEMENT = ["Adhesion", "Sortie", "Formation", "Caution", "Autre"];
const STATUT_PAIEMENT_WEIGHTS = [["En attente", 0.15], ["Partiel", 0.1], ["Payé", 0.7], ["Annulé", 0.05]];
const STATUT_ECHEANCIER_WEIGHTS = [["En cours", 0.5], ["Soldé", 0.4], ["Annulée", 0.1]];

async function seed() {
  await sequelize.authenticate();
  console.log("✅ [finance] connexion établie");

  await sequelize.query(
    "TRUNCATE TABLE finance.paiements, finance.echeanciers, finance.echeances RESTART IDENTITY CASCADE",
  );
  console.log("✅ [finance] tables vidées");

  const identite = readSeedData("identite");
  const formation = readSeedData("formation");
  const currentYear = new Date().getFullYear();
  // Un échéancier n'a de sens que pour une formation dont il reste
  // effectivement un montant à régler.
  const formationsAvecReste = formation.formationIdList.filter(
    (id) => formation.formationsById[id].montant_restant > 0,
  );

  // ==================== PAIEMENTS ====================
  const paiements = [];
  for (let i = 0; i < CONFIG.PAIEMENTS; i++) {
    paiements.push({
      num_adherent: pick(identite.adherentIds),
      id_tresorier: identite.tresorierId,
      date_paiement: pastDate(1),
      montant: randomFloat(15, 250),
      mode: pick(MODES),
      type_paiement: pick(TYPES_PAIEMENT),
      statut: pickWeighted(STATUT_PAIEMENT_WEIGHTS),
      reference_id: `REF-${currentYear}-${String(randomInt(1, 99999)).padStart(5, "0")}`,
      description: pick([
        "Cotisation annuelle", "Règlement sortie mensuelle", "Acompte formation",
        "Caution matériel", "Frais d'inscription", "Règlement licence FFESM",
      ]),
    });
  }
  await Paiement.bulkCreate(paiements);
  console.log(`✅ [finance] ${paiements.length} paiements créés`);

  const paiementRows = await Paiement.findAll({ attributes: ["id_paiement"] });
  const paiementIdList = paiementRows.map((p) => p.id_paiement);

  // ==================== ECHEANCIERS + ECHEANCES ====================
  const echeances = [];
  let echeancesCreated = 0;
  const nbEcheanciers = Math.min(CONFIG.ECHEANCIERS, formationsAvecReste.length);
  for (let i = 0; i < nbEcheanciers; i++) {
    const idFormation = formationsAvecReste[i];
    const infoFormation = formation.formationsById[idFormation];
    const nbEcheances = randomInt(2, 4);
    const montantTotal = infoFormation.montant_restant;
    const dateDebut = pastDate(1);
    const statutEcheancier = pickWeighted(STATUT_ECHEANCIER_WEIGHTS);
    const echeancier = await Echeancier.create({
      type_paiement: "Formation",
      reference_id: String(idFormation),
      num_adherent: infoFormation.num_adherent,
      id_tresorier: identite.tresorierId,
      montant_total: montantTotal,
      nb_echeances: nbEcheances,
      date_debut: toDateOnly(dateDebut),
      statut: statutEcheancier,
    });

    const montantParEcheance = parseFloat((montantTotal / nbEcheances).toFixed(2));
    for (let n = 1; n <= nbEcheances; n++) {
      const dateEcheance = addDays(dateDebut, n * 30);
      const estPassee = dateEcheance.getTime() < Date.now();
      const statut = statutEcheancier === "Soldé"
        ? "Payée"
        : estPassee
          ? pick(["Payée", "En retard"])
          : "En attente";
      echeances.push({
        id_echeancier: echeancier.id_echeancier,
        numero: n,
        date_echeance: toDateOnly(dateEcheance),
        montant: montantParEcheance,
        statut,
        id_paiement: statut === "Payée" ? pick(paiementIdList) : null,
      });
      echeancesCreated++;
    }
  }
  await Echeance.bulkCreate(echeances);
  console.log(`✅ [finance] ${CONFIG.ECHEANCIERS} échéanciers et ${echeancesCreated} échéances créés`);

  console.log("🎉 [finance] seed terminé");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ [finance] erreur de seed :", err);
  process.exit(1);
});
