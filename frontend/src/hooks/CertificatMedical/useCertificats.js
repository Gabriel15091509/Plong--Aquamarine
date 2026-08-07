import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import certificatService from '../../services/CertificatMedical/certificatService';
import toast from 'react-hot-toast';

export const useCertificats = () => {
  const queryClient = useQueryClient();

  const useGetAll = (params = {}) => {
    return useQuery({
      queryKey: ['certificats', params],
      queryFn: () => certificatService.getAll(params),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetById = (id) => {
    return useQuery({
      queryKey: ['certificats', id],
      queryFn: () => certificatService.getById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: (data) => certificatService.create(data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['certificats']);
        toast.success(response.message || 'Certificat créé avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la création');
      },
    });
  };

  const useUpdate = () => {
    return useMutation({
      mutationFn: ({ id, data }) => certificatService.update(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['certificats']);
        toast.success(response.message || 'Certificat mis à jour avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
      },
    });
  };

  const useRemove = () => {
    return useMutation({
      mutationFn: (id) => certificatService.delete(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['certificats']);
        toast.success(response.message || 'Certificat supprimé avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      },
    });
  };

  const useValider = () => {
    return useMutation({
      mutationFn: ({ id, decision, motif }) => certificatService.valider(id, { decision, motif }),
      onSuccess: (response, variables) => {
        queryClient.invalidateQueries(['certificats']);
        toast.success(
          response.message ||
            (variables.decision === "Validé" ? "Certificat validé" : "Certificat rejeté"),
        );
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Erreur lors de la validation");
      },
    });
  };

  const useStatus = (numAdherent) => {
    return useQuery({
      queryKey: ['certificats', 'status', numAdherent],
      queryFn: () => certificatService.getStatus(numAdherent),
      enabled: !!numAdherent,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useAnalysePhoto = () => {
    return useMutation({
      mutationFn: (params) => certificatService.analysePhoto(params),
      onError: (error) => {
        toast.error(error.response?.data?.message || "Analyse de la photo impossible");
      },
    });
  };

  const useGetByAdherent = (numAdherent) => {
    return useQuery({
      queryKey: ['certificats', 'adherent', numAdherent],
      queryFn: () => certificatService.getByAdherent(numAdherent),
      enabled: !!numAdherent,
      staleTime: 5 * 60 * 1000,
    });
  };

  return {
    useGetAll,
    useGetById,
    useCreate,
    useUpdate,
    useRemove,
    useStatus,
    useGetByAdherent,
    useAnalysePhoto,
    useValider,
  };
};