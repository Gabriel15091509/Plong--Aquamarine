import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import inscriptionService from '../services/inscriptionService';
import toast from 'react-hot-toast';

export const useInscriptions = () => {
  const queryClient = useQueryClient();

  const useGetAll = (params = {}) => {
    return useQuery({
      queryKey: ['inscriptions', params],
      queryFn: () => inscriptionService.getAll(params),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetById = (id) => {
    return useQuery({
      queryKey: ['inscriptions', id],
      queryFn: () => inscriptionService.getById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: (data) => inscriptionService.create(data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['inscriptions']);
        toast.success(response.message || 'Inscription créée avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la création');
      },
    });
  };

  const useUpdate = () => {
    return useMutation({
      mutationFn: ({ id, data }) => inscriptionService.update(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['inscriptions']);
        toast.success(response.message || 'Inscription mise à jour avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
      },
    });
  };

  const useRemove = () => {
    return useMutation({
      mutationFn: (id) => inscriptionService.delete(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['inscriptions']);
        toast.success(response.message || 'Inscription supprimée avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      },
    });
  };

  const useConfirm = () => {
    return useMutation({
      mutationFn: (id) => inscriptionService.confirm(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['inscriptions']);
        toast.success(response.message || 'Inscription confirmée avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la confirmation');
      },
    });
  };

  const useCancel = () => {
    return useMutation({
      mutationFn: (id) => inscriptionService.cancel(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['inscriptions']);
        toast.success(response.message || 'Inscription annulée avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de l\'annulation');
      },
    });
  };

  return {
    useGetAll,
    useGetById,
    useCreate,
    useUpdate,
    useRemove,
    useConfirm,
    useCancel,
  };
};