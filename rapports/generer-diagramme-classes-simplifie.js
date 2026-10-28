// XMI du diagramme de classes SIMPLIFIÉ : uniquement agrégation/composition et
// généralisation (ni association simple, ni dépendance inter-services).
"use strict";
const fs = require("fs");
const data = require("./classDiagramData");
const { buildXmi } = require("./xmiBuilder");

const kinds = {
  "Adherent>Brevet": "shared",
  "Formation>Competence": "composite",
  "Formation>Seance": "composite",
  "Echeancier>Echeance": "composite",
  "Sortie>Inscription": "composite",
  "Sortie>Plongee": "shared",
  "Palanquee>Plongee": "shared",
  "Sortie>Palanquee": "composite",
  "Palanquee>Composer": "composite",
  "Sortie>Attribution": "shared",
  "Palanquee>Attribution": "shared",
  "Sortie>Incident": "composite",
  "Materiel>Reparation": "composite",
};
const associations = data.associations
  .filter((a) => kinds[`${a.from}>${a.to}`])
  .map((a) => ({ ...a, kind: kinds[`${a.from}>${a.to}`] }));

const generalizations = [
  { child: "Adherent", parent: "User" },
  { child: "Moniteur", parent: "User" },
  { child: "Tresorier", parent: "User" },
  { child: "President", parent: "Moniteur" },
  { child: "President", parent: "Tresorier" },
];

const xmi = buildXmi({ ...data, associations, crossServiceRefs: [], generalizations, modelName: "PlongeeAppDiagrammeClasses" });
fs.writeFileSync(process.argv[2] || "diagramme-classes-simplifie.xmi", xmi, "utf8");
console.log("XMI :", associations.length, "agrégations/compositions,", generalizations.length, "généralisations");
