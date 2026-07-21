import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUser,
  FiFileText,
  FiCalendar,
  FiEdit,
  FiArrowLeft,
  FiBriefcase,
  FiAward,
  FiAlertCircle,
  FiTrash2,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
  FiFile,
  FiHeart,
  FiUserCheck,
  FiPaperclip,
} from "react-icons/fi";
import { useCertificats } from "../../hooks/CertificatMedical/useCertificats";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../Common/LoadingSpinner";
import StatusBadge from "../Common/StatusBadge";
import { formatDate } from "../../utils/helpers";

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

const CertificatDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canManageCertificat = hasRole(["president"]);
  const { useGetById, useRemove } = useCertificats();
  const { useGetAll } = useAdherents();
  const { data, isLoading } = useGetById(id);
  const { data: adherentsData } = useGetAll();
  const remove = useRemove();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const certificat = data?.data;
  const adherent = adherentsData?.data?.find(
    (a) => a.num_adherent === certificat?.num_adherent,
  );

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      navigate("/certificats");
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

  if (!certificat) {
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
          Certificat non trouvé
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Le certificat que vous recherchez n'existe pas ou a été supprimé.
        </p>
        <button
          onClick={() => navigate("/certificats")}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </motion.div>
    );
  }

  const isExpired =
    certificat.date_validite && new Date(certificat.date_validite) < new Date();

  const daysUntilExpiry = () => {
    if (!certificat.date_validite) return null;
    const today = new Date();
    const expiry = new Date(certificat.date_validite);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysLeft = daysUntilExpiry();

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
      className="space-y-6 px-4"
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
                <FiFile className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {certificat.type_certificat}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-sm">
                    <FiFileText className="w-3.5 h-3.5" />
                    N°{certificat.id_certificat}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1 text-sm">
                    <FiBriefcase className="w-3.5 h-3.5" />
                    {certificat.medecin || "Médecin non renseigné"}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1 text-sm">
                    <FiUser className="w-3.5 h-3.5" />
                    {adherent
                      ? `${adherent.nom} ${adherent.prenom}`
                      : `N°${certificat.num_adherent}`}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
        {canManageCertificat && (
          <div className="flex gap-2">
            <Link
              to={`/certificats/edit/${certificat.id_certificat}`}
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
        )}
      </motion.div>

      {/* Carte récapitulative - Statut */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl shadow-xl p-6 md:p-8 ${
          isExpired
            ? "bg-gradient-to-r from-red-600 to-rose-600 dark:from-red-800 dark:to-rose-800"
            : daysLeft && daysLeft <= 30
              ? "bg-gradient-to-r from-orange-500 to-amber-600 dark:from-orange-700 dark:to-amber-800"
              : "bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-800 dark:to-green-800"
        } text-white`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-white/80 uppercase tracking-wider">
              Statut du certificat
            </p>
            <div className="flex items-center gap-3 mt-2">
              {isExpired ? (
                <>
                  <FiXCircle className="w-6 h-6 text-white" />
                  <span className="text-xl font-bold">Expiré</span>
                </>
              ) : (
                <>
                  <FiCheckCircle className="w-6 h-6 text-white" />
                  <span className="text-xl font-bold">Valide</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-8 flex-wrap">
            <div className="text-center">
              <p className="text-3xl font-bold">
                {daysLeft !== null ? (isExpired ? "0" : daysLeft) : "-"}
              </p>
              <p className="text-xs text-white/70 uppercase tracking-wider">
                {isExpired ? "Expiré" : "Jours restants"}
              </p>
            </div>
            <div className="w-px h-12 bg-white/20 hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl font-bold">
                {formatDate(certificat.date_validite)}
              </p>
              <p className="text-xs text-white/70 uppercase tracking-wider">
                Date d'expiration
              </p>
            </div>
            <div className="w-px h-12 bg-white/20 hidden sm:block" />
            <div className="text-center">
              <StatusBadge status={certificat.statut} />
            </div>
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
                N°{certificat.num_adherent}
              </p>
            )}
          </InfoItem>
          {adherent && (
            <>
              <InfoItem
                icon={FiAward}
                label="Niveau"
                value={adherent.niveau || "Non défini"}
              />
              <InfoItem
                icon={FiCalendar}
                label="Date d'adhésion"
                value={formatDate(adherent.date_adhesion)}
              />
              <InfoItem
                icon={FiHeart}
                label="Contact d'urgence"
                value={adherent.contact_urgence || "Non renseigné"}
              />
            </>
          )}
        </SectionCard>

        {/* Informations certificat */}
        <SectionCard title="Informations certificat" icon={FiFileText}>
          <InfoItem
            icon={FiFileText}
            label="Type de certificat"
            value={certificat.type_certificat}
            highlight
          />
          <InfoItem
            icon={FiCalendar}
            label="Date de validité"
            value={formatDate(certificat.date_validite)}
          />
          <InfoItem
            icon={FiClock}
            label="Date de délivrance"
            value={
              certificat.date_delivrance
                ? formatDate(certificat.date_delivrance)
                : "Non renseignée"
            }
          />
          <InfoItem
            icon={FiBriefcase}
            label="Médecin traitant"
            value={certificat.medecin || "Non renseigné"}
          />
          <InfoItem
            icon={FiAward}
            label="Statut"
            value={<StatusBadge status={certificat.statut} />}
          />
          <InfoItem
            icon={isExpired ? FiXCircle : FiCheckCircle}
            label="Validité"
            value={
              <span
                className={`font-semibold ${
                  isExpired
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                }`}
              >
                {isExpired ? "❌ Expiré" : "✅ Valide"}
              </span>
            }
          />
          {daysLeft !== null && !isExpired && (
            <InfoItem
              icon={FiClock}
              label="Jours restants"
              value={
                <span
                  className={`font-semibold ${
                    daysLeft <= 7
                      ? "text-red-600 dark:text-red-400"
                      : daysLeft <= 30
                        ? "text-orange-500 dark:text-orange-400"
                        : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {daysLeft} jour{daysLeft > 1 ? "s" : ""}
                </span>
              }
            />
          )}
          {certificat.document_path && (
            <InfoItem icon={FiPaperclip} label="Document">
              <a
                href={certificat.document_path}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-0.5 inline-block"
              >
                Voir le document
              </a>
            </InfoItem>
          )}
        </SectionCard>
      </motion.div>

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
              Êtes-vous sûr de vouloir supprimer ce certificat{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {certificat.type_certificat}
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

export default CertificatDetails;
