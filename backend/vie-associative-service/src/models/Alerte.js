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
        "Materiel en retard",
        "Inactivite plongee",
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
    // Précision affichable de CE qui expire/manque exactement (ex. "Licence
    // FFESM", "Assurance responsabilité civile", "Certificat médical —
    // Plongée") — `type` ci-dessus reste la catégorie générique utilisée pour
    // le filtrage par rôle (ROLE_ALERT_TYPES) et les libellés d'icône, trop
    // grossière pour distinguer laquelle des adhésions d'un même adhérent est
    // concernée.
    detail: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    // Avec reference_id ci-dessous : identifie la ligne source précise
    // (Adhesion ou CertificatMedical) qui a déclenché l'alerte automatique.
    // Sert de clé de déduplication dans AlerteService.upsertAutomaticAlerte
    // — sans ça, deux adhésions différentes du même adhérent qui expirent la
    // même semaine (ex. Licence FFESM ET Assurance RC) convergeaient vers
    // une seule ligne d'alerte, la seconde écrasant silencieusement la
    // trace de la première. Nul pour les alertes non liées à une ligne
    // source précise (ex. relance manuelle, "Paiement en retard").
    reference_type: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    reference_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
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
