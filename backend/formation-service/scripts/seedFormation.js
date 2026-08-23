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
// Pas d'entrée pour "Moniteur" : c'est le sommet de l'échelle, aucun niveau
// suivant n'existe (voir FormationService.checkPrerequis, qui refuse
// désormais toute formation dont le niveau visé n'est pas strictement
// supérieur au niveau actuel — un adhérent déjà Moniteur est exclu du tirage
// ci-dessous plutôt que de lui assigner "MF1" à tort, comme avant).
const NEXT_NIVEAU_MAP = {
  "Baptême": "N1",
  "Niveau 1": "N2",
  "Niveau 2": "N3",
  "Niveau 3": "N4",
  "Niveau 4": "MF1",
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
  console.log("[formation] connexion établie");

  await sequelize.query(
    "TRUNCATE TABLE formation.formations, formation.competences, formation.formations_specialites, formation.seances RESTART IDENTITY CASCADE",
  );
  console.log("[formation] tables vidées");

  const identite = readSeedData("identite");
  const activites = readSeedData("activites");

  // Un adhérent déjà "Moniteur" n'a plus de niveau suivant à viser (voir
  // NEXT_NIVEAU_MAP) : exclu du tirage plutôt que de retomber sur le
  // fallback `pick(NIVEAUX_FORMATION)`, qui pourrait tout aussi bien lui
  // assigner un niveau déjà largement dépassé (ex. N2) et violer la même
  // règle.
  const adherentIdsFormables = identite.adherentIds.filter(
    (id) => identite.adherentNiveauMap[id] !== "Moniteur",
  );

  // ==================== FORMATIONS ====================
  const formations = [];
  for (let i = 0; i < CONFIG.FORMATIONS; i++) {
    const dateDebut = pastDate(2);
    const dateFinPrevue = addDays(dateDebut, randomInt(30, 180));
    const statut = pickWeighted(STATUT_FORMATION_WEIGHTS);
    const nbSeancesPrevues = randomInt(6, 16);
    const montantTotal = randomFloat(80, 400);
    const statutPaiement = pickWeighted(STATUT_PAIEMENT_WEIGHTS);
    const numAdherent = pick(adherentIdsFormables);
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
      // Recalculé plus bas (section SEANCES) à partir des lignes Seance
      // réellement créées pour cette formation — une valeur tirée au
      // hasard ici serait déconnectée des séances et fausserait la
      // progression affichée (voir le correctif FormationService.update
      // qui, de la même façon, ignore désormais toute valeur envoyée par
      // le client pour ce champ).
      nb_seances_realisees: 0,
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
  console.log(`[formation] ${formations.length} formations créées`);

  // Répercute sur identite.adherents (autre schéma, même base Postgres —
  // requête brute plutôt qu'un modèle Sequelize, formation-service n'a pas
  // Adherent/Brevet dans son registre de modèles) ce qu'un vrai passage par
  // FormationService.completeFormation aurait fait pour chaque formation
  // "Terminée" ci-dessus : sans ça, un adhérent avec une formation
  // "Terminée" visant N3 restait affiché "Niveau 2" dans la liste des
  // adhérents — jamais promu, puisque niveau_vise est calculé à partir du
  // niveau AVANT la formation (NEXT_NIVEAU_MAP ci-dessus) et que ce script
  // insère les lignes Formation directement, sans jamais appeler
  // updateNiveau. Même logique que backend/identite-service/scripts/
  // backfill-adherent-niveau-formation-terminee.sql (à date : ce backfill a
  // servi une fois pour rattraper les formations déjà seedées avant ce
  // correctif) — reproduite ici pour que chaque nouveau seed reste cohérent
  // dès la génération, sans dépendre qu'on repense à relancer un script à
  // part.
  await sequelize.query(`
    WITH echelle(niveau, rang) AS (
      VALUES ('Baptême', 0), ('Niveau 1', 1), ('Niveau 2', 2), ('Niveau 3', 3), ('Niveau 4', 4), ('Moniteur', 5)
    ),
    obtenu(niveau_vise, niveau_obtenu) AS (
      VALUES ('N1', 'Niveau 1'), ('N2', 'Niveau 2'), ('N3', 'Niveau 3'), ('N4', 'Niveau 4'), ('MF1', 'Moniteur')
    ),
    promotions AS (
      SELECT DISTINCT ON (f.num_adherent) f.num_adherent, o.niveau_obtenu, f.date_fin_reelle
      FROM formation.formations f
      JOIN obtenu o ON o.niveau_vise = f.niveau_vise
      JOIN identite.adherents a ON a.num_adherent = f.num_adherent
      JOIN echelle e_actuel ON e_actuel.niveau = a.niveau::text
      JOIN echelle e_obtenu ON e_obtenu.niveau = o.niveau_obtenu
      WHERE f.statut = 'Terminée' AND e_actuel.rang < e_obtenu.rang
      ORDER BY f.num_adherent, f.date_fin_reelle ASC
    )
    INSERT INTO identite.brevets (num_adherent, niveau, date_obtention, created_at, updated_at)
    SELECT p.num_adherent, p.niveau_obtenu::"identite"."enum_brevets_niveau", p.date_fin_reelle, now(), now()
    FROM promotions p
    WHERE NOT EXISTS (
      SELECT 1 FROM identite.brevets b WHERE b.num_adherent = p.num_adherent AND b.niveau::text = p.niveau_obtenu
    );
  `);
  await sequelize.query(`
    WITH echelle(niveau, rang) AS (
      VALUES ('Baptême', 0), ('Niveau 1', 1), ('Niveau 2', 2), ('Niveau 3', 3), ('Niveau 4', 4), ('Moniteur', 5)
    ),
    obtenu(niveau_vise, niveau_obtenu) AS (
      VALUES ('N1', 'Niveau 1'), ('N2', 'Niveau 2'), ('N3', 'Niveau 3'), ('N4', 'Niveau 4'), ('MF1', 'Moniteur')
    ),
    promotions AS (
      SELECT DISTINCT ON (f.num_adherent) f.num_adherent, o.niveau_obtenu, f.date_fin_reelle
      FROM formation.formations f
      JOIN obtenu o ON o.niveau_vise = f.niveau_vise
      JOIN identite.adherents a ON a.num_adherent = f.num_adherent
      JOIN echelle e_actuel ON e_actuel.niveau = a.niveau::text
      JOIN echelle e_obtenu ON e_obtenu.niveau = o.niveau_obtenu
      WHERE f.statut = 'Terminée' AND e_actuel.rang < e_obtenu.rang
      ORDER BY f.num_adherent, f.date_fin_reelle ASC
    )
    UPDATE identite.adherents a
    SET niveau = p.niveau_obtenu::"identite"."enum_adherents_niveau", date_obtention_niveau = p.date_fin_reelle
    FROM promotions p
    WHERE a.num_adherent = p.num_adherent;
  `);
  console.log("[formation] niveau des adhérents réconcilié avec leurs formations Terminée");

  const formationRows = await Formation.findAll({
    attributes: [
      "id_formation",
      "date_debut",
      "date_fin_prevue",
      "num_adherent",
      "montant_total",
      "montant_paye",
      "statut",
      "nb_seances_prevues",
    ],
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
  console.log(`[formation] ${competences.length} compétences créées`);

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
  console.log(`[formation] ${specialites.length} spécialités créées`);

  // ==================== SEANCES ====================
  // Générées par formation (et non plus 300 lignes tirées au hasard parmi
  // toutes les formations, indépendamment de leur statut) pour que les
  // données restent cohérentes :
  //  - jamais plus de nb_seances_prevues séances pour une même formation
  //    (même règle que le garde-fou SeanceService.validateSeanceData) ;
  //  - une formation "Terminée" a exactement nb_seances_prevues séances,
  //    toutes "Réalisée" — jamais de séance encore "Planifiée" à pointer
  //    derrière une formation déjà close (même invariant que
  //    FormationService.completeFormation, qui exige nb_seances_realisees
  //    >= nb_seances_prevues avant de terminer) ;
  //  - les autres statuts (En cours, Abandonnée, Suspendue, Ajournée)
  //    n'ont qu'un sous-ensemble des séances prévues, avec un mélange
  //    Réalisée/Planifiée/Absence légitime tant que la formation n'est
  //    pas close.
  const seances = [];
  for (const formation of formationRows) {
    if (!formation.nb_seances_prevues) continue;
    const estTerminee = formation.statut === "Terminée";
    const nbSeances = estTerminee
      ? formation.nb_seances_prevues
      : randomInt(0, formation.nb_seances_prevues);

    for (let i = 0; i < nbSeances; i++) {
      const statutSeance = estTerminee ? "Réalisée" : pickWeighted(STATUT_SEANCE_WEIGHTS);
      let typeSeance = pick(["Théorique", "Pratique"]);
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
  }
  await Seance.bulkCreate(seances);
  console.log(`[formation] ${seances.length} séances créées`);

  // Recalcule nb_seances_realisees à partir des lignes Seance réellement
  // créées ci-dessus, plutôt que de garder la valeur placeholder (0) posée
  // à la création des formations — même requête que le backfill
  // backend/formation-service/scripts/backfill-seances-coherence.sql,
  // gardée synchronisée pour qu'un nouveau seed reste cohérent sans
  // dépendre qu'on relance le backfill à part.
  await sequelize.query("UPDATE formation.formations SET nb_seances_realisees = 0");
  await sequelize.query(`
    UPDATE formation.formations f
    SET nb_seances_realisees = sub.n
    FROM (SELECT id_formation, COUNT(*) AS n FROM formation.seances WHERE statut = 'Réalisée' GROUP BY id_formation) sub
    WHERE f.id_formation = sub.id_formation;
  `);
  console.log("[formation] nb_seances_realisees recalculé à partir des séances réellement créées");

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

  console.log("[formation] seed terminé");
  process.exit(0);
}

seed().catch((err) => {
  console.error("[formation] erreur de seed :", err);
  process.exit(1);
});
