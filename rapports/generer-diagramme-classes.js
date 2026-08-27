// Génère un fichier XMI 2.1 (métamodèle UML 2.x) du diagramme de classes
// de plongee-app, à partir des modèles Sequelize réels des 6 microservices.
// Compatible import Visual Paradigm (Tools > Import > XMI).
"use strict";
const fs = require("fs");

let idCounter = 1;
const nextId = (prefix) => `${prefix}_${idCounter++}`;

// ── Types primitifs UML (définis localement, pas de href externe — plus
//    fiable à l'import que de référencer la lib UML primitive types externe) ──
const primitiveTypes = ["String", "Integer", "Boolean", "Date", "Decimal"];
const typeIds = {};
primitiveTypes.forEach((t) => (typeIds[t] = nextId("type")));

// Mapping Sequelize DataTypes -> type UML primitif
function mapType(sqType) {
  const t = sqType.toUpperCase();
  if (t.startsWith("STRING") || t === "TEXT" || t === "JSON" || t === "BLOB") return "String";
  if (t === "INTEGER") return "Integer";
  if (t === "BOOLEAN") return "Boolean";
  if (t === "DATE" || t === "DATEONLY" || t === "TIME") return "Date";
  if (t === "DECIMAL" || t === "FLOAT") return "Decimal";
  return "String";
}

// ── Énumérations réelles (Sequelize DataTypes.ENUM(...) uniquement) ──────────
const enumerations = [
  { name: "RoleUtilisateur", values: ["president", "moniteur", "adherent", "tresorier"] },
  { name: "Civilite", values: ["M.", "Mme", "Mlle"] },
  { name: "NiveauPlongee", values: ["Baptême", "Niveau 1", "Niveau 2", "Niveau 3", "Niveau 4", "Moniteur"] },
  { name: "StatutAdherent", values: ["Actif", "Inactif", "Suspendu", "En formation", "Ancien"] },
  { name: "TypeCertificat", values: ["Sportif", "Plongée", "Généraliste", "Médecin hyperbare"] },
  {
    name: "TypeAlerte",
    values: [
      "Certificat expiré", "Certificat expire bientot", "Adhésion expirée",
      "Adhesion expire bientot", "Paiement en retard", "Formation",
      "Materiel en retard", "Inactivite plongee",
    ],
  },
  { name: "StatutAlerte", values: ["Envoyé", "Lu", "Erreur"] },
];
const enumIds = {};
enumerations.forEach((e) => (enumIds[e.name] = nextId("enum")));

