import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiLogIn, FiMenu, FiX, FiMapPin } from "react-icons/fi";
import Logo from "../../components/Common/Logo";
import { CLUB_LOCATION } from "../../utils/constants";
import AboutPage from "./AboutPage";

// Ancres vers les sections identifiées par id dans AboutPage.jsx (histoire,
// activites, equipe, infos-pratiques) — à garder synchronisé avec ces id si
// AboutPage.jsx est réorganisé.
const NAV_LINKS = [
  { href: "#histoire", label: "Histoire" },
  { href: "#activites", label: "Activités" },
  { href: "#equipe", label: "Équipe" },
  { href: "#infos-pratiques", label: "Infos pratiques" },
];

// Vitrine publique du club (même contenu que AboutPage.jsx, réutilisé tel
// quel), accessible sans connexion depuis le lien "Découvrir le club" de
// LoginPage.jsx — volontairement SANS Layout (pas de Sidebar/Header/menu de
// l'application), avec sa propre coquille "site vitrine" : nav à ancres +
// pied de page, plutôt qu'un simple lien de retour. /about (protégé, dans
// le menu) reste la version consultée une fois connecté, sans cette
// coquille (elle n'a de sens que pour un visiteur non authentifié).
const PublicAboutPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* En-tête collant avec fond flouté : reste lisible par-dessus le hero
          plein cadre dès qu'on défile, sans occuper de place fixe au repos
          (contrairement à un vrai header applicatif) — touche "site vitrine"
          plutôt que simple bandeau statique. */}
      <div className="sticky top-0 z-30 backdrop-blur-md bg-gray-50/80 dark:bg-gray-900/80 border-b border-gray-200/60 dark:border-gray-800/60">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <Link to="/login" className="flex items-center gap-3 flex-shrink-0">
            <Logo size="lg" />
            <span className="hidden sm:inline font-display text-xl font-semibold text-gray-800 dark:text-white">
              Aquanature Plongée
            </span>
          </Link>

          {/* Nav à ancres : visible à partir de md, pour laisser toute la
              largeur au logo + CTA sur mobile (menu déroulant à la place,
              voir plus bas). */}
          <nav className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-primary-500 to-ocean-500 rounded-xl shadow-md hover:shadow-lg transition-shadow"
            >
              <FiLogIn className="w-4 h-4 sm:w-5 sm:h-5" />
              Connexion
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              className="md:hidden p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800/60 transition-colors"
            >
              {menuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="md:hidden px-4 sm:px-6 pb-4 flex flex-col gap-1 border-t border-gray-200/60 dark:border-gray-800/60 pt-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}
      </div>

      <div className="flex-1 p-4 sm:p-6">
        <AboutPage />
      </div>

      {/* Pied de page "site vitrine" : coordonnées réelles du club (voir
          CLUB_LOCATION, même source que la carte d'itinéraire des sorties)
          — pas de téléphone/email/réseaux sociaux ici, aucune donnée de ce
          type n'existe ailleurs dans l'application, mieux vaut les omettre
          que d'en inventer. */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-6">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <div>
              <p className="font-display font-semibold text-gray-800 dark:text-white">
                Aquanature Plongée
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Club affilié FFESM · Saint-Leu, La Réunion
              </p>
            </div>
          </div>
          <div className="sm:text-right flex sm:justify-end items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
            <FiMapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{CLUB_LOCATION.address}</span>
          </div>
        </div>
        <div className="px-4 sm:px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400 dark:text-gray-500">
          <p>© {new Date().getFullYear()} Aquanature Plongée. Tous droits réservés.</p>
          <Link to="/login" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            Retour à la connexion
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default PublicAboutPage;
