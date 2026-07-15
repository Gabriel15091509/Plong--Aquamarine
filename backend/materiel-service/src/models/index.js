const { sequelize } = require("../config/database");
const Materiel = require("./Materiel");
const Reparation = require("./Reparation");

// 📌 Materiel - Reparation (seule association intra-domaine restante ici :
// Attribution vit dans activites-service, référencé par num_inventaire sans
// FK inter-schémas — voir serviceClients si un appel HTTP devient nécessaire).
Materiel.hasMany(Reparation, {
  foreignKey: "num_inventaire",
  as: "reparations",
});
Reparation.belongsTo(Materiel, {
  foreignKey: "num_inventaire",
  as: "materiel",
});

module.exports = {
  sequelize,
  Materiel,
  Reparation,
};
