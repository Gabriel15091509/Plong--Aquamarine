import React, { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FiCheck, FiX, FiClock, FiUser, FiEdit2 } from "react-icons/fi";
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
    } catch (error) {
      // Error handled in parent
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
      setShowReason(false);
      setReason("");
      setJustified(false);
    } catch (error) {
      // Error handled in parent
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-900 rounded-xl border p-4 transition-all ${
        isChecked
          ? inscription.presence
            ? "border-green-200 dark:border-green-800/30 bg-green-50/30 dark:bg-green-900/10"
            : "border-red-200 dark:border-red-800/30 bg-red-50/30 dark:bg-red-900/10"
          : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
              isChecked
                ? inscription.presence
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
          >
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
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full ${
                  inscription.presence
                    ? "text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                    : "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {inscription.presence ? (
                  <FiCheck className="w-3.5 h-3.5" />
                ) : (
                  <FiX className="w-3.5 h-3.5" />
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
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                title="Annuler le pointage"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePresence(true)}
                disabled={isLoading || loading}
                className="px-3.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded-lg transition-all disabled:opacity-50"
              >
                ✅ Présent
              </button>

              {showReason ? (
                <div className="flex items-center gap-1.5 animate-in fade-in duration-200">
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Raison..."
                    className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white w-36"
                    autoFocus
                  />
                  <label className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={justified}
                      onChange={(e) => setJustified(e.target.checked)}
                      className="w-3.5 h-3.5 text-red-600 rounded focus:ring-red-500"
                    />
                    Justifié
                  </label>
                  <button
                    onClick={handleAbsence}
                    disabled={isLoading || loading || !reason.trim()}
                    className="px-2.5 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all disabled:opacity-50"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => {
                      setShowReason(false);
                      setReason("");
                    }}
                    className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowReason(true)}
                  disabled={isLoading || loading}
                  className="px-3.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg transition-all disabled:opacity-50"
                >
                  ❌ Absent
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Raison d'absence */}
      {isChecked && !inscription.presence && inscription.absence_reason && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-1.5 flex items-center gap-2"
        >
          <span className="font-medium text-gray-600 dark:text-gray-300">
            Raison :
          </span>
          {inscription.absence_reason}
          {inscription.absence_justified && (
            <span className="text-green-600 dark:text-green-400 font-medium">
              ✓ Justifié
            </span>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default PresenceCheck;
