// Onglets partagés par les 4 pages de gestion des comptes/rôles
// (MoniteurList, PresidentList, TresorierList, AdherentList) — la page
// "Utilisateurs" (liste générique de tous les comptes) a été supprimée,
// sa gestion de compte (statut, mot de passe, rôle, suppression) vit
// maintenant directement sur la fiche Détails de chacune de ces 4
// entités (voir AccountManagementCard.jsx). Ces 4 pages restent des
// routes/entités distinctes (fiches métier, pas une liste générique),
// donc pas de fusion en une seule liste — juste une navigation commune,
// comme useSortieTabs pour Sorties/Carte des sites. Moniteurs/Présidents/
// Trésoriers sont réservés au président (routes `requiredRoles=
// ["president"]`) ; Adhérents est aussi ouvert à moniteur/trésorier, qui
// n'ont donc pas cette TabBar affichée (voir AdherentList.jsx,
// canManageAdherent) pour ne pas leur proposer des onglets bloqués.
// Adhérents en premier : c'est le point d'entrée par défaut de sidebar
// ("Membres", route /adherents, voir Sidebar.jsx) — l'ordre des onglets
// reflète ça plutôt que de mettre en avant un onglet qu'on n'atteint
// jamais directement depuis le menu.
export const ROLE_TABS = [
  { to: "/adherents", label: "Adhérents" },
  { to: "/moniteurs", label: "Moniteurs" },
  { to: "/presidents", label: "Présidents" },
  { to: "/tresoriers", label: "Trésoriers" },
];