// ── Classes par service (package) ────────────────────────────────────────────
// attrs: [nom, typeSequelizeOuEnum, obligatoire]  — pk listé en premier par convention
const packages = {
  "Identité (identite-service)": [
    {
      name: "User",
      attrs: [
        ["id", "INTEGER", true],
        ["email", "STRING", true],
        ["password", "STRING", true],
        ["name", "STRING", true],
        ["role", "ENUM:RoleUtilisateur", true],
        ["active", "BOOLEAN", true],
        ["phone", "STRING", false],
        ["last_login", "DATE", false],
        ["must_change_password", "BOOLEAN", true],
        ["photo", "STRING", false],
        ["preferences", "JSON", false],
        ["otp_code_hash", "STRING", false],
        ["otp_expires_at", "DATE", false],
        ["otp_attempts", "INTEGER", true],
      ],
    },
    {
      name: "Adherent",
      attrs: [
        ["num_adherent", "STRING", true],
        ["civilite", "ENUM:Civilite", true],
        ["nom", "STRING", true],
        ["prenom", "STRING", true],
        ["date_naissance", "DATE", true],
        ["adresse", "STRING", true],
        ["telephone", "STRING", true],
        ["email", "STRING", true],
        ["contact_urgence", "STRING", false],
        ["niveau", "ENUM:NiveauPlongee", false],
        ["date_obtention_niveau", "DATE", false],
        ["num_brevet", "STRING", false],
        ["num_licence_ffesm", "STRING", false],
        ["statut", "ENUM:StatutAdherent", true],
        ["date_inscription", "DATE", true],
        ["nb_plongees_total", "INTEGER", true],
        ["photo", "BLOB", false],
        ["est_invite", "BOOLEAN", true],
        ["archived_at", "DATE", false],
      ],
    },
    {
      name: "Moniteur",
      attrs: [
        ["id_moniteur", "INTEGER", true],
        ["niveau", "STRING", true],
        ["num_brevet", "STRING", true],
        ["date_obtention_brevet", "DATE", true],
        ["specialites", "JSON", false],
        ["disponibilites", "JSON", false],
      ],
    },
    {
      name: "President",
      attrs: [
        ["id_president", "INTEGER", true],
        ["annee_en_poste", "INTEGER", true],
        ["acces", "JSON", false],
      ],
    },
    {
      name: "Tresorier",
      attrs: [
        ["id_tresorier", "INTEGER", true],
        ["annee_en_poste", "INTEGER", false],
      ],
    },
    {
      name: "Brevet",
      attrs: [
        ["id_brevet", "INTEGER", true],
        ["niveau", "ENUM:NiveauPlongee", true],
        ["num_brevet", "STRING", false],
        ["date_obtention", "DATE", true],
      ],
    },
  ],

  "Activités (activites-service)": [
    {
      name: "Sortie",
      attrs: [
        ["id_sortie", "INTEGER", true],
        ["date_heure", "DATE", true],
        ["lieu", "STRING", true],
        ["site", "STRING", true],
        ["type", "STRING", true],
        ["niveau_requis", "STRING", true],
        ["nb_places", "INTEGER", true],
        ["profondeur_max", "INTEGER", true],
        ["duree_estimee", "TIME", true],
        ["statut", "STRING", true],
        ["description_site", "TEXT", false],
        ["date_ouverture_inscriptions", "DATE", true],
        ["condition_affectation", "TEXT", false],
        ["tarif_adherent", "DECIMAL", true],
        ["tarif_non_adherent", "DECIMAL", false],
        ["latitude", "DECIMAL", false],
        ["longitude", "DECIMAL", false],
        ["encadrants", "JSON", false],
        ["motif_annulation", "TEXT", false],
      ],
    },
    {
      name: "Inscription",
      attrs: [
        ["id_inscription", "INTEGER", true],
        ["statut", "STRING", true],
        ["rang_liste_attente", "INTEGER", false],
        ["presence", "BOOLEAN", true],
        ["presence_checked", "BOOLEAN", true],
        ["absence_reason", "TEXT", false],
        ["absence_justified", "BOOLEAN", true],
        ["date_confirmation", "DATE", false],
        ["date_inscription", "DATE", false],
        ["montant_du", "DECIMAL", false],
        ["montant_paye", "DECIMAL", true],
        ["paye", "BOOLEAN", true],
      ],
    },
    {
      name: "Plongee",
      attrs: [
        ["id_plongee", "INTEGER", true],
        ["date", "DATE", true],
        ["profondeur_max", "INTEGER", false],
        ["duree", "INTEGER", false],
        ["temperature_eau", "FLOAT", false],
        ["visibilite", "STRING", false],
        ["courant", "STRING", false],
        ["type_plongee", "STRING", true],
        ["observations_faune", "TEXT", false],
        ["observations_moniteur", "TEXT", false],
        ["lien_photos", "STRING", false],
      ],
    },
    {
      name: "Palanquee",
      attrs: [
        ["id_palanquee", "INTEGER", true],
        ["nom_palanquee", "STRING", true],
        ["profondeur_max_realisee", "INTEGER", false],
        ["duree_reelle", "INTEGER", false],
        ["statut", "STRING", true],
        ["date_cloture", "DATE", false],
      ],
    },
    {
      name: "Composer",
      attrs: [
        ["niveau_au_moment", "STRING", false],
      ],
    },
    {
      name: "Attribution",
      attrs: [
        ["id_attribution", "INTEGER", true],
        ["date_attribution", "DATE", true],
        ["etat_depart", "STRING", true],
        ["etat_retour", "STRING", false],
        ["date_retour_prevue", "DATE", true],
        ["date_retour_reel", "DATE", false],
        ["constat_deterioration", "TEXT", false],
        ["montant_caution", "DECIMAL", false],
        ["statut_caution", "STRING", true],
        ["piece_identite_retenue", "STRING", false],
      ],
    },
    {
      name: "Incident",
      attrs: [
        ["id_incident", "INTEGER", true],
        ["date_heure", "DATE", true],
        ["type", "STRING", true],
        ["description", "TEXT", true],
        ["mesures_prises", "TEXT", false],
        ["cloture", "BOOLEAN", true],
        ["date_cloture", "DATE", false],
      ],
    },
  ],

  "Formation (formation-service)": [
    {
      name: "Formation",
      attrs: [
        ["id_formation", "INTEGER", true],
        ["niveau_vise", "STRING", true],
        ["date_debut", "DATE", true],
        ["date_fin_prevue", "DATE", true],
        ["date_fin_reelle", "DATE", false],
        ["date_examen_brevet", "DATEONLY", false],
        ["statut", "STRING", true],
        ["nb_seances_realisees", "INTEGER", true],
        ["nb_seances_prevues", "INTEGER", false],
        ["commentaire_moniteur", "TEXT", false],
        ["appreciation_moniteur", "STRING", false],
        ["montant_total", "DECIMAL", false],
        ["montant_paye", "DECIMAL", true],
        ["statut_paiement", "STRING", true],
      ],
    },
    {
      name: "Seance",
      attrs: [
        ["id_seance", "INTEGER", true],
        ["date_seance", "DATEONLY", true],
        ["type_seance", "STRING", true],
        ["contenu", "STRING", false],
        ["statut", "STRING", true],
        ["commentaire", "TEXT", false],
      ],
    },
    {
      name: "Competence",
      attrs: [
        ["id_competence", "INTEGER", true],
        ["libelle", "STRING", true],
        ["niveau_requis", "STRING", true],
        ["acquise", "BOOLEAN", true],
        ["date_validation", "DATE", false],
        ["validee_par", "STRING", false],
      ],
    },
    {
      name: "FormationSpecialite",
      attrs: [
        ["id_specialite_formation", "INTEGER", true],
        ["type_specialite", "STRING", true],
        ["date_debut", "DATE", true],
        ["date_obtention_prevue", "DATEONLY", false],
        ["statut", "STRING", true],
        ["commentaire", "TEXT", false],
      ],
    },
  ],

  "Finance (finance-service)": [
    {
      name: "Paiement",
      attrs: [
        ["id_paiement", "INTEGER", true],
        ["date_paiement", "DATE", true],
        ["montant", "DECIMAL", true],
        ["mode", "STRING", true],
        ["type_paiement", "STRING", true],
        ["statut", "STRING", true],
        ["reference_id", "STRING", false],
        ["description", "TEXT", false],
      ],
    },
    {
      name: "Echeancier",
      attrs: [
        ["id_echeancier", "INTEGER", true],
        ["type_paiement", "STRING", true],
        ["reference_id", "STRING", true],
        ["montant_total", "DECIMAL", true],
        ["nb_echeances", "INTEGER", true],
        ["date_debut", "DATEONLY", true],
        ["statut", "STRING", true],
      ],
    },
    {
      name: "Echeance",
      attrs: [
        ["id_echeance", "INTEGER", true],
        ["numero", "INTEGER", true],
        ["date_echeance", "DATEONLY", true],
        ["montant", "DECIMAL", true],
        ["statut", "STRING", true],
      ],
    },
  ],

  "Matériel (materiel-service)": [
    {
      name: "Materiel",
      attrs: [
        ["num_inventaire", "STRING", true],
        ["categorie", "STRING", true],
        ["marque", "STRING", true],
        ["modele", "STRING", true],
        ["taille", "STRING", false],
        ["epaisseur", "STRING", false],
        ["date_achat", "DATE", true],
        ["etat", "STRING", true],
        ["localisation", "STRING", true],
        ["capacite", "STRING", false],
        ["date_verif_visuelle", "DATE", false],
        ["date_revision_technique", "DATE", false],
        ["date_prochaine_echeance", "DATE", false],
        ["etat_sangles", "STRING", false],
        ["batterie", "STRING", false],
        ["photo_path", "STRING", false],
      ],
    },
    {
      name: "Reparation",
      attrs: [
        ["id_reparation", "INTEGER", true],
        ["date_constat", "DATE", true],
        ["description_panne", "TEXT", true],
        ["prestataire", "STRING", true],
        ["cout", "DECIMAL", true],
        ["date_retour", "DATE", false],
        ["statut", "STRING", true],
        ["montant_couvert_caution", "DECIMAL", false],
        ["montant_complement_du", "DECIMAL", false],
      ],
    },
  ],

  "Vie associative (vie-associative-service)": [
    {
      name: "Adhesion",
      attrs: [
        ["id_adhesion", "INTEGER", true],
        ["type", "STRING", true],
        ["date_debut", "DATE", true],
        ["date_fin", "DATE", true],
        ["montant", "DECIMAL", true],
        ["num_licence_ffesm", "STRING", false],
        ["statut_paiement", "STRING", true],
        ["annee_adhesion", "INTEGER", true],
        ["document_path", "STRING", false],
        ["montant_paye", "DECIMAL", true],
        ["statut_validation", "STRING", true],
        ["soumis_par_adherent", "BOOLEAN", true],
        ["valide_le", "DATE", false],
        ["motif_rejet", "STRING", false],
      ],
    },
    {
      name: "CertificatMedical",
      attrs: [
        ["id_certificat", "INTEGER", true],
        ["type_certificat", "ENUM:TypeCertificat", true],
        ["date_validite", "DATE", true],
        ["date_delivrance", "DATE", true],
        ["medecin", "STRING", true],
        ["document_path", "STRING", false],
        ["statut", "STRING", true],
        ["statut_validation", "STRING", true],
        ["soumis_par_adherent", "BOOLEAN", true],
        ["valide_le", "DATE", false],
        ["motif_rejet", "STRING", false],
      ],
    },
    {
      name: "Alerte",
      attrs: [
        ["id_alerte", "INTEGER", true],
        ["type", "ENUM:TypeAlerte", true],
        ["date_envoi", "DATE", true],
        ["canal", "STRING", true],
        ["statut", "ENUM:StatutAlerte", true],
        ["read", "BOOLEAN", true],
        ["detail", "STRING", false],
        ["reference_type", "STRING", false],
        ["reference_id", "INTEGER", false],
      ],
    },
  ],
};

