// Onglets de navigation entre les 3 pages du groupe Formation
// (Formations/Spécialités/Brevets, voir pages/Formation/FormationGroupPage.jsx)
// — même principe que MATERIEL_TABS (constants/materielTabs.js), mais en
// fonction plutôt qu'en tableau fixe : contrairement à Matériel, la
// visibilité diffère par rôle ici. "Spécialités" et "Formations que
// j'encadre" sont réservées président/moniteur (canManage, voir
// FormationList.jsx/SpecialiteFormationList.jsx/BrevetList.jsx) ;
// "Formations" et "Brevets" restent ouverts à l'adhérent, qui ne voit donc
// que ces 2 onglets.
// Un moniteur (isMoniteurSeul) n'a pas d'onglet "Formations" (toutes) :
// /formations est pour lui toujours limité à celles qu'il encadre.
export const getFormationTabs = (canManage, isMoniteurSeul = false) => [
  isMoniteurSeul
    ? { to: "/formations", label: "Formations que j'encadre" }
    : { to: "/formations", label: "Formations" },
  ...(canManage
    ? [
        ...(isMoniteurSeul
          ? []
          : [
              {
                to: "/formations?filtre=mes-formations-encadrees",
                label: "Formations que j'encadre",
              },
            ]),
        { to: "/specialites-formation", label: "Spécialités" },
      ]
    : []),
  { to: "/brevets", label: "Brevets" },
];
