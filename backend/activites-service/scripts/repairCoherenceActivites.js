// Répare, SANS reseed complet, les incohérences des données activités déjà
// en base (sorties/inscriptions conservées telles quelles) :
//  - palanquées/compositions/plongées reconstruites depuis les inscriptions
//    "Confirmée" pointées présentes de chaque sortie réalisée (avant :
//    adhérents composés au hasard sans lien avec les inscrits, palanquées de
//    5-10 plongeurs, doublons de nom, même adhérent dans 2 palanquées, plus
//    de plongeurs que de places) — voir coherenceHelpers.js ;
//  - inscriptions en doublon (même adhérent inscrit plusieurs fois à la même
//    sortie, ce que InscriptionService interdit) : on garde la meilleure
//    (Confirmée > En attente > Liste d'attente > Annulée), les autres passent
//    en "Annulée" (jamais supprimées : un paiement peut y renvoyer) ;
//  - attributions de matériel rattachées à un adhérent réellement présent
//    sur la sortie concernée.
// Usage : cd backend/activites-service && node scripts/repairCoherenceActivites.js [--apply]
// Sans --apply : simple simulation (aucune écriture).
"use strict";

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { QueryTypes } = require("sequelize");
const { sequelize, Sortie, Inscription, Plongee, Palanquee, Composer, Attribution } = require("../src/models");
const { pick } = require("../../scripts/seedHelpers");
const { construirePalanquees, construirePlongee } = require("./coherenceHelpers");

const APPLY = process.argv.includes("--apply");
const RANG_STATUT = { "Confirmée": 0, "En attente": 1, "Liste d'attente": 2, "Annulée": 3 };

// Retourne les id_inscription à annuler (doublons par sortie + adhérent).
function trouverDoublons(inscriptions) {
  const parCle = new Map();
  for (const i of inscriptions) {
    const cle = `${i.id_sortie}|${i.num_adherent}`;
    if (!parCle.has(cle)) parCle.set(cle, []);
    parCle.get(cle).push(i);
  }
  const aAnnuler = [];
  for (const groupe of parCle.values()) {
    if (groupe.length < 2) continue;
    groupe.sort(
      (a, b) =>
        (RANG_STATUT[a.statut] ?? 9) - (RANG_STATUT[b.statut] ?? 9) ||
        a.id_inscription - b.id_inscription,
    );
    // Le premier (meilleur statut) est conservé ; les autres encore actifs
    // passent en Annulée.
    aAnnuler.push(...groupe.slice(1).filter((i) => i.statut !== "Annulée").map((i) => i.id_inscription));
  }
  return aAnnuler;
}

