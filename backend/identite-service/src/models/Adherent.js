const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Adherent = sequelize.define(
  "Adherent",
  {
    num_adherent: {
      type: DataTypes.STRING(20),
      primaryKey: true,
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
    civilite: {
      type: DataTypes.ENUM("M.", "Mme", "Mlle"),
      allowNull: false,
    },
    nom: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    prenom: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    date_naissance: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        isDate: true,
      },
    },
    adresse: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    telephone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    contact_urgence: {
      type: DataTypes.STRING(100),
      allowNull: true,
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
      allowNull: true,
    },
    date_obtention_niveau: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: true,
      },
    },
    num_brevet: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    // Source de vérité pour l'auto-remplissage du formulaire d'ajout
    // d'adhésion (au lieu de la dernière ligne Adhesion.num_licence_ffesm,
    // peu fiable). Un Baptême n'est pas licencié FFESM : reste null (une
    // contrainte unique Postgres autorise plusieurs NULL sans conflit, donc
    // ça ne bloque pas les Baptêmes entre eux). Le n° de licence FFESM est un
    // identifiant personnel délivré une seule fois par la fédération : deux
    // adhérents ne peuvent pas légitimement en partager un.
    num_licence_ffesm: {
      type: DataTypes.STRING(30),
      allowNull: true,
      unique: true,
    },
    statut: {
      type: DataTypes.ENUM(
        "Actif",
        "Inactif",
        "Suspendu",
        "En formation",
        "Ancien",
      ),
      allowNull: false,
      defaultValue: "Actif",
    },
    date_inscription: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    nb_plongees_total: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    photo: {
      type: DataTypes.BLOB,
      allowNull: true,
    },
    // Fiche créée par le staff pour un invité non-membre (ex. un baptême
    // pour un ami d'un adhérent) : passe par le même parcours qu'un
    // adhérent normal (compte, adhésion Club, certificat médical requis
    // pour plonger), mais paie le tarif_non_adherent d'une sortie au lieu
    // du tarif_adherent (CDC 3.2.1, voir activites-service/src/utils/
    // tarifRules.js) et n'entre pas dans les statistiques d'adhérents
    // actifs ni dans la communication ciblée (CDC 3.6.1/3.6.2).
    est_invite: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    archived_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "president",
        key: "id_president",
      },
    },
    archived_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    schema: process.env.DB_SCHEMA || "identite",
    tableName: "adherents",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Adherent;
