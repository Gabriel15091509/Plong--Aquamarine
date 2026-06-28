import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePlongees } from '../../hooks/usePlongees';
import LoadingSpinner from '../Common/LoadingSpinner';
import { TYPE_PLONGEE_OPTIONS } from '../../utils/constants';

const VISIBILITE_OPTIONS = ['Très bonne', 'Bonne', 'Moyenne', 'Mauvaise', 'Très mauvaise'];

const PlongeeForm = ({ editMode = false, plongeeId = null }) => {
  const navigate = useNavigate();
  const { useGetById, useCreate, useUpdate } = usePlongees();
  const { data, isLoading: loadingData } = useGetById(plongeeId);
  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    num_adherent: '',
    date: '',
    profondeur_max: '',
    duree: '',
    temperature_eau: '',
    visibilite: 'Bonne',
    type_plongee: 'Loisir',
    observations_faune: '',
    valide_moniteur: false,
    lien_photos: ''
  });

  useEffect(() => {
    if (editMode && plongeeId && data?.data) {
      const p = data.data;
      setFormData({
        num_adherent: p.num_adherent || '',
        date: p.date ? p.date.split('T')[0] : '',
        profondeur_max: p.profondeur_max || '',
        duree: p.duree || '',
        temperature_eau: p.temperature_eau || '',
        visibilite: p.visibilite || 'Bonne',
        type_plongee: p.type_plongee || 'Loisir',
        observations_faune: p.observations_faune || '',
        valide_moniteur: p.valide_moniteur || false,
        lien_photos: p.lien_photos || ''
      });
    }
  }, [editMode, plongeeId, data]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.num_adherent) newErrors.num_adherent = 'L\'adhérent est requis';
    if (!formData.date) newErrors.date = 'La date est requise';
    if (!formData.profondeur_max || formData.profondeur_max <= 0) newErrors.profondeur_max = 'La profondeur est requise';
    if (!formData.duree || formData.duree <= 0) newErrors.duree = 'La durée est requise';
    if (!formData.type_plongee) newErrors.type_plongee = 'Le type est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (editMode && plongeeId) {
        await update.mutateAsync({ id: plongeeId, data: formData });
      } else {
        await create.mutateAsync(formData);
      }
      navigate('/plongees');
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
          <input type="date" name="date" value={formData.date} onChange={handleChange} className={`input-field ${errors.date ? 'border-red-500' : ''}`} />
          {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Profondeur max (m) *</label>
          <input type="number" name="profondeur_max" value={formData.profondeur_max} onChange={handleChange} className={`input-field ${errors.profondeur_max ? 'border-red-500' : ''}`} />
          {errors.profondeur_max && <p className="mt-1 text-sm text-red-600">{errors.profondeur_max}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Durée (minutes) *</label>
          <input type="number" name="duree" value={formData.duree} onChange={handleChange} className={`input-field ${errors.duree ? 'border-red-500' : ''}`} />
          {errors.duree && <p className="mt-1 text-sm text-red-600">{errors.duree}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Température de l'eau (°C)</label>
          <input type="number" step="0.1" name="temperature_eau" value={formData.temperature_eau} onChange={handleChange} className="input-field" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Visibilité</label>
          <select name="visibilite" value={formData.visibilite} onChange={handleChange} className="input-field">
            {VISIBILITE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type de plongée *</label>
          <select name="type_plongee" value={formData.type_plongee} onChange={handleChange} className="input-field">
            {TYPE_PLONGEE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Lien photos</label>
          <input type="text" name="lien_photos" value={formData.lien_photos} onChange={handleChange} className="input-field" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Observations</label>
          <textarea name="observations_faune" value={formData.observations_faune} onChange={handleChange} rows="3" className="input-field" />
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="valide_moniteur" checked={formData.valide_moniteur} onChange={handleChange} className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
            <span className="text-sm font-medium text-gray-700">Validée par le moniteur</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t">
        <button type="button" onClick={() => navigate('/plongees')} className="btn-secondary">Annuler</button>
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
          {editMode ? 'Mettre à jour' : 'Créer'}
        </button>
      </div>
    </motion.form>
  );
};

export default PlongeeForm;