// ── Méthodes par classe ───────────────────────────────────────────────────────
// Dérivées des vraies méthodes des contrôleurs/services de chaque entité
// (backend/*/src/controllers/*.js) : le CRUD de base commun à
// BaseController.js (create/getAll/getById/update/delete — absent quand
// l'entité n'a pas son propre contrôleur, ex. Brevet/Echeance, gérées comme
// sous-ressources d'Adherent/Echeancier) + la logique métier propre à
// chaque contrôleur spécialisé (Sortie.enregistrerPointage,
// Attribution.retourner, CertificatMedical.valider...). Les multiples
// variantes de requête (getByXxx redondants) ne sont pas toutes reprises :
// seules les opérations qui changent un état ou représentent une règle
// métier réelle, pour rester lisible sur le diagramme.
// Chaque entrée : [nom, [[nomParam, type], ...], typeRetour]
// type/typeRetour ∈ primitiveTypes | "void" | "self" (instance de la classe
// elle-même, résolu à la génération).
const methodsByClass = {
  User: [
    ["create", [["data", "String"]], "self"],
    ["getAll", [], "self"],
    ["getById", [["id", "Integer"]], "self"],
    ["update", [["id", "Integer"], ["data", "String"]], "self"],
    ["delete", [["id", "Integer"]], "void"],
    ["login", [["email", "String"], ["password", "String"]], "String"],
    ["verifyOtp", [["email", "String"], ["code", "String"]], "Boolean"],
    ["changePassword", [["oldPassword", "String"], ["newPassword", "String"]], "Boolean"],
    ["changeRole", [["role", "String"]], "void"],
    ["disableAccount", [["id", "Integer"]], "void"],
    ["enableAccount", [["id", "Integer"]], "void"],
  ],
  Adherent: [
    ["create", [["data", "String"]], "self"],
    ["getAll", [], "self"],
    ["getById", [["numAdherent", "String"]], "self"],
    ["update", [["numAdherent", "String"], ["data", "String"]], "self"],
    ["delete", [["numAdherent", "String"]], "void"],
    ["incrementPlongees", [["numAdherent", "String"]], "void"],
    ["updateNiveau", [["numAdherent", "String"], ["niveau", "String"]], "void"],
    ["sendCommunication", [["subject", "String"], ["message", "String"]], "void"],
    ["getStats", [], "String"],
  ],
  Moniteur: [
    ["create", [["data", "String"]], "self"],
    ["getAll", [], "self"],
    ["getById", [["idMoniteur", "Integer"]], "self"],
    ["update", [["idMoniteur", "Integer"], ["data", "String"]], "self"],
    ["delete", [["idMoniteur", "Integer"]], "void"],
    ["getDisponibles", [], "self"],
  ],
  President: [
    ["create", [["data", "String"]], "self"],
    ["getAll", [], "self"],
    ["getById", [["idPresident", "Integer"]], "self"],
    ["update", [["idPresident", "Integer"], ["data", "String"]], "self"],
    ["delete", [["idPresident", "Integer"]], "void"],
    ["getCurrent", [], "self"],
  ],
  Tresorier: [
    ["create", [["data", "String"]], "self"],
    ["getAll", [], "self"],
    ["getById", [["idTresorier", "Integer"]], "self"],
    ["update", [["idTresorier", "Integer"], ["data", "String"]], "self"],
    ["delete", [["idTresorier", "Integer"]], "void"],
  ],
  Brevet: [
    ["getAll", [], "self"],
    ["getById", [["idBrevet", "Integer"]], "self"],
  ],

  Sortie: [
    ["create", [["data", "String"]], "self"],
    ["getAll", [], "self"],
    ["getById", [["idSortie", "Integer"]], "self"],
    ["update", [["idSortie", "Integer"], ["data", "String"]], "self"],
    ["delete", [["idSortie", "Integer"]], "void"],
    ["getUpcomingSorties", [], "self"],
    ["getTauxRemplissage", [["idSortie", "Integer"]], "Decimal"],
    ["enregistrerPointage", [["idSortie", "Integer"], ["data", "String"]], "void"],
    ["annulerPointage", [["idSortie", "Integer"]], "void"],
  ],
  Inscription: [
    ["create", [["data", "String"]], "self"],
    ["getAll", [], "self"],
    ["getById", [["idInscription", "Integer"]], "self"],
    ["update", [["idInscription", "Integer"], ["data", "String"]], "self"],
    ["delete", [["idInscription", "Integer"]], "void"],
    ["confirmInscription", [["idInscription", "Integer"]], "void"],
    ["cancelInscription", [["idInscription", "Integer"]], "void"],
    ["enregistrerPaiement", [["idInscription", "Integer"], ["montant", "Decimal"]], "void"],
    ["getWaitlist", [["idSortie", "Integer"]], "self"],
  ],
  Plongee: [
    ["create", [["data", "String"]], "self"],
    ["getAll", [], "self"],
    ["getById", [["idPlongee", "Integer"]], "self"],
    ["update", [["idPlongee", "Integer"], ["data", "String"]], "self"],
    ["delete", [["idPlongee", "Integer"]], "void"],
    ["validatePlongee", [["idPlongee", "Integer"]], "void"],
    ["getCarnetPdf", [["numAdherent", "String"]], "String"],
  ],
  Palanquee: [
    ["create", [["data", "String"]], "self"],
    ["getAll", [], "self"],
    ["getById", [["idPalanquee", "Integer"]], "self"],
    ["update", [["idPalanquee", "Integer"], ["data", "String"]], "self"],
    ["delete", [["idPalanquee", "Integer"]], "void"],
    ["addMembre", [["idPalanquee", "Integer"], ["numAdherent", "String"]], "void"],
    ["removeMembre", [["idPalanquee", "Integer"], ["numAdherent", "String"]], "void"],
    ["cloturer", [["idPalanquee", "Integer"]], "void"],
    ["enregistrerDonneesPlongee", [["idPalanquee", "Integer"], ["data", "String"]], "void"],
  ],
  Composer: [
    ["create", [["data", "String"]], "self"],
    ["getByAdherent", [["numAdherent", "String"]], "self"],
  ],
  Attribution: [
    ["create", [["data", "String"]], "self"],
    ["getAll", [], "self"],
    ["getById", [["idAttribution", "Integer"]], "self"],
    ["retourner", [["idAttribution", "Integer"], ["etatRetour", "String"]], "void"],
    ["enregistrerCaution", [["idAttribution", "Integer"], ["montant", "Decimal"]], "void"],
    ["restituerCaution", [["idAttribution", "Integer"]], "void"],
    ["traiterDeterioration", [["idAttribution", "Integer"], ["constat", "String"]], "void"],
  ],
  Incident: [
    ["create", [["data", "String"]], "self"],
    ["getAll", [], "self"],
    ["getById", [["idIncident", "Integer"]], "self"],
    ["cloturer", [["idIncident", "Integer"], ["mesuresPrises", "String"]], "void"],
    ["getNonClotures", [], "self"],
  ],

  Formation: [
    ["create", [["data", "String"]], "self"],
    ["getAll", [], "self"],
    ["getById", [["idFormation", "Integer"]], "self"],
    ["update", [["idFormation", "Integer"], ["data", "String"]], "self"],
    ["delete", [["idFormation", "Integer"]], "void"],
    ["completeFormation", [["idFormation", "Integer"]], "void"],
    ["ajourner", [["idFormation", "Integer"], ["motif", "String"]], "void"],
    ["enregistrerPaiement", [["idFormation", "Integer"], ["montant", "Decimal"]], "void"],
  ],
  Seance: [
    ["getByFormation", [["idFormation", "Integer"]], "self"],
    ["updateStatut", [["idSeance", "Integer"], ["statut", "String"]], "void"],
    ["update", [["idSeance", "Integer"], ["data", "String"]], "self"],
    ["delete", [["idSeance", "Integer"]], "void"],
  ],
  Competence: [
    ["getByFormation", [["idFormation", "Integer"]], "self"],
    ["valider", [["idCompetence", "Integer"], ["valideePar", "String"]], "void"],
    ["update", [["idCompetence", "Integer"], ["data", "String"]], "self"],
    ["delete", [["idCompetence", "Integer"]], "void"],
  ],
  FormationSpecialite: [
    ["create", [["data", "String"]], "self"],
    ["getByAdherent", [["numAdherent", "String"]], "self"],
    ["getByMoniteur", [["idMoniteur", "Integer"]], "self"],
  ],

  Paiement: [
    ["create", [["data", "String"]], "self"],
    ["createLinked", [["referenceId", "String"], ["typePaiement", "String"]], "self"],
    ["getAll", [], "self"],
    ["getById", [["idPaiement", "Integer"]], "self"],
    ["processPayment", [["idPaiement", "Integer"]], "void"],
    ["cancelPayment", [["idPaiement", "Integer"]], "void"],
    ["marquerRembourse", [["idPaiement", "Integer"]], "void"],
    ["getRecu", [["idPaiement", "Integer"]], "String"],
  ],
  Echeancier: [
    ["create", [["data", "String"]], "self"],
    ["getByReference", [["referenceId", "String"]], "self"],
    ["getByAdherent", [["numAdherent", "String"]], "self"],
    ["payerEcheance", [["idEcheance", "Integer"], ["montant", "Decimal"]], "void"],
  ],
  Echeance: [
    ["getAll", [], "self"],
    ["getById", [["idEcheance", "Integer"]], "self"],
  ],

  Materiel: [
    ["getAll", [], "self"],
    ["getById", [["numInventaire", "String"]], "self"],
    ["update", [["numInventaire", "String"], ["data", "String"]], "self"],
    ["delete", [["numInventaire", "String"]], "void"],
    ["getAvailableMateriel", [], "self"],
    ["getNeedingMaintenance", [], "self"],
    ["updateEtat", [["numInventaire", "String"], ["etat", "String"]], "void"],
    ["updateLocalisation", [["numInventaire", "String"], ["localisation", "String"]], "void"],
    ["checkAvailability", [["numInventaire", "String"], ["dateDebut", "Date"], ["dateFin", "Date"]], "Boolean"],
  ],
  Reparation: [
    ["create", [["data", "String"]], "self"],
    ["getByMateriel", [["numInventaire", "String"]], "self"],
    ["getEnCours", [], "self"],
    ["terminer", [["idReparation", "Integer"], ["dateRetour", "Date"]], "void"],
  ],

  Adhesion: [
    ["create", [["data", "String"]], "self"],
    ["getAll", [], "self"],
    ["getById", [["idAdhesion", "Integer"]], "self"],
    ["getActiveAdhesions", [], "self"],
    ["getExpiringAdhesions", [], "self"],
    ["enregistrerPaiement", [["idAdhesion", "Integer"], ["montant", "Decimal"]], "void"],
    ["valider", [["idAdhesion", "Integer"]], "void"],
    ["getAttestation", [["idAdhesion", "Integer"]], "String"],
  ],
  CertificatMedical: [
    ["create", [["data", "String"]], "self"],
    ["getAll", [], "self"],
    ["getById", [["idCertificat", "Integer"]], "self"],
    ["getValidCertificates", [], "self"],
    ["getExpiringSoon", [], "self"],
    ["checkStatus", [["idCertificat", "Integer"]], "String"],
    ["valider", [["idCertificat", "Integer"]], "void"],
    ["downloadDocument", [["idCertificat", "Integer"]], "String"],
  ],
  Alerte: [
    ["create", [["data", "String"]], "self"],
    ["getAll", [], "self"],
    ["getById", [["idAlerte", "Integer"]], "self"],
    ["getUnread", [["numAdherent", "String"]], "self"],
    ["markAsRead", [["idAlerte", "Integer"]], "void"],
    ["markAllAsRead", [["numAdherent", "String"]], "void"],
    ["relancer", [["idAlerte", "Integer"]], "void"],
    ["delete", [["idAlerte", "Integer"]], "void"],
  ],
};

