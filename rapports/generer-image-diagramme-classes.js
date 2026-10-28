// Rendu image (SVG + PNG) du diagramme de classes simplifié, style UML classique :
// boîtes à 3 compartiments (nom / attributs / méthodes), associations nommées avec
// multiplicités, losanges d'agrégation/composition, flèche creuse de généralisation.
// Usage : node generer-image-diagramme-classes.js [dossierSortie]
// Nécessite @viz-js/viz et playwright (installés hors dépôt, cf. NODE_PATH).
"use strict";
const fs = require("fs");
const path = require("path");
const data = require("./classDiagramData");

const kinds = {
  "Adherent>Brevet": "shared", "Formation>Competence": "composite", "Formation>Seance": "composite",
  "Echeancier>Echeance": "composite", "Sortie>Inscription": "composite", "Sortie>Plongee": "shared",
  "Palanquee>Plongee": "shared", "Sortie>Palanquee": "composite", "Palanquee>Composer": "composite",
  "Sortie>Attribution": "shared", "Palanquee>Attribution": "shared", "Sortie>Incident": "composite",
  "Materiel>Reparation": "composite",
};
const generalizations = [
  ["Adherent", "User"], ["Moniteur", "User"], ["Tresorier", "User"], ["President", "Moniteur"], ["President", "Tresorier"],
];
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const typeName = (t) => (t.startsWith("ENUM:") ? t.slice(5) : data.mapType(t));

const classes = Object.values(data.packages).flat();
const node = (cls) => {
  const attrs = cls.attrs.map(([n, t]) => `<TR><TD ALIGN="LEFT" BALIGN="LEFT">- ${esc(n)} : ${esc(typeName(t).toLowerCase())}</TD></TR>`).join("");
  const meths = (data.methodsByClass[cls.name] || []).map(([n, ps, r]) => {
    const ret = r === "void" ? "" : ` : ${r === "self" ? cls.name : r.toLowerCase()}`;
    return `<TR><TD ALIGN="LEFT">+ ${esc(n)}(${esc(ps.map(([pn, pt]) => `${pn}: ${pt.toLowerCase()}`).join(", "))})${esc(ret)}</TD></TR>`;
  }).join("") || `<TR><TD> </TD></TR>`;
  return `  "${cls.name}" [label=<<TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" CELLPADDING="3" BGCOLOR="white">` +
    `<TR><TD BGCOLOR="#f2f2f2"><B>${cls.name.toUpperCase()}</B></TD></TR><HR/>${attrs || "<TR><TD> </TD></TR>"}<HR/>${meths}</TABLE>>];`;
};

let dot = `digraph G {\n  graph [rankdir=TB, splines=polyline, nodesep=0.7, ranksep=1.1, pad=0.4, fontname="Helvetica"];\n` +
  `  node [shape=plain, fontname="Helvetica", fontsize=9];\n  edge [fontname="Helvetica", fontsize=9, labeldistance=2.2];\n`;
dot += classes.map(node).join("\n") + "\n";
data.associations.forEach((a) => {
  const k = kinds[`${a.from}>${a.to}`];
  if (!k) return;
  dot += `  "${a.from}" -> "${a.to}" [dir=both, arrowtail=${k === "composite" ? "diamond" : "odiamond"}, arrowhead=none, ` +
    `label="${a.name.toUpperCase()}", taillabel="${a.fromMult}", headlabel="${a.toMult}"];\n`;
});
generalizations.forEach(([c, p]) => { dot += `  "${c}" -> "${p}" [arrowhead=empty, arrowsize=1.1];\n`; });
// Arêtes invisibles : empile les groupes indépendants sous le groupe principal
// pour un format plus compact (sinon Graphviz les aligne tous côte à côte).
["Formation", "Echeancier", "Materiel", "Adhesion", "CertificatMedical", "Paiement", "Alerte", "FormationSpecialite"].forEach((c, i) => {
  dot += `  "${["Attribution", "Composer", "Brevet"][i % 3]}" -> "${c}" [style=invis];\n`;
});
dot += "}\n";

(async () => {
  const out = process.argv[2] || ".";
  const { instance } = require("@viz-js/viz");
  const viz = await instance();
  const svg = viz.renderString(dot, { format: "svg" });
  fs.writeFileSync(path.join(out, "diagramme-classes-simplifie.svg"), svg);
  const { chromium } = require("playwright");
  const b = await chromium.launch();
  const p = await b.newPage({ deviceScaleFactor: 1.5 });
  await p.setContent(`<body style="margin:0;background:#fff">${svg}</body>`);
  const el = await p.locator("svg").first();
  await el.screenshot({ path: path.join(out, "diagramme-classes-simplifie.png") });
  await b.close();
  console.log("OK", path.resolve(out));
})();
