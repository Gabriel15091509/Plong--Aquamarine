const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Materiel = sequelize.define(
  "Materiel",
  {
    num_inventaire: {
      type: DataTypes.STRING(20),
      primaryKey: true,
    },
    categorie: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    marque: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    modele: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    taille: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    epaisseur: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    date_achat: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    etat: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "Bon",
    },
    // Trois états attendus (voir LOCALISATION_MATERIEL_OPTIONS côté
    // frontend) : "Local" (au club), "Prêté" (Attribution en cours,
    // activites-service), "En réparation" (Reparation en cours, ce
    // service) — mis à jour automatiquement par AttributionService et
    // ReparationService, pas seulement à la main via ce formulaire.
    localisation: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "Local",
    },
    // Blocs d'air : volume (ex. "12L", "15L").
    capacite: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    date_verif_visuelle: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    date_revision_technique: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    date_prochaine_echeance: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Stabilisateurs : état des sangles, distinct de l'état général `etat`.
    etat_sangles: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    // Ordinateurs de plongée : état de la batterie.
    batterie: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    // Chemin relatif servi par materiel-service (voir middlewares/upload.js),
    // même convention que identite-service (User.photo) — remplace l'ancien
    // stockage BLOB en base, jamais exploité par le frontend.
    photo_path: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    // Plus de FK Postgres vers `president` (identite-service, autre schéma) :
    // reste une colonne applicative, non validée en base.
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    schema: process.env.DB_SCHEMA || "materiel",
    tableName: "materiels",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Materiel;
