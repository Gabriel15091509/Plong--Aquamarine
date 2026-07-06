import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiEdit,
  FiArrowLeft,
  FiUser,
  FiCalendar,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiMapPin,
  FiTag,
  FiDroplet,
  FiAward,
  FiUsers,
  FiAnchor,
  FiInfo,
  FiFileText,
  FiAlertCircle,
  FiTrendingUp,
  FiBarChart2,
} from "react-icons/fi";
import { useInscriptions } from "../../hooks/useInscriptions";
import { useAdherents } from "../../hooks/useAdherents";
import { useSorties } from "../../hooks/useSorties";
import LoadingSpinner from "../Common/LoadingSpinner";
import StatusBadge from "../Common/StatusBadge";
import { formatDate, formatDateTime } from "../../utils/helpers";

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
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.4, ease: "easeOut" },
};

const InscriptionDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const inscriptionId = parseInt(id);

  const { useGetById: useGetInscriptionById } = useInscriptions();
  const { useGetById: useGetAdherentById } = useAdherents();
  const { useGetById: useGetSortieById } = useSorties();

  const {
    data: inscriptionData,
    isLoading: isLoadingInscription,
    error: inscriptionError,
  } = useGetInscriptionById(inscriptionId);

  const [inscription, setInscription] = useState(null);
  const [adherent, setAdherent] = useState(null);
  const [sortie, setSortie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadRelatedData = async () => {
      if (!inscriptionData?.data) return;

      const ins = inscriptionData.data;
      setInscription(ins);

      if (ins.num_adherent) {
        try {
          const adherentResponse = await useGetAdherentById(ins.num_adherent);
          if (adherentResponse?.data) {
            setAdherent(adherentResponse.data);
          }
        } catch (err) {
          console.error("Erreur chargement adhérent:", err);
        }
      }

      if (ins.id_sortie) {
        try {
          const sortieResponse = await useGetSortieById(ins.id_sortie);
          if (sortieResponse?.data) {
            setSortie(sortieResponse.data);
          }
        } catch (err) {
          console.error("Erreur chargement sortie:", err);
        }
      }

      setLoading(false);
    };

    loadRelatedData();
  }, [inscriptionData, useGetAdherentById, useGetSortieById]);

  useEffect(() => {
    if (inscriptionError) {
      setError(inscriptionError);
      setLoading(false);
    }
  }, [inscriptionError]);

  if (isLoadingInscription || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || inscriptionError) {
    return (
      <motion.div
        variants={scaleIn}
        initial="initial"
        animate="animate"
        className="text-center py-16"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
          <FiAlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
          Erreur de chargement
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {error?.message ||
            inscriptionError?.message ||
            "Une erreur est survenue lors du chargement des données"}
        </p>
        <button
          onClick={() => navigate("/inscriptions")}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </motion.div>
    );
  }

  if (!inscription) {
    return (
      <motion.div
        variants={scaleIn}
        initial="initial"
        animate="animate"
        className="text-center py-16"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800/50 mb-6">
          <FiInfo className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
          Inscription non trouvée
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          L'inscription que vous recherchez n'existe pas ou a été supprimée.
        </p>
        <button
          onClick={() => navigate("/inscriptions")}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </motion.div>
    );
  }

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

  const getStatutColor = (statut) => {
    const colors = {
      Confirmée:
        "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
      Annulée:
        "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
      "Liste d'attente":
        "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
      "En attente":
        "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    };
    return colors[statut] || colors["En attente"];
  };

  const getStatutIcon = (statut) => {
    const icons = {
      Confirmée: FiCheckCircle,
      Annulée: FiXCircle,
      "Liste d'attente": FiClock,
      "En attente": FiClock,
    };
    return icons[statut] || FiClock;
  };

  const getStatutText = (statut) => {
    const texts = {
      Confirmée: "L'inscription est confirmée et validée",
      Annulée: "L'inscription a été annulée",
      "Liste d'attente": "En attente d'une place disponible",
      "En attente": "En attente de confirmation par le moniteur",
    };
    return texts[statut] || "Statut inconnu";
  };

  const StatutIcon = getStatutIcon(inscription.statut);

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
        <button
          onClick={() => navigate("/inscriptions")}
          className="group inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300"
        >
          <FiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
          Retour à la liste
        </button>
        <Link
          to={`/inscriptions/edit/${inscription.id_inscription}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5"
        >
          <FiEdit className="w-4 h-4" />
          Modifier l'inscription
        </Link>
      </motion.div>

      {/* Titre */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100/80 dark:border-gray-800/80 p-6 md:p-8 overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                <FiFileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Inscription{" "}
                  <span className="text-blue-600 dark:text-blue-400">
                    N°{inscription.id_inscription}
                  </span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <FiUser className="w-3.5 h-3.5" />
                    {adherent
                      ? `${adherent.civilite} ${adherent.prenom} ${adherent.nom}`
                      : `Adhérent N°${inscription.num_adherent}`}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1">
                    <FiAnchor className="w-3.5 h-3.5" />
                    {sortie
                      ? `${sortie.type} - ${sortie.lieu}`
                      : `Sortie N°${inscription.id_sortie}`}
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={inscription.statut} />
          </div>
        </div>
      </motion.div>

      {/* Grille d'informations */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Adhérent */}
        <SectionCard title="Informations adhérent" icon={FiUser}>
          <InfoItem icon={FiUser} label="Adhérent" highlight>
            {adherent ? (
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {adherent.civilite} {adherent.prenom} {adherent.nom}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  N°{adherent.num_adherent}
                </p>
              </div>
            ) : (
              <p className="font-semibold text-gray-900 dark:text-white">
                N°{inscription.num_adherent}
              </p>
            )}
          </InfoItem>
          {adherent && (
            <>
              <InfoItem
                icon={FiAward}
                label="Niveau de plongée"
                value={adherent.niveau || "Non défini"}
              />
              <InfoItem
                icon={FiCalendar}
                label="Date d'adhésion"
                value={formatDate(adherent.date_adhesion)}
              />
              <InfoItem icon={FiUsers} label="Email" value={adherent.email} />
            </>
          )}
        </SectionCard>

        {/* Sortie */}
        <SectionCard title="Informations sortie" icon={FiMapPin}>
          <InfoItem icon={FiCalendar} label="Sortie" highlight>
            {sortie ? (
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {sortie.type} - {sortie.lieu}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  N°{sortie.id_sortie} • {sortie.site}
                </p>
              </div>
            ) : (
              <p className="font-semibold text-gray-900 dark:text-white">
                N°{inscription.id_sortie}
              </p>
            )}
          </InfoItem>
          {sortie && (
            <>
              <InfoItem icon={FiTag} label="Type" value={sortie.type} />
              <InfoItem
                icon={FiDroplet}
                label="Profondeur max"
                value={`${sortie.profondeur_max || 0} mètres`}
              />
              <InfoItem
                icon={FiCalendar}
                label="Date et heure"
                value={formatDateTime(sortie.date_heure)}
              />
              <InfoItem
                icon={FiBarChart2}
                label="Statut"
                value={<StatusBadge status={sortie.statut} />}
              />
            </>
          )}
        </SectionCard>
      </motion.div>

      {/* Statut de l'inscription */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100/80 dark:border-gray-800/80 p-6 md:p-8"
      >
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-3">
          <span className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400">
            <FiCheckCircle className="w-5 h-5" />
          </span>
          Statut de l'inscription
        </h3>

        <div
          className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-xl border-2 ${getStatutColor(inscription.statut)}`}
        >
          <div
            className={`p-3 rounded-full ${
              inscription.statut === "Confirmée"
                ? "bg-green-100 dark:bg-green-900/30"
                : inscription.statut === "Annulée"
                  ? "bg-red-100 dark:bg-red-900/30"
                  : "bg-yellow-100 dark:bg-yellow-900/30"
            }`}
          >
            <StatutIcon
              className={`w-7 h-7 ${
                inscription.statut === "Confirmée"
                  ? "text-green-600 dark:text-green-400"
                  : inscription.statut === "Annulée"
                    ? "text-red-600 dark:text-red-400"
                    : "text-yellow-600 dark:text-yellow-400"
              }`}
            />
          </div>
          <div className="flex-1">
            <p
              className={`font-bold text-lg ${
                inscription.statut === "Confirmée"
                  ? "text-green-800 dark:text-green-400"
                  : inscription.statut === "Annulée"
                    ? "text-red-800 dark:text-red-400"
                    : "text-yellow-800 dark:text-yellow-400"
              }`}
            >
              {inscription.statut}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getStatutText(inscription.statut)}
            </p>
          </div>
          {inscription.rang_liste_attente && (
            <div className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Rang{" "}
                <span className="font-bold text-gray-900 dark:text-white">
                  N°{inscription.rang_liste_attente}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Détails supplémentaires */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-700/30 transition-colors duration-300">
            <FiCalendar className="w-4 h-4 text-blue-500 mt-0.5" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Date d'inscription
              </p>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {formatDate(inscription.date_inscription)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-700/30 transition-colors duration-300">
            {inscription.presence ? (
              <FiCheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
            ) : (
              <FiXCircle className="w-4 h-4 text-red-500 mt-0.5" />
            )}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Présence
              </p>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                {inscription.presence ? "Présent ✅" : "Absent ❌"}
              </p>
            </div>
          </div>

          {inscription.date_confirmation && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-700/30 transition-colors duration-300">
              <FiCheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  Date de confirmation
                </p>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">
                  {formatDate(inscription.date_confirmation)}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-700/30 transition-colors duration-300">
            <FiFileText className="w-4 h-4 text-blue-500 mt-0.5" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                Référence
              </p>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">
                INS-{String(inscription.id_inscription).padStart(4, "0")}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pied de page */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-xs text-gray-400 dark:text-gray-500 pt-2"
      >
        <p>Dernière mise à jour : {formatDateTime(new Date().toISOString())}</p>
      </motion.div>
    </motion.div>
  );
};

export default InscriptionDetails;
