// Helpers de génération de données partagés entre les scripts de seed des
// 6 microservices. Volontairement sans dépendance externe (pas de faker) :
// un seul des 6 services (gateway-service) l'a en dépendance, et ce module
// doit pouvoir être require() depuis n'importe lequel des 6 dossiers de
// service sans installer quoi que ce soit de plus.
const fs = require("fs");
const path = require("path");

const SEED_DATA_DIR = path.join(__dirname, "seed-data");
if (!fs.existsSync(SEED_DATA_DIR)) fs.mkdirSync(SEED_DATA_DIR, { recursive: true });

function writeSeedData(name, data) {
  fs.writeFileSync(
    path.join(SEED_DATA_DIR, `${name}.json`),
    JSON.stringify(data, null, 2),
  );
}

function readSeedData(name) {
  return JSON.parse(
    fs.readFileSync(path.join(SEED_DATA_DIR, `${name}.json`), "utf-8"),
  );
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function pick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function pickMultiple(arr, min, max) {
  const count = Math.min(arr.length, randomInt(min, max));
  return [...arr].sort(() => 0.5 - Math.random()).slice(0, count);
}

function pickWeighted(pairs) {
  const total = pairs.reduce((sum, [, w]) => sum + w, 0);
  const rand = Math.random() * total;
  let cumul = 0;
  for (const [value, weight] of pairs) {
    cumul += weight;
    if (rand < cumul) return value;
  }
  return pairs[0][0];
}

const FIRST_NAMES = [
  "Jean", "Marie", "Pierre", "Sophie", "Nicolas", "Isabelle", "Thomas", "Nathalie",
  "Julien", "Sandrine", "David", "Céline", "Alexandre", "Aurélie", "Vincent", "Laëtitia",
  "Mathieu", "Émilie", "Sébastien", "Camille", "Olivier", "Julie", "Christophe", "Charlotte",
  "Fabien", "Manon", "Guillaume", "Léa", "Antoine", "Chloé", "Maxime", "Sarah",
  "Ludovic", "Élodie", "Bruno", "Pauline", "Frédéric", "Marion", "Kévin", "Laura",
  "Wilfrid", "Aïsha", "Teddy", "Nadia", "Jean-Baptiste", "Sandra", "Éric", "Vanessa",
  "Steevy", "Priscilla", "Anthony", "Karine", "Grégory", "Stéphanie", "Yannick", "Delphine",
];

const LAST_NAMES = [
  "Payet", "Hoarau", "Grondin", "Fontaine", "Robert", "Técher", "Boyer", "Nativel",
  "Dijoux", "Maillot", "Lauret", "Gonthier", "Sautron", "Bègue", "Cadet", "Rivière",
  "Vitry", "Turpin", "Ethève", "Lebon", "Baret", "Sinama", "Vellayoudom", "Ah-Nou",
  "Martin", "Bernard", "Dubois", "Thomas", "Petit", "Durand", "Leroy", "Moreau",
  "Simon", "Laurent", "Michel", "Garcia", "Girard", "Bonnet", "Roux", "Fournier",
];

function randomFullName() {
  return { prenom: pick(FIRST_NAMES), nom: pick(LAST_NAMES) };
}

function slugify(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function randomPhone() {
  return `06${randomInt(10000000, 99999999)}`;
}

function randomEmail(nom, prenom) {
  const domains = ["gmail.com", "yahoo.fr", "orange.fr", "outlook.fr", "wanadoo.fr"];
  return `${slugify(prenom)}.${slugify(nom)}${randomInt(1, 9999)}@${pick(domains)}`;
}

// Communes réelles de La Réunion, proches de Saint-Leu (siège du club) —
// remplace les adresses "Marseille/Toulon" d'un ancien script hérité d'un
// autre contexte géographique.
const COMMUNES_REUNION = [
  { ville: "Saint-Leu", cp: "97436" },
  { ville: "Saint-Paul", cp: "97460" },
  { ville: "Trois-Bassins", cp: "97426" },
  { ville: "Saint-Gilles-les-Bains", cp: "97434" },
  { ville: "L'Étang-Salé", cp: "97427" },
  { ville: "Les Avirons", cp: "97425" },
  { ville: "Saint-Louis", cp: "97450" },
  { ville: "Saint-Pierre", cp: "97410" },
  { ville: "Le Port", cp: "97420" },
  { ville: "La Possession", cp: "97419" },
  { ville: "Saint-Denis", cp: "97400" },
  { ville: "Le Tampon", cp: "97430" },
];

const RUES = [
  "Rue des Filaos", "Rue de la Marine", "Chemin Summer", "Rue du Lagon",
  "Allée des Badamiers", "Rue des Salines", "Chemin Bethléem", "Rue du Maido",
  "Impasse des Corailleurs", "Rue des Tisserins", "Chemin Cazale", "Rue de l'Océan",
];

function randomAddress() {
  const commune = pick(COMMUNES_REUNION);
  return `${randomInt(1, 150)} ${pick(RUES)}, ${commune.cp} ${commune.ville}`;
}

const LOREM_WORDS = [
  "plongée", "fonds", "marins", "récif", "corail", "tortue", "faune", "flore",
  "site", "exceptionnel", "courant", "léger", "visibilité", "excellente", "groupe",
  "encadrement", "sécurité", "matériel", "vérifié", "briefing", "avant", "départ",
  "profondeur", "paliers", "respectés", "ambiance", "conviviale", "poissons",
  "tropicaux", "épave", "tombant", "grotte", "passe", "lagon", "sortie", "réussie",
  "bateau", "palanquée", "moniteur", "expérimenté", "adhérents", "motivés",
];

function randomSentence(minWords = 6, maxWords = 16) {
  const n = randomInt(minWords, maxWords);
  const words = Array.from({ length: n }, () => pick(LOREM_WORDS));
  const sentence = words.join(" ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}

function toDateOnly(date) {
  // Accepte aussi bien un Date qu'une chaîne ISO (les dates relues depuis
  // les fichiers seed-data/*.json via JSON.parse restent des chaînes, la
  // sérialisation JSON.stringify ne les "revive" pas en Date).
  return new Date(date).toISOString().slice(0, 10);
}

function pastDate(yearsBack = 1) {
  const now = Date.now();
  const past = now - randomInt(1, yearsBack * 365) * 86400000;
  return new Date(past);
}

function futureDate(daysAhead = 365) {
  const now = Date.now();
  const future = now + randomInt(1, daysAhead) * 86400000;
  return new Date(future);
}

function recentDate(daysBack = 1) {
  const now = Date.now();
  return new Date(now - randomInt(0, daysBack) * 86400000);
}

function soonDate(daysAhead = 30) {
  const now = Date.now();
  return new Date(now + randomInt(0, daysAhead) * 86400000);
}

function betweenDates(from, to) {
  const f = new Date(from).getTime();
  const t = new Date(to).getTime();
  if (t <= f) return new Date(f);
  return new Date(f + Math.random() * (t - f));
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

module.exports = {
  writeSeedData,
  readSeedData,
  randomInt,
  randomFloat,
  pick,
  pickMultiple,
  pickWeighted,
  randomFullName,
  randomPhone,
  randomEmail,
  randomAddress,
  randomSentence,
  toDateOnly,
  pastDate,
  futureDate,
  recentDate,
  soonDate,
  betweenDates,
  addDays,
};
