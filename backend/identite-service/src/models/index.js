const { sequelize } = require("../config/database");
const User = require("./User");
const Adherent = require("./Adherent");
const Moniteur = require("./Moniteur");
const President = require("./President");
const Tresorier = require("./Tresorier");
const Brevet = require("./Brevet");

// User/Adherent/Moniteur/President/Tresorier vivent tous dans le même
// schéma (identite-service) : ces associations restent de vraies relations
// Sequelize/Postgres, contrairement aux domaines externes (voir
// serviceClients pour ceux-ci).

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

// 📌 President - actions (created_by / archived_by)
President.hasMany(User, { foreignKey: "created_by", as: "usersCrees" });
User.belongsTo(President, { foreignKey: "created_by", as: "createur" });

President.hasMany(Adherent, { foreignKey: "archived_by", as: "adherentsArchives" });
Adherent.belongsTo(President, { foreignKey: "archived_by", as: "archivePar" });

// 📌 Adherent - Brevet (historique des niveaux, voir Brevet.js)
Adherent.hasMany(Brevet, { foreignKey: "num_adherent", as: "brevets" });
Brevet.belongsTo(Adherent, { foreignKey: "num_adherent", as: "adherent" });

module.exports = {
  sequelize,
  User,
  Adherent,
  Moniteur,
  President,
  Tresorier,
  Brevet,
};
