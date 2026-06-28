import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useFormations } from '../../hooks/useFormations';
import LoadingSpinner from '../Common/LoadingSpinner';
import { NIVEAU_FORMATION_OPTIONS, STATUT_FORMATION_OPTIONS } from '../../utils/constants';

const FormationForm = ({ editMode = false, formationId = null }) => {
  const navigate = useNavigate();
  const { useGetById, useCreate, useUpdate } = useFormations();
  const { data, isLoading: loadingData } = useGetById(formationId);
  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    num_adherent: '',
    niveau_vise: 'N1',
    date_debut: '',
    date_fin_prevue: '',
    statut: 'En cours',
    nb_seances_realisees: 0,
    commentaire_moniteur: ''
  });

  useEffect(() => {
    if (editMode && formationId && data?.data) {
      const f = data.data;
      setFormData({
        num_adherent: f.num_adherent || '',
        niveau_vise: f.niveau_vise || 'N1',
        date_debut: f.date_debut ? f.date_debut.split('T')[0] : '',
        date_fin_prevue: f.date_fin_prevue ? f.date_fin_prevue.split('T')[0] : '',
        statut: f.statut || 'En cours',
        nb_seances_realisees: f.nb_seances_realisees || 0,
        commentaire_moniteur: f.commentaire_moniteur || ''
      });
    }
  }, [editMode, formationId, data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.num_adherent) newErrors.num_adherent = 'L\'adhérent est requis';
    if (!formData.niveau_vise) newErrors.niveau_vise = 'Le niveau est requis';
    if (!formData.date_debut) newErrors.date_debut = 'La date de début est requise';
    if (!formData.date_fin_prevue) newErrors.date_fin_prevue = 'La date de fin prévue est requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (editMode && formationId) {
        await update.mutateAsync({ id: formationId, data: formData });
      } else {
        await create.mutateAsync(formData);
      }
      navigate('/formations');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData && editMode) return <LoadingSpinner />;

  return (
    <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Adhérent *</label>
          <input type="number" name="num_adherent" value={formData.num_adherent} onChange={handleChange} className={`input-field ${errors.num_adherent ? 'border-red-500' : ''}`} />
          {errors.num_adherent && <p className="mt-1 text-sm text-red-600">{errors.num_adherent}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Niveau visé *</label>
          <select name="niveau_vise" value={formData.niveau_vise} onChange={handleChange} className="input-field">
            {NIVEAU_FORMATION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date début *</label>
          <input type="date" name="date_debut" value={formData.date_debut} onChange={handleChange} className={`input-field ${errors.date_debut ? 'border-red-500' : ''}`} />
          {errors.date_debut && <p className="mt-1 text-sm text-red-600">{errors.date_debut}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date fin prévue *</label>
          <input type="date" name="date_fin_prevue" value={formData.date_fin_prevue} onChange={handleChange} className={`input-field ${errors.date_fin_prevue ? 'border-red-500' : ''}`} />
          {errors.date_fin_prevue && <p className="mt-1 text-sm text-red-600">{errors.date_fin_prevue}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
          <select name="statut" value={formData.statut} onChange={handleChange} className="input-field">
            {STATUT_FORMATION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Séances réalisées</label>
          <input type="number" name="nb_seances_realisees" value={formData.nb_seances_realisees} onChange={handleChange} className="input-field" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire du moniteur</label>
          <textarea name="commentaire_moniteur" value={formData.commentaire_moniteur} onChange={handleChange} rows="4" className="input-field" />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t">
        <button type="button" onClick={() => navigate('/formations')} className="btn-secondary">Annuler</button>
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
          {editMode ? 'Mettre à jour' : 'Créer'}
        </button>
      </div>
    </motion.form>
  );
};

export default FormationForm;