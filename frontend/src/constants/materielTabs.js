// Onglets partagés par les 3 pages de gestion du matériel (MaterielList,
// AttributionList, ReparationList) — même schéma que ROLE_TABS
// (constants/roleTabs.js) pour Adhérents/Moniteurs/Présidents/Trésoriers :
// une navigation commune entre 3 entités distinctes (pas une fusion en une
// seule liste), affichée sans clignotement grâce au composant-coquille
// partagé (voir pages/Materiel/MaterielGroupPage.jsx) qui les garde tous
// les 3 montés en permanence.
//
// Matériel/Réparations restent réservés président sans exception
// (canSeeMateriel, voir Sidebar.jsx) ; Attributions ouvre sa liste en
// lecture à moniteur/adhérent (voir MaterielGroupPage.needsPresident), qui
// n'ont donc pas cette TabBar affichée (voir AttributionList.jsx,
// canManageAttribution) pour ne pas leur proposer 2 onglets bloqués — même
// raisonnement que ROLE_TABS/canManageAdherent pour Adhérents.
export const MATERIEL_TABS = [
  { to: "/materiels", label: "Matériel" },
  { to: "/attributions", label: "Attributions" },
  { to: "/reparations", label: "Réparations" },
];
