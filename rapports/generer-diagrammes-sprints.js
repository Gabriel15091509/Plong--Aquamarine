// Génère UN fichier XMI par sprint (14) — diagramme de classes de CONCEPTION
// du périmètre développé à ce sprint : les classes introduites à ce sprint,
// plus les classes déjà existantes (sprints précédents) directement liées à
// elles par une association ou une référence inter-services. Réutilise les
// mêmes données que le diagramme complet (classDiagramData.js) et la même
// sérialisation (xmiBuilder.js) — un seul jeu de vérité, jamais deux copies
// à tenir synchronisées.
"use strict";
const fs = require("fs");
const path = require("path");
const baseData = require("./classDiagramData");
const { buildXmi } = require("./xmiBuilder");

// Sprint 14 "Tableau de bord" n'introduit aucune nouvelle entité persistée
// (page de lecture agrégeant les autres domaines) — représenté par une
// classe de conception synthétique sans attribut, avec des dépendances de
// lecture vers les classes qu'elle agrège. Ajoutée UNE FOIS ici (jamais dans
// classDiagramData.js, qui doit rester fidèle au système réellement
// persisté) et réutilisée pour tous les sprints ci-dessous : inoffensif pour
// les sprints 1-13, dont aucune classe focus ne touche TableauDeBord.
const packages = {
  ...baseData.packages,
  "Tableau de bord (agrégation multi-services)": [{ name: "TableauDeBord", attrs: [] }],
};
const methodsByClass = {
  ...baseData.methodsByClass,
  TableauDeBord: [
    ["getVueEnsemble", [], "String"],
    ["getStatistiquesAdherents", [], "String"],
    ["getStatistiquesSorties", [], "String"],
    ["getStatistiquesFinancieres", [], "String"],
  ],
};
const crossServiceRefs = [
  ...baseData.crossServiceRefs,
  ...["Adherent", "Sortie", "Inscription", "Paiement", "Materiel", "Formation", "Alerte"].map((to) => ({
    from: "TableauDeBord",
    to,
    via: "lecture agrégée (read-only)",
  })),
];

// ── Plan de sprints (RELEASE 1-14) — chaque sprint liste les classes qu'il
//    introduit. L'ordre définit aussi la chronologie utilisée ci-dessous pour
//    ne jamais tirer dans le diagramme d'un sprint une classe d'un sprint
//    FUTUR (une classe pas encore conçue à ce stade). ─────────────────────────
const SPRINTS = [
  { id: 1, titre: "Développer l'authentification et la gestion des comptes utilisateurs", jours: 6, classes: ["User", "Moniteur", "President", "Tresorier"] },
  { id: 2, titre: "Développer la gestion des adhérents", jours: 5, classes: ["Adherent", "Brevet"] },
  { id: 3, titre: "Développer la gestion des adhésions et des certificats médicaux", jours: 8, classes: ["Adhesion", "CertificatMedical"] },
  { id: 4, titre: "Développer la gestion des sorties de plongée", jours: 8, classes: ["Sortie", "Incident"] },
  { id: 5, titre: "Développer la gestion des inscriptions et des listes d'attente", jours: 7, classes: ["Inscription"] },
  { id: 6, titre: "Développer la gestion des palanquées et du pointage des présences", jours: 6, classes: ["Palanquee", "Composer"] },
  { id: 7, titre: "Développer la gestion du carnet de plongée", jours: 5, classes: ["Plongee"] },
  { id: 8, titre: "Développer la gestion du matériel et de l'inventaire", jours: 6, classes: ["Materiel"] },
  { id: 9, titre: "Développer la gestion des attributions et des cautions de matériel", jours: 5, classes: ["Attribution"] },
  { id: 10, titre: "Développer la gestion des réparations et de la maintenance", jours: 3, classes: ["Reparation"] },
  { id: 11, titre: "Développer la gestion des formations et de la progression", jours: 8, classes: ["Formation", "Seance", "Competence", "FormationSpecialite"] },
  { id: 12, titre: "Développer la gestion des paiements et des échéanciers", jours: 6, classes: ["Paiement", "Echeancier", "Echeance"] },
  { id: 13, titre: "Développer la gestion des alertes et des communications", jours: 4, classes: ["Alerte"] },
  { id: 14, titre: "Développer le tableau de bord", jours: 4, classes: ["TableauDeBord"] },
];

