const { sequelize } = require("../config/database");
const Formation = require("./Formation");
const Competence = require("./Competence");

// Relation interne au domaine Formation — reste une vraie FK Postgres
// puisque les deux tables vivent dans le même schéma `formation`.
Formation.hasMany(Competence, {
  foreignKey: "id_formation",
  as: "competences",
});
Competence.belongsTo(Formation, {
  foreignKey: "id_formation",
  as: "formation",
});

module.exports = { sequelize, Formation, Competence };
