import { useAuth } from "../../context/AuthContext";

// Onglets partagés entre SortiesPage.jsx (liste) et SortieCartePage.jsx
// (carte, une page à part entière — pas une simple vue filtrée de la
// liste) : centralisé ici pour ne construire ce tableau qu'une seule fois,
// avec les mêmes ensembles de rôles que les anciens sous-menus dépliables
// de Sidebar.jsx (canSeeMesSortiesMenu/canSeeMoniteurSousMenus) et la même
// restriction que la route /sorties/carte (ProtectedRoute
// requiredRoles=["president","moniteur","adherent"] — le trésorier n'y a
// jamais eu accès).
export function useSortieTabs() {
  const { hasRole, user } = useAuth();
  // Un moniteur n'a pas d'onglet "Toutes les sorties" : /sorties est
  // toujours limité aux sorties qu'il encadre (voir SortiesPage.jsx).
  const isMoniteurSeul = user?.role === "moniteur";
  const tabs = [
    {
      to: "/sorties",
      label: isMoniteurSeul ? "Sorties que j'encadre" : "Toutes les sorties",
    },
  ];

  if (hasRole(["adherent"])) {
    tabs.push({ to: "/sorties?filtre=mes-sorties", label: "Mes sorties" });
  } else if (!isMoniteurSeul && hasRole(["president"])) {
    tabs.push({
      to: "/sorties?filtre=mes-sorties-encadrees",
      label: "Sorties que j'encadre",
    });
  }

  if (hasRole(["president", "moniteur", "adherent"])) {
    tabs.push({ to: "/sorties/carte", label: "Carte des sites" });
  }

  // Ex-section sidebar "Sécurité" (voir Sidebar.jsx) : un seul lien
  // ("Incidents"), déplacé ici pour rejoindre le même onglet que le reste
  // du groupe Sorties — mêmes rôles que l'ancien canSeeIncidents/la route
  // /incidents (ProtectedRoute requiredRoles=["president","moniteur"]).
  if (hasRole(["president", "moniteur"])) {
    tabs.push({ to: "/incidents", label: "Incidents" });
  }

  return tabs;
}
