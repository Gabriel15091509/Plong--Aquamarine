import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiPackage,
  FiCalendar,
  FiEdit,
  FiArrowLeft,
  FiUser,
  FiAlertCircle,
  FiTrash2,
  FiCheckCircle,
  FiClock,
  FiInfo,
  FiTag,
  FiDollarSign,
  FiShield,
} from "react-icons/fi";
import { useAttributions } from "../../hooks/Attribution/useAttributions";
import { useMateriels } from "../../hooks/Materiel/useMateriels";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useSorties } from "../../hooks/Sortie/useSorties";
import LoadingSpinner from "../Common/LoadingSpinner";
import ModalOverlay from "../Common/ModalOverlay";
import { formatDate, formatDateForInput, formatCurrency } from "../../utils/helpers";
import { ETAT_MATERIEL_OPTIONS, MODE_PAIEMENT_OPTIONS } from "../../utils/constants";

const AttributionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    useGetById,
    useRemove,
    useRetour,
    useEnregistrerCaution,
    useRestituerCaution,
    useTraiterDeterioration,
  } = useAttributions();
  const { useGetById: useGetMateriel } = useMateriels();
  const { useGetAll: useGetAllAdherents } = useAdherents();
  const { useGetById: useGetSortie } = useSorties();
  const { data, isLoading } = useGetById(id);
  const remove = useRemove();
  const retour = useRetour();
  const enregistrerCaution = useEnregistrerCaution();
  const restituerCaution = useRestituerCaution();
  const traiterDeterioration = useTraiterDeterioration();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRetourForm, setShowRetourForm] = useState(false);
  const [etatRetour, setEtatRetour] = useState("Bon");
  const [dateRetourReel, setDateRetourReel] = useState(
    formatDateForInput(new Date()),
  );
  const [showCautionModal, setShowCautionModal] = useState(false);
  const [cautionForm, setCautionForm] = useState({ montant: "", mode: "Espèces" });
  const [showDeteriorationModal, setShowDeteriorationModal] = useState(false);
  const [deteriorationForm, setDeteriorationForm] = useState({
    description: "",
    prestataire: "",
    cout_reparation: "",
  });

  const attribution = data?.data;
  const { data: materielData } = useGetMateriel(attribution?.num_inventaire);
  const materiel = materielData?.data;
  const { data: adherentsData } = useGetAllAdherents();
  const adherent = adherentsData?.data?.find(
    (a) => a.num_adherent === attribution?.num_adherent,
  );
  const { data: sortieData } = useGetSortie(attribution?.id_sortie);
  const sortie = sortieData?.data;

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      navigate("/attributions");
    } catch (error) {
      // toast déjà géré par le hook useRemove
    }
  };

  const handleRetour = async () => {
    try {
      await retour.mutateAsync({
        id,
        data: { etat_retour: etatRetour, date_retour_reel: dateRetourReel },
      });
      setShowRetourForm(false);
    } catch (error) {
      // toast déjà géré par le hook useRetour
    }
  };

  const handleEnregistrerCaution = async (e) => {
    e.preventDefault();
    try {
      await enregistrerCaution.mutateAsync({
        id,
        data: { montant: parseFloat(cautionForm.montant), mode: cautionForm.mode },
      });
      setShowCautionModal(false);
      setCautionForm({ montant: "", mode: "Espèces" });
    } catch (error) {
      // toast déjà géré par le hook
    }
  };

  const handleRestituerCaution = async () => {
    try {
      await restituerCaution.mutateAsync(id);
    } catch (error) {
      // toast déjà géré par le hook
    }
  };

  const handleTraiterDeterioration = async (e) => {
    e.preventDefault();
    try {
      await traiterDeterioration.mutateAsync({
        id,
        data: {
          description: deteriorationForm.description,
          prestataire: deteriorationForm.prestataire,
          cout_reparation: parseFloat(deteriorationForm.cout_reparation),
        },
      });
      setShowDeteriorationModal(false);
      setDeteriorationForm({ description: "", prestataire: "", cout_reparation: "" });
    } catch (error) {
      // toast déjà géré par le hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!attribution) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800/50 mb-6">
          <FiInfo className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
          Attribution non trouvée
        </h3>
        <button
          onClick={() => navigate("/attributions")}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-300 shadow-lg"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </motion.div>
    );
  }

  const isEnCours = !attribution.date_retour_reel;
  const isEnRetard = isEnCours && new Date(attribution.date_retour_prevue) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 px-4"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
              <FiPackage className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </span>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Attribution N°{attribution.id_attribution}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                {materiel ? `${materiel.marque} ${materiel.modele}` : `Matériel #${attribution.num_inventaire}`}
                {" → "}
                {adherent ? `${adherent.nom} ${adherent.prenom}` : `Adhérent #${attribution.num_adherent}`}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/attributions/edit/${attribution.id_attribution}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-300 shadow-lg hover:-translate-y-0.5"
          >
            <FiEdit className="w-4 h-4" />
            Modifier
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-xl transition-all duration-300 shadow-lg hover:-translate-y-0.5"
          >
            <FiTrash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl shadow-xl p-6 md:p-8 text-white ${
          isEnRetard
            ? "bg-gradient-to-r from-red-500 to-rose-600"
            : isEnCours
              ? "bg-gradient-to-r from-blue-500 to-indigo-600"
              : "bg-gradient-to-r from-emerald-500 to-green-600"
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-white/20">
              {isEnRetard ? (
                <FiAlertCircle className="w-7 h-7" />
              ) : isEnCours ? (
                <FiClock className="w-7 h-7" />
              ) : (
                <FiCheckCircle className="w-7 h-7" />
              )}
            </div>
            <div>
              <p className="text-2xl font-bold">
                {isEnRetard ? "En retard" : isEnCours ? "En cours" : "Retourné"}
              </p>
              <p className="text-sm text-white/80">
                {isEnCours
                  ? `Retour prévu le ${formatDate(attribution.date_retour_prevue)}`
                  : `Retourné le ${formatDate(attribution.date_retour_reel)}`}
              </p>
            </div>
          </div>
          {isEnCours && (
            <button
              onClick={() => setShowRetourForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-blue-700 bg-white hover:bg-gray-100 rounded-xl transition-all duration-300 shadow-lg"
            >
              <FiCheckCircle className="w-4 h-4" />
              Enregistrer le retour
            </button>
          )}
        </div>
      </motion.div>

      {showRetourForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100/80 dark:border-gray-800/80 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            Enregistrer le retour
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                État au retour
              </label>
              <select
                value={etatRetour}
                onChange={(e) => setEtatRetour(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {ETAT_MATERIEL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Date de retour réel
              </label>
              <input
                type="date"
                value={dateRetourReel}
                onChange={(e) => setDateRetourReel(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowRetourForm(false)}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleRetour}
              disabled={retour.isPending}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors disabled:opacity-60"
            >
              Confirmer le retour
            </button>
          </div>
        </motion.div>
      )}

      <motion.div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100/80 dark:border-gray-800/80 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-3">
          <span className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400">
            <FiInfo className="w-5 h-5" />
          </span>
          Détails
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FiUser className="text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Adhérent :</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {adherent ? `${adherent.nom} ${adherent.prenom}` : attribution.num_adherent}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FiPackage className="text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Matériel :</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {materiel ? `${materiel.marque} ${materiel.modele}` : attribution.num_inventaire}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FiCalendar className="text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Date d'attribution :</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatDate(attribution.date_attribution)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FiPackage className="text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Sortie :</span>
            {attribution.id_sortie ? (
              <Link
                to={`/sorties/${attribution.id_sortie}`}
                className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                {sortie ? `${sortie.type} - ${sortie.lieu}` : `#${attribution.id_sortie}`}
              </Link>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                Prêt (sans sortie)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <FiTag className="text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">État au départ :</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {attribution.etat_depart}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FiCalendar className="text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Retour prévu :</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatDate(attribution.date_retour_prevue)}
            </span>
          </div>
          {attribution.date_retour_reel && (
            <>
              <div className="flex items-center gap-2">
                <FiCalendar className="text-gray-400" />
                <span className="text-gray-500 dark:text-gray-400">Retour réel :</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatDate(attribution.date_retour_reel)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FiTag className="text-gray-400" />
                <span className="text-gray-500 dark:text-gray-400">État au retour :</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {attribution.etat_retour}
                </span>
              </div>
            </>
          )}
          {attribution.constat_deterioration && (
            <div className="flex items-center gap-2 sm:col-span-2">
              <FiAlertCircle className="text-red-400" />
              <span className="text-gray-500 dark:text-gray-400">Constat de détérioration :</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {attribution.constat_deterioration}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Caution */}
      <motion.div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100/80 dark:border-gray-800/80 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400">
              <FiShield className="w-5 h-5" />
            </span>
            Caution
          </h3>
          <div className="flex gap-2 flex-wrap">
            {attribution.statut_caution === "Aucune" && (
              <button
                onClick={() => setShowCautionModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-300 shadow-lg"
              >
                <FiDollarSign className="w-4 h-4" />
                Enregistrer la caution
              </button>
            )}
            {attribution.statut_caution === "Payée" && !isEnCours && (
              <>
                <button
                  onClick={handleRestituerCaution}
                  disabled={restituerCaution.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 rounded-xl transition-all duration-300 shadow-lg disabled:opacity-60"
                >
                  <FiCheckCircle className="w-4 h-4" />
                  Restituer la caution
                </button>
                <button
                  onClick={() => setShowDeteriorationModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-xl transition-all duration-300 shadow-lg"
                >
                  <FiAlertCircle className="w-4 h-4" />
                  Traiter une détérioration
                </button>
              </>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <FiDollarSign className="text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Montant :</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {attribution.montant_caution ? formatCurrency(attribution.montant_caution) : "Non renseigné"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FiShield className="text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Statut :</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {attribution.statut_caution}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <FiShield className="text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400">Pièce d'identité retenue :</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {attribution.piece_identite_retenue || "Aucune"}
            </span>
          </div>
        </div>
      </motion.div>

      {showCautionModal && (
        <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.form
            onSubmit={handleEnregistrerCaution}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Enregistrer la caution
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Montant (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={cautionForm.montant}
                  onChange={(e) =>
                    setCautionForm((prev) => ({ ...prev, montant: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Mode de paiement
                </label>
                <select
                  value={cautionForm.mode}
                  onChange={(e) =>
                    setCautionForm((prev) => ({ ...prev, mode: e.target.value }))
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
                onClick={() => setShowCautionModal(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-300 shadow-lg"
              >
                Enregistrer
              </button>
            </div>
          </motion.form>
        </ModalOverlay>
      )}

      {showDeteriorationModal && (
        <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.form
            onSubmit={handleTraiterDeterioration}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Traiter une détérioration
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Caution actuelle :{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(attribution.montant_caution || 0)}
              </span>
              . La caution couvrira tout ou partie du coût de réparation ; le
              reliquat éventuel sera à restituer, le complément éventuel à réclamer.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Description de la panne *
                </label>
                <textarea
                  required
                  rows={3}
                  value={deteriorationForm.description}
                  onChange={(e) =>
                    setDeteriorationForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Prestataire *
                </label>
                <input
                  type="text"
                  required
                  value={deteriorationForm.prestataire}
                  onChange={(e) =>
                    setDeteriorationForm((prev) => ({ ...prev, prestataire: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Coût de réparation (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={deteriorationForm.cout_reparation}
                  onChange={(e) =>
                    setDeteriorationForm((prev) => ({ ...prev, cout_reparation: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowDeteriorationModal(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-xl transition-all duration-300 shadow-lg"
              >
                Enregistrer
              </button>
            </div>
          </motion.form>
        </ModalOverlay>
      )}

      {showDeleteModal && (
        <ModalOverlay className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                <FiAlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Confirmer la suppression</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer cette attribution ?
              <br />
              <span className="text-sm text-red-500 font-medium">
                Cette action est irréversible.
              </span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-xl transition-all duration-300 shadow-lg"
              >
                <FiTrash2 className="w-4 h-4 inline mr-2" />
                Confirmer la suppression
              </button>
            </div>
          </motion.div>
        </ModalOverlay>
      )}
    </motion.div>
  );
};

export default AttributionDetails;
