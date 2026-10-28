import { useNavigate, useLocation } from "react-router-dom";

// Équivalent de useNavigate() pour un navigate() PROGRAMMATIQUE qui ouvre
// une modale de création/édition par-dessus la page actuelle (voir
// ModalLink.jsx pour l'équivalent <Link>, mêmes garanties/mêmes limites) —
// utilisé là où un <Link> ne convient pas (navigation depuis un handler,
// pas un clic direct sur l'élément qui ouvre la modale).
export function useModalNavigate() {
  const navigate = useNavigate();
  const location = useLocation();
  // Repropage la backgroundLocation déjà posée plutôt que de l'écraser avec
  // `location` — nécessaire dès qu'on ouvre une modale DEPUIS une autre
  // modale (voir le même garde-fou, expliqué en détail, dans ModalLink.jsx).
  const backgroundLocation = location.state?.backgroundLocation ?? location;
  return (to, options) =>
    navigate(to, {
      ...options,
      state: { ...options?.state, backgroundLocation },
    });
}
