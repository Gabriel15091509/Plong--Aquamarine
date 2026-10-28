// Backfill ponctuel (données de démo locales, aucune donnée personnelle
// réelle) : crée la ligne d'historique (table `brevets`) manquante pour
// chaque adhérent Niveau 1+ qui n'en a aucune pour son niveau courant.
//
// Origine de l'écart : seedIdentite.js renseignait bien Adherent.niveau/
// num_brevet/date_obtention_niveau pour chaque adhérent N1+, mais ne créait
// jamais la ligne correspondante dans `brevets` (cette table n'est alimentée
// qu'à chaque VRAI changement de niveau via AdherentService.updateNiveau —
// jamais rejouée par un simple seed) : la page "Brevets" (menu président/
// moniteur/adhérent, ajoutée après coup) se retrouvait donc vide pour la
// quasi-totalité des adhérents N1+ du seed, alors que leur niveau courant
// était déjà défini. Corrigé pour les futurs seeds dans seedIdentite.js ; ce
// script rattrape les lignes déjà en base (les quelques adhérents déjà
// passés par un vrai updateNiveau, ex. via une formation seedée ailleurs,
// ont déjà leur ligne — ceux-là sont ignorés, jamais dupliqués).
//
// À lancer depuis ce dossier de service : `cd backend/identite-service &&
// node scripts/backfill-brevet-historique.js`.
const { sequelize, Adherent, Brevet } = require("../src/models");
const { Op } = require("sequelize");

async function run() {
  await sequelize.authenticate();
  console.log("[identite] connexion établie");

  // Un Baptême n'a ni date_obtention_niveau ni num_brevet (voir seedIdentite.
  // js) : aucune ligne cohérente à créer pour ce niveau, exactement comme à
  // la création — Brevet.date_obtention est NOT NULL, il n'y a donc rien de
  // fiable à y mettre pour un Baptême.
  const adherents = await Adherent.findAll({
    where: { niveau: { [Op.and]: [{ [Op.ne]: null }, { [Op.ne]: "Baptême" }] } },
  });

  let crees = 0;
  let dejaPresents = 0;

  for (const adherent of adherents) {
    const existant = await Brevet.findOne({
      where: { num_adherent: adherent.num_adherent, niveau: adherent.niveau },
    });
    if (existant) {
      dejaPresents++;
      continue;
    }

    await Brevet.create({
      num_adherent: adherent.num_adherent,
      niveau: adherent.niveau,
      num_brevet: adherent.num_brevet,
      // pastDate(8) au seed garantit une vraie date pour tout N1+ ; le
      // fallback à `new Date()` ne couvre que le cas, en théorie possible,
      // d'un adhérent modifié à la main sans date associée.
      date_obtention: adherent.date_obtention_niveau || new Date(),
    });
    crees++;
  }

  console.log(
    `[identite] ${crees} ligne(s) d'historique créées, ${dejaPresents} déjà présentes (sur ${adherents.length} adhérents Niveau 1+).`,
  );
  process.exit(0);
}

run().catch((err) => {
  console.error("[identite] erreur de backfill :", err);
  process.exit(1);
});
