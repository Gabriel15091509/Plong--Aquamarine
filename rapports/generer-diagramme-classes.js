// Génère un fichier XMI 2.1 (métamodèle UML 2.x) du diagramme de classes
// COMPLET de plongee-app, à partir des modèles Sequelize réels des 6
// microservices. Compatible import Visual Paradigm (Tools > Import > XMI).
// Données/sérialisation partagées avec generer-diagrammes-sprints.js (un
// sous-ensemble filtré par sprint) via classDiagramData.js/xmiBuilder.js —
// voir ces deux fichiers pour le détail.
"use strict";
const fs = require("fs");
const data = require("./classDiagramData");
const { buildXmi } = require("./xmiBuilder");

const xmi = buildXmi({ ...data, modelName: "PlongeeAppDiagrammeClasses" });

fs.writeFileSync(process.argv[2] || "diagramme-classes.xmi", xmi, "utf8");

const nbClasses = Object.values(data.packages).reduce((n, classes) => n + classes.length, 0);
console.log(
  "XMI généré :",
  nbClasses, "classes,",
  data.associations.length, "associations,",
  data.crossServiceRefs.length, "dépendances inter-services,",
  data.enumerations.length, "énumérations.",
);
