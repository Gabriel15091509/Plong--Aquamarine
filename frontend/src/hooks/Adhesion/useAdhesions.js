import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import adhesionService from '../../services/Adhesion/adhesionService';
import toast from 'react-hot-toast';

export const useAdhesions = () => {
  const queryClient = useQueryClient();

  const useGetAll = (params = {}) => {
    return useQuery({
      queryKey: ['adhesions', params],
      queryFn: () => adhesionService.getAll(params),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetById = (id) => {
    return useQuery({
      queryKey: ['adhesions', id],
      queryFn: () => adhesionService.getById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: (data) => adhesionService.create(data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['adhesions']);
        toast.success(response.message || 'Adhésion créée avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la création');
      },
    });
  };

  const useUpdate = () => {
    return useMutation({
      mutationFn: ({ id, data }) => adhesionService.update(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['adhesions']);
        toast.success(response.message || 'Adhésion mise à jour avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
      },
    });
  };

  const useRemove = () => {
    return useMutation({
      mutationFn: (id) => adhesionService.delete(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['adhesions']);
        toast.success(response.message || 'Adhésion supprimée avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      },
    });
  };

  const useEnregistrerPaiement = () => {
    return useMutation({
      mutationFn: ({ id, data }) => adhesionService.enregistrerPaiement(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['adhesions']);
        // Le versement crée aussi une ligne Paiement liée côté backend.
        queryClient.invalidateQueries(['paiements']);
        toast.success(response.message || 'Paiement enregistré avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement du paiement');
      },
    });
  };

  const useGetByAdherent = (numAdherent) => {
    return useQuery({
      queryKey: ['adhesions', 'adherent', numAdherent],
      queryFn: () => adhesionService.getByAdherent(numAdherent),
      enabled: !!numAdherent,
      staleTime: 2 * 60 * 1000,
    });
  };

  const useAnalysePhoto = () => {
    return useMutation({
      mutationFn: (params) => adhesionService.analysePhoto(params),
      onError: (error) => {
        toast.error(error.response?.data?.message || "Analyse de la photo impossible");
      },
    });
  };

  const useDossierStatus = (numAdherent) => {
    return useQuery({
      queryKey: ['adhesions', 'dossier-status', numAdherent],
      queryFn: () => adhesionService.getDossierStatus(numAdherent),
      enabled: !!numAdherent,
      staleTime: 5 * 60 * 1000,
    });
  };

  return {
    useGetAll,
    useGetById,
    useGetByAdherent,
    useCreate,
    useUpdate,
    useRemove,
    useDossierStatus,
    useEnregistrerPaiement,
    useAnalysePhoto,
  };
};