import React, { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FiCheck, FiX, FiClock, FiUser } from "react-icons/fi";
import { formatTime } from "../../utils/helpers";

const PresenceCheck = ({ inscription, onCheck, loading, onCancel }) => {
  const [showReason, setShowReason] = useState(false);
  const [reason, setReason] = useState("");
  const [justified, setJustified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handlePresence = async (present) => {
    setIsLoading(true);
    try {
      await onCheck(inscription.id_inscription, {
        presence: present,
        presence_checked: true,
        presence_check_time: new Date().toISOString(),
      });
      toast.success(present ? "Présence enregistrée" : "Absence enregistrée");
    } catch (error) {
      toast.error("Erreur lors du pointage");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbsence = async () => {
    if (!reason.trim()) {
      toast.error("Veuillez indiquer une raison");
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
      toast.success("Absence enregistrée");
      setShowReason(false);
      setReason("");
      setJustified(false);
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsLoading(false);
    }
  };

  const isChecked = inscription.presence_checked;
  const adherent = inscription.adherent || {};
  const fullName =
    adherent.nom && adherent.prenom
      ? `${adherent.nom} ${adherent.prenom}`
      : `#${inscription.num_adherent}`;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 font-medium text-sm flex-shrink-0">
            {fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {fullName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              #{inscription.num_adherent} • {adherent.email || "—"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isChecked ? (
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${
                  inscription.presence
                    ? "text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                    : "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {inscription.presence ? (
                  <FiCheck className="w-3 h-3" />
                ) : (
                  <FiX className="w-3 h-3" />
                )}
                {inscription.presence ? "Présent" : "Absent"}
              </span>
              {inscription.presence_check_time && (
                <span className="text-xs text-gray-400">
                  {formatTime(inscription.presence_check_time)}
                </span>
              )}
              <button
                onClick={onCancel}
                disabled={isLoading}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                title="Annuler le pointage"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePresence(true)}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded-lg transition-colors disabled:opacity-50"
              >
                Présent
              </button>

              {showReason ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Raison..."
                    className="px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-32"
                    autoFocus
                  />
                  <label className="flex items-center gap-1 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={justified}
                      onChange={(e) => setJustified(e.target.checked)}
                      className="w-3.5 h-3.5 text-red-600 rounded"
                    />
                    Justifié
                  </label>
                  <button
                    onClick={handleAbsence}
                    disabled={isLoading || !reason.trim()}
                    className="px-2.5 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => {
                      setShowReason(false);
                      setReason("");
                    }}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowReason(true)}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg transition-colors disabled:opacity-50"
                >
                  Absent
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {isChecked && !inscription.presence && inscription.absence_reason && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-1.5">
          <span className="font-medium">Raison :</span>{" "}
          {inscription.absence_reason}
          {inscription.absence_justified && (
            <span className="ml-2 text-green-600 dark:text-green-400">
              ✓ Justifié
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default PresenceCheck;
