// Backfill ponctuel (données de démo locales, aucune donnée personnelle
// réelle) : comble les num_brevet/num_licence_ffesm manquants chez les
// adhérents Niveau 1 et plus.
//
// Origine de l'écart : seedIdentite.js générait bien num_licence_ffesm pour
// chaque adhérent N1+, mais ne renseignait jamais Adherent.num_brevet dans la
// boucle de création (seuls les Moniteur/Président en recevaient un, via
// Moniteur.num_brevet — un champ distinct) — 100% des adhérents N1+ avaient
// donc un n° de brevet vide avant ce script. Corrigé pour les futurs seeds
// dans seedIdentite.js ; ce script rattrape les lignes déjà en base.
// Quelques num_licence_ffesm restaient également vides (passages de niveau
// via AdherentService.updateNiveau sans que l'appelant ait fourni
// extra.num_licence_ffesm) — vérifié au préalable qu'aucune adhésion FFESM
// validée ne permettait de les récupérer (voir backfill-adherent-num-
// licence-ffesm-from-adhesion.sql, qui couvre le seul cas où cette donnée
// est récupérable ailleurs) : générés ici au même titre que num_brevet, qui
// lui n'a aucune source de vérité alternative dans le système.
//
// À lancer depuis ce dossier de service : `cd backend/identite-service &&
// node scripts/backfill-adherent-brevet-licence.js`.
const { sequelize, Adherent } = require("../src/models");
const { randomInt } = require("../../scripts/seedHelpers");

const NIVEAU_BREVET_CODE = {
  "Niveau 1": "N1",
  "Niveau 2": "N2",
  "Niveau 3": "N3",
  "Niveau 4": "N4",
  Moniteur: "MF1",
};

async function run() {
  await sequelize.authenticate();
  console.log("[identite] connexion établie");

  const adherents = await Adherent.findAll({
    where: { niveau: Object.keys(NIVEAU_BREVET_CODE) },
  });

  // num_licence_ffesm est UNIQUE en base : on part des valeurs déjà prises
  // pour ne jamais en générer une qui entre en conflit (même logique que
  // seedIdentite.js).
  const usedLicences = new Set(
    adherents.map((a) => a.num_licence_ffesm).filter(Boolean),
  );
  const nextLicence = () => {
    let licence;
    do {
      licence = `FF${String(randomInt(1, 99999)).padStart(5, "0")}`;
    } while (usedLicences.has(licence));
    usedLicences.add(licence);
    return licence;
  };

  let brevetsCombles = 0;
  let licencesComblees = 0;

  for (const adherent of adherents) {
    let dirty = false;

    if (!adherent.num_brevet) {
      const annee = adherent.date_obtention_niveau
        ? new Date(adherent.date_obtention_niveau).getFullYear()
        : new Date().getFullYear();
      const code = NIVEAU_BREVET_CODE[adherent.niveau] || "N1";
      adherent.num_brevet = `${code}-${annee}-${String(randomInt(1, 99999)).padStart(5, "0")}`;
      brevetsCombles++;
      dirty = true;
    }

    if (!adherent.num_licence_ffesm) {
      adherent.num_licence_ffesm = nextLicence();
      licencesComblees++;
      dirty = true;
    }

    if (dirty) await adherent.save();
  }

  // L'historique des brevets (une ligne par passage de niveau) reste séparé
  // du niveau courant — seule la ligne qui correspond au niveau ACTUEL de
  // l'adhérent (le seul dont on connaît le vrai n° avec certitude) reçoit la
  // même valeur, pour que "Historique des brevets" (fiche adhérent) ne reste
  // pas vide alors que le champ courant, lui, est désormais renseigné.
  // UPDATE sans RETURNING : le 1er élément (`results`) reste vide, le nombre
  // de lignes touchées vit dans les métadonnées (2e élément).
  const [, updateMeta] = await sequelize.query(
    `UPDATE identite.brevets b
     SET num_brevet = ad.num_brevet
     FROM identite.adherents ad
     WHERE b.num_adherent = ad.num_adherent
       AND b.niveau::text = ad.niveau::text
       AND (b.num_brevet IS NULL OR b.num_brevet = '')
       AND ad.num_brevet IS NOT NULL AND ad.num_brevet != ''`,
  );

  console.log(
    `[identite] ${brevetsCombles} num_brevet complétés, ${licencesComblees} num_licence_ffesm complétés (sur ${adherents.length} adhérents N1+), ${updateMeta?.rowCount ?? "?"} ligne(s) d'historique alignées.`,
  );
  process.exit(0);
}

run().catch((err) => {
  console.error("[identite] erreur de backfill :", err);
  process.exit(1);
});