async function main() {
  await sequelize.authenticate();

  const niveauRows = await sequelize.query(
    "SELECT num_adherent, niveau FROM identite.adherents",
    { type: QueryTypes.SELECT },
  );
  const niveauParAdherent = Object.fromEntries(niveauRows.map((r) => [r.num_adherent, r.niveau]));

  const sorties = await Sortie.findAll({
    where: { statut: ["Terminée", "En cours"] },
    attributes: ["id_sortie", "statut", "date_heure", "profondeur_max", "encadrants", "type"],
    raw: true,
  });
  const toutesInscriptions = await Inscription.findAll({
    attributes: ["id_inscription", "id_sortie", "num_adherent", "statut", "presence"],
    raw: true,
  });
  const doublons = trouverDoublons(toutesInscriptions);
  console.log(`[repair] ${doublons.length} inscriptions en doublon à annuler`);
  const doublonsSet = new Set(doublons);
  const inscriptions = toutesInscriptions.filter(
    (i) => i.statut === "Confirmée" && i.presence && !doublonsSet.has(i.id_inscription),
  );
  const presentsParSortie = {};
  for (const i of inscriptions) {
    (presentsParSortie[i.id_sortie] ||= []).push({
      num_adherent: i.num_adherent,
      niveau: niveauParAdherent[i.num_adherent] || "Niveau 1",
    });
  }

  const sortiesAvecPresents = sorties.filter((s) => (presentsParSortie[s.id_sortie] || []).length > 0);
  console.log(`[repair] ${sorties.length} sorties réalisées, ${sortiesAvecPresents.length} avec des présents`);

  const plan = sortiesAvecPresents.map((s) => ({
    sortie: s,
    palanquees: construirePalanquees(s, presentsParSortie[s.id_sortie]),
  }));
  const nbPalanquees = plan.reduce((n, p) => n + p.palanquees.length, 0);
  const nbMembres = plan.reduce((n, p) => n + p.palanquees.reduce((m, q) => m + q.membres.length, 0), 0);
  console.log(`[repair] à créer : ${nbPalanquees} palanquées, ${nbMembres} compositions/plongées`);

  if (!APPLY) {
    console.log("[repair] simulation terminée — relancer avec --apply pour écrire en base");
    return;
  }

  // Sauvegarde JSON avant toute suppression (rollback manuel possible).
  const backupFile = path.join(require("os").tmpdir(), `backup-activites-${Date.now()}.json`);
  const dump = async (Model) => Model.findAll({ raw: true });
  fs.writeFileSync(
    backupFile,
    JSON.stringify({
      palanquees: await dump(Palanquee),
      composer: await dump(Composer),
      plongees: await dump(Plongee),
      attributions: await dump(Attribution),
    }),
  );
  console.log(`[repair] sauvegarde : ${backupFile}`);

  await sequelize.transaction(async (transaction) => {
    if (doublons.length > 0) {
      await Inscription.update(
        {
          statut: "Annulée",
          rang_liste_attente: null,
          presence: false,
          presence_checked: false,
          presence_check_time: null,
        },
        { where: { id_inscription: doublons }, transaction },
      );
    }
    await Plongee.destroy({ where: { id_seance: null }, transaction });
    await Composer.destroy({ where: {}, transaction });
    await Palanquee.destroy({ where: {}, transaction });

    for (const { sortie, palanquees } of plan) {
      for (const { palanquee, membres } of palanquees) {
        const cree = await Palanquee.create(palanquee, { transaction });
        await Composer.bulkCreate(
          membres.map((m) => ({
            id_palanquee: cree.id_palanquee,
            num_adherent: m.num_adherent,
            niveau_au_moment: m.niveau,
          })),
          { transaction },
        );
        await Plongee.bulkCreate(
          membres.map((m) => construirePlongee(sortie, cree, m)),
          { transaction },
        );
      }
    }

    // Attributions : adhérent présent sur la sortie visée, sinon la
    // sortie est remplacée par une sortie réalisée qui a des présents
    // (dates décalées pour rester cohérentes avec la nouvelle sortie).
    const attributions = await Attribution.findAll({ transaction });
    for (const a of attributions) {
      let cible = plan.find((p) => p.sortie.id_sortie === a.id_sortie)?.sortie;
      if (!cible) cible = pick(plan).sortie;
      const presents = presentsParSortie[cible.id_sortie];
      const decalage = new Date(cible.date_heure).getTime() - new Date(a.date_attribution).getTime();
      const shift = (d) => (d ? new Date(new Date(d).getTime() + decalage) : d);
      await a.update(
        {
          id_sortie: cible.id_sortie,
          num_adherent: pick(presents).num_adherent,
          date_attribution: cible.date_heure,
          date_retour_prevue: shift(a.date_retour_prevue),
          date_retour_reel: shift(a.date_retour_reel),
        },
        { transaction },
      );
    }
    console.log(`[repair] ${attributions.length} attributions recalées`);
  });

  console.log("[repair] terminé");
}

main()
  .then(() => sequelize.close())
  .catch(async (err) => {
    console.error("[repair] erreur :", err.message);
    await sequelize.close();
    process.exit(1);
  });
