import React from "react";
import { Link, useLocation } from "react-router-dom";

// Remplaçant direct de <Link> pour un lien qui ouvre une modale de
// création/édition PAR-DESSUS la page ACTUELLE (fiche détail d'une autre
// entité, page d'une autre entité...) plutôt que de la remplacer — attache
// automatiquement `state.backgroundLocation` (lu par App.jsx pour choisir
// la route "modale seule", voir le pattern React Router "background
// location"). Ne concerne QUE les liens ouverts depuis une page qui n'est
// PAS la liste propriétaire de la modale visée : un lien d'une page liste
// vers sa PROPRE route /create ou /edit (ex. PlongeeList.jsx →
// /plongees/create) reste un <Link> ordinaire, sans state — cette page ne
// démonte jamais en ouvrant sa propre modale (voir useFormModal).
// Bug corrigé : cette page de fond doit rester la MÊME tout le long d'une
// chaîne de modales imbriquées (ex. depuis SortieDetails déjà ouverte
// par-dessus /calendrier, cliquer "Déclarer un incident" puis, DANS cette
// modale, un lien vers une autre entité) — pas juste la dernière modale en
// date. Si `location.state.backgroundLocation` existe déjà (on est DANS une
// modale, rendue par le second <Routes> "modale seule" de App.jsx, non
// scopé par location — son `useLocation()` renvoie donc l'URL réelle de
// CETTE modale, jamais celle de la page d'origine), on le repropage tel
// quel plutôt que d'écraser avec `location` (qui pointerait alors sur la
// modale elle-même, pas sur la vraie page de fond). Sans ce garde-fou, la
// page de fond changeait silencieusement pour celle de la modale qu'on
// venait de quitter à chaque niveau d'imbrication.
const ModalLink = ({ state, ...props }) => {
  const location = useLocation();
  const backgroundLocation = location.state?.backgroundLocation ?? location;
  return (
    <Link {...props} state={{ ...state, backgroundLocation }} />
  );
};

export default ModalLink;
