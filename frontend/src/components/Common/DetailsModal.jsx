import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import ModalOverlay from "./ModalOverlay";

const SIZE_CLASSES = {
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-5xl",
};

// Table plutôt que template literal interpolé (`bg-${iconColor}-100`) :
// voir le même commentaire dans FormModal.jsx — le JIT Tailwind ne scanne
// que des classes écrites en toutes lettres dans le code source.
const ICON_COLOR_CLASSES = {
  blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
  emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
  purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
  cyan: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400",
  pink: "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",
};

// Coquille de modale pour une fiche Détails (voir MoniteurDetails.jsx, puis
// les autres entités une fois ce modèle validé) — même langage visuel que
// FormModal.jsx (fond, coins, ombre, en-tête avec chip icône + titre +
// fermer), mais le corps ne défile JAMAIS avec tout le contenu à la suite :
// il est découpé en "pages" (une par ancien <SectionCard>, voir la prop
// `pages`), une seule affichée à la fois, navigable par ◀ ▶ + "Page X / Y"
// en pied de modale — plutôt que d'empiler toutes les sections et faire
// défiler (l'ancien reproche : "trop d'espace gaspillé"/scroll interminable
// pour une fiche avec beaucoup de sections).
//
// `overflow-y-auto` reste posé sur la zone de contenu par précaution (un
// nombre inhabituel d'éléments dans une page ne doit jamais couper
// silencieusement du contenu, ce qui serait pire qu'un défilement rare) —
// mais chaque page est pensée courte pour ne normalement jamais l'activer.
//
// Hauteur AU CONTENU (`max-h-[80vh]`, pas `h-[80vh]` fixe) : une fiche à 1
// page courte (ex. le dossier d'un adhérent sans rien encore dedans) se
// contente désormais de sa hauteur réelle plutôt que de forcer un grand
// vide en bas pour "faire aussi grand qu'une fiche à 3 pages" — la taille
// varie librement d'une fiche à l'autre, comme le fait déjà la LARGEUR via
// la prop `size` ci-dessus. `max-h-[80vh]` reste le plafond pour une page
// longue : passé cette hauteur, la zone de contenu (`overflow-y-auto`
// ci-dessous) défile normalement, header/pied de modale restant fixes
// (`shrink-0`) — même mécanique qu'avant, seule la borne basse (contenu
// court) change. Plafonnées à 3 pages sans que ce soit un objectif à
// atteindre (voir chaque composant XDetails.jsx : au-delà de 3, regrouper
// plutôt qu'ajouter une 4e page — en dessous, une fiche simple garde 1 ou 2
// pages, jamais gonflée pour faire du remplissage).
const DetailsModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  iconColor = "cyan",
  size = "xl",
  pages = [],
  headerExtra,
  initialPageIndex = 0,
}) => {
  const [pageIndex, setPageIndex] = useState(initialPageIndex);

  // Revient toujours à la première page à l'ouverture — sans ça, rouvrir
  // (ou passer d'une fiche à une autre pendant que la modale reste montée)
  // resterait sur la page où on avait laissé la précédente consultation.
  // `initialPageIndex` permet à l'appelant de cibler une autre page dès
  // l'ouverture (ex. AdherentDetails.jsx + #materiel-attribue, ouvert
  // depuis AlerteDetailsModal.jsx) — sans lui, l'ancien lien "voir mon
  // matériel en retard" rouvrirait toujours sur la première page.
  useEffect(() => {
    if (isOpen) setPageIndex(initialPageIndex);
  }, [isOpen, title, initialPageIndex]);

  if (!isOpen) return null;

  const total = pages.length;
  const safeIndex = Math.min(pageIndex, Math.max(total - 1, 0));
  const current = pages[safeIndex];
  const iconClasses = ICON_COLOR_CLASSES[iconColor] || ICON_COLOR_CLASSES.cyan;
  const CurrentPageIcon = current?.icon;

  return (
    <ModalOverlay
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 25 }}
        className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full ${
          SIZE_CLASSES[size] || SIZE_CLASSES.xl
        } max-h-[80vh] flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête : identité de la fiche (ex. nom du moniteur), pas le nom
            de la page courante — celui-ci vit juste en dessous, avec le
            contenu, pour rester visible même si le titre est long.
            `flex-col sm:flex-row`, pas juste `flex-wrap` : avec `min-w-0` sur
            le bloc icône/titre (nécessaire pour que `break-words` fasse
            effet), un simple `flex-wrap` ne déclenche jamais le retour à la
            ligne — `min-w-0` rend ce bloc arbitrairement compressible, donc
            le navigateur préfère toujours le comprimer à un filet de largeur
            plutôt que de renvoyer `headerExtra` (plusieurs boutons,
            shrink-0, ex. SortieDetails.jsx : alerte/modifier/annuler) à la
            ligne suivante — et un titre/sous-titre long (ex. "Type - Lieu" +
            "N°X • Site • date") cassait alors lettre par lettre. En empilant
            explicitement les deux blocs sur mobile, le titre a toute la
            largeur de la modale sur sa propre ligne. `order-*` inverse
            l'ordre visuel seulement sur mobile : boutons d'action (fermer,
            modifier...) tout en haut, titre en dessous — repère "comment
            quitter/agir" toujours accessible en premier au pouce, sans
            attendre d'avoir scrollé/lu tout un titre potentiellement sur
            plusieurs lignes. Rien ne change à partir de sm : ordre normal
            titre à gauche, actions à droite, sur une seule ligne. */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="order-2 sm:order-1 flex items-center gap-3 min-w-0">
            {Icon && (
              <div className={`p-2 rounded-xl shrink-0 ${iconClasses}`}>
                <Icon className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white break-words">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 break-words">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="order-1 sm:order-2 flex items-center gap-1 self-end sm:self-auto shrink-0">
            {headerExtra}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              aria-label="Fermer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {current && (
          <>
            {/* Libellé de la page courante — hors de la zone défilante :
                le repère "quelle section je regarde" ne doit jamais
                disparaître avec le contenu. */}
            <div className="flex items-center gap-2 px-6 pt-3 pb-1 shrink-0 text-sm font-semibold text-gray-500 dark:text-gray-400">
              {CurrentPageIcon && <CurrentPageIcon className="w-4 h-4" />}
              {current.label}
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-3 flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={safeIndex}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.15 }}
                  className="w-full"
                >
                  {current.content}
                </motion.div>
              </AnimatePresence>
            </div>
          </>
        )}

        {/* Même langage visuel que Pagination.jsx (listages) : boutons ◀ ▶
            circulaires, "Page X / Y" et une puce par page (la puce active
            en pilule) — toute la pagination de l'appli se ressemble. */}
        {total > 1 && (
          <div className="flex items-center justify-center gap-4 sm:gap-6 px-6 py-3 border-t border-gray-100 dark:border-gray-800 shrink-0">
            <button
              type="button"
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={safeIndex === 0}
              aria-label="Page précédente"
              className="shrink-0 p-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-cyan-300 hover:text-cyan-600 dark:hover:border-cyan-700 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 dark:disabled:hover:border-gray-700 disabled:hover:text-gray-500 disabled:hover:bg-transparent"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400 tabular-nums">
                Page {safeIndex + 1} sur {total}
              </span>
              <div className="flex items-center gap-1.5">
                {pages.map((page, i) => (
                  <button
                    key={page.label || i}
                    type="button"
                    onClick={() => setPageIndex(i)}
                    aria-label={`Page ${i + 1}`}
                    aria-current={safeIndex === i ? "page" : undefined}
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      safeIndex === i
                        ? "w-5 bg-cyan-500"
                        : "w-1.5 bg-gray-300 dark:bg-gray-700 hover:bg-cyan-300 dark:hover:bg-cyan-800"
                    }`}
                  />
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPageIndex((p) => Math.min(total - 1, p + 1))}
              disabled={safeIndex === total - 1}
              aria-label="Page suivante"
              className="shrink-0 p-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-cyan-300 hover:text-cyan-600 dark:hover:border-cyan-700 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 dark:disabled:hover:border-gray-700 disabled:hover:text-gray-500 disabled:hover:bg-transparent"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </motion.div>
    </ModalOverlay>
  );
};

export default DetailsModal;
