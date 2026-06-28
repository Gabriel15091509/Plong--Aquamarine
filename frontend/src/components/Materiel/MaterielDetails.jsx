import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEdit, FiArrowLeft, FiPackage, FiTag, FiCalendar, FiMapPin, FiTool, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { useMateriels } from '../../hooks/useMateriels';
import LoadingSpinner from '../Common/LoadingSpinner';
import { formatDate } from '../../utils/helpers';

const MaterielDetails = ({ id }) => {
  const navigate = useNavigate();
  const { useGetById } = useMateriels();
  const { data, isLoading, error } = useGetById(id);
  const [materiel, setMateriel] = useState(null);

  useEffect(() => {
    if (data?.data) {
      setMateriel(data.data);
    }
  }, [data]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;
  if (!materiel) return <div className="text-center py-8">Matériel non trouvé</div>;

  const getEtatColor = (etat) => {
    const colors = {
      'Neuf': 'text-green-600 bg-green-50',
      'Bon': 'text-blue-600 bg-blue-50',
      'Usagé': 'text-yellow-600 bg-yellow-50',
      'À réparer': 'text-orange-600 bg-orange-50',
      'Hors service': 'text-red-600 bg-red-50'
    };
    return colors[etat] || 'text-gray-600 bg-gray-50';
  };

  const InfoItem = ({ icon: Icon, label, value, highlight = false }) => (
    <div className={`flex items-start gap-3 p-3 rounded-xl ${highlight ? 'bg-primary-50' : ''}`}>
      <div className="text-gray-400 mt-1">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">{value || 'Non défini'}</p>
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
          onClick={() => navigate('/materiels')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
        <Link
          to={`/materiels/edit/${materiel.num_inventaire}`}
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
              Matériel #{materiel.num_inventaire}
            </h1>
            <p className="text-gray-500 mt-1">
              {materiel.marque} {materiel.modele}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEtatColor(materiel.etat)}`}>
            {materiel.etat}
          </span>
        </div>
      </div>

      {/* Informations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Informations générales</h3>
          <div className="space-y-3">
            <InfoItem icon={FiPackage} label="Catégorie" value={materiel.categorie} highlight />
            <InfoItem icon={FiTag} label="Marque" value={materiel.marque} />
            <InfoItem icon={FiTag} label="Modèle" value={materiel.modele} />
            {materiel.taille && <InfoItem icon={FiTool} label="Taille" value={materiel.taille} />}
            {materiel.epaisseur && <InfoItem icon={FiTool} label="Épaisseur" value={materiel.epaisseur} />}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Détails</h3>
          <div className="space-y-3">
            <InfoItem icon={FiCalendar} label="Date d'achat" value={formatDate(materiel.date_achat)} />
            <InfoItem icon={FiMapPin} label="Localisation" value={materiel.localisation} />
            {materiel.date_verif_visuelle && (
              <InfoItem icon={FiCalendar} label="Vérification visuelle" value={formatDate(materiel.date_verif_visuelle)} />
            )}
            {materiel.date_revision_technique && (
              <InfoItem icon={FiCalendar} label="Révision technique" value={formatDate(materiel.date_revision_technique)} />
            )}
            {materiel.date_prochaine_echeance && (
              <InfoItem icon={FiCalendar} label="Prochaine échéance" value={formatDate(materiel.date_prochaine_echeance)} />
            )}
          </div>
        </div>
      </div>

      {/* Statut */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Statut du matériel</h3>
        <div className={`flex items-center gap-4 p-4 rounded-xl ${
          materiel.etat === 'Neuf' || materiel.etat === 'Bon' ? 'bg-green-50' : 
          materiel.etat === 'Hors service' ? 'bg-red-50' : 
          'bg-yellow-50'
        }`}>
          <div className={`p-3 rounded-full ${
            materiel.etat === 'Neuf' || materiel.etat === 'Bon' ? 'bg-green-100' : 
            materiel.etat === 'Hors service' ? 'bg-red-100' : 
            'bg-yellow-100'
          }`}>
            {materiel.etat === 'Neuf' || materiel.etat === 'Bon' ? (
              <FiCheckCircle className="w-6 h-6 text-green-600" />
            ) : materiel.etat === 'Hors service' ? (
              <FiXCircle className="w-6 h-6 text-red-600" />
            ) : (
              <FiTool className="w-6 h-6 text-yellow-600" />
            )}
          </div>
          <div>
            <p className={`font-medium ${
              materiel.etat === 'Neuf' || materiel.etat === 'Bon' ? 'text-green-800' : 
              materiel.etat === 'Hors service' ? 'text-red-800' : 
              'text-yellow-800'
            }`}>
              {materiel.etat === 'Neuf' ? 'Matériel neuf' : 
               materiel.etat === 'Bon' ? 'Matériel en bon état' : 
               materiel.etat === 'Usagé' ? 'Matériel usagé' : 
               materiel.etat === 'À réparer' ? 'Matériel à réparer' : 
               'Matériel hors service'}
            </p>
            <p className="text-sm text-gray-600">
              {materiel.etat === 'Neuf' || materiel.etat === 'Bon' ? 'Le matériel est disponible' : 
               materiel.etat === 'Hors service' ? 'Le matériel n\'est pas disponible' : 
               'Le matériel nécessite une attention particulière'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MaterielDetails;