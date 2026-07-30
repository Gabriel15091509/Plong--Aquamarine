const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Formation = sequelize.define(
  "Formation",
  {
    id_formation: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    num_adherent: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    id_moniteur: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // Plus de contrainte FK Postgres vers `moniteurs` (table désormais
      // propriété d'identite-service, dans un autre schéma) : la colonne
      // reste une référence applicative, validée via identiteClient quand
      // nécessaire, pas via une contrainte DB inter-schémas.
    },
    niveau_vise: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    date_debut: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    date_fin_prevue: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    date_fin_reelle: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    date_examen_brevet: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    statut: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "En cours",
    },
    nb_seances_realisees: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    // Cible connue à la création (nullable pour les formations existantes,
    // créées avant l'ajout de ce champ) — sert au garde-fou du bouton
    // "Terminer" et au déclenchement automatique de fin de formation dès que
    // cette cible est atteinte ET que toutes les compétences sont acquises
    // (voir FormationService.tryAutoComplete).
    nb_seances_prevues: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    commentaire_moniteur: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    appreciation_moniteur: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    montant_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    montant_paye: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    statut_paiement: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "En attente",
    },
  },
  {
    tableName: "formations",
    schema: process.env.DB_SCHEMA || "formation",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Formation;
