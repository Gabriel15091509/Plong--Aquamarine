// Sérialisation XMI 2.1 (métamodèle UML 2.x) à partir des données d'un
// diagramme de classes (packages/méthodes/associations/dépendances) — extrait
// de generer-diagramme-classes.js pour être réutilisé tel quel par
// generer-diagrammes-sprints.js (un appel par sprint, sur un sous-ensemble
// filtré des mêmes données). Compatible import Visual Paradigm (Tools >
// Import > XMI).
"use strict";

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

// { primitiveTypes, mapType, enumerations, packages, methodsByClass,
//   associations, crossServiceRefs, modelName } -> chaîne XMI complète.
// idCounter est LOCAL à cet appel (jamais partagé entre deux appels) : deux
// diagrammes générés dans le même process (ex. les 14 sprints à la suite)
// repartent chacun d'xmi:id à 1, pour rester lisibles/reproductibles
// indépendamment les uns des autres.
function buildXmi({
  primitiveTypes,
  mapType,
  enumerations,
  packages,
  methodsByClass,
  associations,
  crossServiceRefs,
  generalizations = [],
  modelName,
}) {
  let idCounter = 1;
  const nextId = (prefix) => `${prefix}_${idCounter++}`;

  const typeIds = {};
  primitiveTypes.forEach((t) => (typeIds[t] = nextId("type")));

  const enumIds = {};
  enumerations.forEach((e) => (enumIds[e.name] = nextId("enum")));

  const classIds = {}; // nom de classe -> xmi:id

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
      // xmi:id — "self" ne peut être résolu qu'ici, une fois classId connu.
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
  let assocXml = "";
  associations.forEach((a) => {
    const assocId = nextId("assoc");
    const end1Id = nextId("end");
    const end2Id = nextId("end");
    const from = multBounds(a.fromMult);
    const to = multBounds(a.toMult);
    assocXml += `    <packagedElement xmi:type="uml:Association" xmi:id="${assocId}" name="${esc(a.name)}" memberEnd="${end1Id} ${end2Id}">\n`;
    assocXml += `      <ownedEnd xmi:type="uml:Property" xmi:id="${end1Id}" name="${esc(a.fromRole)}" type="${classIds[a.from]}"${a.kind ? ` aggregation="${a.kind}"` : ""} association="${assocId}">\n`;
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

  // Généralisations (héritage) : enfant -> parent
  const genByChild = {};
  generalizations.forEach((g) => (genByChild[g.child] = (genByChild[g.child] || []).concat(g.parent)));
  Object.entries(genByChild).forEach(([child, parents]) => {
    parents.forEach((p) => {
      const marker = `<packagedElement xmi:type="uml:Class" xmi:id="${classIds[child]}" name="${esc(child)}">
`;
      packagesXml = packagesXml.replace(marker, marker + `        <generalization xmi:type="uml:Generalization" xmi:id="${nextId("gen")}" general="${classIds[p]}"/>
`);
    });
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<xmi:XMI xmi:version="2.1" xmlns:xmi="http://schema.omg.org/spec/XMI/2.1" xmlns:uml="http://www.eclipse.org/uml2/3.0.0/UML">
  <uml:Model xmi:id="${nextId("model")}" name="${esc(modelName)}">
${typesXml}${enumsXml}${packagesXml}${assocXml}${depXml}  </uml:Model>
</xmi:XMI>
`;
}

module.exports = { buildXmi };
