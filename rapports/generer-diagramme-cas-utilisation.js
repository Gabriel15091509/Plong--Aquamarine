// Génère un fichier XMI 2.1 (métamodèle UML 2.x) du diagramme de cas
// d'utilisation de plongee-app, à jour du logiciel réel (rôles/permissions
// AuthController.getPermissionsForRole + routes réellement gardées côté
// backend). Compatible import Visual Paradigm (Tools > Import > XMI).
"use strict";
const fs = require("fs");

let idCounter = 1;
const nextId = (prefix) => `${prefix}_${idCounter++}`;
function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Acteurs ───────────────────────────────────────────────────────────────
// generalizes: nom de l'acteur parent (actor generalization), ou null.
// Président généralise Moniteur (et non l'inverse) car dans le modèle de
// données réel, President.belongsTo(Moniteur, {foreignKey:"id_moniteur"}) :
// un président est TOUJOURS d'abord un moniteur (gouvernance FFESM réelle).
const actorsDef = [
  { name: "Utilisateur", generalizes: null },
  { name: "Adhérent", generalizes: "Utilisateur" },
  { name: "Trésorier", generalizes: "Utilisateur" },
  { name: "Moniteur", generalizes: "Utilisateur" },
  { name: "Président", generalizes: "Moniteur" },
];

// ── Cas d'utilisation ─────────────────────────────────────────────────────
// owners: liste des acteurs directement associés (top-level, déclenché
// directement par l'acteur) — vide pour un sous-cas atteint seulement via
// <<include>>/<<extend>>.
const useCasesDef = [
  // Utilisateur (hérité par les 4 rôles)
  { key: "connexion", name: "Se connecter", owners: ["Utilisateur"] },
  { key: "planning", name: "Consulter le planning des sorties", owners: ["Utilisateur"] },
  { key: "profil", name: "Consulter et modifier son profil", owners: ["Utilisateur"] },
  { key: "alertes", name: "Consulter ses alertes", owners: ["Utilisateur"] },

  // Adhérent
  { key: "inscription", name: "S'inscrire à une sortie", owners: ["Adhérent"] },
  { key: "desinscription", name: "Annuler son inscription à une sortie", owners: [] },
  { key: "carnet", name: "Consulter son carnet de plongée", owners: ["Adhérent"] },
  { key: "export_carnet", name: "Exporter son carnet en PDF", owners: [] },
  { key: "soumettre_adhesion", name: "Soumettre une adhésion", owners: ["Adhérent"] },
  { key: "soumettre_certificat", name: "Soumettre un certificat médical", owners: ["Adhérent"] },
  { key: "analyse_ia", name: "Analyser automatiquement le document soumis (IA)", owners: [] },
  { key: "consulter_echeancier", name: "Consulter son échéancier de paiement", owners: ["Adhérent"] },

  // Moniteur (+ hérité par Président)
  { key: "gerer_sortie", name: "Créer / modifier / annuler une sortie", owners: ["Moniteur"] },
  { key: "pointer_presences", name: "Pointer les présences", owners: ["Moniteur"] },
  { key: "marquer_present", name: "Marquer un adhérent présent", owners: [] },
  { key: "marquer_absent", name: "Marquer un adhérent absent", owners: [] },
  { key: "constituer_palanquees", name: "Constituer les palanquées", owners: ["Moniteur"] },
  { key: "enregistrer_plongee", name: "Enregistrer une plongée (carnet)", owners: ["Moniteur"] },
  { key: "valider_plongee_formation", name: "Valider une plongée de formation", owners: [] },
  { key: "gerer_formation", name: "Gérer une formation (séances et compétences)", owners: ["Moniteur"] },
  { key: "declarer_incident", name: "Déclarer un incident", owners: ["Moniteur"] },
  { key: "conditions_incident", name: "Enregistrer les conditions et circonstances", owners: [] },
  { key: "retour_materiel", name: "Enregistrer le retour du matériel", owners: ["Moniteur"] },
  { key: "consulter_fiche_adherent", name: "Consulter la fiche d'un adhérent", owners: ["Moniteur"] },

  // Président (spécifique, en plus de tout ce qu'il hérite de Moniteur)
  { key: "gerer_comptes", name: "Gérer les comptes utilisateurs", owners: ["Président"] },
  { key: "gerer_fiche_adherent", name: "Créer / modifier une fiche adhérent", owners: ["Président"] },
  { key: "archiver_adherent", name: "Archiver un adhérent", owners: [] },
  { key: "gerer_inventaire", name: "Gérer l'inventaire matériel", owners: ["Président"] },
  { key: "attribuer_materiel", name: "Attribuer du matériel (avec check-list d'état)", owners: [] },
  { key: "verifier_echeance_materiel", name: "Vérifier l'échéance du matériel", owners: [] },
  { key: "enregistrer_reparation", name: "Enregistrer une réparation matériel", owners: [] },
  { key: "valider_adhesion", name: "Valider une adhésion soumise par un adhérent", owners: ["Président"] },
  { key: "valider_certificat", name: "Valider un certificat médical soumis par un adhérent", owners: ["Président"] },

  // Finance — Trésorier + Président (président = permissions "all", mais ne
  // généralise pas Trésorier dans le modèle de données : association directe)
  { key: "statistiques", name: "Consulter les statistiques et exporter des rapports", owners: ["Président", "Trésorier"] },
  { key: "enregistrer_paiement", name: "Enregistrer un paiement", owners: ["Président", "Trésorier"] },
  { key: "gerer_echeancier", name: "Gérer un échéancier de paiement", owners: ["Président", "Trésorier"] },
  { key: "marquer_echeance_payee", name: "Marquer une échéance payée", owners: [] },
  { key: "export_paiements", name: "Exporter les paiements mensuels", owners: ["Président", "Trésorier"] },
];

