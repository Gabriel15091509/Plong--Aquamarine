import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useEcheanciers } from "../../hooks/Echeancier/useEcheanciers";
import { formatCurrency } from "../../utils/helpers";

// Modale de création d'un échéancier — même pattern visuel que
// FormationPaiementModal (overlay + motion.form) : le montant total est
// prérempli avec le solde restant de l'entité payée, le trésorier n'a plus
// qu'à choisir le nombre d'échéances et la date de la première ; le reste
// (montants/dates des échéances suivantes) est calculé côté backend.
const EcheancierCreationModal = ({
  isOpen,
  onClose,
  type_paiement,
  reference_id,
  num_adherent,
  soldeRestant,
}) => {
  const { useCreate } = useEcheanciers();
  const create = useCreate();
  const [form, setForm] = useState({
    montant_total: soldeRestant ? String(soldeRestant) : "",
    nb_echeances: "3",
    date_debut: "",
  });
  const submittingRef = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      await create.mutateAsync({
        type_paiement,
        reference_id,
        num_adherent,
        montant_total: parseFloat(form.montant_total),
        nb_echeances: parseInt(form.nb_echeances, 10),
        date_debut: form.date_debut,
      });
      onClose();
      setForm({ montant_total: "", nb_echeances: "3", date_debut: "" });
    } catch (error) {
      // toast déjà géré par le hook
    } finally {
      submittingRef.current = false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 25 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800"
      >
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Créer un échéancier
        </h3>
        {soldeRestant !== undefined && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Solde restant :{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatCurrency(soldeRestant)}
            </span>
          </p>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Montant total (€) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={form.montant_total}
              onChange={(e) => setForm((prev) => ({ ...prev, montant_total: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Nombre d&apos;échéances *
            </label>
            <input
              type="number"
              step="1"
              min="2"
              required
              value={form.nb_echeances}
              onChange={(e) => setForm((prev) => ({ ...prev, nb_echeances: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Date de la première échéance *
            </label>
            <input
              type="date"
              required
              value={form.date_debut}
              onChange={(e) => setForm((prev) => ({ ...prev, date_debut: e.target.value }))}
              className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Les échéances suivantes sont réparties à parts égales, un mois d&apos;écart chacune.
            </p>
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
            disabled={create.isPending}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Créer
          </button>
        </div>
      </motion.form>
    </div>
  );
};

export default EcheancierCreationModal;
