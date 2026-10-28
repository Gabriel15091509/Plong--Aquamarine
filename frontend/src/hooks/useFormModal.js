import { useParams, useLocation, useNavigate } from "react-router-dom";

// Retour depuis une modale de formulaire : si elle a été ouverte PAR-DESSUS
// une autre page (state.backgroundLocation, posé par <ModalLink>/
// useModalNavigate — voir ces fichiers), navigate(-1) dépile exactement
// l'entrée /create ou /edit/:id ajoutée à l'ouverture et rend la main à
// cette page de fond, sans empiler une entrée d'historique redondante.
// Suppose que CETTE entrée a bien été ajoutée par un push normal (jamais un
// `replace`) depuis la page de fond — <ModalLink>/useModalNavigate ne font
// jamais de `replace`, condition à ne jamais casser en ajoutant un nouveau
// site d'ouverture de modale.
//
// Sinon (pas de backgroundLocation) : ce n'est PAS forcément un accès direct
// par URL/rafraîchissement — c'est aussi le cas, bien plus fréquent, d'un
// simple clic sur une ligne de SA PROPRE liste (ex. PlongeeList → un <Link>
// ordinaire vers /plongees/:id, sans state — cette page ne démonte jamais en
// ouvrant sa propre modale, voir useFormModal ci-dessous). Un `navigate(
// basePath)` fixe perdait alors le filtre actif (ex. l'onglet "Mes
// plongées", ?filtre=mes-plongees — voir plongeeTabs dans PlongeeList.jsx,
// même chose pour Sorties/Adhésions/Certificats) : le lien vers /plongees/:id
// ne le reporte pas dans son URL, donc le retrouver à la fermeture par un
// simple navigate(basePath) est impossible, mais navigate(-1) le peut très
// bien — l'entrée d'historique DEUX crans plus tôt garde le `?filtre=...`
// tel quel, peu importe ce que l'URL de la modale elle-même contenait.
// `location.key === "default"` est la façon documentée (fournie par le
// package `history` sous react-router) de détecter qu'on est sur la TOUTE
// PREMIÈRE entrée de la session de navigation, donc qu'il n'existe vraiment
// RIEN à dépiler (accès direct par URL/rafraîchissement, ou lien externe) —
// c'est là, et SEULEMENT là, que retomber sur basePath est nécessaire.
// Chaque navigate() applicatif, backgroundLocation ou non, pousse toujours
// une entrée avec une clé propre (jamais "default").
export function useCloseFormModal(basePath) {
  const navigate = useNavigate();
  const location = useLocation();
  const backgroundLocation = location.state?.backgroundLocation;
  return () => {
    if (backgroundLocation || location.key !== "default") {
      navigate(-1);
    } else {
      navigate(basePath);
    }
  };
}

// Pilote l'ouverture/fermeture d'une modale de formulaire (création/édition)
// depuis la route elle-même, plutôt que via un état local dans la page —
// la modale s'ouvre en visitant `${basePath}/create` ou
// `${basePath}/edit/:id`, se ferme en revenant à `basePath` (ou à la page de
// fond d'où elle a été ouverte, voir useCloseFormModal ci-dessus). Les 4
// façons de fermer (bouton Annuler, clic sur le fond, succès de soumission,
// bouton retour du navigateur) convergent déjà toutes vers `useCloseFormModal`
// côté formulaire lui-même (inchangé par cette conversion en modale) — il
// suffit donc de détecter la route courante, aucun état local à synchroniser.
//
// Le query string (`?id_sortie=...`, `?sortie=...`) n'entre volontairement
// PAS dans ce calcul (basé sur `location.pathname` seul, jamais sur
// `location.search`) : il reste lu tel quel par le formulaire via son propre
// `useSearchParams()`, complètement inchangé par cette conversion.
export function useFormModal(basePath) {
  const { id } = useParams();
  const location = useLocation();

  const isCreate = location.pathname === `${basePath}/create`;
  const isEdit = location.pathname.startsWith(`${basePath}/edit/`) && !!id;

  return {
    isOpen: isCreate || isEdit,
    id: isEdit ? id : undefined,
    close: useCloseFormModal(basePath),
  };
}

// Même principe que useFormModal ci-dessus, mais pour la fiche Détails
// devenue modale (voir DetailsModal.jsx) : s'ouvre en visitant
// `${basePath}/:id` directement (pas `/create` ni `/edit/:id`, déjà exclus
// par la comparaison stricte du pathname complet ci-dessous — React Router
// fait de toute façon déjà primer ces routes littérales sur `:id` grâce à
// son classement par spécificité, cette comparaison est surtout la garantie
// que `useParams().id` vient bien de CETTE route-ci et pas d'une autre route
// `:id`-shaped coïncidente). Se ferme comme n'importe quelle modale pilotée
// par l'URL (voir useCloseFormModal, réutilisé tel quel — sa logique ne
// dépend pas de la nature "formulaire" du contenu).
export function useDetailsModal(basePath) {
  const { id } = useParams();
  const location = useLocation();

  const isOpen = !!id && location.pathname === `${basePath}/${id}`;

  return {
    isOpen,
    id: isOpen ? id : undefined,
    close: useCloseFormModal(basePath),
  };
}
