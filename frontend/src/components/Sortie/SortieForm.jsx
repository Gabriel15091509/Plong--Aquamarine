import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSorties } from '../../hooks/useSorties';
import LoadingSpinner from '../Common/LoadingSpinner';
import { TYPE_SORTIE_OPTIONS, STATUT_SORTIE_OPTIONS, NIVEAU_OPTIONS } from '../../utils/constants';

const SortieForm = ({ editMode = false, sortieId = null }) => {
  const navigate = useNavigate();
  const { useGetById, useCreate, useUpdate } = useSorties();
  const { data, isLoading: loadingData } = useGetById(sortieId);
  const create = useCreate();
  const update = useUpdate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    date_heure: '',
    lieu: '',
    site: '',
    type: 'Plongée',
    niveau_requis: 'Débutant',
    nb_places: 10,
    profondeur_max: 20,
    duree_estimee: '01:00',
    tarif: 0,
    statut: 'Planifiée',
    description_site: '',
    date_ouverture_inscriptions: '',
    condition_affectation: ''
  });

  useEffect(() => {
    if (editMode && sortieId && data?.data) {
      const s = data.data;
      setFormData({
        date_heure: s.date_heure ? s.date_heure.split('T')[0] : '',
        lieu: s.lieu || '',
        site: s.site || '',
        type: s.type || 'Plongée',
        niveau_requis: s.niveau_requis || 'Débutant',
        nb_places: s.nb_places || 10,
        profondeur_max: s.profondeur_max || 20,
        duree_estimee: s.duree_estimee || '01:00',
        tarif: s.tarif || 0,
        statut: s.statut || 'Planifiée',
        description_site: s.description_site || '',
        date_ouverture_inscriptions: s.date_ouverture_inscriptions ? s.date_ouverture_inscriptions.split('T')[0] : '',
        condition_affectation: s.condition_affectation || ''
      });
    }
  }, [editMode, sortieId, data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.date_heure) newErrors.date_heure = 'La date est requise';
    if (!formData.lieu) newErrors.lieu = 'Le lieu est requis';
    if (!formData.site) newErrors.site = 'Le site est requis';
    if (!formData.type) newErrors.type = 'Le type est requis';
    if (!formData.nb_places || formData.nb_places < 1) newErrors.nb_places = 'Minimum 1 place';
    if (!formData.profondeur_max || formData.profondeur_max < 0) newErrors.profondeur_max = 'La profondeur est requise';
    if (!formData.tarif || formData.tarif < 0) newErrors.tarif = 'Le tarif est requis';
    if (!formData.date_ouverture_inscriptions) newErrors.date_ouverture_inscriptions = 'La date d\'ouverture est requise';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      if (editMode && sortieId) {
        await update.mutateAsync({ id: sortieId, data: formData });
      } else {
        await create.mutateAsync(formData);
      }
      navigate('/sorties');
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Date et heure *</label>
          <input type="datetime-local" name="date_heure" value={formData.date_heure} onChange={handleChange} className={`input-field ${errors.date_heure ? 'border-red-500' : ''}`} />
          {errors.date_heure && <p className="mt-1 text-sm text-red-600">{errors.date_heure}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Lieu *</label>
          <input type="text" name="lieu" value={formData.lieu} onChange={handleChange} className={`input-field ${errors.lieu ? 'border-red-500' : ''}`} />
          {errors.lieu && <p className="mt-1 text-sm text-red-600">{errors.lieu}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Site *</label>
          <input type="text" name="site" value={formData.site} onChange={handleChange} className={`input-field ${errors.site ? 'border-red-500' : ''}`} />
          {errors.site && <p className="mt-1 text-sm text-red-600">{errors.site}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
          <select name="type" value={formData.type} onChange={handleChange} className="input-field">
            {TYPE_SORTIE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Niveau requis</label>
          <select name="niveau_requis" value={formData.niveau_requis} onChange={handleChange} className="input-field">
            {NIVEAU_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de places *</label>
          <input type="number" name="nb_places" value={formData.nb_places} onChange={handleChange} className={`input-field ${errors.nb_places ? 'border-red-500' : ''}`} />
          {errors.nb_places && <p className="mt-1 text-sm text-red-600">{errors.nb_places}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Profondeur max (m) *</label>
          <input type="number" name="profondeur_max" value={formData.profondeur_max} onChange={handleChange} className={`input-field ${errors.profondeur_max ? 'border-red-500' : ''}`} />
          {errors.profondeur_max && <p className="mt-1 text-sm text-red-600">{errors.profondeur_max}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Durée estimée (HH:MM)</label>
          <input type="time" name="duree_estimee" value={formData.duree_estimee} onChange={handleChange} className="input-field" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tarif (€) *</label>
          <input type="number" step="0.01" name="tarif" value={formData.tarif} onChange={handleChange} className={`input-field ${errors.tarif ? 'border-red-500' : ''}`} />
          {errors.tarif && <p className="mt-1 text-sm text-red-600">{errors.tarif}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date ouverture inscriptions *</label>
          <input type="date" name="date_ouverture_inscriptions" value={formData.date_ouverture_inscriptions} onChange={handleChange} className={`input-field ${errors.date_ouverture_inscriptions ? 'border-red-500' : ''}`} />
          {errors.date_ouverture_inscriptions && <p className="mt-1 text-sm text-red-600">{errors.date_ouverture_inscriptions}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
          <select name="statut" value={formData.statut} onChange={handleChange} className="input-field">
            {STATUT_SORTIE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Description du site</label>
          <textarea name="description_site" value={formData.description_site} onChange={handleChange} rows="3" className="input-field" />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Conditions d'affectation</label>
          <textarea name="condition_affectation" value={formData.condition_affectation} onChange={handleChange} rows="2" className="input-field" />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-6 border-t">
        <button type="button" onClick={() => navigate('/sorties')} className="btn-secondary">Annuler</button>
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
          {editMode ? 'Mettre à jour' : 'Créer'}
        </button>
      </div>
    </motion.form>
  );
};

export default SortieForm;