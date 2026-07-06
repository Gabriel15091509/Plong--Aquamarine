const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Alerte = sequelize.define(
  "Alerte",
  {
    id_alerte: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    num_adherent: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        "Certificat expiré",
        "Certificat expire bientot",
        "Adhésion expirée",
        "Adhesion expire bientot",
        "Paiement en retard",
        "Formation",
      ),
      allowNull: false,
    },
    date_envoi: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    canal: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    statut: {
      type: DataTypes.ENUM("Envoyé", "Lu", "Erreur"),
      allowNull: false,
      defaultValue: "Envoyé",
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "alertes",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Alerte;
