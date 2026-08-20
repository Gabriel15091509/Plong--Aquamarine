const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Composer = sequelize.define(
  "Composer",
  {
    id_palanquee: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    // Plus de FK Postgres vers `adherents` (identite-service, autre schéma).
    num_adherent: {
      type: DataTypes.STRING(20),
      primaryKey: true,
    },
    // Snapshot du niveau de l'adhérent au moment où il rejoint CETTE
    // palanquée — jamais recalculé ensuite, contrairement à
    // Adherent.niveau (identite-service) qui avance à chaque passage de
    // niveau. Sans ce champ, le ratio encadrant/plongeur (computeMaxRatio,
    // règle RG5 : 1/4 pour un niveau limitant, 1/6 sinon) était recalculé
    // à chaque lecture à partir du niveau ACTUEL de l'adhérent : une
    // palanquée déjà clôturée depuis des mois pouvait ainsi apparaître a
    // posteriori conforme à 1/6 alors qu'elle avait réellement été
    // composée et validée sous la règle 1/4 (un membre encore Niveau 1 ce
    // jour-là, passé Niveau 2 depuis) — faussant tout audit du respect du
    // ratio sur une plongée passée. Renseigné une seule fois à la création
    // de la ligne (PalanqueeService.addMembre / autoConstituerPourPresence),
    // jamais modifié ensuite.
    niveau_au_moment: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  },
  {
    schema: process.env.DB_SCHEMA || "activites",
    tableName: "composer",
    timestamps: true,
    underscored: true,
  },
);

module.exports = Composer;
