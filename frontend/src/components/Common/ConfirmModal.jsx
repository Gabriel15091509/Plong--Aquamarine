import React from "react";
import { motion } from "framer-motion";
import { FiTrash2 } from "react-icons/fi";
import ModalOverlay from "./ModalOverlay";

// Modal de confirmation générique (suppression/action destructive), factorisé
// à partir du même bloc JSX répété à l'identique dans une trentaine
// d'écrans List/Details — un seul endroit à faire évoluer désormais.
const ConfirmModal = ({
  isOpen,
  title = "Confirmer la suppression",
  message,
  warningText = "Cette action est irréversible.",
  confirmLabel = "Supprimer",
  cancelLabel = "Annuler",
  onConfirm,
  onCancel,
  icon: Icon = FiTrash2,
}) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
      >
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
          <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
            <Icon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold">{title}</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}
          {warningText && (
            <>
              <br />
              <span className="text-sm text-red-500 font-medium">
                {warningText}
              </span>
            </>
          )}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </ModalOverlay>
  );
};

export default ConfirmModal;
