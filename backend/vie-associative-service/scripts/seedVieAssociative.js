// Seed vie-associative-service : Adhesion (190), CertificatMedical (145),
// Alerte (80). Dépend de identite-service (backend/scripts/seed-data/
// identite.json) — à lancer APRÈS celui-là, depuis ce dossier
// (`cd backend/vie-associative-service && node scripts/
// seedVieAssociative.js`).
const { sequelize, Adhesion, CertificatMedical, Alerte } = require("../src/models");
const {
  readSeedData,
  randomInt,
  randomFloat,
  pick,
  pickWeighted,
  pastDate,
  addDays,
} = require("../../scripts/seedHelpers");

const CONFIG = { ADHESIONS: 190, CERTIFICATS: 145, ALERTES: 80 };

const STATUT_PAIEMENT_WEIGHTS = [["En attente", 0.15], ["Partiel", 0.1], ["Payé", 0.7], ["Annulé", 0.05]];
const TYPES_CERTIFICAT = ["Sportif", "Plongée", "Généraliste", "Médecin hyperbare"];
const MEDECINS = [
  "Dr. Payet", "Dr. Hoarau", "Dr. Grondin", "Dr. Fontaine", "Dr. Robert",
  "Dr. Técher", "Dr. Boyer", "Dr. Nativel", "Dr. Dijoux", "Dr. Maillot",
];
const TYPES_ALERTE = [
  "Certificat expiré", "Certificat expire bientot", "Adhésion expirée",
  "Adhesion expire bientot", "Paiement en retard", "Formation",
  "Materiel en retard", "Inactivite plongee",
];
const STATUT_ALERTE_WEIGHTS = [["Envoyé", 0.7], ["Lu", 0.25], ["Erreur", 0.05]];

async function seed() {
  await sequelize.authenticate();
  console.log("[vie-associative] connexion établie");

  await sequelize.query(
    "TRUNCATE TABLE vie_associative.adhesions, vie_associative.certificats_medicaux, vie_associative.alertes RESTART IDENTITY CASCADE",
  );
  console.log("[vie-associative] tables vidées");

  const identite = readSeedData("identite");
  const currentYear = new Date().getFullYear();

  // ==================== ADHESIONS ====================
  const adhesions = [];
  for (let i = 0; i < CONFIG.ADHESIONS; i++) {
    const numAdherent = pick(identite.adherentIds);
    const estBapteme = identite.adherentNiveauMap[numAdherent] === "Baptême";
    const annee = currentYear - randomInt(0, 2);
    const dateDebut = new Date(annee, 0, 1);
    const dateFin = new Date(annee, 11, 31);
    // Un Baptême n'est pas licencié FFESM ni assuré à l'année : seule une
    // adhésion Club a du sens pour ce niveau (dossier allégé).
    const type = estBapteme ? "Club" : pick(["Club", "Club", "FFESM", "Assurance RC", "Assurance IA"]);
    const montant = type === "Club" ? randomFloat(50, 200) : 0;
    const statutPaiement = type === "Club" ? pickWeighted(STATUT_PAIEMENT_WEIGHTS) : "Payé";
    adhesions.push({
      num_adherent: numAdherent,
      type,
      date_debut: dateDebut,
      date_fin: dateFin,
      montant,
      montant_paye: statutPaiement === "Payé" ? montant : statutPaiement === "Partiel" ? randomFloat(10, montant - 5) : 0,
      num_licence_ffesm: estBapteme ? null : `FF${String(randomInt(1, 99999)).padStart(5, "0")}`,
      statut_paiement: statutPaiement,
      annee_adhesion: annee,
    });
  }
  await Adhesion.bulkCreate(adhesions);
  console.log(`[vie-associative] ${adhesions.length} adhésions créées`);

  // ==================== CERTIFICATS MEDICAUX ====================
  const certificats = [];
  for (let i = 0; i < CONFIG.CERTIFICATS; i++) {
    const dateDelivrance = pastDate(2);
    const dateValidite = addDays(dateDelivrance, 365);
    certificats.push({
      num_adherent: pick(identite.adherentIds),
      type_certificat: pick(TYPES_CERTIFICAT),
      date_validite: dateValidite,
      date_delivrance: dateDelivrance,
      medecin: pick(MEDECINS),
      statut: dateValidite > new Date() ? "Valide" : "Expiré",
    });
  }
  await CertificatMedical.bulkCreate(certificats);
  console.log(`[vie-associative] ${certificats.length} certificats créés`);

  // ==================== ALERTES ====================
  const alertes = [];
  for (let i = 0; i < CONFIG.ALERTES; i++) {
    alertes.push({
      num_adherent: pick(identite.adherentIds),
      type: pick(TYPES_ALERTE),
      date_envoi: pastDate(1),
      canal: pick(["Email", "SMS"]),
      statut: pickWeighted(STATUT_ALERTE_WEIGHTS),
      read: Math.random() > 0.4,
    });
  }
  await Alerte.bulkCreate(alertes);
  console.log(`[vie-associative] ${alertes.length} alertes créées`);

  console.log("[vie-associative] seed terminé");
  process.exit(0);
}

seed().catch((err) => {
  console.error("[vie-associative] erreur de seed :", err);
  process.exit(1);
});
