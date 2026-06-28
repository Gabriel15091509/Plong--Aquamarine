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
const User = require("./User"); // ✅ Ajout

// Relations
Adherent.hasMany(Adhesion, { foreignKey: "num_adherent" });
Adhesion.belongsTo(Adherent, { foreignKey: "num_adherent" });

Adherent.hasMany(CertificatMedical, { foreignKey: "num_adherent" });
CertificatMedical.belongsTo(Adherent, { foreignKey: "num_adherent" });

Adherent.hasMany(Paiement, { foreignKey: "num_adherent" });
Paiement.belongsTo(Adherent, { foreignKey: "num_adherent" });

Adherent.hasMany(Inscription, { foreignKey: "num_adherent" });
Sortie.hasMany(Inscription, { foreignKey: "id_sortie" });
Inscription.belongsTo(Adherent, { foreignKey: "num_adherent" });
Inscription.belongsTo(Sortie, { foreignKey: "id_sortie" });

Adherent.hasMany(Plongee, { foreignKey: "num_adherent" });
Plongee.belongsTo(Adherent, { foreignKey: "num_adherent" });

Plongee.hasMany(Palanquee, { foreignKey: "id_plongee" });
Palanquee.belongsTo(Plongee, { foreignKey: "id_plongee" });

Palanquee.hasMany(Composer, { foreignKey: "id_palanquee" });
Adherent.hasMany(Composer, { foreignKey: "num_adherent" });
Composer.belongsTo(Palanquee, { foreignKey: "id_palanquee" });
Composer.belongsTo(Adherent, { foreignKey: "num_adherent" });

Adherent.hasMany(Formation, { foreignKey: "num_adherent" });
Formation.belongsTo(Adherent, { foreignKey: "num_adherent" });

Formation.hasMany(Competence, { foreignKey: "id_formation" });
Competence.belongsTo(Formation, { foreignKey: "id_formation" });

Adherent.hasMany(Alerte, { foreignKey: "num_adherent" });
Alerte.belongsTo(Adherent, { foreignKey: "num_adherent" });

Materiel.hasMany(Reparation, { foreignKey: "num_inventaire" });
Reparation.belongsTo(Materiel, { foreignKey: "num_inventaire" });

Materiel.hasMany(Attribution, { foreignKey: "num_inventaire" });
Adherent.hasMany(Attribution, { foreignKey: "num_adherent" });
Sortie.hasMany(Attribution, { foreignKey: "id_sortie" });
Attribution.belongsTo(Materiel, { foreignKey: "num_inventaire" });
Attribution.belongsTo(Adherent, { foreignKey: "num_adherent" });
Attribution.belongsTo(Sortie, { foreignKey: "id_sortie" });

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
