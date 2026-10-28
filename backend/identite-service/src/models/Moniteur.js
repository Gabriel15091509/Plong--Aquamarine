const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Moniteur = sequelize.define(
  "Moniteur",
  {
    id_moniteur: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    niveau: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    num_brevet: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    date_obtention_brevet: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    specialites: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    disponibilites: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    // Distinct de `disponibilites` ci-dessus (créneaux habituels du moniteur,
    // ex. "Week-ends" — jamais utilisé pour bloquer une désignation) : ce
    // booléen est un interrupteur ponctuel ("je pars en vacances/arrêt
    // médical...") qui empêche de le désigner encadrant tant qu'il n'est pas
    // remis à true — voir SortieForm.jsx (sélection des encadrants) et
    // SortieDetails.jsx (alerte sur une sortie déjà planifiée avec lui).
    disponible: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    // Motif affiché au président/aux autres moniteurs (tooltip) quand
    // disponible=false — vidé automatiquement dès que disponible repasse à
    // true, voir MoniteurService.updateDisponibilite.
    cause_indisponibilite: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    schema: process.env.DB_SCHEMA || "identite",
    tableName: "moniteurs",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Moniteur;
