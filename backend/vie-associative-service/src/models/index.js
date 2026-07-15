const { sequelize } = require("../config/database");
const Adhesion = require("./Adhesion");
const CertificatMedical = require("./CertificatMedical");
const Alerte = require("./Alerte");

// Aucune association Sequelize ici : Adherent (identite-service) reste une
// colonne applicative (num_adherent) sur chacun des 3 modèles, recomposée
// via identiteClient quand nécessaire. Adhesion/CertificatMedical/Alerte ne
// se référencent pas entre eux dans le monolithe d'origine.

module.exports = {
  sequelize,
  Adhesion,
  CertificatMedical,
  Alerte,
};
