const { sequelize } = require("../config/database");
const Adherent = require("./Adherent");
const Adhesion = require("./Adhesion");
const CertificatMedical = require("./CertificatMedical");
const Paiement = require("./Paiement");
const Sortie = require("./Sortie");
const Inscription = require("./Inscription");
const Plongee = require("./Plongee");
const Palanquee = require("./Palanquee");
const Composer = require("./Composer");
const Materiel = require("./Materiel");
const Reparation = require("./Reparation");
const Attribution = require("./Attribution");
const Formation = require("./Formation");
const Competence = require("./Competence");
const Alerte = require("./Alerte");
const User = require("./User");

// ============================================
// RELATIONS AVEC ALIAS
// ============================================

// 📌 Adherent - Adhesion
Adherent.hasMany(Adhesion, {
  foreignKey: "num_adherent",
  as: "adhesions", // ✅ Alias ajouté
});
Adhesion.belongsTo(Adherent, {
  foreignKey: "num_adherent",
  as: "adherent", // ✅ Alias ajouté
});

// 📌 Adherent - CertificatMedical
Adherent.hasMany(CertificatMedical, {
  foreignKey: "num_adherent",
  as: "certificats", // ✅ Alias ajouté
});
CertificatMedical.belongsTo(Adherent, {
  foreignKey: "num_adherent",
  as: "adherent", // ✅ Alias ajouté
});

// 📌 Adherent - Paiement
Adherent.hasMany(Paiement, {
  foreignKey: "num_adherent",
  as: "paiements", // ✅ Alias ajouté
});
Paiement.belongsTo(Adherent, {
  foreignKey: "num_adherent",
  as: "adherent", // ✅ Alias ajouté
});

// 📌 Adherent - Inscription (création)
Adherent.hasMany(Inscription, {
  foreignKey: "num_adherent",
  as: "inscriptions", // ✅ Alias ajouté
});

// 📌 Sortie - Inscription
Sortie.hasMany(Inscription, {
  foreignKey: "id_sortie",
  as: "inscriptions", // ✅ Alias ajouté - C'EST CELUI-CI QUI VOUS MANQUAIT !
});

// 📌 Inscription - Adherent
Inscription.belongsTo(Adherent, {
  foreignKey: "num_adherent",
  as: "adherent", // ✅ Alias ajouté
});

// 📌 Inscription - Sortie
Inscription.belongsTo(Sortie, {
  foreignKey: "id_sortie",
  as: "sortie", // ✅ Alias ajouté
});

// 📌 Adherent - Plongee
Adherent.hasMany(Plongee, {
  foreignKey: "num_adherent",
  as: "plongees", // ✅ Alias ajouté
});
Plongee.belongsTo(Adherent, {
  foreignKey: "num_adherent",
  as: "adherent", // ✅ Alias ajouté
});

// 📌 Plongee - Palanquee
Plongee.hasMany(Palanquee, {
  foreignKey: "id_plongee",
  as: "palanquees", // ✅ Alias ajouté
});
Palanquee.belongsTo(Plongee, {
  foreignKey: "id_plongee",
  as: "plongee", // ✅ Alias ajouté
});

// 📌 Palanquee - Composer
Palanquee.hasMany(Composer, {
  foreignKey: "id_palanquee",
  as: "composers", // ✅ Alias ajouté
});

// 📌 Adherent - Composer
Adherent.hasMany(Composer, {
  foreignKey: "num_adherent",
  as: "composers", // ✅ Alias ajouté
});

// 📌 Composer - Palanquee
Composer.belongsTo(Palanquee, {
  foreignKey: "id_palanquee",
  as: "palanquee", // ✅ Alias ajouté
});

// 📌 Composer - Adherent
Composer.belongsTo(Adherent, {
  foreignKey: "num_adherent",
  as: "adherent", // ✅ Alias ajouté
});

// 📌 Adherent - Formation
Adherent.hasMany(Formation, {
  foreignKey: "num_adherent",
  as: "formations", // ✅ Alias ajouté
});
Formation.belongsTo(Adherent, {
  foreignKey: "num_adherent",
  as: "adherent", // ✅ Alias ajouté
});

// 📌 Formation - Competence
Formation.hasMany(Competence, {
  foreignKey: "id_formation",
  as: "competences", // ✅ Alias ajouté
});
Competence.belongsTo(Formation, {
  foreignKey: "id_formation",
  as: "formation", // ✅ Alias ajouté
});

// 📌 Adherent - Alerte
Adherent.hasMany(Alerte, {
  foreignKey: "num_adherent",
  as: "alertes", // ✅ Alias ajouté
});
Alerte.belongsTo(Adherent, {
  foreignKey: "num_adherent",
  as: "adherent", // ✅ Alias ajouté
});

// 📌 Materiel - Reparation
Materiel.hasMany(Reparation, {
  foreignKey: "num_inventaire",
  as: "reparations", // ✅ Alias ajouté
});
Reparation.belongsTo(Materiel, {
  foreignKey: "num_inventaire",
  as: "materiel", // ✅ Alias ajouté
});

// 📌 Materiel - Attribution
Materiel.hasMany(Attribution, {
  foreignKey: "num_inventaire",
  as: "attributions", // ✅ Alias ajouté
});

// 📌 Adherent - Attribution
Adherent.hasMany(Attribution, {
  foreignKey: "num_adherent",
  as: "attributions", // ✅ Alias ajouté
});

// 📌 Sortie - Attribution
Sortie.hasMany(Attribution, {
  foreignKey: "id_sortie",
  as: "attributions", // ✅ Alias ajouté
});

// 📌 Attribution - Materiel
Attribution.belongsTo(Materiel, {
  foreignKey: "num_inventaire",
  as: "materiel", // ✅ Alias ajouté
});

// 📌 Attribution - Adherent
Attribution.belongsTo(Adherent, {
  foreignKey: "num_adherent",
  as: "adherent", // ✅ Alias ajouté
});

// 📌 Attribution - Sortie
Attribution.belongsTo(Sortie, {
  foreignKey: "id_sortie",
  as: "sortie", // ✅ Alias ajouté
});

module.exports = {
  sequelize,
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
};
