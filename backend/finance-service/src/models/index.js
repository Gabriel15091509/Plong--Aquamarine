const { sequelize } = require("../config/database");
const Paiement = require("./Paiement");
const Echeancier = require("./Echeancier");
const Echeance = require("./Echeance");

// Aucune association Sequelize entre Paiement et les autres domaines :
// Adherent/Tresorier (identite-service) et Adhesion/Formation/Sortie/
// Attribution (autres services) restent des colonnes applicatives
// (num_adherent, id_tresorier, reference_id), recomposées via les
// serviceClients HTTP quand nécessaire.
//
// Echeancier/Echeance, elles, vivent toutes les deux dans finance-service et
// le même schéma Postgres : une vraie FK + association Sequelize est donc
// justifiée ici, contrairement à Paiement.reference_id.
Echeancier.hasMany(Echeance, { foreignKey: "id_echeancier", as: "echeances" });
Echeance.belongsTo(Echeancier, { foreignKey: "id_echeancier", as: "echeancier" });

module.exports = {
  sequelize,
  Paiement,
  Echeancier,
  Echeance,
};
