import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { FiCheck, FiX, FiClock, FiRotateCcw } from "react-icons/fi";
import ModalOverlay from "../Common/ModalOverlay";
import { formatTime } from "../../utils/helpers";

const PresenceCheck = ({ inscription, onCheck, loading, onCancel }) => {
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [reason, setReason] = useState("");
  const [justified, setJustified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isChecked = inscription.presence_checked;
  const adherent = inscription.adherent || {};
  const fullName =
    adherent.nom && adherent.prenom
      ? `${adherent.nom} ${adherent.prenom}`
      : `#${inscription.num_adherent}`;

  // Le pointage "présent" reste bloqué côté backend tant qu'aucun paiement
  // n'a été enregistré : on le reflète ici pour ne pas laisser l'utilisateur
  // cliquer dans le vide et ne l'apprendre qu'après coup via un toast d'erreur.
  const paiementNonCommence =
    Number(inscription.montant_du) > 0 &&
    Number(inscription.montant_paye || 0) <= 0;

  const disabled = isLoading || loading;

  const handlePresence = async (present) => {
    setIsLoading(true);
    try {
      await onCheck(inscription.id_inscription, {
        presence: present,
        presence_checked: true,
        presence_check_time: new Date().toISOString(),
      });
    } catch (error) {
      // Erreur gérée par le parent
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbsence = async () => {
    if (!reason.trim()) {
      toast.error("Veuillez indiquer un motif");
      return;
    }
    setIsLoading(true);
    try {
      await onCheck(inscription.id_inscription, {
        presence: false,
        presence_checked: true,
        presence_check_time: new Date().toISOString(),
        absence_reason: reason,
        absence_justified: justified,
      });
      setShowAbsenceModal(false);
      setReason("");
      setJustified(false);
    } catch (error) {
      // Erreur gérée par le parent
    } finally {
      setIsLoading(false);
    }
  };

  const tileTone = isChecked
    ? inscription.presence
      ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700/60"
      : "bg-red-50 border-red-300 dark:bg-red-950/40 dark:border-red-700/60"
    : "bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-800";

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`relative rounded-2xl border-2 p-4 flex flex-col items-center text-center transition-colors ${tileTone}`}
      >
        {isChecked && (
          <button
            onClick={onCancel}
            disabled={disabled}
            title="Annuler le pointage"
            className="absolute top-2.5 right-2.5 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-white/70 dark:text-gray-500 dark:hover:text-gray-200 dark:hover:bg-black/20 transition-colors disabled:opacity-40"
          >
            <FiRotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-lg font-bold shadow-sm">
          {fullName.charAt(0).toUpperCase()}
        </div>

        <p className="mt-3 text-sm font-bold text-gray-900 dark:text-white truncate w-full">
          {fullName}
        </p>
        <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate w-full">
          #{inscription.num_adherent}
        </p>

        {isChecked ? (
          <div
            className={`mt-3 w-full py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 text-white ${
              inscription.presence
                ? "bg-emerald-600 dark:bg-emerald-600"
                : "bg-red-600 dark:bg-red-600"
            }`}
          >
            {inscription.presence ? (
              <FiCheck className="w-4 h-4" />
            ) : (
              <FiX className="w-4 h-4" />
            )}
            {inscription.presence ? "Présent" : "Absent"}
            {inscription.presence_check_time && (
              <span className="opacity-75 font-normal">
                {formatTime(inscription.presence_check_time)}
              </span>
            )}
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2 w-full">
            <button
              onClick={() => handlePresence(true)}
              disabled={disabled || paiementNonCommence}
              title={
                paiementNonCommence
                  ? "Aucun paiement enregistré pour cette sortie : impossible de pointer présent"
                  : undefined
              }
              className="py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-600"
            >
              Présent
            </button>
            <button
              onClick={() => setShowAbsenceModal(true)}
              disabled={disabled}
              className="py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-40"
            >
              Absent
            </button>
          </div>
        )}

        {!isChecked && paiementNonCommence && (
          <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
            <FiClock className="w-3 h-3 flex-shrink-0" />
            Paiement non débuté
          </p>
        )}

        {isChecked && !inscription.presence && inscription.absence_reason && (
          <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400 truncate w-full">
            {inscription.absence_reason}
            {inscription.absence_justified && (
              <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                • Justifiée
              </span>
            )}
          </p>
        )}
      </motion.div>

      {/* Fenêtre de saisie du motif d'absence */}
      <AnimatePresence>
        {showAbsenceModal && (
          <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
                <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                  <FiX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Déclarer une absence
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {fullName}
                  </p>
                </div>
              </div>

              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                Motif
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex : maladie, empêchement..."
                autoFocus
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-3"
              />

              <button
                type="button"
                onClick={() => setJustified((j) => !j)}
                className={`w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium border transition-colors mb-5 ${
                  justified
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-800/40 dark:text-emerald-400"
                    : "bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400"
                }`}
              >
                <FiCheck className="w-4 h-4" />
                Absence justifiée
              </button>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAbsenceModal(false);
                    setReason("");
                    setJustified(false);
                  }}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAbsence}
                  disabled={disabled || !reason.trim()}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  Confirmer
                </button>
              </div>
            </motion.div>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </>
  );
};

export default PresenceCheck;