// classe -> index du sprint qui l'introduit (1-based) — sert à n'inclure
// dans le diagramme d'un sprint QUE des classes déjà conçues (sprint <=
// sprint courant), jamais une classe d'un sprint plus tardif.
const classSprintIndex = {};
SPRINTS.forEach((s) => s.classes.forEach((c) => (classSprintIndex[c] = s.id)));

// Classes focus du sprint + voisins DIRECTS (une seule association/référence
// de distance) déjà conçus à ce stade — jamais d'expansion transitive
// (sinon chaque sprint reconstituerait peu à peu le diagramme complet).
function computeClassSet(sprintId, focusClasses) {
  const focus = new Set(focusClasses);
  const result = new Set(focusClasses);
  const allLinks = [...baseData.associations, ...crossServiceRefs];
  allLinks.forEach(({ from, to }) => {
    if (focus.has(from) && classSprintIndex[to] <= sprintId) result.add(to);
    if (focus.has(to) && classSprintIndex[from] <= sprintId) result.add(from);
  });
  return result;
}

function filterPackages(classSet) {
  const out = {};
  for (const [pkgName, classes] of Object.entries(packages)) {
    const kept = classes.filter((c) => classSet.has(c.name));
    if (kept.length > 0) out[pkgName] = kept;
  }
  return out;
}

function filterMethods(classSet) {
  const out = {};
  classSet.forEach((name) => {
    if (methodsByClass[name]) out[name] = methodsByClass[name];
  });
  return out;
}

function filterLinks(links, classSet) {
  return links.filter((l) => classSet.has(l.from) && classSet.has(l.to));
}

function enumsUsedBy(classSet) {
  const used = new Set();
  Object.values(packages).forEach((classes) => {
    classes.forEach((cls) => {
      if (!classSet.has(cls.name)) return;
      cls.attrs.forEach(([, type]) => {
        if (type.startsWith("ENUM:")) used.add(type.slice(5));
      });
    });
  });
  return baseData.enumerations.filter((e) => used.has(e.name));
}

function slugify(titre) {
  return titre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/^developper la gestion (des|de la|du|de l')\s*/, "")
    .replace(/^developper /, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const outDir = path.join(__dirname, "sprints");
fs.mkdirSync(outDir, { recursive: true });

SPRINTS.forEach((sprint) => {
  const classSet = computeClassSet(sprint.id, sprint.classes);
  const xmi = buildXmi({
    primitiveTypes: baseData.primitiveTypes,
    mapType: baseData.mapType,
    enumerations: enumsUsedBy(classSet),
    packages: filterPackages(classSet),
    methodsByClass: filterMethods(classSet),
    associations: filterLinks(baseData.associations, classSet),
    crossServiceRefs: filterLinks(crossServiceRefs, classSet),
    modelName: `PlongeeApp_Sprint${String(sprint.id).padStart(2, "0")}_${slugify(sprint.titre)}`,
  });

  const fileName = `sprint-${String(sprint.id).padStart(2, "0")}-${slugify(sprint.titre)}.xmi`;
  fs.writeFileSync(path.join(outDir, fileName), xmi, "utf8");

  console.log(
    `Sprint ${sprint.id} (${sprint.jours}j) [${fileName}] :`,
    classSet.size, "classes,",
    filterLinks(baseData.associations, classSet).length, "associations,",
    filterLinks(crossServiceRefs, classSet).length, "dépendances inter-services.",
  );
});

console.log(`\n${SPRINTS.length} diagrammes générés dans ${outDir}`);