// ── Associations réelles (FK + Sequelize association intra-service) ─────────
const associations = [
  { from: "User", to: "Adherent", fromRole: "utilisateur", toRole: "adherent", fromMult: "1", toMult: "0..1", name: "possède" },
  { from: "User", to: "Moniteur", fromRole: "utilisateur", toRole: "moniteur", fromMult: "1", toMult: "0..1", name: "possède" },
  { from: "Moniteur", to: "President", fromRole: "moniteur", toRole: "president", fromMult: "1", toMult: "0..1", name: "est élu" },
  { from: "User", to: "Tresorier", fromRole: "utilisateur", toRole: "tresorier", fromMult: "1", toMult: "0..1", name: "possède" },
  { from: "President", to: "User", fromRole: "créateur", toRole: "usersCrees", fromMult: "0..1", toMult: "0..*", name: "crée" },
  { from: "President", to: "Adherent", fromRole: "archivePar", toRole: "adherentsArchives", fromMult: "0..1", toMult: "0..*", name: "archive" },
  { from: "Adherent", to: "Brevet", fromRole: "adherent", toRole: "brevets", fromMult: "1", toMult: "0..*", name: "obtient" },

  { from: "Sortie", to: "Inscription", fromRole: "sortie", toRole: "inscriptions", fromMult: "1", toMult: "0..*", name: "reçoit" },
  { from: "Sortie", to: "Plongee", fromRole: "sortie", toRole: "plongees", fromMult: "1", toMult: "0..*", name: "génère" },
  { from: "Palanquee", to: "Plongee", fromRole: "palanquee", toRole: "carnets", fromMult: "0..1", toMult: "0..*", name: "produit" },
  { from: "Sortie", to: "Palanquee", fromRole: "sortie", toRole: "palanquees", fromMult: "1", toMult: "0..*", name: "organise" },
  { from: "Palanquee", to: "Composer", fromRole: "palanquee", toRole: "composers", fromMult: "1", toMult: "0..*", name: "compose" },
  { from: "Sortie", to: "Attribution", fromRole: "sortie", toRole: "attributions", fromMult: "1", toMult: "0..*", name: "concerne" },
  { from: "Palanquee", to: "Attribution", fromRole: "palanquee", toRole: "attributions", fromMult: "0..1", toMult: "0..*", name: "reçoit" },
  { from: "Sortie", to: "Incident", fromRole: "sortie", toRole: "incidents", fromMult: "1", toMult: "0..*", name: "déclare" },

  { from: "Formation", to: "Competence", fromRole: "formation", toRole: "competences", fromMult: "1", toMult: "0..*", name: "vise" },
  { from: "Formation", to: "Seance", fromRole: "formation", toRole: "seances", fromMult: "1", toMult: "0..*", name: "planifie" },

  { from: "Echeancier", to: "Echeance", fromRole: "echeancier", toRole: "echeances", fromMult: "1", toMult: "0..*", name: "détaille" },

  { from: "Materiel", to: "Reparation", fromRole: "materiel", toRole: "reparations", fromMult: "1", toMult: "0..*", name: "subit" },
];

