const { sequelize } = require("../config/database");
const Sortie = require("./Sortie");
const Inscription = require("./Inscription");
const Plongee = require("./Plongee");
const Palanquee = require("./Palanquee");
const Composer = require("./Composer");
const Attribution = require("./Attribution");
const Incident = require("./Incident");

// Adherent/Moniteur/President/User (identite-service) et Materiel
// (materiel-service) restent des colonnes applicatives (num_adherent,
// id_moniteur_*, created_by, declared_by, num_inventaire), recomposées via
// les serviceClients HTTP quand nécessaire — voir SortieService/
// PlongeeService/PalanqueeService/InscriptionService/AttributionService.

// 📌 Sortie - Inscription
Sortie.hasMany(Inscription, {
  foreignKey: "id_sortie",
  as: "inscriptions",
});
Inscription.belongsTo(Sortie, {
  foreignKey: "id_sortie",
  as: "sortie",
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

// 📌 Palanquee - Composer
Palanquee.hasMany(Composer, {
  foreignKey: "id_palanquee",
  as: "composers",
});
Composer.belongsTo(Palanquee, {
  foreignKey: "id_palanquee",
  as: "palanquee",
});

// 📌 Sortie - Attribution
Sortie.hasMany(Attribution, {
  foreignKey: "id_sortie",
  as: "attributions",
});
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

module.exports = {
  sequelize,
  Sortie,
  Inscription,
  Plongee,
  Palanquee,
  Composer,
  Attribution,
  Incident,
};
