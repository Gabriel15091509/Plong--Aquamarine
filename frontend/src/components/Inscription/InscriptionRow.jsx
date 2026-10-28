import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiEye,
  FiTrash2,
  FiCheck,
  FiX,
  FiClipboard,
  FiCalendar,
  FiClock,
  FiUser,
  FiRefreshCw,
} from "react-icons/fi";
import StatusBadge from "../Common/StatusBadge";
import { formatDate } from "../../utils/helpers";
import { photoUrl } from "../../utils/photoUrl";
import { STATUT_INSCRIPTION } from "../../utils/constants";

// Rendu d'une ligne d'inscription — extrait de InscriptionList (dont le
// rôle reste le filtrage/la pagination/la liste des actions), pour que la
// logique d'affichage d'une inscription individuelle (badges, boutons
// d'action conditionnels selon statut/rôle) vive dans son propre composant.
const InscriptionRow = ({
  inscription,
  adherentInfo,
  sortieInfo,
  capacityInfo,
  isAdmin,
  isOwnInscription,
  // Clé de l'action en cours pour CETTE inscription (ex. `confirm-42`,
  // `cancel-42`, `waitlist-42`, `delete-42`) — voir InscriptionList.jsx.
  // null/undefined tant qu'aucune requête n'est en vol pour cette ligne.
  // Comparé ci-dessous par action pour ne remplacer QUE l'icône concernée
  // par un spinner, pas les autres boutons de la ligne.
  actionLoading,
  onRequestConfirm,
  onRequestWaitlist,
  onRequestCancel,
  onRequestDelete,
  selected,
  onToggleSelect,
  // "grid" : carte verticale centrée (icône/photo en haut, comme
  // SortiesPage/AdherentList) — mieux adaptée au mobile. "list" (défaut) :
  // ligne horizontale historique, gardée pour la bascule manuelle.
  variant = "list",
}) => {
  const adherentName = adherentInfo.nom;
  const hasAvailablePlace = (capacityInfo.placesDisponibles || 0) > 0;
  // Une fois le pointage fait (présence enregistrée le jour de la sortie),
  // confirmer ou annuler l'inscription n'a plus de sens : le sort de
  // l'inscription est déjà scellé par la présence/absence constatée.
  const canConfirm =
    isAdmin &&
    !inscription.presence_checked &&
    [STATUT_INSCRIPTION.EN_ATTENTE, STATUT_INSCRIPTION.LISTE_ATTENTE].includes(
      inscription.statut,
    ) &&
    hasAvailablePlace;
  const canMoveToWaitlist =
    isAdmin &&
    inscription.statut === STATUT_INSCRIPTION.EN_ATTENTE &&
    !hasAvailablePlace;

  const rowId = inscription.id_inscription;
  const isConfirming = actionLoading === `confirm-${rowId}`;
  const isWaitlisting = actionLoading === `waitlist-${rowId}`;
  const isCanceling = actionLoading === `cancel-${rowId}`;
  const isDeleting = actionLoading === `delete-${rowId}`;
  const loading = isConfirming || isWaitlisting || isCanceling || isDeleting;

  if (variant === "grid") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col items-center text-center hover:shadow-lg transition-shadow"
      >
        {adherentInfo.photo ? (
          <img
            src={photoUrl(adherentInfo.photo)}
            alt={adherentName}
            className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-700 shadow-sm"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-700 shadow-sm">
            <FiUser className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
          </div>
        )}
        <h3 className="font-semibold text-gray-900 dark:text-white mt-3 break-words w-full">
          {adherentName}
          {isOwnInscription && (
            <span className="ml-1 text-blue-600 dark:text-blue-400 font-normal">(Vous)</span>
          )}
        </h3>
        <p className="text-sm text-indigo-600 dark:text-indigo-400 truncate w-full">
          {sortieInfo.label}
        </p>
        <p className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
          <FiCalendar className="w-3.5 h-3.5 flex-shrink-0" />
          {formatDate(inscription.date_inscription)}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
          {inscription.presence_checked ? (
            inscription.presence ? (
              <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                <FiCheck className="w-3.5 h-3.5" /> Présent
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                <FiX className="w-3.5 h-3.5" /> Absent
              </span>
            )
          ) : (
            <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
              <FiClock className="w-3.5 h-3.5" /> Non pointé
            </span>
          )}
          <StatusBadge status={inscription.statut} />
        </div>
        <div className="flex items-center justify-center flex-wrap gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 w-full">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={!!selected}
              onChange={onToggleSelect}
              className="mr-1 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
              title="Sélectionner"
            />
          )}
          {isAdmin && (
            <Link
              to={`/sorties/${inscription.id_sortie}/pointage`}
              className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              title="Gérer le pointage"
            >
              <FiClipboard className="w-4 h-4" />
            </Link>
          )}
          {canConfirm && (
            <button
              onClick={onRequestConfirm}
              disabled={loading}
              className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-50"
              title="Confirmer"
            >
              {isConfirming ? (
                <FiRefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FiCheck className="w-4 h-4" />
              )}
            </button>
          )}
          {canMoveToWaitlist && (
            <button
              onClick={onRequestWaitlist}
              disabled={loading}
              className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors disabled:opacity-50"
              title="Mettre en liste d'attente"
            >
              {isWaitlisting ? (
                <FiRefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FiClock className="w-4 h-4" />
              )}
            </button>
          )}
          {(inscription.statut === STATUT_INSCRIPTION.EN_ATTENTE ||
            inscription.statut === STATUT_INSCRIPTION.CONFIRMEE ||
            inscription.statut === STATUT_INSCRIPTION.LISTE_ATTENTE) &&
            !inscription.presence_checked &&
            (isAdmin || isOwnInscription) && (
              <button
                onClick={onRequestCancel}
                disabled={loading}
                className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50"
                title="Annuler"
              >
                {isCanceling ? (
                  <FiRefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <FiX className="w-4 h-4" />
                )}
              </button>
            )}
          <Link
            to={`/inscriptions/${inscription.id_inscription}`}
            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            title="Voir"
          >
            <FiEye className="w-4 h-4" />
          </Link>
          {isAdmin && (
            <button
              onClick={onRequestDelete}
              disabled={loading}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
              title="Supprimer"
            >
              {isDeleting ? (
                <FiRefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <FiTrash2 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-4">
        {onToggleSelect && (
          <input
            type="checkbox"
            checked={!!selected}
            onChange={onToggleSelect}
            className="mt-1 h-4 w-4 flex-shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
          />
        )}
        {/* Photo en évidence */}
        <div className="flex-shrink-0">
          {adherentInfo.photo ? (
            <img
              src={photoUrl(adherentInfo.photo)}
              alt={adherentName}
              className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200 dark:border-indigo-700 shadow-sm"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 flex items-center justify-center border-2 border-indigo-200 dark:border-indigo-700 shadow-sm">
              <FiUser className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
            </div>
          )}
          {isOwnInscription && (
            <div className="text-center mt-1">
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                (Vous)
              </span>
            </div>
          )}
        </div>

        {/* Informations */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900 dark:text-white break-words">
                  {adherentName}
                </h3>
                <span className="text-sm text-gray-400 dark:text-gray-500">•</span>
                <span className="text-sm text-indigo-600 dark:text-indigo-400">
                  {sortieInfo.label}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <FiCalendar className="w-3.5 h-3.5 flex-shrink-0" />
                  {formatDate(inscription.date_inscription)}
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  {inscription.presence_checked ? (
                    inscription.presence ? (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <FiCheck className="w-3.5 h-3.5" /> Présent
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <FiX className="w-3.5 h-3.5" /> Absent
                      </span>
                    )
                  ) : (
                    <span className="flex items-center gap-1 text-gray-400">
                      <FiClock className="w-3.5 h-3.5" /> Non pointé
                    </span>
                  )}
                  <StatusBadge status={inscription.statut} />
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Pointage */}
              {isAdmin && (
                <Link
                  to={`/sorties/${inscription.id_sortie}/pointage`}
                  className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                  title="Gérer le pointage"
                >
                  <FiClipboard className="w-4 h-4" />
                </Link>
              )}

              {/* Confirmer */}
              {canConfirm && (
                <button
                  onClick={onRequestConfirm}
                  disabled={loading}
                  className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-50"
                  title="Confirmer"
                >
                  {isConfirming ? (
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FiCheck className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Liste d'attente */}
              {canMoveToWaitlist && (
                <button
                  onClick={onRequestWaitlist}
                  disabled={loading}
                  className="p-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors disabled:opacity-50"
                  title="Mettre en liste d'attente"
                >
                  {isWaitlisting ? (
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FiClock className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Annuler */}
              {(inscription.statut === STATUT_INSCRIPTION.EN_ATTENTE ||
                inscription.statut === STATUT_INSCRIPTION.CONFIRMEE ||
                inscription.statut === STATUT_INSCRIPTION.LISTE_ATTENTE) &&
                !inscription.presence_checked &&
                (isAdmin || isOwnInscription) && (
                  <button
                    onClick={onRequestCancel}
                    disabled={loading}
                    className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Annuler"
                  >
                    {isCanceling ? (
                      <FiRefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <FiX className="w-4 h-4" />
                    )}
                  </button>
                )}

              {/* Voir */}
              <Link
                to={`/inscriptions/${inscription.id_inscription}`}
                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="Voir"
              >
                <FiEye className="w-4 h-4" />
              </Link>

              {/* Supprimer */}
              {isAdmin && (
                <button
                  onClick={onRequestDelete}
                  disabled={loading}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                  title="Supprimer"
                >
                  {isDeleting ? (
                    <FiRefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <FiTrash2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default InscriptionRow;
