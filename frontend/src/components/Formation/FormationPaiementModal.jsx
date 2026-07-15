import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useFormations } from "../../hooks/Formation/useFormations";
import { formatCurrency } from "../../utils/helpers";
import { MODE_PAIEMENT_OPTIONS } from "../../utils/constants";

// Sous-feature "paiement complémentaire" d'une formation — extraite de
// FormationDetails pour la même raison que FormationCompetences : sa propre
// gestion de formulaire/soumission n'a pas besoin de vivre dans le composant
// d'affichage principal.
const FormationPaiementModal = ({ isOpen, formation, id, onClose }) => {
  const { useEnregistrerPaiement } = useFormations();
  const enregistrerPaiement = useEnregistrerPaiement();
  const [paiementForm, setPaiementForm] = useState({
    montant: "",
    mode: "Espèces",
  });
  const submittingPaiementRef = useRef(false);

  const handleEnregistrerPaiement = async (e) => {
    e.preventDefault();
    if (submittingPaiementRef.current) return;
    submittingPaiementRef.current = true;
    try {
      await enregistrerPaiement.mutateAsync({
        id,
        data: {
          montant: parseFloat(paiementForm.montant),
          mode: paiementForm.mode,
        },
      });
      onClose();
      setPaiementForm({ montant: "", mode: "Espèces" });
    } catch (error) {
      // toast déjà géré par le hook
    } finally {
      submittingPaiementRef.current = false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.form
        onSubmit={handleEnregistrerPaiement}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 25 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800"
      >
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Enregistrer un paiement complémentaire
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Solde restant :{" "}
          <span className="font-semibold text-gray-900 dark:text-white">
            {formatCurrency(
              Math.max(
                (formation.montant_total || 0) - (formation.montant_paye || 0),
                0,
              ),
            )}
          </span>
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Montant (€) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={paiementForm.montant}
              onChange={(e) =>
                setPaiementForm((prev) => ({ ...prev, montant: e.target.value }))
              }
              className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Mode de paiement
            </label>
            <select
              value={paiementForm.mode}
              onChange={(e) =>
                setPaiementForm((prev) => ({ ...prev, mode: e.target.value }))
              }
              className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              {MODE_PAIEMENT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
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
            disabled={enregistrerPaiement.isPending}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 rounded-xl transition-all duration-300 shadow-lg shadow-green-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Enregistrer
          </button>
        </div>
      </motion.form>
    </div>
  );
};

export default FormationPaiementModal;
