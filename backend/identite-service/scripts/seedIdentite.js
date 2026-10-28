// Seed identite-service : Users, Adherents (120), Moniteurs, Président,
// Trésorier. Doit être lancé EN PREMIER (les autres services référencent
// num_adherent / id_moniteur / id_president générés ici) et depuis CE
// dossier de service (`cd backend/identite-service && node scripts/
// seedIdentite.js`) pour que `require("dotenv").config()` charge le bon
// .env (searchPath = schéma identite).
const { sequelize, User, Adherent, Moniteur, President, Tresorier, Brevet } = require("../src/models");
const {
  writeSeedData,
  randomInt,
  pick,
  pickWeighted,
  randomFullName,
  randomPhone,
  randomEmail,
  randomAddress,
  pastDate,
} = require("../../scripts/seedHelpers");

const CONFIG = {
  ADHERENTS: 120,
  MONITEURS_SUPPLEMENTAIRES: 10, // + 1 président-moniteur = 11 moniteurs au total
};

const NIVEAU_ADHERENT_WEIGHTS = [
  ["Baptême", 0.1],
  ["Niveau 1", 0.3],
  ["Niveau 2", 0.25],
  ["Niveau 3", 0.2],
  ["Niveau 4", 0.1],
  ["Moniteur", 0.05],
];

// Préfixe FFESSM du brevet Adherent.num_brevet (distinct de Moniteur.
// num_brevet ci-dessus, format MF1/MF2 propre à l'encadrement) — reflète le
// placeholder du formulaire ("FFESSM N2-2024-00123").
const NIVEAU_BREVET_CODE = {
  "Niveau 1": "N1",
  "Niveau 2": "N2",
  "Niveau 3": "N3",
  "Niveau 4": "N4",
  Moniteur: "MF1",
};

const STATUT_WEIGHTS = [
  ["Actif", 0.75],
  ["Inactif", 0.08],
  ["Suspendu", 0.03],
  ["En formation", 0.1],
  ["Ancien", 0.04],
];

// Fourchettes réalistes et non chevauchantes de nombre de plongées par
// niveau : Niveau 1 initiation, Niveau 2 autonomie 20m, Niveau 3 autonomie
// 40m, Niveau 4, Moniteur (bien plus que le minimum Niveau 4 en pratique).
const NB_PLONGEES_RANGE = {
  "Baptême": [0, 3],
  "Niveau 1": [6, 15],
  "Niveau 2": [8, 25],
  "Niveau 3": [10, 40],
  "Niveau 4": [20, 60],
  Moniteur: [60, 150],
};

function randomNbPlongees(niveau) {
  const [min, max] = NB_PLONGEES_RANGE[niveau] || [0, 0];
  return randomInt(min, max);
}

const CIVILITES = ["M.", "Mme", "Mlle"];

