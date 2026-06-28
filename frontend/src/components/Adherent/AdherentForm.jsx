import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAdherents } from '../../hooks/useAdherents';
import LoadingSpinner from '../Common/LoadingSpinner';

const AdherentForm = ({ editMode = false, adherentId = null }) => {
  const navigate = useNavigate();
  const { useGetById, useCreate, useUpdate } = useAdherents();
  const { data, isLoading: loadingData } = useGetById(adherentId);
  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    civilite: 'M.',
    nom: '',
    prenom: '',
    date_naissance: '',
    adresse: '',
    telephone: '',
    email: '',
    contact_urgence: '',
    niveau: 'Débutant',
    date_obtention_niveau: '',
    statut: 'Actif'
  });

  useEffect(() => {
    if (editMode && adherentId && data?.data) {
      const adherent = data.data;
      setFormData({
        civilite: adherent.civilite || 'M.',
        nom: adherent.nom || '',
        prenom: adherent.prenom || '',
        date_naissance: adherent.date_naissance ? adherent.date_naissance.split('T')[0] : '',
        adresse: adherent.adresse || '',
        telephone: adherent.telephone || '',
        email: adherent.email || '',
        contact_urgence: adherent.contact_urgence || '',
        niveau: adherent.niveau || 'Débutant',
        date_obtention_niveau: adherent.date_obtention_niveau ? adherent.date_obtention_niveau.split('T')[0] : '',
        statut: adherent.statut || 'Actif'
      });
    }
  }, [editMode, adherentId, data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.nom) newErrors.nom = 'Le nom est requis';
    if (!formData.prenom) newErrors.prenom = 'Le prénom est requis';
    if (!formData.email) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    if (!formData.date_naissance) {
      newErrors.date_naissance = 'La date de naissance est requise';
    }
    if (!formData.adresse) newErrors.adresse = 'L\'adresse est requise';
    if (!formData.telephone) newErrors.telephone = 'Le téléphone est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    // ✅ Préparer les données pour l'API
    const submitData = {
      ...formData,
      // ✅ S'assurer que les dates sont valides ou null
      date_naissance: formData.date_naissance ? new Date(formData.date_naissance).toISOString() : null,
      date_obtention_niveau: formData.date_obtention_niveau ? new Date(formData.date_obtention_niveau).toISOString() : null
    };

    setLoading(true);
    try {
      if (editMode && adherentId) {
        await update.mutateAsync({ id: adherentId, data: submitData });
      } else {
        await create.mutateAsync(submitData);
      }
      navigate('/adherents');
    } catch (error) {
      console.error('Error saving adherent:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData && editMode) return <LoadingSpinner />;

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-card p-6 space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Civilité */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Civilité *
          </label>
          <select
            name="civilite"
            value={formData.civilite}
            onChange={handleChange}
            className="input-field"
          >
            <option value="M.">M.</option>
            <option value="Mme">Mme</option>
            <option value="Mlle">Mlle</option>
          </select>
        </div>

        {/* Nom */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom *
          </label>
          <input
            type="text"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            className={`input-field ${errors.nom ? 'border-red-500' : ''}`}
          />
          {errors.nom && <p className="mt-1 text-sm text-red-600">{errors.nom}</p>}
        </div>

        {/* Prénom */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prénom *
          </label>
          <input
            type="text"
            name="prenom"
            value={formData.prenom}
            onChange={handleChange}
            className={`input-field ${errors.prenom ? 'border-red-500' : ''}`}
          />
          {errors.prenom && <p className="mt-1 text-sm text-red-600">{errors.prenom}</p>}
        </div>

        {/* Date de naissance */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date de naissance *
          </label>
          <input
            type="date"
            name="date_naissance"
            value={formData.date_naissance}
            onChange={handleChange}
            className={`input-field ${errors.date_naissance ? 'border-red-500' : ''}`}
          />
          {errors.date_naissance && <p className="mt-1 text-sm text-red-600">{errors.date_naissance}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`input-field ${errors.email ? 'border-red-500' : ''}`}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        {/* Téléphone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Téléphone *
          </label>
          <input
            type="tel"
            name="telephone"
            value={formData.telephone}
            onChange={handleChange}
            className={`input-field ${errors.telephone ? 'border-red-500' : ''}`}
          />
          {errors.telephone && <p className="mt-1 text-sm text-red-600">{errors.telephone}</p>}
        </div>

        {/* Adresse */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adresse *
          </label>
          <input
            type="text"
            name="adresse"
            value={formData.adresse}
            onChange={handleChange}
            className={`input-field ${errors.adresse ? 'border-red-500' : ''}`}
          />
          {errors.adresse && <p className="mt-1 text-sm text-red-600">{errors.adresse}</p>}
        </div>

        {/* Contact urgence */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact d'urgence
          </label>
          <input
            type="text"
            name="contact_urgence"
            value={formData.contact_urgence}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        {/* Niveau */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Niveau
          </label>
          <select
            name="niveau"
            value={formData.niveau}
            onChange={handleChange}
            className="input-field"
          >
            <option value="Débutant">Débutant</option>
            <option value="Niveau 1">Niveau 1</option>
            <option value="Niveau 2">Niveau 2</option>
            <option value="Niveau 3">Niveau 3</option>
            <option value="Niveau 4">Niveau 4</option>
            <option value="Moniteur">Moniteur</option>
          </select>
        </div>

        {/* Date obtention niveau */}
        {formData.niveau !== 'Débutant' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date d'obtention du niveau
            </label>
            <input
              type="date"
              name="date_obtention_niveau"
              value={formData.date_obtention_niveau}
              onChange={handleChange}
              className="input-field"
            />
          </div>
        )}

        {/* Statut */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Statut
          </label>
          <select
            name="statut"
            value={formData.statut}
            onChange={handleChange}
            className="input-field"
          >
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
            <option value="Suspendu">Suspendu</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t">
        <button
          type="button"
          onClick={() => navigate('/adherents')}
          className="btn-secondary"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary flex items-center gap-2"
        >
          {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
          {editMode ? 'Mettre à jour' : 'Créer'}
        </button>
      </div>
    </motion.form>
  );
};

export default AdherentForm;