// ── Références inter-services (pas de FK Postgres réelle : colonne
//    applicative recomposée via un appel HTTP serviceClients) — dessinées en
//    dépendances (flèche pointillée), pas en associations, pour rester fidèle
//    à la séparation des microservices. ──────────────────────────────────────
const crossServiceRefs = [
  { from: "Inscription", to: "Adherent", via: "num_adherent" },
  { from: "Plongee", to: "Adherent", via: "num_adherent" },
  { from: "Composer", to: "Adherent", via: "num_adherent" },
  { from: "Attribution", to: "Adherent", via: "num_adherent" },
  { from: "Palanquee", to: "Moniteur", via: "id_moniteur_encadrant" },
  { from: "Plongee", to: "Moniteur", via: "id_moniteur_validateur" },
  { from: "Sortie", to: "President", via: "created_by" },
  { from: "Incident", to: "President", via: "declared_by" },
  { from: "Attribution", to: "Materiel", via: "num_inventaire" },
  { from: "Formation", to: "Adherent", via: "num_adherent" },
  { from: "Formation", to: "Moniteur", via: "id_moniteur" },
  { from: "FormationSpecialite", to: "Adherent", via: "num_adherent" },
  { from: "FormationSpecialite", to: "Moniteur", via: "id_moniteur" },
  { from: "Seance", to: "Sortie", via: "id_sortie" },
  { from: "Paiement", to: "Adherent", via: "num_adherent" },
  { from: "Paiement", to: "Tresorier", via: "id_tresorier" },
  { from: "Echeancier", to: "Adherent", via: "num_adherent" },
  { from: "Echeancier", to: "Tresorier", via: "id_tresorier" },
  { from: "Reparation", to: "Attribution", via: "id_attribution" },
  { from: "Materiel", to: "President", via: "created_by" },
  { from: "Adhesion", to: "Adherent", via: "num_adherent" },
  { from: "CertificatMedical", to: "Adherent", via: "num_adherent" },
  { from: "Alerte", to: "Adherent", via: "num_adherent" },
];

