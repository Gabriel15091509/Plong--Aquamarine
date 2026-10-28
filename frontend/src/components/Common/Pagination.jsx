import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

// Pagination partagée par tous les listages (Adhérents, Moniteurs,
// Matériel, Formations, etc.) — boutons ◀ ▶ circulaires de part et
// d'autre, "Page X sur Y" et une piste de puces au centre (la puce
// active s'étire en pilule) : même langage visuel que la pagination de
// pages de DetailsModal.jsx, pour que toute la pagination de l'appli se
// ressemble plutôt que chaque listage ayant réinventé son propre style
// ("Précédent"/"Suivant" en texte).
//
// Rendu `null` dès qu'il n'y a rien à paginer (0 ou 1 page) : à
// l'appelant de ne plus avoir à écrire `{totalPages > 1 && (...)}`
// autour de chaque usage.
//
// Au-delà de MAX_DOTS pages, la piste de puces (une par page) deviendrait
// illisible/interminable pour une grande liste — seuls les boutons ◀ ▶ et
// le texte "Page X sur Y" restent alors affichés, sans puces.
const MAX_DOTS = 9;

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  scrollToTop = true,
}) => {
  if (!totalPages || totalPages <= 1) return null;

  const showDots = totalPages <= MAX_DOTS;

  // Changer de page ne change pas l'URL (état local du listage, voir les
  // appelants) : le seul reset de scroll de l'appli (Layout.jsx, sur
  // changement de PAGE au sens route) ne se déclenche donc jamais ici. Même
  // symptôme que celui déjà documenté dans Layout.jsx — rester scrollé en
  // bas d'une longue liste après un changement de page la fait paraître
  // vide — donc même correctif : un saut instantané en haut, pas
  // d'animation lente à chaque clic.
  //
  // `scrollToTop` : ce comportement suppose que la liste paginée occupe
  // TOUTE la page (les listages Adhérents/Moniteurs/... par ex.) — faux
  // pour une pagination nichée dans une petite section au milieu d'une
  // page plus longue (ex. "Mon matériel attribué"/"Dernières plongées" sur
  // ProfilePage.jsx, ou les listes du dossier d'une fiche Détails) : là,
  // remonter toute la fenêtre en haut fait perdre la position de lecture
  // pour une section qui n'a, elle, pas besoin de défiler. Ces appelants
  // passent `scrollToTop={false}`.
  const goToPage = (page) => {
    onPageChange(page);
    if (scrollToTop) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  };

  return (
    <div className="flex items-center justify-center gap-4 sm:gap-6 pt-4 mt-2 border-t border-gray-100 dark:border-gray-800">
      <button
        type="button"
        onClick={() => goToPage(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        aria-label="Page précédente"
        className="shrink-0 p-2.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-cyan-300 hover:text-cyan-600 dark:hover:border-cyan-700 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 dark:disabled:hover:border-gray-700 disabled:hover:text-gray-500 disabled:hover:bg-transparent"
      >
        <FiChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex flex-col items-center gap-2">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400 tabular-nums">
          Page {currentPage} sur {totalPages}
        </span>
        {showDots && (
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => goToPage(page)}
                aria-label={`Page ${page}`}
                aria-current={currentPage === page ? "page" : undefined}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  currentPage === page
                    ? "w-5 bg-cyan-500"
                    : "w-1.5 bg-gray-300 dark:bg-gray-700 hover:bg-cyan-300 dark:hover:bg-cyan-800"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => goToPage(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        aria-label="Page suivante"
        className="shrink-0 p-2.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-cyan-300 hover:text-cyan-600 dark:hover:border-cyan-700 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 dark:disabled:hover:border-gray-700 disabled:hover:text-gray-500 disabled:hover:bg-transparent"
      >
        <FiChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Pagination;