async function seed() {
  await sequelize.authenticate();
  console.log("[identite] connexion établie");

  await sequelize.query(
    "TRUNCATE TABLE identite.users, identite.adherents, identite.moniteurs, identite.president, identite.tresoriers RESTART IDENTITY CASCADE",
  );
  console.log("[identite] tables vidées");

  const currentYear = new Date().getFullYear();

  // Évite qu'un même "Prénom Nom" ne sorte deux fois sur l'ensemble des
  // personnes réelles créées ci-dessous (président/moniteurs/adhérents) :
  // avec seulement 57 prénoms × 40 noms (2280 combinaisons) tirés au hasard
  // pour ~130 personnes, une collision était en pratique quasi certaine à
  // chaque seed (paradoxe des anniversaires) — deux adhérents affichés
  // "Mme Durand Sandra" dans AdherentList.jsx, impossibles à distinguer à
  // l'oeil. Le président et le trésorier ont un nom fixe (voir plus bas) :
  // enregistrés ici aussi pour qu'aucun moniteur/adhérent tiré au hasard ne
  // les duplique par coïncidence.
  const usedFullNames = new Set(["Jean Dupont", "Pierre Durand"]);
  const nextFullName = () => {
    let candidate;
    do {
      candidate = randomFullName();
    } while (usedFullNames.has(`${candidate.prenom} ${candidate.nom}`));
    usedFullNames.add(`${candidate.prenom} ${candidate.nom}`);
    return candidate;
  };

  // ==================== PRÉSIDENT ====================
  const presidentUser = await User.create({
    email: "lovagabriel038@gmail.com",
    password: "president123",
    name: "Jean Dupont",
    role: "president",
    phone: randomPhone(),
    active: true,
    must_change_password: false,
  });
  const presidentMoniteur = await Moniteur.create({
    user_id: presidentUser.id,
    niveau: "Moniteur",
    num_brevet: `MF2-${randomInt(1000, 9999)}`,
    date_obtention_brevet: pastDate(15),
    specialites: ["Nitrox", "Profondeur"],
    disponibilites: ["Samedi", "Dimanche", "Mercredi"],
  });
  const president = await President.create({
    id_moniteur: presidentMoniteur.id_moniteur,
    annee_en_poste: currentYear,
    acces: ["all"],
  });
  console.log(`[identite] président créé (${presidentUser.email})`);

  // ==================== MONITEURS ====================
  const moniteurIds = [presidentMoniteur.id_moniteur];
  for (let i = 0; i < CONFIG.MONITEURS_SUPPLEMENTAIRES; i++) {
    const { nom, prenom } = nextFullName();
    const user = await User.create({
      email: i === 0 ? "moniteur@plongee.com" : randomEmail(nom, prenom),
      password: "moniteur123",
      name: `${prenom} ${nom}`,
      role: "moniteur",
      phone: randomPhone(),
      active: true,
      must_change_password: false,
    });
    const moniteur = await Moniteur.create({
      user_id: user.id,
      niveau: pick(["Niveau 4", "Moniteur"]),
      num_brevet: `MF1-${randomInt(1000, 9999)}`,
      date_obtention_brevet: pastDate(10),
      specialites: [pick(["Nitrox", "Profondeur", "Biologie marine", "Épave", "Nuit", "Photo sous-marine"])],
      disponibilites: ["Samedi", "Dimanche"],
    });
    moniteurIds.push(moniteur.id_moniteur);
  }
  console.log(`[identite] ${moniteurIds.length} moniteurs créés au total (dont le président)`);

  // ==================== TRÉSORIER ====================
  const tresorierUser = await User.create({
    email: "tresorier@plongee.com",
    password: "tresorier123",
    name: "Pierre Durand",
    role: "tresorier",
    phone: randomPhone(),
    active: true,
    must_change_password: false,
  });
  const tresorier = await Tresorier.create({
    user_id: tresorierUser.id,
    annee_en_poste: currentYear,
  });
  console.log(`[identite] trésorier créé (${tresorierUser.email})`);

  // ==================== ADHÉRENTS ====================
  // Le n° de licence FFESM est délivré une seule fois par la fédération à
  // vie : une même personne le garde sur toutes ses lignes Adhesion
  // (FFESM/Assurance) d'une année sur l'autre — jamais un nouveau numéro à
  // chaque ligne (voir la contrainte unique sur Adherent.num_licence_ffesm
  // ci-dessous, et son usage dans seedVieAssociative.js). Généré ici une
  // seule fois par adhérent (sauf Baptême, jamais licencié) et exporté via
  // adherentLicenceMap pour que seedVieAssociative.js réutilise la même
  // valeur au lieu d'en tirer une nouvelle à chaque ligne Adhesion.
  const usedLicences = new Set();
  const nextLicence = () => {
    let licence;
    do {
      licence = `FF${String(randomInt(1, 99999)).padStart(5, "0")}`;
    } while (usedLicences.has(licence));
    usedLicences.add(licence);
    return licence;
  };

  const adherentIds = [];
  const adherentNiveauMap = {};
  const adherentLicenceMap = {};
  for (let i = 0; i < CONFIG.ADHERENTS; i++) {
    const { nom, prenom } = nextFullName();
    const niveau = pickWeighted(NIVEAU_ADHERENT_WEIGHTS);
    const email = i === 0 ? "adherent@plongee.com" : randomEmail(nom, prenom);
    const numLicenceFfesm = niveau !== "Baptême" ? nextLicence() : null;
    const dateObtentionNiveau = niveau !== "Baptême" ? pastDate(8) : null;
    // Contrairement à num_licence_ffesm, num_brevet n'a pas de contrainte
    // d'unicité (deux fédérations/organismes différents peuvent en théorie
    // délivrer le même n° de brevet côte à côte) — pas de Set de suivi requis.
    const numBrevet =
      niveau !== "Baptême"
        ? `${NIVEAU_BREVET_CODE[niveau] || "N1"}-${dateObtentionNiveau.getFullYear()}-${String(randomInt(1, 99999)).padStart(5, "0")}`
        : null;

    const user = await User.create({
      email,
      password: "adherent123",
      name: `${prenom} ${nom}`,
      role: "adherent",
      phone: randomPhone(),
      active: true,
      must_change_password: false,
    });

    const numAdherent = `ADH-${currentYear}-${String(i + 1).padStart(4, "0")}`;
    await Adherent.create({
      num_adherent: numAdherent,
      user_id: user.id,
      civilite: pick(CIVILITES),
      nom,
      prenom,
      date_naissance: new Date(randomInt(1945, 2012), randomInt(0, 11), randomInt(1, 28)),
      adresse: randomAddress(),
      telephone: randomPhone(),
      email,
      contact_urgence: `${randomFullName().prenom} ${randomFullName().nom} - ${randomPhone()}`,
      niveau,
      date_obtention_niveau: dateObtentionNiveau,
      num_licence_ffesm: numLicenceFfesm,
      num_brevet: numBrevet,
      statut: pickWeighted(STATUT_WEIGHTS),
      date_inscription: pastDate(6),
      nb_plongees_total: randomNbPlongees(niveau),
    });

    // Historique des brevets (voir models/Brevet.js) : en production, une
    // ligne y est créée à chaque changement de niveau via AdherentService.
    // updateNiveau — jamais renseigné ici avant ce correctif, ce qui laissait
    // 100% des adhérents N1+ du seed sans le moindre historique alors que
    // leur niveau courant était déjà défini (page "Brevets" vide pour eux).
    // Un Baptême n'a ni date_obtention_niveau ni num_brevet (voir plus haut) :
    // aucune ligne cohérente à créer pour ce niveau, comme pour num_licence_
    // ffesm ci-dessus — le même gate `niveau !== "Baptême"` s'applique.
    if (niveau !== "Baptême") {
      await Brevet.create({
        num_adherent: numAdherent,
        niveau,
        num_brevet: numBrevet,
        date_obtention: dateObtentionNiveau,
      });
    }

    adherentIds.push(numAdherent);
    adherentNiveauMap[numAdherent] = niveau;
    adherentLicenceMap[numAdherent] = numLicenceFfesm;
  }
  console.log(`[identite] ${adherentIds.length} adhérents créés (adherent@plongee.com / adherent123)`);

  writeSeedData("identite", {
    presidentUserId: presidentUser.id,
    presidentMoniteurId: presidentMoniteur.id_moniteur,
    presidentId: president.id_president,
    tresorierUserId: tresorierUser.id,
    tresorierId: tresorier.id_tresorier,
    moniteurIds,
    adherentIds,
    adherentNiveauMap,
    adherentLicenceMap,
  });

  console.log("[identite] seed terminé");
  process.exit(0);
}

seed().catch((err) => {
  console.error("[identite] erreur de seed :", err);
  process.exit(1);
});
