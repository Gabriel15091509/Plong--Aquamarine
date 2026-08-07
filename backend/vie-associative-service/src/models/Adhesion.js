const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Adhesion = sequelize.define(
  "Adhesion",
  {
    id_adhesion: {
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
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    date_debut: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    date_fin: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    montant: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    num_licence_ffesm: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    statut_paiement: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "En attente",
    },
    annee_adhesion: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    document_path: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    montant_paye: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    // Circuit de validation (licence FFESM / assurances soumises par
    // l'adhérent lui-même — jamais l'adhésion "Club", toujours créée par le
    // staff) : "En attente" tant que le président/trésorier ne l'a pas
    // revue, "Validé" une fois utilisable par le système (checkDossierValidity
    // n'en tient compte qu'à ce statut), "Rejeté" avec motif si le document
    // ne convient pas. Une entrée créée directement par le staff est
    // "Validé" dès sa création (AdhesionService.create) — pas de double
    // validation pour ce qui est déjà saisi par une personne habilitée.
    statut_validation: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "Validé",
    },
    // Distingue une entrée réellement passée par le circuit de soumission
    // adhérent (donc verrouillée une fois "Validé", voir
    // AdhesionService.update/delete) d'une entrée créée directement par le
    // staff (toujours "Validé" dès sa création, mais reste modifiable comme
    // avant — un trésorier doit pouvoir corriger un paiement Club sans
    // passer par une "nouvelle soumission"). Sans ce champ, TOUTE adhésion
    // (y compris les adhésions Club existantes) deviendrait immuable dès sa
    // création, ce qui casserait la gestion courante du staff — pas
    // l'intention de la demande.
    soumis_par_adherent: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    // Une fois "Validé" ET soumis par l'adhérent, la ligne devient immuable
    // (voir AdhesionService.update/delete) : on ne peut plus revenir sur une
    // pièce déjà approuvée, pas même le président — une correction passe
    // par une nouvelle soumission, jamais une modification a posteriori.
    valide_par: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    valide_le: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    motif_rejet: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    schema: process.env.DB_SCHEMA || "vie_associative",
    tableName: "adhesions",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Adhesion;
