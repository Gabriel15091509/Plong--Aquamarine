import React from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiLogIn } from "react-icons/fi";
import Logo from "../../components/Common/Logo";
import AboutPage from "./AboutPage";

// Vitrine publique du club (même contenu que AboutPage.jsx, réutilisé tel
// quel), accessible sans connexion depuis le lien "Découvrir le club" de
// LoginPage.jsx — volontairement SANS Layout (pas de Sidebar/Header/menu de
// l'application), juste une coquille minimale : logo + bouton de connexion
// en en-tête, lien de retour en pied de page. /about (protégé, dans le
// menu) reste la version consultée une fois connecté.
const PublicAboutPage = () => {
  return (
    // Pas de conteneur "max-w-*" central : même convention que Layout.jsx
    // (main className="p-4 sm:p-6", sans plafond de largeur) pour que la
    // page occupe tout l'écran plutôt que de laisser de grandes bandes
    // vides sur les côtés en desktop large.
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="flex items-center justify-between pb-4 sm:pb-6">
        <Link to="/login" className="flex items-center gap-3">
          <Logo size="lg" />
          <span className="hidden sm:inline text-xl font-bold text-gray-800 dark:text-white">
            Plongée Club
          </span>
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-primary-500 to-ocean-500 rounded-xl shadow-md hover:shadow-lg transition-shadow"
        >
          <FiLogIn className="w-5 h-5" />
          Connexion
        </Link>
      </div>

      <AboutPage />

      <div className="pt-10 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
};

export default PublicAboutPage;
