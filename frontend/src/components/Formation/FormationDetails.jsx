import React, { useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUser,
  FiAward,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiList,
  FiFileText,
  FiEdit,
  FiArrowLeft,
  FiAlertCircle,
  FiTrash2,
  FiTrendingUp,
  FiBookOpen,
  FiBarChart2,
  FiTarget,
  FiInfo,
  FiUserCheck,
  FiPlus,
  FiStar,
  FiDollarSign,
  FiPlusCircle,
} from "react-icons/fi";
import { useFormations } from "../../hooks/useFormations";
import { useAdherents } from "../../hooks/useAdherents";
import { useCompetences } from "../../hooks/useCompetences";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../Common/LoadingSpinner";
import StatusBadge from "../Common/StatusBadge";
import { formatDate, formatCurrency } from "../../utils/helpers";
import { MODE_PAIEMENT_OPTIONS } from "../../utils/constants";

// Animations
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" },
};

const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const FormationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { useGetById, useRemove, useEnregistrerPaiement } = useFormations();
  const { useGetAll } = useAdherents();
  const {
    useGetByFormation,
    useCreate: useCreateCompetence,
    useValider: useValiderCompetence,
  } = useCompetences();
  const { user, hasRole } = useAuth();
  const canManage = hasRole(["president", "tresorier"]);
  const { data, isLoading } = useGetById(id);
  const { data: adherentsData } = useGetAll();
  const remove = useRemove();
  const enregistrerPaiement = useEnregistrerPaiement();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCompetenceForm, setShowCompetenceForm] = useState(false);
  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [paiementForm, setPaiementForm] = useState({ montant: "", mode: "Espèces" });
  const submittingPaiementRef = useRef(false);
  const [competenceForm, setCompetenceForm] = useState({
    libelle: "",
    niveau_requis: "",
  });

  const handleEnregistrerPaiement = async (e) => {
    e.preventDefault();
    if (submittingPaiementRef.current) return;
    submittingPaiementRef.current = true;
    try {
      await enregistrerPaiement.mutateAsync({
        id,
        data: { montant: parseFloat(paiementForm.montant), mode: paiementForm.mode },
      });
      setShowPaiementModal(false);
      setPaiementForm({ montant: "", mode: "Espèces" });
    } catch (error) {
      // toast déjà géré par le hook
    } finally {
      submittingPaiementRef.current = false;
    }
  };

  const formation = data?.data;
  const adherent = adherentsData?.data?.find(
    (a) => a.num_adherent === formation?.num_adherent,
  );

  const { data: competencesData, isLoading: loadingCompetences } =
    useGetByFormation(formation?.id_formation);
  const competences = competencesData?.data || [];
  const createCompetence = useCreateCompetence();
  const validerCompetence = useValiderCompetence();

  const handleAddCompetence = async (e) => {
    e.preventDefault();
    if (!competenceForm.libelle || !competenceForm.niveau_requis) return;
    try {
      await createCompetence.mutateAsync({
        id_formation: formation.id_formation,
        libelle: competenceForm.libelle,
        niveau_requis: competenceForm.niveau_requis,
      });
      setCompetenceForm({ libelle: "", niveau_requis: "" });
      setShowCompetenceForm(false);
    } catch (error) {
      // géré par le hook (toast)
    }
  };

  const handleValiderCompetence = async (idCompetence) => {
    try {
      await validerCompetence.mutateAsync({
        id: idCompetence,
        data: { validee_par: user?.id },
      });
    } catch (error) {
      // géré par le hook (toast)
    }
  };

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      navigate("/formations");
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

  if (!formation) {
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
          Formation non trouvée
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          La formation que vous recherchez n'existe pas ou a été supprimée.
        </p>
        <button
          onClick={() => navigate("/formations")}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </motion.div>
    );
  }

  const progression = Math.min(
    Math.round((formation.nb_seances_realisees / 10) * 100),
    100,
  );

  const getProgressionColor = (progress) => {
    if (progress >= 80) return "from-emerald-500 to-green-500";
    if (progress >= 50) return "from-blue-500 to-cyan-500";
    if (progress >= 25) return "from-yellow-500 to-amber-500";
    return "from-red-500 to-rose-500";
  };

  const getProgressionTextColor = (progress) => {
    if (progress >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (progress >= 50) return "text-blue-600 dark:text-blue-400";
    if (progress >= 25) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const InfoItem = ({
    icon: Icon,
    label,
    value,
    highlight = false,
    children,
  }) => (
    <motion.div
      variants={fadeInUp}
      className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-300 ${
        highlight
          ? "bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border-l-4 border-blue-500"
          : "hover:bg-gray-50 dark:hover:bg-gray-800/30"
      }`}
    >
      <div
        className={`mt-0.5 p-2 rounded-lg ${
          highlight
            ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
          {label}
        </p>
        {children || (
          <p className="font-semibold text-gray-900 dark:text-white mt-0.5">
            {value || "Non défini"}
          </p>
        )}
      </div>
    </motion.div>
  );

  const SectionCard = ({ title, icon: Icon, children, className = "" }) => (
    <motion.div
      variants={fadeInUp}
      className={`bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100/80 dark:border-gray-800/80 p-6 hover:shadow-2xl transition-shadow duration-300 ${className}`}
    >
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-3">
        <span className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400">
          <Icon className="w-5 h-5" />
        </span>
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-6xl mx-auto px-4"
    >
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                <FiBookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Formation{" "}
                  <span className="text-blue-600 dark:text-blue-400">
                    {formation.niveau_vise}
                  </span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-sm">
                    <FiFileText className="w-3.5 h-3.5" />
                    N°{formation.id_formation}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1 text-sm">
                    <FiUser className="w-3.5 h-3.5" />
                    {adherent
                      ? `${adherent.nom} ${adherent.prenom}`
                      : `N°${formation.num_adherent}`}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1 text-sm">
                    <FiClock className="w-3.5 h-3.5" />
                    {formation.statut}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canManage && formation.statut_paiement === "Partiel" && (
            <button
              onClick={() => setShowPaiementModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 rounded-xl transition-all duration-300 shadow-lg shadow-green-500/25 hover:shadow-xl hover:-translate-y-0.5"
            >
              <FiPlusCircle className="w-4 h-4" />
              Enregistrer un paiement
            </button>
          )}
          <Link
            to={`/formations/edit/${formation.id_formation}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5"
          >
            <FiEdit className="w-4 h-4" />
            Modifier
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-xl transition-all duration-300 shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/35 hover:-translate-y-0.5"
          >
            <FiTrash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      </motion.div>

      {/* Carte récapitulative - Progression */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 dark:from-cyan-800 dark:via-blue-800 dark:to-indigo-800 rounded-2xl shadow-xl p-6 md:p-8 text-white"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-blue-100/80 uppercase tracking-wider">
              Avancement de la formation
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-4xl font-bold">{progression}%</span>
              <span className="text-sm text-blue-100/70">
                {formation.nb_seances_realisees} / 10 séances
              </span>
            </div>
          </div>
          <div className="flex items-center gap-8 flex-wrap">
            <div className="text-center">
              <StatusBadge status={formation.statut} />
            </div>
            <div className="w-px h-12 bg-white/20 hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl font-bold">{formation.niveau_vise}</p>
              <p className="text-xs text-blue-100/70 uppercase tracking-wider">
                Niveau visé
              </p>
            </div>
            <div className="w-px h-12 bg-white/20 hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl font-bold">
                {formatDate(formation.date_debut)}
              </p>
              <p className="text-xs text-blue-100/70 uppercase tracking-wider">
                Date de début
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Barre de progression stylée */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100/80 dark:border-gray-800/80 p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <FiBarChart2 className="w-4 h-4 text-blue-500" />
            Progression de la formation
          </h3>
          <span
            className={`text-lg font-bold ${getProgressionTextColor(progression)}`}
          >
            {progression}%
          </span>
        </div>
        <div className="relative w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progression}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={`h-full bg-gradient-to-r ${getProgressionColor(progression)} rounded-full shadow-lg shadow-blue-500/25`}
          />
          <div className="absolute inset-0 flex items-center justify-end pr-2">
            <span className="text-xs font-bold text-white drop-shadow-md">
              {progression >= 95 && "✅"}
              {progression >= 80 && progression < 95 && "🚀"}
              {progression >= 50 && progression < 80 && "📈"}
              {progression >= 25 && progression < 50 && "📊"}
              {progression < 25 && "🎯"}
            </span>
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400 dark:text-gray-500">
          <span>Début</span>
          <span>{formation.nb_seances_realisees} séances</span>
          <span>10 séances</span>
        </div>
      </motion.div>

      {/* Grille d'informations */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Informations adhérent */}
        <SectionCard title="Informations adhérent" icon={FiUser}>
          <InfoItem icon={FiUser} label="Adhérent" highlight>
            {adherent ? (
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {adherent.civilite} {adherent.nom} {adherent.prenom}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  N°{adherent.num_adherent}
                </p>
              </div>
            ) : (
              <p className="font-semibold text-gray-900 dark:text-white">
                N°{formation.num_adherent}
              </p>
            )}
          </InfoItem>
          {adherent && (
            <>
              <InfoItem
                icon={FiAward}
                label="Niveau actuel"
                value={adherent.niveau || "Non défini"}
              />
              <InfoItem
                icon={FiCalendar}
                label="Date d'adhésion"
                value={formatDate(adherent.date_adhesion)}
              />
              <InfoItem
                icon={FiUserCheck}
                label="Email"
                value={adherent.email}
              />
            </>
          )}
        </SectionCard>

        {/* Informations formation */}
        <SectionCard title="Informations formation" icon={FiTarget}>
          <InfoItem
            icon={FiAward}
            label="Niveau visé"
            value={formation.niveau_vise}
            highlight
          />
          <InfoItem
            icon={FiCalendar}
            label="Date de début"
            value={formatDate(formation.date_debut)}
          />
          <InfoItem
            icon={FiCalendar}
            label="Date de fin prévue"
            value={formatDate(formation.date_fin_prevue)}
          />
          <InfoItem
            icon={FiClock}
            label="Statut"
            value={<StatusBadge status={formation.statut} />}
          />
          <InfoItem
            icon={FiList}
            label="Séances réalisées"
            value={
              <span className="font-semibold">
                {formation.nb_seances_realisees} / 10 séances
              </span>
            }
          />
          <InfoItem
            icon={FiTrendingUp}
            label="Progression"
            value={
              <span
                className={`font-bold ${getProgressionTextColor(progression)}`}
              >
                {progression}%
              </span>
            }
          />
          {formation.montant_total ? (
            <>
              <InfoItem
                icon={FiDollarSign}
                label="Montant total"
                value={formatCurrency(formation.montant_total)}
              />
              <InfoItem
                icon={FiDollarSign}
                label="Montant payé / Solde restant"
                value={`${formatCurrency(formation.montant_paye || 0)} / ${formatCurrency(
                  Math.max((formation.montant_total || 0) - (formation.montant_paye || 0), 0),
                )}`}
              />
              <InfoItem
                icon={FiClock}
                label="Statut du paiement"
                value={<StatusBadge status={formation.statut_paiement} />}
              />
            </>
          ) : (
            <InfoItem icon={FiDollarSign} label="Tarif" value="Gratuite" />
          )}
        </SectionCard>
      </motion.div>

      {/* Commentaire du moniteur */}
      {formation.commentaire_moniteur && (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100/80 dark:border-gray-800/80 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400">
              <FiFileText className="w-5 h-5" />
            </span>
            Commentaire du moniteur
          </h3>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {formation.commentaire_moniteur}
            </p>
          </div>
        </motion.div>
      )}

      {/* Compétences de la formation */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100/80 dark:border-gray-800/80 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400">
              <FiStar className="w-5 h-5" />
            </span>
            Compétences ({competences.length})
          </h3>
          <button
            onClick={() => setShowCompetenceForm((prev) => !prev)}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            <FiPlus className="w-4 h-4" />
            Ajouter une compétence
          </button>
        </div>

        {showCompetenceForm && (
          <form
            onSubmit={handleAddCompetence}
            className="mb-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
          >
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Libellé
              </label>
              <input
                type="text"
                value={competenceForm.libelle}
                onChange={(e) =>
                  setCompetenceForm((prev) => ({
                    ...prev,
                    libelle: e.target.value,
                  }))
                }
                placeholder="Ex: Vidage de masque"
                className="w-full px-3 py-2 text-sm border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Niveau requis
              </label>
              <input
                type="text"
                value={competenceForm.niveau_requis}
                onChange={(e) =>
                  setCompetenceForm((prev) => ({
                    ...prev,
                    niveau_requis: e.target.value,
                  }))
                }
                placeholder="Ex: N1"
                className="w-full px-3 py-2 text-sm border rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
            <div className="sm:col-span-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCompetenceForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={createCompetence.isPending}
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-60"
              >
                Ajouter
              </button>
            </div>
          </form>
        )}

        {loadingCompetences ? (
          <LoadingSpinner />
        ) : competences.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucune compétence enregistrée pour cette formation.
          </p>
        ) : (
          <div className="space-y-2">
            {competences.map((competence) => (
              <div
                key={competence.id_competence}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {competence.libelle}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Niveau requis : {competence.niveau_requis}
                  </p>
                </div>
                {competence.acquise ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <FiCheckCircle className="w-3.5 h-3.5" />
                    Validée
                  </span>
                ) : (
                  <button
                    onClick={() =>
                      handleValiderCompetence(competence.id_competence)
                    }
                    disabled={validerCompetence.isPending}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
                  >
                    <FiCheckCircle className="w-3.5 h-3.5" />
                    Valider
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Modal paiement complémentaire */}
      {showPaiementModal && (
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
                  Math.max((formation.montant_total || 0) - (formation.montant_paye || 0), 0),
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
                onClick={() => setShowPaiementModal(false)}
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
      )}

      {/* Modal suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 25 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800"
          >
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30">
                <FiAlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Confirmer la suppression</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer cette formation{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {formation.niveau_vise}
              </span>
              ?
              <br />
              <span className="text-sm text-red-500 font-medium">
                ⚠️ Cette action est irréversible.
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
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 rounded-xl transition-all duration-300 shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/35"
              >
                <FiTrash2 className="w-4 h-4 inline mr-2" />
                Confirmer la suppression
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default FormationDetails;
