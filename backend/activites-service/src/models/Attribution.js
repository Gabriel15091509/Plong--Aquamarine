const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Attribution = sequelize.define(
  "Attribution",
  {
    id_attribution: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Plus de FK Postgres vers `materiels` (materiel-service, autre schéma).
    num_inventaire: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    // Plus de FK Postgres vers `adherents` (identite-service, autre schéma).
    num_adherent: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    // Nullable : présent pour une attribution liée à une sortie (CDC 3.4.3),
    // absent pour un prêt libre entre deux sorties (CDC 3.4.4) — la présence
    // de cette référence est ce qui distingue les deux cas, pas un champ
    // "type" séparé.
    id_sortie: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    id_palanquee: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    date_attribution: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    etat_depart: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    etat_retour: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    date_retour_prevue: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    date_retour_reel: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    constat_deterioration: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    montant_caution: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    statut_caution: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "Aucune",
    },
    // Alternative à la caution en espèces (CDC 3.4.4) : description de la
    // pièce retenue (ex. "CNI n° 123456789"), nullable — les deux garanties
    // ne sont pas mutuellement exclusives en base, au choix du trésorier.
    piece_identite_retenue: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  },
  {
    schema: process.env.DB_SCHEMA || "activites",
    tableName: "attributions",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Attribution;
