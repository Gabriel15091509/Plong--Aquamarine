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
    // Plus de FK Postgres vers `adherents` (identite-service, autre schéma) :
    // reste une colonne applicative, non validée en base.
    num_adherent: {
      type: DataTypes.STRING(20),
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
    schema: process.env.DB_SCHEMA || "vie_associative",
    tableName: "alertes",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Alerte;
