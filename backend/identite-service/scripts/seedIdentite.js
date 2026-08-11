// Seed identite-service : Users, Adherents (120), Moniteurs, Président,
// Trésorier. Doit être lancé EN PREMIER (les autres services référencent
// num_adherent / id_moniteur / id_president générés ici) et depuis CE
// dossier de service (`cd backend/identite-service && node scripts/
// seedIdentite.js`) pour que `require("dotenv").config()` charge le bon
// .env (searchPath = schéma identite).
const { sequelize, User, Adherent, Moniteur, President, Tresorier } = require("../src/models");
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
    const { nom, prenom } = randomFullName();
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
  const adherentIds = [];
  const adherentNiveauMap = {};
  for (let i = 0; i < CONFIG.ADHERENTS; i++) {
    const { nom, prenom } = randomFullName();
    const niveau = pickWeighted(NIVEAU_ADHERENT_WEIGHTS);
    const email = i === 0 ? "adherent@plongee.com" : randomEmail(nom, prenom);

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
      date_obtention_niveau: niveau !== "Baptême" ? pastDate(8) : null,
      statut: pickWeighted(STATUT_WEIGHTS),
      date_inscription: pastDate(6),
      nb_plongees_total: randomNbPlongees(niveau),
    });
    adherentIds.push(numAdherent);
    adherentNiveauMap[numAdherent] = niveau;
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
  });

  console.log("[identite] seed terminé");
  process.exit(0);
}

seed().catch((err) => {
  console.error("[identite] erreur de seed :", err);
  process.exit(1);
});
