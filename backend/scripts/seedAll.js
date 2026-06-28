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
  User,
} = require("../src/models");
const bcrypt = require("bcryptjs");
const { faker } = require("@faker-js/faker/locale/fr");

// Configuration
const CONFIG = {
  ADHERENTS: 50,
  ADHESIONS: 80,
  CERTIFICATS: 60,
  PAIEMENTS: 100,
  SORTIES: 20,
  INSCRIPTIONS: 120,
  PLONGEES: 150,
  PALANQUEES: 80,
  COMPOSER: 200,
  MATERIELS: 30,
  REPARATIONS: 15,
  ATTRIBUTIONS: 40,
  FORMATIONS: 25,
  COMPETENCES: 60,
  ALERTES: 30,
};

// ============ FONCTIONS UTILITAIRES ============

// Générer un numéro de téléphone aléatoire
function randomPhone() {
  return `0${Math.floor(Math.random() * 6) + 1}${Math.floor(
    Math.random() * 100000000,
  )
    .toString()
    .padStart(8, "0")}`;
}

// Générer un email aléatoire
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
  return `${prenom.toLowerCase()}.${nom.toLowerCase()}${Math.floor(Math.random() * 100)}@${domains[Math.floor(Math.random() * domains.length)]}`;
}

// Générer une adresse aléatoire
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

// ✅ Générer un niveau aléatoire
function randomNiveau() {
  const niveaux = [
    "Débutant",
    "Niveau 1",
    "Niveau 2",
    "Niveau 3",
    "Niveau 4",
    "Moniteur",
  ];
  return niveaux[Math.floor(Math.random() * niveaux.length)];
}

// ✅ Générer un statut aléatoire
function randomStatut() {
  const statuts = ["Actif", "Inactif", "Suspendu"];
  const weights = [0.8, 0.15, 0.05];
  const rand = Math.random();
  let cumul = 0;
  for (let i = 0; i < weights.length; i++) {
    cumul += weights[i];
    if (rand < cumul) return statuts[i];
  }
  return statuts[0];
}

// ✅ Générer un type d'adhésion aléatoire
function randomTypeAdhesion() {
  const types = ["Adhésion annuelle", "Licence FFESM", "Assurance"];
  const weights = [0.6, 0.3, 0.1];
  const rand = Math.random();
  let cumul = 0;
  for (let i = 0; i < weights.length; i++) {
    cumul += weights[i];
    if (rand < cumul) return types[i];
  }
  return types[0];
}

// ✅ Générer un statut de paiement aléatoire
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

// ✅ Générer un mode de paiement aléatoire
function randomModePaiement() {
  const modes = ["Espèces", "Carte", "Chèque", "Virement"];
  return modes[Math.floor(Math.random() * modes.length)];
}

// ✅ Générer un type de sortie aléatoire
function randomTypeSortie() {
  const types = ["Plongée", "Formation", "Exploration", "Nettoyage"];
  return types[Math.floor(Math.random() * types.length)];
}

// ✅ Générer un statut de sortie aléatoire
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

// ✅ Générer un type de plongée aléatoire
function randomTypePlongee() {
  const types = ["Loisir", "Formation", "Exploration", "Nuit", "Épave"];
  return types[Math.floor(Math.random() * types.length)];
}

// ✅ Générer une visibilité aléatoire
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

// ✅ Générer une catégorie de matériel aléatoire
function randomCategorieMateriel() {
  const categories = [
    "Bloc",
    "Détendeur",
    "Gilet",
    "Combinaison",
    "Palmes",
    "Masque",
    "Ordinateur",
  ];
  return categories[Math.floor(Math.random() * categories.length)];
}

// ✅ Générer un état de matériel aléatoire
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

// ✅ Générer un niveau de formation aléatoire
function randomNiveauFormation() {
  const niveaux = ["N1", "N2", "N3", "N4", "MF1"];
  const weights = [0.4, 0.3, 0.15, 0.1, 0.05];
  const rand = Math.random();
  let cumul = 0;
  for (let i = 0; i < weights.length; i++) {
    cumul += weights[i];
    if (rand < cumul) return niveaux[i];
  }
  return niveaux[0];
}

// ✅ Générer un statut de formation aléatoire
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

// ✅ Générer un type d'alerte aléatoire
function randomTypeAlerte() {
  const types = [
    "Certificat expiré",
    "Adhésion expirée",
    "Paiement en retard",
    "Formation",
  ];
  return types[Math.floor(Math.random() * types.length)];
}

// ✅ Générer un canal d'alerte aléatoire (court - max 10 caractères)
function randomCanal() {
  const canaux = ["Email", "SMS", "Notif"]; // ✅ 'Notification' devient 'Notif'
  return canaux[Math.floor(Math.random() * canaux.length)];
}

