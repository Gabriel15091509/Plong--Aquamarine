import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiUser,
  FiCalendar,
  FiDroplet,
  FiClock,
  FiThermometer,
  FiEye,
  FiTag,
  FiImage,
  FiFileText,
  FiCheckCircle,
  FiEdit,
  FiArrowLeft,
  FiActivity,
  FiTrash2,
  FiInfo,
  FiAward,
  FiAnchor,
  FiMapPin,
  FiUsers,
  FiWind,
  FiTool,
} from "react-icons/fi";
import { usePlongees } from "../../hooks/Plongee/usePlongees";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import { useSeances } from "../../hooks/Formation/useSeances";
import { useAuth } from "../../context/AuthContext";
import LoadingSpinner from "../Common/LoadingSpinner";
import ConfirmModal from "../Common/ConfirmModal";
import SectionCard from "../Common/SectionCard";
import InfoItem from "../Common/InfoItem";
import PalanqueeResponsables from "../Palanquee/PalanqueeResponsables";
import { formatDate, formatDateTime } from "../../utils/helpers";

// Animations
const fadeInUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: "easeOut" },
};

const staggerContainer = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.25, ease: "easeOut" },
};

const PlongeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canManagePlongee = hasRole(["president", "moniteur"]);
  const { useGetWithDetails, useRemove } = usePlongees();
  const { useGetAll } = useAdherents();
  const { useGetById: useGetSeanceById } = useSeances();
  const { data, isLoading } = useGetWithDetails(id);
  const { data: adherentsData } = useGetAll();
  const { data: seanceData } = useGetSeanceById(data?.data?.id_seance);
  const remove = useRemove();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const plongee = data?.data;
  const adherent = adherentsData?.data?.find(
    (a) => a.num_adherent === plongee?.num_adherent,
  );

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      navigate("/plongees");
    } catch (error) {
      // toast déjà géré par le hook useRemove
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner variant="details" />
      </div>
    );
  }

  if (!plongee) {
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
          Plongée non trouvée
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          La plongée que vous recherchez n'existe pas ou a été supprimée.
        </p>
        <button
          onClick={() => navigate("/plongees")}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors duration-150"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </motion.div>
    );
  }

  const isValide = !!plongee.id_moniteur_validateur;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 px-4"
    >
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-cyan-50 dark:bg-cyan-900/20">
                <FiActivity className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
              </span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  Plongée du{" "}
                  <span className="text-blue-600 dark:text-blue-400">
                    {formatDate(plongee.date)}
                  </span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-sm">
                    <FiFileText className="w-3.5 h-3.5" />
                    N°{plongee.id_plongee}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1 text-sm">
                    <FiTag className="w-3.5 h-3.5" />
                    {plongee.type_plongee}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1 text-sm">
                    <FiUser className="w-3.5 h-3.5" />
                    {adherent
                      ? `${adherent.nom} ${adherent.prenom}`
                      : `N°${plongee.num_adherent}`}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
        {canManagePlongee && (
        <div className="flex gap-2">
          {/* Verrouillé côté serveur (PlongeeService.update/delete) : une
              plongée validée par un moniteur n'est plus modifiable. */}
          {isValide ? (
            <span
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-800 rounded-xl cursor-not-allowed"
              title="Plongée validée : modification impossible"
            >
              <FiEdit className="w-4 h-4" />
              Modifier
            </span>
          ) : (
            <Link
              to={`/plongees/edit/${plongee.id_plongee}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors duration-150"
            >
              <FiEdit className="w-4 h-4" />
              Modifier
            </Link>
          )}
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={isValide}
            title={isValide ? "Plongée validée : suppression impossible" : undefined}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiTrash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
        )}
      </motion.div>

      {/* Carte récapitulative */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl shadow-sm p-6 md:p-8 border-2 ${
          isValide
            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Statut de la plongée
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div
                className={`p-3 rounded-full ${
                  isValide
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-amber-100 dark:bg-amber-900/30"
                }`}
              >
                {isValide ? (
                  <FiCheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
                ) : (
                  <FiClock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isValide ? "Validée" : "En attente"}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isValide
                    ? "Plongée validée par le moniteur"
                    : "En attente de validation par le moniteur"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8 flex-wrap">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {plongee.profondeur_max != null ? `${plongee.profondeur_max}m` : "—"}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Profondeur max
              </p>
            </div>
            <div className="w-px h-12 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {plongee.duree != null ? `${plongee.duree} min` : "—"}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Durée
              </p>
            </div>
            <div className="w-px h-12 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{plongee.type_plongee}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Type
              </p>
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
                N°{plongee.num_adherent}
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
            </>
          )}
        </SectionCard>

        {/* Informations plongée */}
        <SectionCard title="Informations plongée" icon={FiActivity}>
          <InfoItem
            icon={FiCalendar}
            label="Date"
            value={formatDate(plongee.date)}
            highlight
          />
          <InfoItem
            icon={FiDroplet}
            label="Profondeur max"
            value={
              plongee.profondeur_max != null
                ? `${plongee.profondeur_max} mètres`
                : "À renseigner par le moniteur"
            }
          />
          <InfoItem
            icon={FiClock}
            label="Durée"
            value={
              plongee.duree != null
                ? `${plongee.duree} minutes`
                : "À renseigner par le moniteur"
            }
          />
          <InfoItem
            icon={FiThermometer}
            label="Température de l'eau"
            value={
              plongee.temperature_eau
                ? `${plongee.temperature_eau}°C`
                : "Non renseignée"
            }
          />
          <InfoItem
            icon={FiEye}
            label="Visibilité"
            value={plongee.visibilite || "Non renseignée"}
          />
          <InfoItem
            icon={FiWind}
            label="Courant"
            value={plongee.courant || "Non renseigné"}
          />
          <InfoItem
            icon={FiTag}
            label="Type de plongée"
            value={plongee.type_plongee}
          />
          <InfoItem
            icon={isValide ? FiCheckCircle : FiClock}
            label="Validation moniteur"
            value={isValide ? "Validée" : "En attente"}
          />
          {plongee.lien_photos && (
            <InfoItem
              icon={FiImage}
              label="Photos"
              value={
                <a
                  href={plongee.lien_photos}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold"
                >
                  Voir les photos
                </a>
              }
            />
          )}
        </SectionCard>
      </motion.div>

      {/* Matériel utilisé (CDC 3.3.1) : résolu côté serveur depuis les
          attributions liées à la même sortie/adhérent — voir
          PlongeeService.attachMaterielUtilise. Absent (pas de section) pour
          une plongée sans matériel attribué, ex. un adhérent avec son propre
          équipement. */}
      {plongee.materiel_utilise?.length > 0 && (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400">
              <FiTool className="w-5 h-5" />
            </span>
            Matériel utilisé
          </h3>
          <div className="flex flex-wrap gap-2">
            {plongee.materiel_utilise.map((materiel) => (
              <span
                key={materiel.num_inventaire}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
                title={`N° d'inventaire ${materiel.num_inventaire}`}
              >
                {materiel.categorie
                  ? `${materiel.categorie}${materiel.marque ? ` — ${materiel.marque}${materiel.modele ? " " + materiel.modele : ""}` : ""}`
                  : `#${materiel.num_inventaire}`}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Observations */}
      {plongee.observations_faune && (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400">
              <FiFileText className="w-5 h-5" />
            </span>
            Observations
          </h3>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {plongee.observations_faune}
            </p>
          </div>
        </motion.div>
      )}

      {/* Note individuelle du moniteur */}
      {plongee.observations_moniteur && (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400">
              <FiUser className="w-5 h-5" />
            </span>
            Note du moniteur
          </h3>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {plongee.observations_moniteur}
            </p>
          </div>
        </motion.div>
      )}

      {/* Lien vers la formation en cours (séance pratique validée par cette plongée) */}
      {seanceData?.data && (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400">
              <FiAward className="w-5 h-5" />
            </span>
            Cette plongée compte pour une formation
          </h3>
          <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Séance du {formatDate(seanceData.data.date_seance)} ({seanceData.data.type_seance})
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Statut : {seanceData.data.statut}
              </p>
            </div>
            <Link
              to={`/formations/${seanceData.data.id_formation}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:underline flex-shrink-0"
            >
              Voir la formation
            </Link>
          </div>
        </motion.div>
      )}

      {/* Palanquée de la plongée (lecture seule - gérée depuis la sortie) */}
      {plongee.palanquee && (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400">
              <FiUsers className="w-5 h-5" />
            </span>
            Palanquée : {plongee.palanquee.nom_palanquee}
          </h3>

          {/* Qui est responsable de cette palanquée : moniteur encadrant,
              guide, secouriste — voir PalanqueeResponsables. */}
          <PalanqueeResponsables palanquee={plongee.palanquee} />

          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            Co-plongeurs
          </p>
          <div className="flex flex-wrap gap-2">
            {(plongee.palanquee.composers || [])
              .filter((c) => c.num_adherent !== plongee.num_adherent)
              .map((membre) => (
                <span
                  key={membre.num_adherent}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300"
                >
                  {membre.adherent
                    ? `${membre.adherent.nom} ${membre.adherent.prenom}`
                    : `#${membre.num_adherent}`}
                  {membre.num_adherent === plongee.palanquee.id_guide_palanquee && " · Guide"}
                  {membre.num_adherent === plongee.palanquee.id_secouriste && " · Secouriste"}
                </span>
              ))}
            {(plongee.palanquee.composers || []).length <= 1 && (
              <span className="text-sm text-gray-400 dark:text-gray-500">
                Aucun autre co-plongeur
              </span>
            )}
          </div>
        </motion.div>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        message={
          <>
            Êtes-vous sûr de vouloir supprimer cette plongée du{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatDate(plongee.date)}
            </span>
            ?
          </>
        }
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </motion.div>
  );
};

export default PlongeeDetails;

