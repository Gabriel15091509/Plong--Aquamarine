const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Seance = sequelize.define(
  "Seance",
  {
    id_seance: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_formation: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // Sortie (activites-service, autre schéma) sur laquelle se déroule une
    // séance "Pratique" — référence applicative, non validée en base.
    // Renseignée seulement pour les séances pratiques.
    id_sortie: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    date_seance: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    type_seance: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    contenu: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    statut: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "Planifiée",
    },
    commentaire: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Note /20 attribuée au pointage de présence (SeanceService.updateStatut)
    // — jamais pour une séance "Absence" (voir la garde côté service).
    // Facultative : sert à calculer une moyenne indicative une fois toutes
    // les séances réalisées (voir FormationService/utils/helpers.js
    // computeNoteMoyenneSeances), simple suggestion pour l'appréciation
    // finale — le moniteur reste seul décisionnaire de celle-ci.
    note: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
    },
  },
  {
    tableName: "seances",
    schema: process.env.DB_SCHEMA || "formation",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Seance;
