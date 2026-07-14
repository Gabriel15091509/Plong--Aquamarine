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
const Incident = require("./Incident");
const User = require("./User");
const Moniteur = require("./Moniteur");
const President = require("./President");
const Tresorier = require("./Tresorier");

// ============================================
// RELATIONS AVEC ALIAS
// ============================================

// 📌 User - Adherent
User.hasOne(Adherent, {
  foreignKey: "user_id",
  as: "adherent",
});
Adherent.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

// 📌 User - Moniteur
User.hasOne(Moniteur, {
  foreignKey: "user_id",
  as: "moniteur",
});
Moniteur.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

// 📌 Moniteur - President (héritage)
Moniteur.hasOne(President, {
  foreignKey: "id_moniteur",
  as: "president",
  onDelete: "CASCADE",
});
President.belongsTo(Moniteur, {
  foreignKey: "id_moniteur",
  as: "moniteur",
});

// 📌 User - Tresorier
User.hasOne(Tresorier, {
  foreignKey: "user_id",
  as: "tresorier",
});
Tresorier.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

// 📌 President - actions (created_by / archived_by / declared_by)
President.hasMany(User, { foreignKey: "created_by", as: "usersCrees" });
User.belongsTo(President, { foreignKey: "created_by", as: "createur" });

President.hasMany(Sortie, { foreignKey: "created_by", as: "sortiesCreees" });
Sortie.belongsTo(President, { foreignKey: "created_by", as: "createur" });

President.hasMany(Adherent, { foreignKey: "archived_by", as: "adherentsArchives" });
Adherent.belongsTo(President, { foreignKey: "archived_by", as: "archivePar" });

President.hasMany(Materiel, { foreignKey: "created_by", as: "materielsCrees" });
Materiel.belongsTo(President, { foreignKey: "created_by", as: "createur" });

President.hasMany(Incident, { foreignKey: "declared_by", as: "incidentsDeclares" });
Incident.belongsTo(President, { foreignKey: "declared_by", as: "declarePar" });

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

// 📌 Tresorier - Paiement
Tresorier.hasMany(Paiement, {
  foreignKey: "id_tresorier",
  as: "paiements",
});
Paiement.belongsTo(Tresorier, {
  foreignKey: "id_tresorier",
  as: "tresorier",
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

// 📌 Sortie - Plongee
Sortie.hasMany(Plongee, {
  foreignKey: "id_sortie",
  as: "plongees",
});
Plongee.belongsTo(Sortie, {
  foreignKey: "id_sortie",
  as: "sortie",
});

// 📌 Moniteur - Plongee (validation)
Moniteur.hasMany(Plongee, {
  foreignKey: "id_moniteur_validateur",
  as: "plongeesValidees",
});
Plongee.belongsTo(Moniteur, {
  foreignKey: "id_moniteur_validateur",
  as: "moniteurValidateur",
});

// 📌 Palanquee - Plongee (carnets individuels générés à partir de la palanquée)
Palanquee.hasMany(Plongee, {
  foreignKey: "id_palanquee",
  as: "carnets",
});
Plongee.belongsTo(Palanquee, {
  foreignKey: "id_palanquee",
  as: "palanquee",
  constraints: false,
});

// 📌 Sortie - Palanquee
Sortie.hasMany(Palanquee, {
  foreignKey: "id_sortie",
  as: "palanquees",
});
Palanquee.belongsTo(Sortie, {
  foreignKey: "id_sortie",
  as: "sortie",
});

// 📌 Moniteur - Palanquee (encadrement)
Moniteur.hasMany(Palanquee, {
  foreignKey: "id_moniteur_encadrant",
  as: "palanqueesEncadrees",
});
Palanquee.belongsTo(Moniteur, {
  foreignKey: "id_moniteur_encadrant",
  as: "moniteurEncadrant",
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

// 📌 Palanquee - Adherent (guide de palanquée / secouriste)
Palanquee.belongsTo(Adherent, {
  foreignKey: "id_guide_palanquee",
  as: "guide",
  constraints: false,
});
Palanquee.belongsTo(Adherent, {
  foreignKey: "id_secouriste",
  as: "secouriste",
  constraints: false,
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

// 📌 Moniteur - Formation
Moniteur.hasMany(Formation, {
  foreignKey: "id_moniteur",
  as: "formationsEncadrees",
});
Formation.belongsTo(Moniteur, {
  foreignKey: "id_moniteur",
  as: "moniteur",
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

// 📌 Palanquee - Attribution (matériel attribué à la palanquée)
Palanquee.hasMany(Attribution, {
  foreignKey: "id_palanquee",
  as: "attributions",
});
Attribution.belongsTo(Palanquee, {
  foreignKey: "id_palanquee",
  as: "palanquee",
  constraints: false,
});

// 📌 Sortie - Incident
Sortie.hasMany(Incident, {
  foreignKey: "id_sortie",
  as: "incidents",
});
Incident.belongsTo(Sortie, {
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
  Incident,
  User,
  Moniteur,
  President,
  Tresorier,
};
