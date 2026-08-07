const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

// Historique des niveaux/brevets obtenus par un adhérent — une ligne par
// passage de niveau, jamais écrasée (contrairement à Adherent.niveau/
// date_obtention_niveau/num_brevet, qui restent le niveau COURANT en cache
// pour tout le reste du code, ex. isNiveauCompatible). Alimentée
// automatiquement par AdherentService.updateNiveau à chaque changement de
// niveau — pas de création manuelle exposée pour l'instant.
const Brevet = sequelize.define(
  "Brevet",
  {
    id_brevet: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    num_adherent: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: "adherents",
        key: "num_adherent",
      },
    },
    niveau: {
      type: DataTypes.ENUM(
        "Baptême",
        "Niveau 1",
        "Niveau 2",
        "Niveau 3",
        "Niveau 4",
        "Moniteur",
      ),
      allowNull: false,
    },
    num_brevet: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    date_obtention: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    schema: process.env.DB_SCHEMA || "identite",
    tableName: "brevets",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Brevet;
