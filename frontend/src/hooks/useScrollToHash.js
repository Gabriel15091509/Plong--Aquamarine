import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Fait défiler jusqu'à l'élément dont l'id correspond au hash de l'URL
// (ex: navigate("/adherents/123#materiel-attribue")) une fois que `ready`
// est vrai — l'élément ciblé (une SectionCard) n'existe pas encore dans le
// DOM tant que les données de la page ne sont pas chargées, donc on ne
// peut pas se contenter d'un scroll au montage. Ajoute un bref surlignage
// pour que la destination du lien soit évidente (ex: depuis le modal
// d'alerte "Materiel en retard").
export const useScrollToHash = (ready) => {
  const { hash } = useLocation();

  useEffect(() => {
    if (!ready || !hash) return;
    const id = hash.slice(1);
    const el = document.getElementById(id);
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add(
      "ring-2",
      "ring-cyan-400",
      "ring-offset-2",
      "dark:ring-offset-gray-900",
    );
    const timeout = setTimeout(() => {
      el.classList.remove(
        "ring-2",
        "ring-cyan-400",
        "ring-offset-2",
        "dark:ring-offset-gray-900",
      );
    }, 2000);
    return () => clearTimeout(timeout);
  }, [ready, hash]);
};
