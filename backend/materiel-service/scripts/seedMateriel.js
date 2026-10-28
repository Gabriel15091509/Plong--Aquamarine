// Seed materiel-service : Materiels (60), Reparations (30). Indépendant de
// identite-service (aucune référence à un adhérent). À lancer depuis ce
// dossier (`cd backend/materiel-service && node scripts/seedMateriel.js`).
const { sequelize, Materiel, Reparation } = require("../src/models");
const { writeSeedData, readSeedData, randomInt, randomFloat, pick, pickWeighted, pastDate, futureDate } = require("../../scripts/seedHelpers");

const CONFIG = { MATERIELS: 60, REPARATIONS: 30 };

const CATEGORIES = ["Bloc", "Détendeur", "Combinaison", "Stabilisateur", "Masque", "Tuba", "Palmes", "Ordinateur", "Accessoire"];
const MARQUES = ["Scubapro", "Mares", "Aqualung", "Cressi", "Beuchat", "Suunto", "Oceanic", "TUSA"];
const MODELES = ["Pro 2000", "X-Tec", "Air Control", "Evolution", "Master", "Elite", "Pro", "Sport"];
const TAILLES = ["XS", "S", "M", "L", "XL", "XXL"];
const EPAISSEURS = ["3mm", "5mm", "7mm", "10mm"];
const CAPACITES = ["10L", "12L", "15L", "18L"];
const ETATS_SANGLES = ["Bon", "Usagé", "À réparer"];
const BATTERIES = ["Bonne", "Faible", "À changer"];
const LOCALISATIONS = ["Local", "Local", "Local", "Local", "Prêté", "En réparation"];
const ETAT_WEIGHTS = [["Neuf", 0.1], ["Bon", 0.5], ["Usagé", 0.3], ["À réparer", 0.07], ["Hors service", 0.03]];
const PRESTATAIRES = ["ProDive Réunion", "AquaTech Saint-Leu", "Ocean Repair Service", "Sea Tech 974"];

async function seed() {
  await sequelize.authenticate();
  console.log("[materiel] connexion établie");

  await sequelize.query(
    "TRUNCATE TABLE materiel.materiels, materiel.reparations RESTART IDENTITY CASCADE",
  );
  console.log("[materiel] tables vidées");

  const identite = readSeedData("identite");

  const materielIds = [];
  for (let i = 0; i < CONFIG.MATERIELS; i++) {
    const categorie = pick(CATEGORIES);
    const numInventaire = `INV-${String.fromCharCode(65 + randomInt(0, 25))}${String(randomInt(0, 9999)).padStart(4, "0")}`;
    await Materiel.create({
      num_inventaire: numInventaire,
      categorie,
      marque: pick(MARQUES),
      modele: pick(MODELES),
      taille: Math.random() > 0.5 ? pick(TAILLES) : null,
      epaisseur: categorie === "Combinaison" ? pick(EPAISSEURS) : null,
      date_achat: pastDate(5),
      etat: pickWeighted(ETAT_WEIGHTS),
      localisation: pick(LOCALISATIONS),
      capacite: categorie === "Bloc" ? pick(CAPACITES) : null,
      date_verif_visuelle: Math.random() > 0.5 ? pastDate(1) : null,
      date_revision_technique: Math.random() > 0.5 ? pastDate(1) : null,
      date_prochaine_echeance: futureDate(365),
      etat_sangles: categorie === "Stabilisateur" ? pick(ETATS_SANGLES) : null,
      batterie: categorie === "Ordinateur" ? pick(BATTERIES) : null,
      created_by: identite.presidentId,
    });
    materielIds.push(numInventaire);
  }
  console.log(`[materiel] ${materielIds.length} matériels créés`);

  // Un même matériel ne peut pas avoir deux réparations "En cours"
  // simultanées (il n'est pas à l'atelier deux fois à la fois) — suivi via
  // un Set, même motif que tirerAdhesionUnique dans seedVieAssociative.js :
  // jusqu'à 20 nouveaux tirages avant d'abandonner la ligne plutôt que de
  // boucler indéfiniment. Les réparations "Terminée", elles, peuvent tout à
  // fait s'accumuler sur un même matériel (historique de réparations).
  const materielAvecReparationActive = new Set();
  const reparations = [];
  for (let i = 0; i < CONFIG.REPARATIONS; i++) {
    const dateConstat = pastDate(1);
    const termine = Math.random() > 0.3;
    let numInventaire = pick(materielIds);
    if (!termine) {
      let tentative = 0;
      while (materielAvecReparationActive.has(numInventaire) && tentative < 20) {
        numInventaire = pick(materielIds);
        tentative++;
      }
      if (materielAvecReparationActive.has(numInventaire)) continue;
      materielAvecReparationActive.add(numInventaire);
    }
    reparations.push({
      num_inventaire: numInventaire,
      date_constat: dateConstat,
      description_panne: pick([
        "Fuite au niveau du premier étage",
        "Sangle usée à remplacer",
        "Corrosion sur la robinetterie",
        "Mousquetons du gilet grippés",
        "Flexible haute pression fissuré",
        "Écran de l'ordinateur illisible",
      ]),
      prestataire: pick(PRESTATAIRES),
      cout: randomFloat(20, 220),
      date_retour: termine ? pastDate(0.5) : null,
      statut: termine ? "Terminée" : "En cours",
    });
  }
  await Reparation.bulkCreate(reparations);
  console.log(`[materiel] ${reparations.length} réparations créées`);

  // etat/localisation ont été tirés au hasard AVANT de savoir quels
  // matériels partiraient en réparation active ci-dessus — un matériel ne
  // peut pourtant pas rester "Bon"/"Neuf"/"Local" pendant que sa réparation
  // est "En cours" (voir MaterielService.assertPasDeReparationActive, qui
  // l'interdit désormais en usage réel). Réalignés ici exactement comme le
  // ferait ReparationService.create().
  if (materielAvecReparationActive.size > 0) {
    await Materiel.update(
      { etat: "À réparer", localisation: "En réparation" },
      { where: { num_inventaire: Array.from(materielAvecReparationActive) } },
    );
    console.log(
      `[materiel] état/localisation alignés sur ${materielAvecReparationActive.size} matériel(s) en réparation active`,
    );
  }

  // Partagé avec seedActivites.js (readSeedData("materiel")) pour qu'il
  // n'attribue pas en prêt actif un matériel déjà signalé en réparation ici
  // — sans ça, un matériel pourrait se retrouver à la fois "En réparation"
  // (ce script) et prêté/non rendu (Attribution, autre service/schéma).
  writeSeedData("materiel", {
    materielIds,
    materielEnReparationIds: Array.from(materielAvecReparationActive),
  });

  console.log("[materiel] seed terminé");
  process.exit(0);
}

seed().catch((err) => {
  console.error("[materiel] erreur de seed :", err);
  process.exit(1);
});
