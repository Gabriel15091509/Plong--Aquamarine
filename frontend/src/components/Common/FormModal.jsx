import React from "react";
import { motion } from "framer-motion";
import { FiX } from "react-icons/fi";
import ModalOverlay from "./ModalOverlay";

const SIZE_CLASSES = {
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

// Classes Tailwind écrites en toutes lettres (jamais interpolées, ex.
// `bg-${iconColor}-100`) : le JIT de Tailwind ne scanne que des chaînes
// littérales présentes dans le code source — une classe construite au
// runtime n'apparaît dans aucun fichier source, donc n'est jamais générée
// dans le CSS final (la couleur se retrouve simplement absente, sans
// erreur JS visible). D'où cette table plutôt qu'un template literal.
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

// Coquille partagée pour les formulaires de création/édition de l'app une
// fois convertis en modale — reprend le langage visuel déjà établi par
// ConfirmModal.jsx (fond, coins, ombre, chip icône coloré) et le pattern de
// fermeture/défilement de PdfPreviewModal.jsx (clic sur le fond ferme, clic
// dans le panneau ne ferme pas — stopPropagation ; bouton FiX ; en-tête fixe
// + corps qui défile indépendamment via `flex flex-col overflow-hidden`).
//
// Coquille volontairement fine : PAS de pied de page intégré. Chaque
// formulaire garde son propre pied (Annuler + bouton de soumission, son
// propre état de chargement/spinner) — FormModal n'a pas besoin de connaître
// le libellé, la couleur ou l'état de 16 boutons différents ; il fournit
// seulement portail + fond + panneau + en-tête + zone de défilement pour le
// contenu passé en `children` (corps + pied du formulaire).
const FormModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  iconColor = "blue",
  size = "md",
  children,
}) => {
  if (!isOpen) return null;

  const iconClasses = ICON_COLOR_CLASSES[iconColor] || ICON_COLOR_CLASSES.blue;

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
          SIZE_CLASSES[size] || SIZE_CLASSES.md
        } max-h-[90vh] flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className={`p-2 rounded-xl shrink-0 ${iconClasses}`}>
                <Icon className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors shrink-0"
            aria-label="Fermer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </motion.div>
    </ModalOverlay>
  );
};

export default FormModal;
