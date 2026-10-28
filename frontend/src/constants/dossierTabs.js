// Onglets de navigation entre les 2 pages du "dossier du club"
// (Adhésions/Certificats, voir pages/Dossier/DossierGroupPage.jsx) — même
// principe que MATERIEL_TABS (constants/materielTabs.js) : Adhésions
// (licence FFESM/assurance) et Certificats (certificat médical)
// représentent tous deux le dossier administratif d'un adhérent, fusionnés
// en un seul point d'entrée Sidebar plutôt que deux entrées distinctes.
// Pas de fonction par rôle ici (contrairement à getFormationTabs) : les
// deux pages sont ouvertes à tous les rôles connectés, seules créer/
// modifier restent restreintes (géré dans DossierGroupPage.jsx, pas dans
// cette barre).
export const DOSSIER_TABS = [
  { to: "/adhesions", label: "Adhésions" },
  { to: "/certificats", label: "Certificats" },
];
