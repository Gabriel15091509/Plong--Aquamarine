// Les paiements créés via createLinkedPayment/processPayment utilisaient par
// erreur le statut "Validé", absent de l'énumération réelle des statuts de
// paiement (STATUT_PAIEMENT_OPTIONS = En attente/Payé/Partiel/Annulé, cf.
// frontend/src/utils/constants.js et seedAll.js randomStatutPaiement).
// Corrige les lignes déjà enregistrées avec ce statut incohérent.
const { sequelize } = require("../src/config/database");
const { Paiement } = require("../src/models");

async function run() {
  const [updated] = await Paiement.update(
    { statut: "Payé" },
    { where: { statut: "Validé" } },
  );
  console.log(`${updated} paiement(s) mis à jour : "Validé" -> "Payé"`);
  await sequelize.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
