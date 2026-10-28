import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const HIGHLIGHT_CLASSES = [
  "ring-2",
  "ring-cyan-400",
  "ring-offset-2",
  "dark:ring-offset-gray-900",
];

// Fait défiler jusqu'à l'élément dont l'id correspond au hash de l'URL
// (ex: navigate("/adherents/123#materiel-attribue")) une fois que `ready`
// est vrai — l'élément ciblé (une SectionCard) n'existe pas encore dans le
// DOM tant que les données de la page ne sont pas chargées, donc on ne
// peut pas se contenter d'un scroll au montage. Ajoute un bref surlignage
// pour que la destination du lien soit évidente (ex: depuis le modal
// d'alerte "Materiel en retard").
//
// Ré-essaie sur quelques frames plutôt qu'un simple essai unique : une
// fiche Détails (SortieDetails.jsx, AdherentDetails.jsx...) affiche
// d'ABORD un <DetailsModal> minimal (spinner, sans `initialPageIndex`)
// pendant le chargement, PUIS reswitch, une fois les données prêtes, vers
// le vrai <DetailsModal pages initialPageIndex>, à la MÊME position dans
// l'arbre — React réutilise donc la même instance de DetailsModal, dont le
// `pageIndex` interne (déjà initialisé à 0 pendant le chargement) ne se
// corrige vers `initialPageIndex` qu'au rendu SUIVANT (son propre
// useEffect [isOpen, title, initialPageIndex]). `ready` passe à `true` DANS
// ce même rendu intermédiaire, avant que la bonne page (et donc l'élément
// ciblé) soit montée : un essai unique tombe systématiquement dans cette
// fenêtre et ne trouve jamais l'élément. Voir le même mécanisme documenté
// dans DetailsModal.jsx.
export const useScrollToHash = (ready) => {
  const { hash } = useLocation();

  useEffect(() => {
    if (!ready || !hash) return undefined;
    const id = hash.slice(1);

    let rafId = null;
    let highlightTimeout = null;
    let settleTimeouts = [];
    let attempts = 0;
    const MAX_ATTEMPTS = 60; // ~1s à 60 fps, largement au-delà du rendu correctif décrit ci-dessus

    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.add(...HIGHLIGHT_CLASSES);
        highlightTimeout = setTimeout(() => {
          el.classList.remove(...HIGHLIGHT_CLASSES);
        }, 2000);

        // Un ou deux rattrapages espacés plutôt qu'un scroll unique : du
        // contenu SOUS la cible (ex. Palanquées, chargé par un composant à
        // part avec son propre appel réseau) peut encore grandir juste
        // après ce premier scroll et décaler sa position réelle plus bas —
        // sans ça, on atterrit au milieu de ce contenu au lieu de la
        // cible. `scrollIntoView` déjà aligné est un no-op visuel, donc
        // rejouer l'appel sur une cible qui n'a pas bougé ne dérange pas
        // un utilisateur qui aurait fini de lire.
        const rescroll = () => el.scrollIntoView({ behavior: "smooth", block: "start" });
        rescroll();
        settleTimeouts = [300, 800].map((delay) => setTimeout(rescroll, delay));
        return;
      }
      attempts += 1;
      if (attempts < MAX_ATTEMPTS) {
        rafId = requestAnimationFrame(tryScroll);
      }
    };
    rafId = requestAnimationFrame(tryScroll);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (highlightTimeout) clearTimeout(highlightTimeout);
      settleTimeouts.forEach(clearTimeout);
    };
  }, [ready, hash]);
};
