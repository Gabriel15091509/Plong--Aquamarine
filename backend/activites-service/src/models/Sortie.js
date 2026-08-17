const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Sortie = sequelize.define(
  "Sortie",
  {
    id_sortie: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    date_heure: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    lieu: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    site: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    type: {
      // 30 : assez large pour "Plongée d'exploration" (21 caractères), le
      // plus long des types d'activités actuels.
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    niveau_requis: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    nb_places: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    profondeur_max: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    duree_estimee: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    statut: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "Planifiée",
    },
    description_site: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    date_ouverture_inscriptions: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    condition_affectation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tarif_adherent: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    tarif_non_adherent: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    // Position exacte du site (choisie au clic sur une carte) : les noms de
    // site sont des surnoms locaux non géocodables de façon fiable.
    latitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: true,
    },
    encadrants: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    // Renseigné automatiquement par SortieService.
    // verifierMeteoEtAnnulerSiDangereux quand une sortie "Planifiée" est
    // annulée pour cause de météo dangereuse (voir migrate-sortie-motif-
    // annulation.sql) — reste vide pour une annulation manuelle.
    motif_annulation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Plus de FK Postgres vers `president` (identite-service, autre
    // schéma) : reste une colonne applicative, non validée en base.
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    schema: process.env.DB_SCHEMA || "activites",
    tableName: "sorties",
    timestamps: true,
    underscored: true,
    // Index créé manuellement via scripts/migrate-sortie-index.sql (pas de
    // sequelize.sync() dans ce service) — déclaré ici pour documenter le
    // schéma réel de la table.
    indexes: [{ name: "idx_sorties_date_heure", fields: ["date_heure"] }],
  },
);

module.exports = Sortie;
