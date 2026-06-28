import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEdit, FiMail, FiPhone, FiMapPin, FiCalendar, FiAward, FiUser, FiArrowLeft, FiUsers, FiDollarSign } from 'react-icons/fi';
import { useAdherents } from '../../hooks/useAdherents';
import LoadingSpinner from '../Common/LoadingSpinner';
import StatusBadge from '../Common/StatusBadge';
import { formatDate, formatCurrency } from '../../utils/helpers';

const AdherentDetails = ({ id }) => {
  const navigate = useNavigate();
  // ✅ CORRECTION: Utiliser useGetWithDetails au lieu de getWithDetails
  const { useGetWithDetails } = useAdherents();
  const { data, isLoading, error } = useGetWithDetails(id);
  const [adherent, setAdherent] = useState(null);

  useEffect(() => {
    if (data?.data) {
      setAdherent(data.data);
    }
  }, [data]);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">Erreur: {error.message}</div>;
  if (!adherent) return <div className="text-center py-8">Adhérent non trouvé</div>;

  const InfoItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
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
      {/* Bouton retour */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/adherents')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <FiArrowLeft className="w-4 h-4" />
          Retour à la liste
        </button>
        <Link
          to={`/adherents/edit/${adherent.num_adherent}`}
          className="btn-primary flex items-center gap-2"
        >
          <FiEdit className="w-4 h-4" />
          Modifier
        </Link>
      </div>

      {/* En-tête */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-ocean-500 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {adherent.prenom?.charAt(0)}{adherent.nom?.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {adherent.civilite} {adherent.nom} {adherent.prenom}
              </h1>
              <div className="flex flex-wrap gap-2 mt-1">
                <StatusBadge status={adherent.statut} />
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {adherent.niveau || 'Non défini'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Informations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiUser className="w-5 h-5 text-primary-500" />
            Informations personnelles
          </h3>
          <div className="space-y-2">
            <InfoItem icon={FiUser} label="Civilité" value={adherent.civilite} />
            <InfoItem icon={FiCalendar} label="Date de naissance" value={formatDate(adherent.date_naissance)} />
            <InfoItem icon={FiMapPin} label="Adresse" value={adherent.adresse} />
            <InfoItem icon={FiPhone} label="Téléphone" value={adherent.telephone} />
            <InfoItem icon={FiMail} label="Email" value={adherent.email} />
            <InfoItem icon={FiUser} label="Contact d'urgence" value={adherent.contact_urgence || 'Non défini'} />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiAward className="w-5 h-5 text-primary-500" />
            Informations club
          </h3>
          <div className="space-y-2">
            <InfoItem icon={FiAward} label="Niveau" value={adherent.niveau || 'Non défini'} />
            <InfoItem icon={FiCalendar} label="Date d'obtention" value={formatDate(adherent.date_obtention_niveau)} />
            <InfoItem icon={FiCalendar} label="Date d'inscription" value={formatDate(adherent.date_inscription)} />
            <InfoItem icon={FiAward} label="Nombre de plongées" value={adherent.nb_plongees_total || 0} />
          </div>
        </div>
      </div>

      {/* Adhésions */}
      {adherent.adhesions && adherent.adhesions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiUsers className="w-5 h-5 text-primary-500" />
            Adhésions
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Début</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fin</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {adherent.adhesions.map((adhesion) => (
                  <tr key={adhesion.id_adhesion} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm">{adhesion.type}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(adhesion.date_debut)}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(adhesion.date_fin)}</td>
                    <td className="px-4 py-3 text-sm font-medium">{formatCurrency(adhesion.montant_paye)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={adhesion.statut_paiement} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Paiements */}
      {adherent.paiements && adherent.paiements.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiDollarSign className="w-5 h-5 text-primary-500" />
            Paiements
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motif</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {adherent.paiements.map((paiement) => (
                  <tr key={paiement.id_paiement} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm">{paiement.motif}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(paiement.date_paiement)}</td>
                    <td className="px-4 py-3 text-sm font-medium">{formatCurrency(paiement.montant)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={paiement.statut} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AdherentDetails;