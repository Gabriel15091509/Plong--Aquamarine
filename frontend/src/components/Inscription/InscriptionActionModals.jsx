import React from "react";
import { motion } from "framer-motion";
import { FiCheck, FiX, FiClock } from "react-icons/fi";
import ModalOverlay from "../Common/ModalOverlay";

// Regroupe les 3 modales de confirmation d'action (confirmer/annuler/mettre
// en liste d'attente une inscription) — extraites de InscriptionList pour
// alléger ce fichier ; la modale de suppression, elle, utilise déjà le
// composant partagé Common/ConfirmModal.
const InscriptionActionModals = ({
  confirmModal,
  onCancelConfirm,
  onConfirm,
  cancelModal,
  onCancelCancel,
  onCancel,
  waitlistModal,
  onCancelWaitlist,
  onWaitlist,
}) => (
  <>
    {confirmModal && (
      <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
        >
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 mb-4">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <FiCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Confirmer l'inscription</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Êtes-vous sûr de vouloir confirmer cette inscription ?
            <br />
            <span className="text-sm text-gray-500">
              L'adhérent sera officiellement inscrit à la sortie.
            </span>
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancelConfirm}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => onConfirm(confirmModal)}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors"
            >
              Confirmer
            </button>
          </div>
        </motion.div>
      </ModalOverlay>
    )}

    {cancelModal && (
      <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
        >
          <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400 mb-4">
            <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/30">
              <FiX className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Annuler l'inscription</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Êtes-vous sûr de vouloir annuler cette inscription ?
            <br />
            <span className="text-sm text-gray-500">
              Cette action peut être annulée si nécessaire.
            </span>
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancelCancel}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => onCancel(cancelModal)}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors"
            >
              Annuler l'inscription
            </button>
          </div>
        </motion.div>
      </ModalOverlay>
    )}

    {waitlistModal && (
      <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl"
        >
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-4">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <FiClock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Liste d'attente</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Ajouter cette inscription à la liste d'attente ?
            <br />
            <span className="text-sm text-gray-500">
              L'adhérent sera notifié si une place se libère.
            </span>
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancelWaitlist}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => onWaitlist(waitlistModal)}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors"
            >
              Mettre en liste d'attente
            </button>
          </div>
        </motion.div>
      </ModalOverlay>
    )}
  </>
);

export default InscriptionActionModals;
