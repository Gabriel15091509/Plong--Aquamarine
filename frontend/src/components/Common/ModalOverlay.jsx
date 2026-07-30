import { createPortal } from "react-dom";

// Les modales de l'app sont rendues à l'intérieur de la page (elle-même un
// <motion.div> animé) — or `position: fixed` se recale par rapport au
// premier ancêtre transformé (tout <motion.div> en a un dès qu'il anime x/y/
// scale, même immobile) au lieu du viewport. Résultat : le fond de la modale
// ne recouvre plus toute l'application dès que la page dépasse la hauteur de
// l'écran ou que ce conteneur a une position non nulle. Un portail direct
// dans <body> sort la modale de cette arborescence et lui rend le viewport
// entier comme repère.
//
// Reprend tel quel les attributs (className, onClick...) du <div> qu'il
// remplace : un simple renommage de balise à l'usage, sans changer le
// contenu ni le style.
const ModalOverlay = ({ children, ...props }) =>
  createPortal(<div {...props}>{children}</div>, document.body);

export default ModalOverlay;