// ✅ Générer un statut d'alerte aléatoire
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

// ✅ Générer un niveau de compétence aléatoire (court)
function randomNiveauCompetence() {
  const niveaux = ["Début.", "Inter.", "Avancé", "Expert"];
  return niveaux[Math.floor(Math.random() * niveaux.length)];
}

// ============ SEED PRINCIPAL ============

async function seedAll() {
  try {
    console.log("🔄 Connexion à la base de données...");
    await sequelize.authenticate();
    console.log("✅ Connexion établie");

    // Vider les tables
    console.log("🔄 Vidage des tables...");
    await sequelize.query(
      'TRUNCATE TABLE "attributions" RESTART IDENTITY CASCADE',
    );
    await sequelize.query('TRUNCATE TABLE "composer" RESTART IDENTITY CASCADE');
    await sequelize.query(
      'TRUNCATE TABLE "palanquees" RESTART IDENTITY CASCADE',
    );
    await sequelize.query('TRUNCATE TABLE "plongees" RESTART IDENTITY CASCADE');
    await sequelize.query(
      'TRUNCATE TABLE "inscriptions" RESTART IDENTITY CASCADE',
    );
    await sequelize.query('TRUNCATE TABLE "sorties" RESTART IDENTITY CASCADE');
    await sequelize.query(
      'TRUNCATE TABLE "reparations" RESTART IDENTITY CASCADE',
    );
    await sequelize.query(
      'TRUNCATE TABLE "materiels" RESTART IDENTITY CASCADE',
    );
    await sequelize.query(
      'TRUNCATE TABLE "competences" RESTART IDENTITY CASCADE',
    );
    await sequelize.query(
      'TRUNCATE TABLE "formations" RESTART IDENTITY CASCADE',
    );
    await sequelize.query('TRUNCATE TABLE "alertes" RESTART IDENTITY CASCADE');
    await sequelize.query(
      'TRUNCATE TABLE "paiements" RESTART IDENTITY CASCADE',
    );
    await sequelize.query(
      'TRUNCATE TABLE "certificats_medicaux" RESTART IDENTITY CASCADE',
    );
    await sequelize.query(
      'TRUNCATE TABLE "adhesions" RESTART IDENTITY CASCADE',
    );
    await sequelize.query(
      'TRUNCATE TABLE "adherents" RESTART IDENTITY CASCADE',
    );
    await sequelize.query('TRUNCATE TABLE "users" RESTART IDENTITY CASCADE');
    console.log("✅ Tables vidées");

    // ==================== USERS ====================
    console.log("🔄 Création des utilisateurs...");
    const salt = await bcrypt.genSalt(10);
    await User.create({
      email: "admin@plongee.com",
      password: await bcrypt.hash("admin123", salt),
      name: "Administrateur",
      role: "admin",
      active: true,
    });

    await User.bulkCreate([
      {
        email: "user1@plongee.com",
        password: await bcrypt.hash("user123", salt),
        name: "Jean Martin",
        role: "user",
        active: true,
      },
      {
        email: "user2@plongee.com",
        password: await bcrypt.hash("user123", salt),
        name: "Sophie Dubois",
        role: "user",
        active: true,
      },
      {
        email: "moniteur@plongee.com",
        password: await bcrypt.hash("moniteur123", salt),
        name: "Pierre Bernard",
        role: "moniteur",
        active: true,
      },
    ]);
    console.log(`✅ ${4} utilisateurs créés`);

    // ==================== ADHERENTS ====================
    console.log("🔄 Création des adhérents...");
    const adherents = [];
    const civilites = ["M.", "Mme", "Mlle"];
    for (let i = 0; i < CONFIG.ADHERENTS; i++) {
      const nom = faker.person.lastName();
      const prenom = faker.person.firstName();
      const dateNaissance = faker.date.birthdate({
        min: 1940,
        max: 2010,
        mode: "year",
      });
      const niveau = randomNiveau();
      adherents.push({
        civilite: civilites[Math.floor(Math.random() * civilites.length)],
        nom,
        prenom,
        date_naissance: dateNaissance,
        adresse: randomAddress(),
        telephone: randomPhone(),
        email: randomEmail(nom, prenom),
        contact_urgence: `${faker.person.firstName()} ${faker.person.lastName()} - ${randomPhone()}`,
        niveau: niveau,
        date_obtention_niveau:
          niveau !== "Débutant" ? faker.date.past({ years: 10 }) : null,
        statut: randomStatut(),
        date_inscription: faker.date.past({ years: 5 }),
        nb_plongees_total: Math.floor(Math.random() * 100),
      });
    }
    await Adherent.bulkCreate(adherents);
    console.log(`✅ ${adherents.length} adhérents créés`);

    // Récupérer les IDs des adhérents
    const adherentIds = await Adherent.findAll({
      attributes: ["num_adherent"],
    });
    const adherentIdList = adherentIds.map((a) => a.num_adherent);

    // ==================== ADHESIONS ====================
    console.log("🔄 Création des adhésions...");
    const adhesions = [];
    for (let i = 0; i < CONFIG.ADHESIONS; i++) {
      const numAdherent =
        adherentIdList[Math.floor(Math.random() * adherentIdList.length)];
      const annee = new Date().getFullYear() - Math.floor(Math.random() * 3);
      const dateDebut = new Date(annee, 0, 1);
      const dateFin = new Date(annee, 11, 31);
      adhesions.push({
        num_adherent: numAdherent,
        type: randomTypeAdhesion(),
        date_debut: dateDebut,
        date_fin: dateFin,
        montant_paye: parseFloat((Math.random() * 150 + 50).toFixed(2)),
        num_licence_ffesm: `FF${Math.floor(Math.random() * 100000)
          .toString()
          .padStart(5, "0")}`,
        statut_paiement: randomStatutPaiement(),
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
      const dateSortie = faker.date.future({ years: 1 });
      const dateOuverture = new Date(dateSortie);
      dateOuverture.setDate(
        dateOuverture.getDate() - Math.floor(Math.random() * 30 + 7),
      );
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
        tarif: parseFloat((Math.random() * 80 + 20).toFixed(2)),
        statut: randomStatutSortie(),
        description_site: faker.lorem.sentence({ min: 10, max: 30 }),
        date_ouverture_inscriptions: dateOuverture,
        condition_affectation: faker.lorem.sentence({ min: 5, max: 15 }),
      });
    }
    await Sortie.bulkCreate(sorties);
    console.log(`✅ ${sorties.length} sorties créées`);

    // Récupérer les IDs des sorties
    const sortieIds = await Sortie.findAll({ attributes: ["id_sortie"] });
    const sortieIdList = sortieIds.map((s) => s.id_sortie);

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
      plongees.push({
        num_adherent: numAdherent,
        date: faker.date.past({ years: 3 }),
        profondeur_max: Math.floor(Math.random() * 40 + 5),
        duree: Math.floor(Math.random() * 60 + 15),
        temperature_eau: parseFloat((Math.random() * 20 + 10).toFixed(1)),
        visibilite: randomVisibilite(),
        type_plongee: randomTypePlongee(),
        observations_faune: faker.lorem.sentence({ min: 5, max: 15 }),
        valide_moniteur: Math.random() > 0.3,
        lien_photos:
          Math.random() > 0.5
            ? `https://images.unsplash.com/photo-${Math.random().toString(36).substring(2, 15)}`
            : null,
      });
    }
    await Plongee.bulkCreate(plongees);
    console.log(`✅ ${plongees.length} plongées créées`);

    // Récupérer les IDs des plongées
    const plongeeIds = await Plongee.findAll({ attributes: ["id_plongee"] });
    const plongeeIdList = plongeeIds.map((p) => p.id_plongee);

    // ==================== PALANQUEES ====================
    console.log("🔄 Création des palanquées...");
    const palanquees = [];
    for (let i = 0; i < CONFIG.PALANQUEES; i++) {
      const idPlongee =
        plongeeIdList[Math.floor(Math.random() * plongeeIdList.length)];
      palanquees.push({
        id_plongee: idPlongee,
        nom_palanquee: `Palanquée ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`,
        profondeur_max_realisee: Math.floor(Math.random() * 35 + 5),
        duree_reelle: Math.floor(Math.random() * 55 + 10),
      });
    }
    await Palanquee.bulkCreate(palanquees);
    console.log(`✅ ${palanquees.length} palanquées créées`);

    // Récupérer les IDs des palanquées
    const palanqueeIds = await Palanquee.findAll({
      attributes: ["id_palanquee"],
    });
    const palanqueeIdList = palanqueeIds.map((p) => p.id_palanquee);

    // ==================== COMPOSER ====================
    console.log("🔄 Création des compositions...");
    const composer = [];
    for (let i = 0; i < CONFIG.COMPOSER; i++) {
      const idPalanquee =
        palanqueeIdList[Math.floor(Math.random() * palanqueeIdList.length)];
      const numAdherent =
        adherentIdList[Math.floor(Math.random() * adherentIdList.length)];
      composer.push({
        id_palanquee: idPalanquee,
        num_adherent: numAdherent,
      });
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
        date_achat: faker.date.past({ years: 5 }),
        etat: randomEtatMateriel(),
        localisation: `Local ${Math.floor(Math.random() * 5 + 1)} - Étagère ${Math.floor(Math.random() * 3 + 1)}`,
        date_verif_visuelle:
          Math.random() > 0.5 ? faker.date.past({ years: 1 }) : null,
        date_revision_technique:
          Math.random() > 0.5 ? faker.date.past({ years: 1 }) : null,
        date_prochaine_echeance: faker.date.future({ years: 1 }),
      });
    }
    await Materiel.bulkCreate(materiels);
    console.log(`✅ ${materiels.length} matériels créés`);

    // Récupérer les IDs des matériels
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
      reparations.push({
        num_inventaire: numInventaire,
        date_constat: faker.date.past({ years: 1 }),
        description_panne: faker.lorem.sentence({ min: 10, max: 25 }),
        prestataire:
          prestataires[Math.floor(Math.random() * prestataires.length)],
        cout: parseFloat((Math.random() * 200 + 20).toFixed(2)),
        date_retour: Math.random() > 0.3 ? faker.date.past({ years: 1 }) : null,
      });
    }
    await Reparation.bulkCreate(reparations);
    console.log(`✅ ${reparations.length} réparations créées`);

    // ==================== ATTRIBUTIONS ====================
    console.log("🔄 Création des attributions...");
    const typesAttribution = ["Prêt", "Location", "Formation"];
    const attributions = [];
    for (let i = 0; i < CONFIG.ATTRIBUTIONS; i++) {
      const numInventaire =
        materielIdList[Math.floor(Math.random() * materielIdList.length)];
      const numAdherent =
        adherentIdList[Math.floor(Math.random() * adherentIdList.length)];
      const idSortie =
        sortieIdList[Math.floor(Math.random() * sortieIdList.length)];
      const dateAttribution = faker.date.past({ years: 1 });
      const dateRetourPrevue = new Date(dateAttribution);
      dateRetourPrevue.setDate(
        dateRetourPrevue.getDate() + Math.floor(Math.random() * 7 + 1),
      );
      attributions.push({
        num_inventaire: numInventaire,
        num_adherent: numAdherent,
        id_sortie: idSortie,
        date_attribution: dateAttribution,
        etat_depart: ["Bon", "Très bon", "Neuf"][Math.floor(Math.random() * 3)],
        etat_retour:
          Math.random() > 0.7
            ? ["Bon", "Usagé", "À réparer"][Math.floor(Math.random() * 3)]
            : null,
        date_retour_prevue: dateRetourPrevue,
        constat_deterioration: faker.lorem.sentence({ min: 5, max: 15 }),
        type: typesAttribution[
          Math.floor(Math.random() * typesAttribution.length)
        ],
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
        niveau_vise: randomNiveauFormation(),
        date_debut: dateDebut,
        date_fin_prevue: dateFinPrevue,
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

    // Récupérer les IDs des formations
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
        validee_par: acquise ? `Moniteur ${faker.person.lastName()}` : null,
      });
    }
    await Competence.bulkCreate(competences);
    console.log(`✅ ${competences.length} compétences créées`);

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
        canal: randomCanal(), // ✅ Utilise 'Email', 'SMS' ou 'Notif'
        statut: randomStatutAlerte(),
      });
    }
    await Alerte.bulkCreate(alertes);
    console.log(`✅ ${alertes.length} alertes créées`);

    console.log("\n🎉 SEEDING TERMINÉ AVEC SUCCÈS !");
    console.log("📊 Récapitulatif des données créées :");
    console.log(`   👥 Adhérents : ${CONFIG.ADHERENTS}`);
    console.log(`   📋 Adhésions : ${CONFIG.ADHESIONS}`);
    console.log(`   📄 Certificats : ${CONFIG.CERTIFICATS}`);
    console.log(`   💰 Paiements : ${CONFIG.PAIEMENTS}`);
    console.log(`   🏊 Sorties : ${CONFIG.SORTIES}`);
    console.log(`   📝 Inscriptions : ${CONFIG.INSCRIPTIONS}`);
    console.log(`   🤿 Plongées : ${CONFIG.PLONGEES}`);
    console.log(`   📊 Palanquées : ${CONFIG.PALANQUEES}`);
    console.log(`   🔗 Compositions : ${CONFIG.COMPOSER}`);
    console.log(`   🔧 Matériels : ${CONFIG.MATERIELS}`);
    console.log(`   🔨 Réparations : ${CONFIG.REPARATIONS}`);
    console.log(`   📦 Attributions : ${CONFIG.ATTRIBUTIONS}`);
    console.log(`   🎓 Formations : ${CONFIG.FORMATIONS}`);
    console.log(`   🏆 Compétences : ${CONFIG.COMPETENCES}`);
    console.log(`   🔔 Alertes : ${CONFIG.ALERTES}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors du seeding :", error);
    process.exit(1);
  }
}

seedAll();
