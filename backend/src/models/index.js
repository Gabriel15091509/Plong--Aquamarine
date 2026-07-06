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
  as: "adhesions",
});
Adhesion.belongsTo(Adherent, {
  foreignKey: "num_adherent",
  as: "adherent",
});

// 📌 Adherent - CertificatMedical
Adherent.hasMany(CertificatMedical, {
  foreignKey: "num_adherent",
  as: "certificats",
});
CertificatMedical.belongsTo(Adherent, {
  foreignKey: "num_adherent",
  as: "adherent",
});

// 📌 Adherent - Paiement
Adherent.hasMany(Paiement, {
  foreignKey: "num_adherent",
  as: "paiements",
});
Paiement.belongsTo(Adherent, {
  foreignKey: "num_adherent",
  as: "adherent",
});

// 📌 Adherent - Inscription
Adherent.hasMany(Inscription, {
  foreignKey: "num_adherent",
  as: "inscriptions",
});

// 📌 Sortie - Inscription
Sortie.hasMany(Inscription, {
  foreignKey: "id_sortie",
  as: "inscriptions",
});

// 📌 Inscription - Adherent
Inscription.belongsTo(Adherent, {
  foreignKey: "num_adherent",
  as: "adherent",
});

// 📌 Inscription - Sortie
Inscription.belongsTo(Sortie, {
  foreignKey: "id_sortie",
  as: "sortie",
});

// 📌 User - Inscription (pour le pointage) - ALIAS UNIQUE
User.hasMany(Inscription, {
  foreignKey: "presence_check_by",
  as: "presence_inscriptions",
});
Inscription.belongsTo(User, {
  foreignKey: "presence_check_by",
  as: "checker", // ✅ Alias unique "checker"
});

// 📌 Adherent - Plongee
Adherent.hasMany(Plongee, {
  foreignKey: "num_adherent",
  as: "plongees",
});
Plongee.belongsTo(Adherent, {
  foreignKey: "num_adherent",
  as: "adherent",
});

// 📌 Plongee - Palanquee
Plongee.hasMany(Palanquee, {
  foreignKey: "id_plongee",
  as: "palanquees",
});
Palanquee.belongsTo(Plongee, {
  foreignKey: "id_plongee",
  as: "plongee",
});

// 📌 Palanquee - Composer
Palanquee.hasMany(Composer, {
  foreignKey: "id_palanquee",
  as: "composers",
});

// 📌 Adherent - Composer
Adherent.hasMany(Composer, {
  foreignKey: "num_adherent",
  as: "composers",
});

// 📌 Composer - Palanquee
Composer.belongsTo(Palanquee, {
  foreignKey: "id_palanquee",
  as: "palanquee",
});

// 📌 Composer - Adherent
Composer.belongsTo(Adherent, {
  foreignKey: "num_adherent",
  as: "adherent",
});

// 📌 Adherent - Formation
Adherent.hasMany(Formation, {
  foreignKey: "num_adherent",
  as: "formations",
});
Formation.belongsTo(Adherent, {
  foreignKey: "num_adherent",
  as: "adherent",
});

// 📌 Formation - Competence
Formation.hasMany(Competence, {
  foreignKey: "id_formation",
  as: "competences",
});
Competence.belongsTo(Formation, {
  foreignKey: "id_formation",
  as: "formation",
});

// 📌 Adherent - Alerte
Adherent.hasMany(Alerte, {
  foreignKey: "num_adherent",
  as: "alertes",
});
Alerte.belongsTo(Adherent, {
  foreignKey: "num_adherent",
  as: "adherent",
});

// 📌 Materiel - Reparation
Materiel.hasMany(Reparation, {
  foreignKey: "num_inventaire",
  as: "reparations",
});
Reparation.belongsTo(Materiel, {
  foreignKey: "num_inventaire",
  as: "materiel",
});

// 📌 Materiel - Attribution
Materiel.hasMany(Attribution, {
  foreignKey: "num_inventaire",
  as: "attributions",
});

// 📌 Adherent - Attribution
Adherent.hasMany(Attribution, {
  foreignKey: "num_adherent",
  as: "attributions",
});

// 📌 Sortie - Attribution
Sortie.hasMany(Attribution, {
  foreignKey: "id_sortie",
  as: "attributions",
});

// 📌 Attribution - Materiel
Attribution.belongsTo(Materiel, {
  foreignKey: "num_inventaire",
  as: "materiel",
});

// 📌 Attribution - Adherent
Attribution.belongsTo(Adherent, {
  foreignKey: "num_adherent",
  as: "adherent",
});

// 📌 Attribution - Sortie
Attribution.belongsTo(Sortie, {
  foreignKey: "id_sortie",
  as: "sortie",
});

// ============================================
// EXPORT
// ============================================

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
