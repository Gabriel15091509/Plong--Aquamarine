const { sequelize } = require("../src/models");
const {
  Adherent,
  Adhesion,
  CertificatMedical,
  Paiement,
  Sortie,
  Inscription,
  Plongee,
  Palanquee,
  Composer,
  Materiel,
  Reparation,
  Attribution,
  Formation,
  Competence,
  Alerte,
  Incident,
  User,
  Moniteur,
  President,
  Tresorier,
} = require("../src/models");
const { faker } = require("@faker-js/faker/locale/fr");

// Configuration
// Cible réaliste pour Aquanature Plongée : 120 adhérents actifs (N1 à N4) et
// environ 500 sorties par an. Les volumes des entités dépendantes des
// sorties/adhérents sont mis à l'échelle en conservant les mêmes ratios
// qu'avant (ex. ~6 inscriptions/sortie, ~1,6 adhésion/adhérent).
const CONFIG = {
  ADHERENTS: 120,
  ADHESIONS: 190,
  CERTIFICATS: 145,
  PAIEMENTS: 240,
  SORTIES: 500,
  INSCRIPTIONS: 3000,
  PLONGEES: 2000,
  PALANQUEES: 1200,
  COMPOSER: 3000,
  MATERIELS: 60,
  REPARATIONS: 30,
  ATTRIBUTIONS: 600,
  FORMATIONS: 60,
  COMPETENCES: 150,
  ALERTES: 80,
  INCIDENTS: 40,
  MONITEURS: 10,
};

// ============ FONCTIONS UTILITAIRES ============

function randomPhone() {
  return `0${Math.floor(Math.random() * 6) + 1}${Math.floor(
    Math.random() * 100000000,
  )
    .toString()
    .padStart(8, "0")}`;
}