// ── <<include>> (source --include--> cible) ──────────────────────────────
const includes = [
  ["soumettre_adhesion", "analyse_ia"],
  ["soumettre_certificat", "analyse_ia"],
  ["pointer_presences", "marquer_present"],
  ["pointer_presences", "marquer_absent"],
  ["pointer_presences", "constituer_palanquees"],
  ["constituer_palanquees", "enregistrer_plongee"],
  ["gerer_inventaire", "attribuer_materiel"],
  ["attribuer_materiel", "verifier_echeance_materiel"],
  ["gerer_inventaire", "enregistrer_reparation"],
  ["gerer_echeancier", "marquer_echeance_payee"],
  // Précondition d'authentification (reprend la convention du diagramme
  // existant : les cas d'utilisation principaux incluent "Se connecter")
  ["inscription", "connexion"],
  ["carnet", "connexion"],
  ["soumettre_adhesion", "connexion"],
  ["soumettre_certificat", "connexion"],
  ["gerer_sortie", "connexion"],
  ["pointer_presences", "connexion"],
  ["gerer_formation", "connexion"],
  ["declarer_incident", "connexion"],
  ["retour_materiel", "connexion"],
  ["gerer_comptes", "connexion"],
  ["gerer_fiche_adherent", "connexion"],
  ["gerer_inventaire", "connexion"],
  ["valider_adhesion", "connexion"],
  ["valider_certificat", "connexion"],
  ["enregistrer_paiement", "connexion"],
  ["gerer_echeancier", "connexion"],
];

// ── <<extend>> (extension --extend--> cas de base) ────────────────────────
const extends_ = [
  ["desinscription", "inscription"],
  ["export_carnet", "carnet"],
  ["valider_plongee_formation", "enregistrer_plongee"],
  ["conditions_incident", "declarer_incident"],
  ["archiver_adherent", "gerer_fiche_adherent"],
];

// ── Génération ─────────────────────────────────────────────────────────────
const actorIds = {};
const ucIds = {};

let actorsXml = "";
actorsDef.forEach((a) => (actorIds[a.name] = nextId("actor")));
actorsDef.forEach((a) => {
  actorsXml += `    <packagedElement xmi:type="uml:Actor" xmi:id="${actorIds[a.name]}" name="${esc(a.name)}">\n`;
  if (a.generalizes) {
    actorsXml += `      <generalization xmi:type="uml:Generalization" xmi:id="${nextId("gen")}" general="${actorIds[a.generalizes]}"/>\n`;
  }
  actorsXml += `    </packagedElement>\n`;
});

useCasesDef.forEach((u) => (ucIds[u.key] = nextId("uc")));

const includeMap = {}; // key -> [targetKey,...]
includes.forEach(([src, dst]) => {
  (includeMap[src] = includeMap[src] || []).push(dst);
});
const extendMap = {}; // key (extension) -> [baseKey,...]
extends_.forEach(([src, dst]) => {
  (extendMap[src] = extendMap[src] || []).push(dst);
});

let ucXml = "";
useCasesDef.forEach((u) => {
  ucXml += `    <packagedElement xmi:type="uml:UseCase" xmi:id="${ucIds[u.key]}" name="${esc(u.name)}">\n`;
  (includeMap[u.key] || []).forEach((targetKey) => {
    ucXml += `      <include xmi:type="uml:Include" xmi:id="${nextId("inc")}" addition="${ucIds[targetKey]}"/>\n`;
  });
  (extendMap[u.key] || []).forEach((targetKey) => {
    ucXml += `      <extend xmi:type="uml:Extend" xmi:id="${nextId("ext")}" extendedCase="${ucIds[targetKey]}"/>\n`;
  });
  ucXml += `    </packagedElement>\n`;
});

// Associations acteur <-> cas d'utilisation (mêmes éléments qu'un diagramme
// de classes : uml:Association avec deux ownedEnd)
let assocXml = "";
useCasesDef.forEach((u) => {
  u.owners.forEach((ownerName) => {
    const assocId = nextId("assoc");
    const end1 = nextId("end");
    const end2 = nextId("end");
    assocXml += `    <packagedElement xmi:type="uml:Association" xmi:id="${assocId}" memberEnd="${end1} ${end2}">\n`;
    assocXml += `      <ownedEnd xmi:type="uml:Property" xmi:id="${end1}" type="${actorIds[ownerName]}" association="${assocId}"/>\n`;
    assocXml += `      <ownedEnd xmi:type="uml:Property" xmi:id="${end2}" type="${ucIds[u.key]}" association="${assocId}"/>\n`;
    assocXml += `    </packagedElement>\n`;
  });
});

const xmi = `<?xml version="1.0" encoding="UTF-8"?>
<xmi:XMI xmi:version="2.1" xmlns:xmi="http://schema.omg.org/spec/XMI/2.1" xmlns:uml="http://www.eclipse.org/uml2/3.0.0/UML">
  <uml:Model xmi:id="${nextId("model")}" name="PlongeeAppDiagrammeCasUtilisation">
${actorsXml}${ucXml}${assocXml}  </uml:Model>
</xmi:XMI>
`;

fs.writeFileSync(process.argv[2] || "diagramme-cas-utilisation.xmi", xmi, "utf8");
console.log(
  "XMI généré :",
  actorsDef.length, "acteurs,",
  useCasesDef.length, "cas d'utilisation,",
  includes.length, "include,",
  extends_.length, "extend,",
  assocXml.split("uml:Association").length - 1, "associations acteur/cas."
);
