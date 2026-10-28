import React from "react";
import { useNavigate } from "react-router-dom";
import { FiChevronRight } from "react-icons/fi";

// Fil d'Ariane pour les pages qui ne sont PAS des fiches détail en modale
// (voir ModalLink.jsx/DetailsModal.jsx pour ces dernières, qui ont déjà
// leur propre bouton de fermeture) — Mon profil, Paramètres, Notifications,
// À propos, Confidentialité, Pointage, Créer un utilisateur : ces pages
// n'ont sinon aucun moyen de revenir en arrière autre que la Sidebar (qui
// ne "revient" nulle part en particulier) ou le bouton retour du
// navigateur.
//
// Premier segment volontairement générique ("Retour", jamais le nom d'une
// page précise) : ces pages sont accessibles depuis plusieurs origines
// différentes (ex. Mon profil, depuis le dropdown du Header, peut aussi
// bien s'ouvrir depuis le Tableau de bord que depuis Sorties) et
// navigate(-1) renvoie vers la VRAIE page précédente, quelle qu'elle soit —
// un libellé fixe du genre "Tableau de bord" mentirait dès qu'on vient
// d'ailleurs. Reste un vrai fil d'Ariane visuellement (segment cliquable +
// séparateur + page actuelle), pas qu'un simple lien "Retour" isolé.
const Breadcrumb = ({ current }) => {
  const navigate = useNavigate();

  return (
    <nav
      aria-label="Fil d'Ariane"
      className="flex items-center gap-1.5 text-sm mb-3"
    >
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="font-medium text-gray-500 hover:text-cyan-600 dark:text-gray-400 dark:hover:text-cyan-400 transition-colors"
      >
        Retour
      </button>
      <FiChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 shrink-0" />
      <span className="font-medium text-gray-700 dark:text-gray-300 truncate">
        {current}
      </span>
    </nav>
  );
};

export default Breadcrumb;