// ── Génération XMI ───────────────────────────────────────────────────────────
const classIds = {}; // nom de classe -> xmi:id
const classPackage = {}; // nom de classe -> nom de package (pour retrouver l'élément lors des associations)
let body = "";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Types primitifs (à la racine du modèle)
let typesXml = "";
primitiveTypes.forEach((t) => {
  typesXml += `    <packagedElement xmi:type="uml:PrimitiveType" xmi:id="${typeIds[t]}" name="${t}"/>\n`;
});

// Énumérations (à la racine du modèle)
let enumsXml = "";
enumerations.forEach((e) => {
  enumsXml += `    <packagedElement xmi:type="uml:Enumeration" xmi:id="${enumIds[e.name]}" name="${esc(e.name)}">\n`;
  e.values.forEach((v) => {
    enumsXml += `      <ownedLiteral xmi:type="uml:EnumerationLiteral" xmi:id="${nextId("lit")}" name="${esc(v)}"/>\n`;
  });
  enumsXml += `    </packagedElement>\n`;
});

// Packages + classes
let packagesXml = "";
for (const [pkgName, classes] of Object.entries(packages)) {
  const pkgId = nextId("pkg");
  packagesXml += `    <packagedElement xmi:type="uml:Package" xmi:id="${pkgId}" name="${esc(pkgName)}">\n`;
  classes.forEach((cls) => {
    const classId = nextId("class");
    classIds[cls.name] = classId;
    classPackage[cls.name] = pkgName;
    packagesXml += `      <packagedElement xmi:type="uml:Class" xmi:id="${classId}" name="${esc(cls.name)}">\n`;
    cls.attrs.forEach(([attrName, attrType, required]) => {
      const attrId = nextId("attr");
      const isEnum = attrType.startsWith("ENUM:");
      const typeRef = isEnum ? enumIds[attrType.slice(5)] : typeIds[mapType(attrType)];
      const lower = required ? 1 : 0;
      packagesXml += `        <ownedAttribute xmi:type="uml:Property" xmi:id="${attrId}" name="${esc(attrName)}" visibility="private" type="${typeRef}">\n`;
      packagesXml += `          <lowerValue xmi:type="uml:LiteralInteger" xmi:id="${nextId("lv")}" value="${lower}"/>\n`;
      packagesXml += `          <upperValue xmi:type="uml:LiteralInteger" xmi:id="${nextId("uv")}" value="1"/>\n`;
      packagesXml += `        </ownedAttribute>\n`;
    });
    // Résout un type de paramètre/retour ("String"|"Integer"|...|"self") en
    // xmi:id — "self" ne peut être résolu qu'ici, une fois classId connu
    // (une méthode peut retourner/recevoir une instance de sa propre classe,
    // ex. Sortie.update(...): Sortie).
    const resolveOpType = (t) => (t === "self" ? classId : typeIds[t]);
    (methodsByClass[cls.name] || []).forEach(([opName, params, returnType]) => {
      const opId = nextId("op");
      packagesXml += `        <ownedOperation xmi:type="uml:Operation" xmi:id="${opId}" name="${esc(opName)}" visibility="public">\n`;
      params.forEach(([paramName, paramType]) => {
        const paramId = nextId("param");
        packagesXml += `          <ownedParameter xmi:type="uml:Parameter" xmi:id="${paramId}" name="${esc(paramName)}" type="${resolveOpType(paramType)}" direction="in"/>\n`;
      });
      if (returnType !== "void") {
        const retId = nextId("param");
        packagesXml += `          <ownedParameter xmi:type="uml:Parameter" xmi:id="${retId}" name="return" type="${resolveOpType(returnType)}" direction="return"/>\n`;
      }
      packagesXml += `        </ownedOperation>\n`;
    });
    packagesXml += `      </packagedElement>\n`;
  });
  packagesXml += `    </packagedElement>\n`;
}

