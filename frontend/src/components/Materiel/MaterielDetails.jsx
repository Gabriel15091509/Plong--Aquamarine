import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import ConfirmModal from "../Common/ConfirmModal";
import {
  FiPackage,
  FiTag,
  FiAward,
  FiBox,
  FiMaximize,
  FiActivity,
  FiCalendar,
  FiTool,
  FiMapPin,
  FiEdit,
  FiArrowLeft,
  FiClipboard,
  FiCheckCircle,
  FiClock,
  FiHash,
  FiAlertCircle,
  FiTrash2,
  FiInfo,
  FiFileText,
  FiShield,
  FiDroplet,
  FiAnchor,
  FiUser,
  FiPlus,
  FiDollarSign,
} from "react-icons/fi";
import { useMateriels } from "../../hooks/Materiel/useMateriels";
import { useAttributions } from "../../hooks/Attribution/useAttributions";
import { useReparations } from "../../hooks/Reparation/useReparations";
import { useAdherents } from "../../hooks/Adherent/useAdherents";
import LoadingSpinner from "../Common/LoadingSpinner";
import StatusBadge from "../Common/StatusBadge";
import SectionCard from "../Common/SectionCard";
import InfoItem from "../Common/InfoItem";
import { formatDate, formatCurrency } from "../../utils/helpers";
import { photoUrl } from "../../utils/photoUrl";

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

const MaterielDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { useGetById, useRemove } = useMateriels();
  const { useGetByMateriel: useGetAttributionsByMateriel } =
    useAttributions();
  const { useGetByMateriel: useGetReparationsByMateriel } = useReparations();
  const { useGetAll: useGetAllAdherents } = useAdherents();
  const { data, isLoading } = useGetById(id);
  const remove = useRemove();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const materiel = data?.data;

  const { data: attributionsData, isLoading: loadingAttributions } =
    useGetAttributionsByMateriel(materiel?.num_inventaire);
  const { data: reparationsData, isLoading: loadingReparations } =
    useGetReparationsByMateriel(materiel?.num_inventaire);
  const { data: adherentsData } = useGetAllAdherents();

  const attributions = attributionsData?.data || [];
  const reparations = reparationsData?.data || [];
  const adherentMap = {};
  adherentsData?.data?.forEach((a) => {
    adherentMap[a.num_adherent] = `${a.nom} ${a.prenom}`;
  });

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      navigate("/materiels");
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

  if (!materiel) {
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
          Matériel non trouvé
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Le matériel que vous recherchez n'existe pas ou a été supprimé.
        </p>
        <button
          onClick={() => navigate("/materiels")}
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors duration-150"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
      </motion.div>
    );
  }

  const getEtatColor = (etat) => {
    const colors = {
      Neuf: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
      Bon: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
      "Usagé":
        "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
      "À réparer":
        "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
      "Hors service":
        "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    };
    return colors[etat] || colors["Bon"];
  };

  const getEtatIcon = (etat) => {
    const icons = {
      Neuf: FiCheckCircle,
      Bon: FiCheckCircle,
      "Usagé": FiClock,
      "À réparer": FiTool,
      "Hors service": FiAlertCircle,
    };
    return icons[etat] || FiCheckCircle;
  };

  const getEtatText = (etat) => {
    const texts = {
      Neuf: "Matériel neuf, jamais utilisé",
      Bon: "Matériel en bon état de fonctionnement",
      "Usagé": "Matériel usagé, encore fonctionnel",
      "À réparer": "Matériel nécessitant une réparation",
      "Hors service": "Matériel hors service",
    };
    return texts[etat] || "État inconnu";
  };

  const getLocalisationColor = (localisation) => {
    const colors = {
      Local: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      "Prêté": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      "En réparation": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    };
    return colors[localisation] || "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400";
  };

  const EtatIcon = getEtatIcon(materiel.etat);

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
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center flex-shrink-0">
            {materiel.photo_path ? (
              <img
                src={photoUrl(materiel.photo_path)}
                alt={`${materiel.marque} ${materiel.modele}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <FiPackage className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {materiel.marque}{" "}
                  <span className="text-blue-600 dark:text-blue-400">
                    {materiel.modele}
                  </span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-sm">
                    <FiHash className="w-3.5 h-3.5" />
                    N°{materiel.num_inventaire}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="flex items-center gap-1 text-sm">
                    <FiTag className="w-3.5 h-3.5" />
                    {materiel.categorie}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className={`flex items-center gap-1 text-sm px-2 py-0.5 rounded-full font-medium ${getLocalisationColor(materiel.localisation)}`}>
                    <FiMapPin className="w-3.5 h-3.5" />
                    {materiel.localisation}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/materiels/edit/${materiel.num_inventaire}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors duration-150"
          >
            <FiEdit className="w-4 h-4" />
            Modifier
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors duration-150"
          >
            <FiTrash2 className="w-4 h-4" />
            Supprimer
          </button>
        </div>
      </motion.div>

      {/* Carte récapitulative - État */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl shadow-sm p-6 md:p-8 border-2 ${getEtatColor(materiel.etat)}`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              État du matériel
            </p>
            <div className="flex items-center gap-4 mt-2">
              <div
                className={`p-3 rounded-full ${
                  materiel.etat === "Neuf" || materiel.etat === "Bon"
                    ? "bg-green-100 dark:bg-green-900/30"
                    : materiel.etat === "Usagé"
                      ? "bg-yellow-100 dark:bg-yellow-900/30"
                      : materiel.etat === "À réparer"
                        ? "bg-orange-100 dark:bg-orange-900/30"
                        : "bg-red-100 dark:bg-red-900/30"
                }`}
              >
                <EtatIcon
                  className={`w-7 h-7 ${
                    materiel.etat === "Neuf" || materiel.etat === "Bon"
                      ? "text-green-600 dark:text-green-400"
                      : materiel.etat === "Usagé"
                        ? "text-yellow-600 dark:text-yellow-400"
                        : materiel.etat === "À réparer"
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-red-600 dark:text-red-400"
                  }`}
                />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {materiel.etat}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getEtatText(materiel.etat)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-8 flex-wrap">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatDate(materiel.date_achat)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date d'achat
              </p>
            </div>
            <div className="w-px h-12 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {materiel.taille || "-"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Taille
              </p>
            </div>
            <div className="w-px h-12 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {materiel.epaisseur || "-"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Épaisseur
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
        {/* Informations générales */}
        <SectionCard title="Informations générales" icon={FiPackage}>
          <InfoItem
            icon={FiHash}
            label="N° Inventaire"
            value={materiel.num_inventaire}
            highlight
          />
          <InfoItem icon={FiTag} label="Catégorie" value={materiel.categorie} />
          <InfoItem icon={FiAward} label="Marque" value={materiel.marque} />
          <InfoItem icon={FiBox} label="Modèle" value={materiel.modele} />
          <InfoItem
            icon={FiMaximize}
            label="Taille"
            value={materiel.taille || "Non renseignée"}
          />
          <InfoItem
            icon={FiActivity}
            label="Épaisseur"
            value={materiel.epaisseur || "Non renseignée"}
          />
          {materiel.categorie === "Bloc" && (
            <InfoItem
              icon={FiDroplet}
              label="Capacité"
              value={materiel.capacite || "Non renseignée"}
            />
          )}
          {materiel.categorie === "Stabilisateur" && (
            <InfoItem
              icon={FiCheckCircle}
              label="État des sangles"
              value={materiel.etat_sangles || "Non renseigné"}
            />
          )}
          {materiel.categorie === "Ordinateur" && (
            <InfoItem
              icon={FiActivity}
              label="Batterie"
              value={materiel.batterie || "Non renseignée"}
            />
          )}
          <InfoItem icon={FiMapPin} label="Localisation">
            <span
              className={`inline-block mt-1 px-2.5 py-1 rounded-full text-sm font-semibold ${getLocalisationColor(materiel.localisation)}`}
            >
              {materiel.localisation}
            </span>
          </InfoItem>
        </SectionCard>

        {/* Maintenance et entretien */}
        <SectionCard title="Maintenance & entretien" icon={FiTool}>
          <InfoItem
            icon={FiCalendar}
            label="Date d'achat"
            value={formatDate(materiel.date_achat)}
          />
          <InfoItem
            icon={FiCheckCircle}
            label="État"
            value={<StatusBadge status={materiel.etat} />}
          />
          <InfoItem
            icon={FiTool}
            label="Vérification visuelle"
            value={
              materiel.date_verif_visuelle
                ? formatDate(materiel.date_verif_visuelle)
                : "Non effectuée"
            }
          />
          <InfoItem
            icon={FiClipboard}
            label="Révision technique"
            value={
              materiel.date_revision_technique
                ? formatDate(materiel.date_revision_technique)
                : "Non effectuée"
            }
          />
          <InfoItem
            icon={FiClock}
            label="Prochaine échéance"
            value={
              materiel.date_prochaine_echeance
                ? formatDate(materiel.date_prochaine_echeance)
                : "Non définie"
            }
            highlight={
              materiel.date_prochaine_echeance &&
              new Date(materiel.date_prochaine_echeance) < new Date()
            }
          />
        </SectionCard>
      </motion.div>

      {/* Attributions du matériel */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400">
              <FiUser className="w-5 h-5" />
            </span>
            Attributions ({attributions.length})
          </h3>
          <Link
            to={`/attributions/create?num_inventaire=${materiel.num_inventaire}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            <FiPlus className="w-4 h-4" />
            Nouvelle attribution
          </Link>
        </div>
        {loadingAttributions ? (
          <LoadingSpinner variant="list" />
        ) : attributions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucune attribution enregistrée pour ce matériel.
          </p>
        ) : (
          <div className="space-y-2">
            {attributions.map((attribution) => (
              <Link
                key={attribution.id_attribution}
                to={`/attributions/${attribution.id_attribution}`}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {adherentMap[attribution.num_adherent] ||
                      `Adhérent #${attribution.num_adherent}`}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(attribution.date_attribution)} →{" "}
                    {formatDate(attribution.date_retour_prevue)}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    attribution.date_retour_reel
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  }`}
                >
                  {attribution.date_retour_reel ? "Retourné" : "En cours"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </motion.div>

      {/* Réparations du matériel */}
      <motion.div
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100/80 dark:border-gray-800/80 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400">
              <FiTool className="w-5 h-5" />
            </span>
            Réparations ({reparations.length})
          </h3>
          <Link
            to={`/reparations/create?num_inventaire=${materiel.num_inventaire}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
          >
            <FiPlus className="w-4 h-4" />
            Nouvelle réparation
          </Link>
        </div>
        {loadingReparations ? (
          <LoadingSpinner variant="list" />
        ) : reparations.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucune réparation enregistrée pour ce matériel.
          </p>
        ) : (
          <div className="space-y-2">
            {reparations.map((reparation) => (
              <Link
                key={reparation.id_reparation}
                to={`/reparations/${reparation.id_reparation}`}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
                    {reparation.description_panne}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    {formatDate(reparation.date_constat)}
                    {reparation.cout && (
                      <span className="flex items-center gap-1">
                        <FiDollarSign className="w-3 h-3" />
                        {formatCurrency(reparation.cout)}
                      </span>
                    )}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    reparation.date_retour
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                  }`}
                >
                  {reparation.date_retour ? "Terminée" : "En cours"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </motion.div>

      {/* Modal suppression */}
      <ConfirmModal
        isOpen={showDeleteModal}
        icon={FiAlertCircle}
        message={
          <>
            Êtes-vous sûr de vouloir supprimer ce matériel{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {materiel.marque} {materiel.modele}
            </span>
            ?
          </>
        }
        confirmLabel="Confirmer la suppression"
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
      />
    </motion.div>
  );
};

export default MaterielDetails;
