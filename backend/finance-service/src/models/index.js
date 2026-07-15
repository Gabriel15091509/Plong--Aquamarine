const { sequelize } = require("../config/database");
const Paiement = require("./Paiement");

// Aucune association Sequelize ici : Adherent/Tresorier (identite-service)
// et Adhesion/Formation/Sortie/Attribution (autres domaines) restent des
// colonnes applicatives (num_adherent, id_tresorier, reference_id),
// recomposées via les serviceClients HTTP quand nécessaire.

module.exports = {
  sequelize,
  Paiement,
};
