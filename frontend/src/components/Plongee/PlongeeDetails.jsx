import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiEdit,
  FiArrowLeft,
  FiUser,
  FiCalendar,
  FiAnchor,
  FiThermometer,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiClock,
} from "react-icons/fi";
import { usePlongees } from "../../hooks/usePlongees";
import LoadingSpinner from "../Common/LoadingSpinner";
import { formatDate } from "../../utils/helpers";

const PlongeeDetails = ({ id }) => {
  const navigate = useNavigate();
  const { useGetById } = usePlongees();
  const { data, isLoading, error } = useGetById(id);
  const [plongee, setPlongee] = useState(null);

  useEffect(() => {
    if (data?.data) {
      setPlongee(data.data);
    }
  }, [data]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;
  if (!plongee)
    return <div className="text-center py-8">Plongée non trouvée</div>;

  const InfoItem = ({ icon: Icon, label, value, highlight = false }) => (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl ${highlight ? "bg-primary-50" : ""}`}
    >
      <div className="text-gray-400 mt-1">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">{value || "Non défini"}</p>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/plongees")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
        <Link
          to={`/plongees/edit/${plongee.id_plongee}`}
          className="btn-primary flex items-center gap-2"
        >
          <FiEdit className="w-4 h-4" />
          Modifier
        </Link>
      </div>

      {/* Titre */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Plongée #{plongee.id_plongee}
            </h1>
            <p className="text-gray-500 mt-1">
              {plongee.type_plongee} - {formatDate(plongee.date)}
            </p>
          </div>
          {plongee.valide_moniteur ? (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1">
              <FiCheckCircle className="w-4 h-4" /> Validée
            </span>
          ) : (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-1">
              <FiXCircle className="w-4 h-4" /> En attente
            </span>
          )}
        </div>
      </div>

      {/* Informations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Informations générales
          </h3>
          <div className="space-y-3">
            <InfoItem
              icon={FiUser}
              label="Adhérent"
              value={`#${plongee.num_adherent}`}
              highlight
            />
            <InfoItem
              icon={FiCalendar}
              label="Date"
              value={formatDate(plongee.date)}
            />
            <InfoItem
              icon={FiAnchor}
              label="Type de plongée"
              value={plongee.type_plongee}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Détails techniques
          </h3>
          <div className="space-y-3">
            <InfoItem
              icon={FiAnchor}
              label="Profondeur max"
              value={`${plongee.profondeur_max}m`}
            />
            <InfoItem
              icon={FiClock}
              label="Durée"
              value={`${plongee.duree} min`}
            />
            {plongee.temperature_eau && (
              <InfoItem
                icon={FiThermometer}
                label="Température de l'eau"
                value={`${plongee.temperature_eau}°C`}
              />
            )}
            {plongee.visibilite && (
              <InfoItem
                icon={FiEye}
                label="Visibilité"
                value={plongee.visibilite}
              />
            )}
          </div>
        </div>
      </div>

      {/* Observations */}
      {plongee.observations_faune && (
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Observations
          </h3>
          <p className="text-gray-600 leading-relaxed">
            {plongee.observations_faune}
          </p>
        </div>
      )}

      {/* Photos */}
      {plongee.lien_photos && (
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Photos</h3>
          <a
            href={plongee.lien_photos}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 underline"
          >
            Voir les photos
          </a>
        </div>
      )}
    </motion.div>
  );
};

export default PlongeeDetails;
