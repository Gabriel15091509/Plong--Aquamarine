const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Inscription = sequelize.define(
  "Inscription",
  {
    id_inscription: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Plus de FK Postgres vers `adherents` (identite-service, autre schéma).
    num_adherent: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    id_sortie: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    statut: {
      type: DataTypes.STRING(50),
      defaultValue: "En attente",
      allowNull: false,
    },
    rang_liste_attente: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    presence: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    presence_checked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    presence_check_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Plus de FK Postgres vers `users` (identite-service, autre schéma).
    presence_check_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    absence_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    absence_justified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    date_confirmation: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Posé par SortieService.replanifier quand une inscription "Confirmée"
    // est remise "En attente" suite à une replanification météo (nouvelle
    // date, la place n'est plus garantie) — seul cas où l'adhérent peut
    // reconfirmer lui-même via InscriptionService.confirmInscription (voir
    // son garde-fou) : il récupère une place qu'il avait déjà, pas une
    // auto-confirmation initiale (toujours réservée à un gestionnaire, voir
    // createInscription). Remis à false dès qu'il reconfirme ou qu'un
    // gestionnaire tranche autrement (confirme/annule).
    reconfirmation_requise: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    date_inscription: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    montant_du: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    montant_paye: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    paye: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    schema: process.env.DB_SCHEMA || "activites",
    tableName: "inscriptions",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Inscription;
