// Post-passe de cohérence : Materiel.localisation doit refléter l'état réel
// des attributions (activites-service, autre schéma) et réparations (ce
// service) générées par le seed — dans l'appli réelle ce champ est
// maintenu par AttributionService/ReparationService, pas saisi à la main.
// À lancer EN DERNIER, après activites-service (`cd backend/
// materiel-service && node scripts/syncLocalisation.js`).
const { sequelize, Materiel, Reparation } = require("../src/models");

async function sync() {
  await sequelize.authenticate();
  console.log("[materiel] connexion établie");

  // Cross-schéma (même base Postgres, schéma qualifié explicitement) : un
  // prêt "Prêté" n'a pas encore de date de retour réelle.
  const [attributionsOuvertes] = await sequelize.query(
    "SELECT DISTINCT num_inventaire FROM activites.attributions WHERE date_retour_reel IS NULL",
  );
  const pretes = new Set(attributionsOuvertes.map((r) => r.num_inventaire));

  const reparationsOuvertes = await Reparation.findAll({
    where: { statut: "En cours" },
    attributes: ["num_inventaire"],
  });
  const enReparation = new Set(reparationsOuvertes.map((r) => r.num_inventaire));

  const materiels = await Materiel.findAll({ attributes: ["num_inventaire", "localisation"] });

  let updated = 0;
  for (const m of materiels) {
    // En réparation prime sur prêté (un objet en atelier n'est pas "chez"
    // l'emprunteur), lui-même prime sur "Local" par défaut.
    const localisation = enReparation.has(m.num_inventaire)
      ? "En réparation"
      : pretes.has(m.num_inventaire)
        ? "Prêté"
        : "Local";
    if (m.localisation !== localisation) {
      await m.update({ localisation });
      updated++;
    }
  }
  console.log(`[materiel] localisation resynchronisée sur ${materiels.length} matériels (${updated} corrigés) — ${enReparation.size} en réparation, ${pretes.size} prêtés`);

  console.log("[materiel] synchronisation terminée");
  process.exit(0);
}

sync().catch((err) => {
  console.error("[materiel] erreur de synchronisation :", err);
  process.exit(1);
});
