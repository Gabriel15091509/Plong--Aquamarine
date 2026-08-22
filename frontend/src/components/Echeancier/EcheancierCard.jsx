import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import ModalOverlay from "../Common/ModalOverlay";
import { useEcheanciers } from "../../hooks/Echeancier/useEcheanciers";
import { formatCurrency, formatDate } from "../../utils/helpers";
import { MODE_PAIEMENT_OPTIONS } from "../../utils/constants";
import StatusBadge from "../Common/StatusBadge";
import EcheancierCreationModal from "./EcheancierCreationModal";

// Petite modale de confirmation pour régler une échéance donnée — le montant
// est fixé par l'échéance elle-même (pas de saisie libre), seul le mode de
// paiement reste à choisir. Même pattern visuel que FormationPaiementModal.
const PayerEcheanceModal = ({ echeance, onClose, ownerQueryKeys }) => {
  const { usePayerEcheance } = useEcheanciers();
  const payerEcheance = usePayerEcheance(ownerQueryKeys);
  const [mode, setMode] = useState("Espèces");
  const submittingRef = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await payerEcheance.mutateAsync({ id_echeance: echeance.id_echeance, data: { mode } });
      onClose();
    } catch (error) {
      // toast déjà géré par le hook
    } finally {
      submittingRef.current = false;
    }
  };

  return (
    <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 25 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 dark:border-gray-800"
      >
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Régler l&apos;échéance n°{echeance.numero}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Montant :{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {formatCurrency(echeance.montant)}
          </span>
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Mode de paiement
          </label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {MODE_PAIEMENT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={payerEcheance.isPending}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 rounded-xl transition-all duration-300 shadow-lg shadow-green-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Marquer payée
          </button>
        </div>
      </motion.form>
    </ModalOverlay>
  );
};

// Carte échéancier, agnostique du type de paiement (Adhésion/Formation/
// Sortie) : affiche le(s) échéancier(s) existants pour cette référence, avec
// leurs échéances et un bouton pour régler celles en attente/retard, et
// propose d'en créer un nouveau s'il n'y en a pas déjà un en cours.
const EcheancierCard = ({
  type_paiement,
  reference_id,
  num_adherent,
  soldeRestant,
  canManage = false,
  ownerQueryKeys,
}) => {
  const { useGetByReference } = useEcheanciers();
  const { data: echeanciers, isLoading } = useGetByReference(type_paiement, reference_id);
  const [showCreation, setShowCreation] = useState(false);
  const [echeanceAPayer, setEcheanceAPayer] = useState(null);

  if (isLoading) return null;

  const liste = echeanciers?.data || [];
  const aUnEcheancierEnCours = liste.some((e) => e.statut === "En cours");

  return (
    <div className="space-y-4">
      {liste.map((echeancier) => (
        <div
          key={echeancier.id_echeancier}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Échéancier — {formatCurrency(echeancier.montant_total)} en {echeancier.nb_echeances} fois
              </h4>
            </div>
            <StatusBadge status={echeancier.statut} />
          </div>

          <div className="space-y-2">
            {(echeancier.echeances || []).map((echeance) => (
              <div
                key={echeance.id_echeance}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50"
              >
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    n°{echeance.numero}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {formatDate(echeance.date_echeance)}
                  </span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {formatCurrency(echeance.montant)}
                  </span>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2">
                  <StatusBadge status={echeance.statut} />
                  {canManage && ["En attente", "En retard"].includes(echeance.statut) && (
                    <button
                      type="button"
                      onClick={() => setEcheanceAPayer(echeance)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 rounded-lg transition-all duration-300 flex-shrink-0"
                    >
                      Marquer payée
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {canManage && !aUnEcheancierEnCours && (
        <button
          type="button"
          onClick={() => setShowCreation(true)}
          className="px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          Créer un échéancier
        </button>
      )}

      <EcheancierCreationModal
        isOpen={showCreation}
        onClose={() => setShowCreation(false)}
        type_paiement={type_paiement}
        reference_id={reference_id}
        num_adherent={num_adherent}
        soldeRestant={soldeRestant}
      />

      {echeanceAPayer && (
        <PayerEcheanceModal
          echeance={echeanceAPayer}
          onClose={() => setEcheanceAPayer(null)}
          ownerQueryKeys={ownerQueryKeys}
        />
      )}
    </div>
  );
};

export default EcheancierCard;