function randomEmail(nom, prenom) {
  const domains = [
    "gmail.com",
    "yahoo.fr",
    "orange.fr",
    "free.fr",
    "outlook.fr",
    "club-internet.fr",
    "plongee.com",
    "diving.fr",
  ];
  const slug = (s) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]/g, "");
  return `${slug(prenom)}.${slug(nom)}${Math.floor(Math.random() * 10000)}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

function randomAddress() {
  const rue = [
    "Rue de la Plongée",
    "Avenue des Coraux",
    "Boulevard de l'Océan",
    "Rue des Poissons",
    "Allée des Dauphins",
    "Place du Phare",
    "Rue du Port",
    "Avenue de la Mer",
    "Boulevard du Littoral",
    "Rue des Marins",
    "Impasse des Algues",
    "Rue des Coquillages",
  ];
  const villes = [
    "Marseille",
    "Toulon",
    "Nice",
    "Cannes",
    "Saint-Tropez",
    "Hyères",
    "La Seyne-sur-Mer",
    "Bandol",
    "Sanary-sur-Mer",
    "Six-Fours-les-Plages",
    "Le Lavandou",
    "Cavalaire-sur-Mer",
    "Saint-Raphaël",
    "Fréjus",
    "Antibes",
    "Villefranche-sur-Mer",
    "Beaulieu-sur-Mer",
  ];
  const codesPostaux = [
    "83000",
    "83000",
    "83000",
    "83100",
    "83100",
    "83200",
    "83300",
    "83400",
    "83500",
    "83600",
    "83700",
    "83800",
  ];
  return `${Math.floor(Math.random() * 200) + 1} ${rue[Math.floor(Math.random() * rue.length)]}, ${codesPostaux[Math.floor(Math.random() * codesPostaux.length)]} ${villes[Math.floor(Math.random() * villes.length)]}`;
}

function randomNiveau() {
  const niveaux = [
    "Baptême",
    "Niveau 1",
    "Niveau 2",
    "Niveau 3",
    "Niveau 4",
    "Moniteur",
  ];
  return niveaux[Math.floor(Math.random() * niveaux.length)];
}

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
  return min + Math.floor(Math.random() * (max - min + 1));
}

function randomStatut() {
  const statuts = ["Actif", "Inactif", "Suspendu", "En formation", "Ancien"];
  const weights = [0.6, 0.1, 0.05, 0.2, 0.05];
  const rand = Math.random();
  let cumul = 0;
  for (let i = 0; i < weights.length; i++) {
    cumul += weights[i];
    if (rand < cumul) return statuts[i];
  }
  return statuts[0];
}

function randomTypeAdhesion() {
  const types = ["Club", "FFESM", "Assurance RC", "Assurance IA"];
  const weights = [0.4, 0.3, 0.2, 0.1];
  const rand = Math.random();
  let cumul = 0;
  for (let i = 0; i < weights.length; i++) {
    cumul += weights[i];
    if (rand < cumul) return types[i];
  }
  return types[0];
}

function randomStatutPaiement() {
  const statuts = ["Payé", "En attente", "Partiel", "Annulé"];
  const weights = [0.7, 0.15, 0.1, 0.05];
  const rand = Math.random();
  let cumul = 0;
  for (let i = 0; i < weights.length; i++) {
    cumul += weights[i];
    if (rand < cumul) return statuts[i];
  }
  return statuts[0];
}

function randomModePaiement() {
  const modes = ["Especes", "Cheque", "Virement", "Carte"];
  return modes[Math.floor(Math.random() * modes.length)];
}

function randomTypePaiement() {
  const types = ["Adhesion", "Caution", "Autre"];
  return types[Math.floor(Math.random() * types.length)];
}

function randomTypeSortie() {
  const types = [
    "Plongée d'exploration",
    "Baptême",
    "Formation",
    "Plongée technique",
    "Nettoyage",
    "Sortie bateau",
    "Plongée de nuit",
  ];
  return types[Math.floor(Math.random() * types.length)];
}

function randomStatutSortie() {
  const statuts = ["Planifiée", "En cours", "Terminée", "Annulée"];
  const weights = [0.4, 0.1, 0.4, 0.1];
  const rand = Math.random();
  let cumul = 0;
  for (let i = 0; i < weights.length; i++) {
    cumul += weights[i];
    if (rand < cumul) return statuts[i];
  }
  return statuts[0];
}

function randomTypePlongee() {
  const types = [
    "Plongée d'exploration",
    "Baptême",
    "Formation",
    "Plongée technique",
    "Nettoyage",
    "Sortie bateau",
    "Plongée de nuit",
  ];
  return types[Math.floor(Math.random() * types.length)];
}

function randomVisibilite() {
  const visibilites = [
    "Très bonne",
    "Bonne",
    "Moyenne",
    "Mauvaise",
    "Très mauvaise",
  ];
  return visibilites[Math.floor(Math.random() * visibilites.length)];
}

function randomCategorieMateriel() {
  // Mêmes valeurs que CATEGORIE_MATERIEL_OPTIONS (frontend/src/utils/
  // constants.js) — un seed avec des catégories différentes du dropdown se
  // retrouve avec une valeur sans <option> correspondante à l'édition.
  const categories = [
    "Bloc",
    "Détendeur",
    "Combinaison",
    "Stabilisateur",
    "Masque",
    "Tuba",
    "Palmes",
    "Ordinateur",
    "Accessoire",
  ];
  return categories[Math.floor(Math.random() * categories.length)];
}

function randomEtatMateriel() {
  const etats = ["Neuf", "Bon", "Usagé", "À réparer", "Hors service"];
  const weights = [0.1, 0.5, 0.3, 0.07, 0.03];
  const rand = Math.random();
  let cumul = 0;
  for (let i = 0; i < weights.length; i++) {
    cumul += weights[i];
    if (rand < cumul) return etats[i];
  }
  return etats[0];
}

function randomNiveauFormation() {
  const niveaux = ["N1", "N2", "N3", "N4", "Nitrox", "Profonde"];
  const weights = [0.3, 0.25, 0.15, 0.1, 0.1, 0.1];
  const rand = Math.random();
  let cumul = 0;
  for (let i = 0; i < weights.length; i++) {
    cumul += weights[i];
    if (rand < cumul) return niveaux[i];
  }
  return niveaux[0];
}

function randomStatutFormation() {
  const statuts = ["En cours", "Terminée", "Abandonnée", "Suspendue"];
  const weights = [0.3, 0.5, 0.1, 0.1];
  const rand = Math.random();
  let cumul = 0;
  for (let i = 0; i < weights.length; i++) {
    cumul += weights[i];
    if (rand < cumul) return statuts[i];
  }
  return statuts[0];
}

function randomTypeAlerte() {
  const types = [
    "Certificat expiré",
    "Adhésion expirée",
    "Paiement en retard",
    "Formation",
  ];
  return types[Math.floor(Math.random() * types.length)];
}

function randomCanal() {
  const canaux = ["Email", "SMS"];
  return canaux[Math.floor(Math.random() * canaux.length)];
}

function randomStatutAlerte() {
  const statuts = ["Envoyé", "Lu", "Erreur"];
  const weights = [0.7, 0.25, 0.05];
  const rand = Math.random();
  let cumul = 0;
  for (let i = 0; i < weights.length; i++) {
    cumul += weights[i];
    if (rand < cumul) return statuts[i];
  }
  return statuts[0];
}

function randomNiveauCompetence() {
  const niveaux = ["Débutant", "Intermédiaire", "Avancé", "Expert"];
  return niveaux[Math.floor(Math.random() * niveaux.length)];
}

function randomTypeIncident() {
  const types = ["Materiel", "Medical", "Meteo", "Autre"];
  return types[Math.floor(Math.random() * types.length)];
}

function randomSpecialites() {
  const pool = ["Nitrox", "Profondeur", "Biologie marine", "Épave", "Nuit", "Photo sous-marine"];
  const count = Math.floor(Math.random() * 3) + 1;
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomDisponibilites() {
  const pool = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  const count = Math.floor(Math.random() * 4) + 2;
  const shuffled = [...pool].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// ============ SEED PRINCIPAL ============

async function seedAll() {
  try {
    console.log("🔄 Connexion à la base de données...");
    await sequelize.authenticate();
    console.log("✅ Connexion établie");

    // Vider les tables
    console.log("🔄 Vidage des tables...");
    await sequelize.query('TRUNCATE TABLE "incidents" RESTART IDENTITY CASCADE');
    await sequelize.query('TRUNCATE TABLE "attributions" RESTART IDENTITY CASCADE');
    await sequelize.query('TRUNCATE TABLE "composer" RESTART IDENTITY CASCADE');
    await sequelize.query('TRUNCATE TABLE "palanquees" RESTART IDENTITY CASCADE');
    await sequelize.query('TRUNCATE TABLE "plongees" RESTART IDENTITY CASCADE');
    await sequelize.query('TRUNCATE TABLE "inscriptions" RESTART IDENTITY CASCADE');
    await sequelize.query('TRUNCATE TABLE "sorties" RESTART IDENTITY CASCADE');
    await sequelize.query('TRUNCATE TABLE "reparations" RESTART IDENTITY CASCADE');
    await sequelize.query('TRUNCATE TABLE "materiels" RESTART IDENTITY CASCADE');
    await sequelize.query('TRUNCATE TABLE "competences" RESTART IDENTITY CASCADE');
    await sequelize.query('TRUNCATE TABLE "formations" RESTART IDENTITY CASCADE');
    await sequelize.query('TRUNCATE TABLE "alertes" RESTART IDENTITY CASCADE');
    await sequelize.query('TRUNCATE TABLE "paiements" RESTART IDENTITY CASCADE');
    await sequelize.query('TRUNCATE TABLE "certificats_medicaux" RESTART IDENTITY CASCADE');
    await sequelize.query('TRUNCATE TABLE "adhesions" RESTART IDENTITY CASCADE');
    await sequelize.query('TRUNCATE TABLE "adherents" RESTART IDENTITY CASCADE');
    await sequelize.query('TRUNCATE TABLE "tresoriers" RESTART IDENTITY CASCADE');
    await sequelize.query('TRUNCATE TABLE "president" RESTART IDENTITY CASCADE');
    await sequelize.query('TRUNCATE TABLE "moniteurs" RESTART IDENTITY CASCADE');
    await sequelize.query('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');
    console.log("✅ Tables vidées");

    const currentYear = new Date().getFullYear();

    // ==================== PRESIDENT (user + moniteur + president) ====================
    console.log("🔄 Création du président...");
    const presidentUser = await User.create({
      email: "president@plongee.com",
      password: "president123",
      name: "Jean Dupont",
      role: "president",
      phone: randomPhone(),
      active: true,
      must_change_password: false,
    });
    const presidentMoniteur = await Moniteur.create({
      user_id: presidentUser.id,
      num_brevet: `MF2-${Math.floor(Math.random() * 9000 + 1000)}`,
      date_obtention_brevet: faker.date.past({ years: 15 }),
      specialites: randomSpecialites(),
      disponibilites: randomDisponibilites(),
    });
    const president = await President.create({
      id_moniteur: presidentMoniteur.id_moniteur,
      annee_en_poste: currentYear,
      acces: ["all"],
    });
    console.log("✅ Président créé (president@plongee.com / president123)");

    // ==================== MONITEURS ====================
    console.log("🔄 Création des moniteurs...");
    const moniteurIds = [presidentMoniteur.id_moniteur];
    for (let i = 0; i < CONFIG.MONITEURS; i++) {
      const nom = faker.person.lastName();
      const prenom = faker.person.firstName();
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
        num_brevet: `MF1-${Math.floor(Math.random() * 9000 + 1000)}`,
        date_obtention_brevet: faker.date.past({ years: 10 }),
        specialites: randomSpecialites(),
        disponibilites: randomDisponibilites(),
      });
      moniteurIds.push(moniteur.id_moniteur);
    }
    console.log(`✅ ${moniteurIds.length} moniteurs créés (dont le président ; moniteur@plongee.com / moniteur123)`);

    // ==================== TRESORIER ====================
    console.log("🔄 Création du trésorier...");
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
    console.log("✅ Trésorier créé (tresorier@plongee.com / tresorier123)");

    // ==================== ADHERENTS (user + adherent) ====================
    console.log("🔄 Création des adhérents...");
    const civilites = ["M.", "Mme", "Mlle"];
    const adherentIdList = [];
    const adherentNiveauMap = {};
    for (let i = 0; i < CONFIG.ADHERENTS; i++) {
      const nom = faker.person.lastName();
      const prenom = faker.person.firstName();
      const dateNaissance = faker.date.birthdate({
        min: 1940,
        max: 2010,
        mode: "year",
      });
      const niveau = randomNiveau();
      const email =
        i === 0 ? "adherent@plongee.com" : randomEmail(nom, prenom);

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
        civilite: civilites[Math.floor(Math.random() * civilites.length)],
        nom,
        prenom,
        date_naissance: dateNaissance,
        adresse: randomAddress(),
        telephone: randomPhone(),
        email,
        contact_urgence: `${faker.person.firstName()} ${faker.person.lastName()} - ${randomPhone()}`,
        niveau,
        // Un Baptême n'est pas un niveau breveté : pas de date d'obtention.
        date_obtention_niveau:
          niveau !== "Baptême" ? faker.date.past({ years: 10 }) : null,
        statut: randomStatut(),
        date_inscription: faker.date.past({ years: 5 }),
        nb_plongees_total: randomNbPlongees(niveau),
      });
      adherentIdList.push(numAdherent);
      adherentNiveauMap[numAdherent] = niveau;
    }
    console.log(`✅ ${adherentIdList.length} adhérents créés (adherent@plongee.com / adherent123)`);

    // ==================== ADHESIONS ====================
    console.log("🔄 Création des adhésions...");
    const adhesions = [];
    for (let i = 0; i < CONFIG.ADHESIONS; i++) {
      const numAdherent =
        adherentIdList[Math.floor(Math.random() * adherentIdList.length)];
      const annee = currentYear - Math.floor(Math.random() * 3);
      const dateDebut = new Date(annee, 0, 1);
      const dateFin = new Date(annee, 11, 31);
      // Un Baptême n'est pas licencié FFESM ni assuré à l'année (dossier
      // allégé, cf. checkDossierValidity) : seule une adhésion Club a du
      // sens pour ce niveau.
      const type =
        adherentNiveauMap[numAdherent] === "Baptême"
          ? "Club"
          : randomTypeAdhesion();
      // Seule l'adhésion Club a un tarif/paiement suivi dans l'app : les
      // autres types (FFESM, assurances) sont couverts par la cotisation
      // Club et sont donc directement "Payé" sans montant.
      const montant = type === "Club" ? parseFloat((Math.random() * 150 + 50).toFixed(2)) : 0;
      const statutPaiement = type === "Club" ? randomStatutPaiement() : "Payé";
      adhesions.push({
        num_adherent: numAdherent,
        type,
        date_debut: dateDebut,
        date_fin: dateFin,
        montant,
        montant_paye: statutPaiement === "Payé" ? montant : 0,
        num_licence_ffesm:
          adherentNiveauMap[numAdherent] === "Baptême"
            ? null
            : `FF${Math.floor(Math.random() * 100000)
                .toString()
                .padStart(5, "0")}`,
        statut_paiement: statutPaiement,
        annee_adhesion: annee,
      });
    }
    await Adhesion.bulkCreate(adhesions);
    console.log(`✅ ${adhesions.length} adhésions créées`);

    // ==================== CERTIFICATS MEDICAUX ====================
    console.log("🔄 Création des certificats médicaux...");
    const certificats = [];
    const medecins = [
      "Dr. Bernard",
      "Dr. Dubois",
      "Dr. Martin",
      "Dr. Petit",
      "Dr. Robert",
      "Dr. Richard",
      "Dr. Durand",
      "Dr. Moreau",
      "Dr. Simon",
      "Dr. Laurent",
    ];
    const typesCertificat = ["Médical", "Sportif", "Plongée", "Révision"];
    for (let i = 0; i < CONFIG.CERTIFICATS; i++) {
      const numAdherent =
        adherentIdList[Math.floor(Math.random() * adherentIdList.length)];
      const dateDelivrance = faker.date.past({ years: 2 });
      const dateValidite = new Date(dateDelivrance);
      dateValidite.setFullYear(dateValidite.getFullYear() + 1);
      certificats.push({
        num_adherent: numAdherent,
        type_certificat:
          typesCertificat[Math.floor(Math.random() * typesCertificat.length)],
        date_validite: dateValidite,
        date_delivrance: dateDelivrance,
        medecin: medecins[Math.floor(Math.random() * medecins.length)],
        statut: dateValidite > new Date() ? "Valide" : "Expiré",
      });
    }
    await CertificatMedical.bulkCreate(certificats);
    console.log(`✅ ${certificats.length} certificats créés`);

    // ==================== SORTIES ====================
    console.log("🔄 Création des sorties...");
    const lieux = [
      "Marseille",
      "Toulon",
      "Nice",
      "Cannes",
      "Saint-Tropez",
      "Hyères",
      "Bandol",
      "Sanary-sur-Mer",
      "Six-Fours-les-Plages",
      "Le Lavandou",
    ];
    const sites = [
      "Île des Embiez",
      "Île de Porquerolles",
      "Île du Levant",
      "Rade de Toulon",
      "Calanques de Marseille",
      "Cap Sicié",
      "Île de Bendor",
      "Saint-Mandrier",
    ];
    const sorties = [];
    for (let i = 0; i < CONFIG.SORTIES; i++) {
      // Le statut détermine la date (et non l'inverse) : une sortie
      // Terminée/Annulée ne peut pas être dans le futur, une sortie
      // Planifiée ne peut pas être dans le passé — sur 500 sorties/an
      // générées, l'incohérence serait immédiatement visible dans le
      // calendrier.
      const statut = randomStatutSortie();
      let dateSortie;
      if (statut === "Terminée" || statut === "Annulée") {
        dateSortie = faker.date.past({ years: 1 });
      } else if (statut === "En cours") {
        dateSortie = faker.date.recent({ days: 1 });
      } else {
        dateSortie = faker.date.soon({ days: 120 });
      }
      const dateOuverture = new Date(dateSortie);
      dateOuverture.setDate(
        dateOuverture.getDate() - Math.floor(Math.random() * 30 + 7),
      );
      const nbEncadrants = Math.floor(Math.random() * 2) + 1;
      const encadrants = [...moniteurIds]
        .sort(() => 0.5 - Math.random())
        .slice(0, nbEncadrants);
      sorties.push({
        date_heure: dateSortie,
        lieu: lieux[Math.floor(Math.random() * lieux.length)],
        site: sites[Math.floor(Math.random() * sites.length)],
        type: randomTypeSortie(),
        niveau_requis: randomNiveau(),
        nb_places: Math.floor(Math.random() * 10 + 2),
        profondeur_max: Math.floor(Math.random() * 40 + 5),
        duree_estimee: `${Math.floor(Math.random() * 2 + 1)}:${Math.floor(
          Math.random() * 60,
        )
          .toString()
          .padStart(2, "0")}`,
        statut,
        description_site: faker.lorem.sentence({ min: 10, max: 30 }),
        date_ouverture_inscriptions: dateOuverture,
        condition_affectation: faker.lorem.sentence({ min: 5, max: 15 }),
        encadrants,
        created_by: president.id_president,
      });
    }
    await Sortie.bulkCreate(sorties);
    console.log(`✅ ${sorties.length} sorties créées`);

    const sortieRows = await Sortie.findAll({
      attributes: ["id_sortie", "statut", "date_heure"],
    });
    const sortieIdList = sortieRows.map((s) => s.id_sortie);
    const sortieDateMap = Object.fromEntries(
      sortieRows.map((s) => [s.id_sortie, s.date_heure]),
    );
    // Une plongée, une attribution de matériel ou un incident ne peuvent
    // être rattachés qu'à une sortie qui a effectivement eu lieu.
    const sortieDoneIdList = sortieRows
      .filter((s) => ["Terminée", "En cours"].includes(s.statut))
      .map((s) => s.id_sortie);

    // ==================== INSCRIPTIONS ====================
    console.log("🔄 Création des inscriptions...");
    const inscriptions = [];
    const statutsInscription = [
      "En attente",
      "Confirmée",
      "Annulée",
      "Liste d'attente",
    ];
    for (let i = 0; i < CONFIG.INSCRIPTIONS; i++) {
      const numAdherent =
        adherentIdList[Math.floor(Math.random() * adherentIdList.length)];
      const idSortie =
        sortieIdList[Math.floor(Math.random() * sortieIdList.length)];
      const statut =
        statutsInscription[
          Math.floor(Math.random() * statutsInscription.length)
        ];
      inscriptions.push({
        num_adherent: numAdherent,
        id_sortie: idSortie,
        date_inscription: faker.date.past({ years: 1 }),
        statut: statut,
        rang_liste_attente:
          statut === "Liste d'attente"
            ? Math.floor(Math.random() * 5 + 1)
            : null,
        presence: Math.random() > 0.3,
        date_confirmation:
          statut === "Confirmée" ? faker.date.past({ years: 1 }) : null,
      });
    }
    await Inscription.bulkCreate(inscriptions);
    console.log(`✅ ${inscriptions.length} inscriptions créées`);

    // ==================== PLONGEES ====================
    console.log("🔄 Création des plongées...");
    const plongees = [];
    for (let i = 0; i < CONFIG.PLONGEES; i++) {
      const numAdherent =
        adherentIdList[Math.floor(Math.random() * adherentIdList.length)];
      const idSortie =
        sortieDoneIdList[Math.floor(Math.random() * sortieDoneIdList.length)];
      const estValidee = Math.random() > 0.3;
      plongees.push({
        num_adherent: numAdherent,
        id_sortie: idSortie,
        date: sortieDateMap[idSortie],
        profondeur_max: Math.floor(Math.random() * 40 + 5),
        duree: Math.floor(Math.random() * 60 + 15),
        temperature_eau: parseFloat((Math.random() * 20 + 10).toFixed(1)),
        visibilite: randomVisibilite(),
        type_plongee: randomTypePlongee(),
        observations_faune: faker.lorem.sentence({ min: 5, max: 15 }),
        id_moniteur_validateur: estValidee
          ? moniteurIds[Math.floor(Math.random() * moniteurIds.length)]
          : null,
        lien_photos:
          Math.random() > 0.5
            ? `https://images.unsplash.com/photo-${Math.random().toString(36).substring(2, 15)}`
            : null,
      });
    }
    await Plongee.bulkCreate(plongees);
    console.log(`✅ ${plongees.length} plongées créées`);

    const plongeeRows = await Plongee.findAll({
      attributes: ["id_plongee", "id_sortie"],
    });

    // ==================== PALANQUEES ====================
    console.log("🔄 Création des palanquées...");
    const palanquees = [];
    for (let i = 0; i < CONFIG.PALANQUEES; i++) {
      const plongee =
        plongeeRows[Math.floor(Math.random() * plongeeRows.length)];
      palanquees.push({
        id_plongee: plongee.id_plongee,
        id_sortie: plongee.id_sortie,
        nom_palanquee: `Palanquée ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`,
        id_moniteur_encadrant:
          moniteurIds[Math.floor(Math.random() * moniteurIds.length)],
        profondeur_max_realisee: Math.floor(Math.random() * 35 + 5),
        duree_reelle: Math.floor(Math.random() * 55 + 10),
      });
    }
    await Palanquee.bulkCreate(palanquees);
    console.log(`✅ ${palanquees.length} palanquées créées`);

    const palanqueeIds = await Palanquee.findAll({
      attributes: ["id_palanquee"],
    });
    const palanqueeIdList = palanqueeIds.map((p) => p.id_palanquee);

    // ==================== COMPOSER ====================
    console.log("🔄 Création des compositions...");
    const composerSeen = new Set();
    const composer = [];
    let attempts = 0;
    while (composer.length < CONFIG.COMPOSER && attempts < CONFIG.COMPOSER * 5) {
      attempts++;
      const idPalanquee =
        palanqueeIdList[Math.floor(Math.random() * palanqueeIdList.length)];
      const numAdherent =
        adherentIdList[Math.floor(Math.random() * adherentIdList.length)];
      const key = `${idPalanquee}-${numAdherent}`;
      if (composerSeen.has(key)) continue;
      composerSeen.add(key);
      composer.push({ id_palanquee: idPalanquee, num_adherent: numAdherent });
    }
    await Composer.bulkCreate(composer);
    console.log(`✅ ${composer.length} compositions créées`);

    // ==================== MATERIELS ====================
    console.log("🔄 Création du matériel...");
    const marques = [
      "Scubapro",
      "Mares",
      "Aqualung",
      "Cressi",
      "Beuchat",
      "Suunto",
      "Oceanic",
      "TUSA",
    ];
    const modeles = [
      "Pro 2000",
      "X-Tec",
      "Air Control",
      "Evolution",
      "Master",
      "Elite",
      "Pro",
      "Sport",
    ];
    const tailles = ["XS", "S", "M", "L", "XL", "XXL"];
    const epaisseurs = ["3mm", "5mm", "7mm", "10mm"];
    const capacites = ["10L", "12L", "15L", "18L"];
    const etatsSangles = ["Bon", "Usagé", "À réparer"];
    const batteries = ["Bonne", "Faible", "À changer"];
    // Mêmes 3 états que LOCALISATION_MATERIEL_OPTIONS (frontend), très
    // majoritairement "Local" — un club n'a qu'une poignée de prêts/
    // réparations en cours à un instant donné.
    const localisations = ["Local", "Local", "Local", "Local", "Prêté", "En réparation"];
    const materiels = [];
    for (let i = 0; i < CONFIG.MATERIELS; i++) {
      const numInventaire = `INV-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(
        Math.random() * 10000,
      )
        .toString()
        .padStart(4, "0")}`;
      const categorie = randomCategorieMateriel();
      materiels.push({
        num_inventaire: numInventaire,
        categorie: categorie,
        marque: marques[Math.floor(Math.random() * marques.length)],
        modele: modeles[Math.floor(Math.random() * modeles.length)],
        taille:
          Math.random() > 0.5
            ? tailles[Math.floor(Math.random() * tailles.length)]
            : null,
        epaisseur: ["Combinaison"].includes(categorie)
          ? epaisseurs[Math.floor(Math.random() * epaisseurs.length)]
          : null,
        capacite:
          categorie === "Bloc"
            ? capacites[Math.floor(Math.random() * capacites.length)]
            : null,
        etat_sangles:
          categorie === "Stabilisateur"
            ? etatsSangles[Math.floor(Math.random() * etatsSangles.length)]
            : null,
        batterie:
          categorie === "Ordinateur"
            ? batteries[Math.floor(Math.random() * batteries.length)]
            : null,
        date_achat: faker.date.past({ years: 5 }),
        etat: randomEtatMateriel(),
        localisation: localisations[Math.floor(Math.random() * localisations.length)],
        date_verif_visuelle:
          Math.random() > 0.5 ? faker.date.past({ years: 1 }) : null,
        date_revision_technique:
          Math.random() > 0.5 ? faker.date.past({ years: 1 }) : null,
        date_prochaine_echeance: faker.date.future({ years: 1 }),
        created_by: president.id_president,
      });
    }
    await Materiel.bulkCreate(materiels);
    console.log(`✅ ${materiels.length} matériels créés`);

    const materielIds = await Materiel.findAll({
      attributes: ["num_inventaire"],
    });
    const materielIdList = materielIds.map((m) => m.num_inventaire);

    // ==================== REPARATIONS ====================
    console.log("🔄 Création des réparations...");
    const prestataires = [
      "ProDive",
      "AquaTech",
      "Diving Center",
      "Sea Repair",
      "Ocean Service",
    ];
    const reparations = [];
    for (let i = 0; i < CONFIG.REPARATIONS; i++) {
      const numInventaire =
        materielIdList[Math.floor(Math.random() * materielIdList.length)];
      const dateRetour =
        Math.random() > 0.3 ? faker.date.past({ years: 1 }) : null;
      reparations.push({
        num_inventaire: numInventaire,
        date_constat: faker.date.past({ years: 1 }),
        description_panne: faker.lorem.sentence({ min: 10, max: 25 }),
        prestataire:
          prestataires[Math.floor(Math.random() * prestataires.length)],
        cout: parseFloat((Math.random() * 200 + 20).toFixed(2)),
        date_retour: dateRetour,
        statut: dateRetour ? "Terminée" : "En cours",
      });
    }
    await Reparation.bulkCreate(reparations);
    console.log(`✅ ${reparations.length} réparations créées`);

    // ==================== ATTRIBUTIONS ====================
    console.log("🔄 Création des attributions...");
    const attributions = [];
    for (let i = 0; i < CONFIG.ATTRIBUTIONS; i++) {
      const numInventaire =
        materielIdList[Math.floor(Math.random() * materielIdList.length)];
      const numAdherent =
        adherentIdList[Math.floor(Math.random() * adherentIdList.length)];
      const idSortie =
        sortieDoneIdList[Math.floor(Math.random() * sortieDoneIdList.length)];
      const dateAttribution = sortieDateMap[idSortie] || faker.date.past({ years: 1 });
      const dateRetourPrevue = new Date(dateAttribution);
      dateRetourPrevue.setDate(
        dateRetourPrevue.getDate() + Math.floor(Math.random() * 7 + 1),
      );
      const dejaRetourne = Math.random() > 0.4;
      attributions.push({
        num_inventaire: numInventaire,
        num_adherent: numAdherent,
        id_sortie: idSortie,
        date_attribution: dateAttribution,
        etat_depart: ["Bon", "Très bon", "Neuf"][Math.floor(Math.random() * 3)],
        etat_retour: dejaRetourne
          ? ["Bon", "Usagé", "À réparer"][Math.floor(Math.random() * 3)]
          : null,
        date_retour_prevue: dateRetourPrevue,
        date_retour_reel: dejaRetourne
          ? faker.date.between({ from: dateAttribution, to: new Date() })
          : null,
        constat_deterioration: faker.lorem.sentence({ min: 5, max: 15 }),
      });
    }
    await Attribution.bulkCreate(attributions);
    console.log(`✅ ${attributions.length} attributions créées`);

    // ==================== FORMATIONS ====================
    console.log("🔄 Création des formations...");
    const formations = [];
    for (let i = 0; i < CONFIG.FORMATIONS; i++) {
      const numAdherent =
        adherentIdList[Math.floor(Math.random() * adherentIdList.length)];
      const dateDebut = faker.date.past({ years: 2 });
      const dateFinPrevue = new Date(dateDebut);
      dateFinPrevue.setMonth(
        dateFinPrevue.getMonth() + Math.floor(Math.random() * 6 + 1),
      );
      const statut = randomStatutFormation();
      formations.push({
        num_adherent: numAdherent,
        id_moniteur: moniteurIds[Math.floor(Math.random() * moniteurIds.length)],
        niveau_vise: randomNiveauFormation(),
        date_debut: dateDebut,
        date_fin_prevue: dateFinPrevue,
        date_fin_reelle:
          statut === "Terminée"
            ? faker.date.between({ from: dateDebut, to: dateFinPrevue })
            : null,
        statut: statut,
        nb_seances_realisees:
          statut === "Terminée"
            ? Math.floor(Math.random() * 10 + 5)
            : Math.floor(Math.random() * 5),
        commentaire_moniteur: faker.lorem.sentence({ min: 10, max: 30 }),
      });
    }
    await Formation.bulkCreate(formations);
    console.log(`✅ ${formations.length} formations créées`);

    const formationIds = await Formation.findAll({
      attributes: ["id_formation"],
    });
    const formationIdList = formationIds.map((f) => f.id_formation);

    // ==================== COMPETENCES ====================
    console.log("🔄 Création des compétences...");
    const libellesCompetences = [
      "Maîtrise apnée",
      "Gestion lestage",
      "Orientation",
      "Communication",
      "Gestion stress",
      "Palmeage",
      "Plongée nuit",
      "Plongée profonde",
      "Plongée courant",
      "Secourisme",
      "Réanimation",
      "Gestion risques",
    ];
    const competences = [];
    for (let i = 0; i < CONFIG.COMPETENCES; i++) {
      const idFormation =
        formationIdList[Math.floor(Math.random() * formationIdList.length)];
      const acquise = Math.random() > 0.3;
      competences.push({
        id_formation: idFormation,
        libelle:
          libellesCompetences[
            Math.floor(Math.random() * libellesCompetences.length)
          ],
        niveau_requis: randomNiveauCompetence(),
        acquise: acquise,
        date_validation: acquise ? faker.date.past({ years: 1 }) : null,
        validee_par: acquise ? String(moniteurIds[Math.floor(Math.random() * moniteurIds.length)]) : null,
      });
    }
    await Competence.bulkCreate(competences);
    console.log(`✅ ${competences.length} compétences créées`);

    // ==================== PAIEMENTS ====================
    console.log("🔄 Création des paiements...");
    const paiements = [];
    for (let i = 0; i < CONFIG.PAIEMENTS; i++) {
      const numAdherent =
        adherentIdList[Math.floor(Math.random() * adherentIdList.length)];
      paiements.push({
        num_adherent: numAdherent,
        id_tresorier: tresorier.id_tresorier,
        date_paiement: faker.date.past({ years: 1 }),
        montant: parseFloat((Math.random() * 200 + 20).toFixed(2)),
        mode: randomModePaiement(),
        type_paiement: randomTypePaiement(),
        statut: randomStatutPaiement(),
        reference_id: `REF-${currentYear}-${Math.floor(Math.random() * 100000)
          .toString()
          .padStart(5, "0")}`,
        description: faker.lorem.sentence({ min: 5, max: 12 }),
      });
    }
    await Paiement.bulkCreate(paiements);
    console.log(`✅ ${paiements.length} paiements créés`);

    // ==================== ALERTES ====================
    console.log("🔄 Création des alertes...");
    const alertes = [];
    for (let i = 0; i < CONFIG.ALERTES; i++) {
      const numAdherent =
        adherentIdList[Math.floor(Math.random() * adherentIdList.length)];
      alertes.push({
        num_adherent: numAdherent,
        type: randomTypeAlerte(),
        date_envoi: faker.date.past({ years: 1 }),
        canal: randomCanal(),
        statut: randomStatutAlerte(),
      });
    }
    await Alerte.bulkCreate(alertes);
    console.log(`✅ ${alertes.length} alertes créées`);

    // ==================== INCIDENTS ====================
    console.log("🔄 Création des incidents...");
    const incidents = [];
    for (let i = 0; i < CONFIG.INCIDENTS; i++) {
      const idSortie =
        sortieDoneIdList[Math.floor(Math.random() * sortieDoneIdList.length)];
      const cloture = Math.random() > 0.4;
      const dateHeure = sortieDateMap[idSortie] || faker.date.past({ years: 1 });
      incidents.push({
        id_sortie: idSortie,
        date_heure: dateHeure,
        type: randomTypeIncident(),
        description: faker.lorem.sentence({ min: 10, max: 25 }),
        mesures_prises: cloture
          ? faker.lorem.sentence({ min: 5, max: 15 })
          : null,
        cloture,
        date_cloture: cloture
          ? faker.date.between({ from: dateHeure, to: new Date() })
          : null,
        declared_by: president.id_president,
      });
    }
    await Incident.bulkCreate(incidents);
    console.log(`✅ ${incidents.length} incidents créés`);

    console.log("\n🎉 SEEDING TERMINÉ AVEC SUCCÈS !");
    console.log("📊 Récapitulatif des données créées :");
    console.log(`   👑 Président : 1 (president@plongee.com / president123)`);
    console.log(`   🏊 Moniteurs : ${moniteurIds.length} (moniteur@plongee.com / moniteur123)`);
    console.log(`   💰 Trésorier : 1 (tresorier@plongee.com / tresorier123)`);
    console.log(`   👥 Adhérents : ${adherentIdList.length} (adherent@plongee.com / adherent123)`);
    console.log(`   📋 Adhésions : ${CONFIG.ADHESIONS}`);
    console.log(`   📄 Certificats : ${CONFIG.CERTIFICATS}`);
    console.log(`   💰 Paiements : ${CONFIG.PAIEMENTS}`);
    console.log(`   🏊 Sorties : ${CONFIG.SORTIES}`);
    console.log(`   📝 Inscriptions : ${CONFIG.INSCRIPTIONS}`);
    console.log(`   🤿 Plongées : ${CONFIG.PLONGEES}`);
    console.log(`   📊 Palanquées : ${CONFIG.PALANQUEES}`);
    console.log(`   🔗 Compositions : ${composer.length}`);
    console.log(`   🔧 Matériels : ${CONFIG.MATERIELS}`);
    console.log(`   🔨 Réparations : ${CONFIG.REPARATIONS}`);
    console.log(`   📦 Attributions : ${CONFIG.ATTRIBUTIONS}`);
    console.log(`   🎓 Formations : ${CONFIG.FORMATIONS}`);
    console.log(`   🏆 Compétences : ${CONFIG.COMPETENCES}`);
    console.log(`   🔔 Alertes : ${CONFIG.ALERTES}`);
    console.log(`   🚨 Incidents : ${CONFIG.INCIDENTS}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors du seeding :", error);
    process.exit(1);
  }
}

seedAll();