// Associations (multiplicité "0..*" / "0..1" / "1" -> bornes UML)
function multBounds(mult) {
  if (mult === "1") return { lower: 1, upper: 1 };
  if (mult === "0..1") return { lower: 0, upper: 1 };
  if (mult === "0..*") return { lower: 0, upper: "*" };
  throw new Error("multiplicité inconnue: " + mult);
}
function upperXml(id, upper) {
  if (upper === "*") {
    return `<upperValue xmi:type="uml:LiteralUnlimitedNatural" xmi:id="${id}" value="*"/>`;
  }
  return `<upperValue xmi:type="uml:LiteralInteger" xmi:id="${id}" value="${upper}"/>`;
}

let assocXml = "";
associations.forEach((a) => {
  const assocId = nextId("assoc");
  const end1Id = nextId("end");
  const end2Id = nextId("end");
  const from = multBounds(a.fromMult);
  const to = multBounds(a.toMult);
  assocXml += `    <packagedElement xmi:type="uml:Association" xmi:id="${assocId}" name="${esc(a.name)}" memberEnd="${end1Id} ${end2Id}">\n`;
  assocXml += `      <ownedEnd xmi:type="uml:Property" xmi:id="${end1Id}" name="${esc(a.fromRole)}" type="${classIds[a.from]}" association="${assocId}">\n`;
  assocXml += `        <lowerValue xmi:type="uml:LiteralInteger" xmi:id="${nextId("lv")}" value="${from.lower}"/>\n`;
  assocXml += `        ${upperXml(nextId("uv"), from.upper)}\n`;
  assocXml += `      </ownedEnd>\n`;
  assocXml += `      <ownedEnd xmi:type="uml:Property" xmi:id="${end2Id}" name="${esc(a.toRole)}" type="${classIds[a.to]}" association="${assocId}">\n`;
  assocXml += `        <lowerValue xmi:type="uml:LiteralInteger" xmi:id="${nextId("lv")}" value="${to.lower}"/>\n`;
  assocXml += `        ${upperXml(nextId("uv"), to.upper)}\n`;
  assocXml += `      </ownedEnd>\n`;
  assocXml += `    </packagedElement>\n`;
});

// Dépendances inter-services (référence applicative, pas de FK réelle)
let depXml = "";
crossServiceRefs.forEach((d) => {
  const depId = nextId("dep");
  depXml += `    <packagedElement xmi:type="uml:Usage" xmi:id="${depId}" name="réf. applicative : ${esc(d.via)}" client="${classIds[d.from]}" supplier="${classIds[d.to]}"/>\n`;
});

const xmi = `<?xml version="1.0" encoding="UTF-8"?>
<xmi:XMI xmi:version="2.1" xmlns:xmi="http://schema.omg.org/spec/XMI/2.1" xmlns:uml="http://www.eclipse.org/uml2/3.0.0/UML">
  <uml:Model xmi:id="${nextId("model")}" name="PlongeeAppDiagrammeClasses">
${typesXml}${enumsXml}${packagesXml}${assocXml}${depXml}  </uml:Model>
</xmi:XMI>
`;

fs.writeFileSync(process.argv[2] || "diagramme-classes.xmi", xmi, "utf8");
console.log("XMI généré :", Object.keys(classIds).length, "classes,", associations.length, "associations,", crossServiceRefs.length, "dépendances inter-services,", enumerations.length, "énumérations.");
