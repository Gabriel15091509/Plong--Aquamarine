import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiTrash2 } from "react-icons/fi";

// Barre d'actions groupées générique, réutilisée par toutes les pages de
// listage (voir useSelection) : apparaît dès qu'au moins un élément est
// sélectionné. `onDelete` est optionnel (masque le bouton Supprimer si le
// rôle courant n'a pas le droit de supprimer) ; `children` permet
// d'ajouter d'autres actions groupées propres à une liste précise (ex.
// Valider en masse) sans dupliquer la barre elle-même.
const BulkActionBar = ({
  count,
  onClear,
  onDelete,
  deleteLabel = "Supprimer",
  deleteDisabled = false,
  children,
}) => (
  <AnimatePresence>
    {count > 0 && (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 dark:border-indigo-800 dark:bg-indigo-900/30"
      >
        <span className="text-sm font-medium text-indigo-900 dark:text-indigo-200">
          {count} sélectionné{count > 1 ? "s" : ""}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 text-sm font-medium text-indigo-700 hover:text-indigo-900 dark:text-indigo-300 dark:hover:text-indigo-100"
        >
          <FiX className="w-4 h-4" /> Désélectionner
        </button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {children}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleteDisabled}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiTrash2 className="w-4 h-4" /> {deleteLabel} ({count})
            </button>
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default BulkActionBar;
