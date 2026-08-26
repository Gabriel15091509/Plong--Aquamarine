import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import tresorierService from '../../services/Tresorier/tresorierService';
import toast from 'react-hot-toast';
import { getByIdWithOfflineFallback } from '../../utils/offlineDetailFallback';

export const useTresoriers = () => {
  const queryClient = useQueryClient();

  const useGetAll = (params = {}) => {
    return useQuery({
      queryKey: ['tresoriers', params],
      queryFn: () => tresorierService.getAll(params),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetById = (id) => {
    return useQuery({
      queryKey: ['tresoriers', id],
      queryFn: () => getByIdWithOfflineFallback(tresorierService, id, 'id_tresorier'),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetByAnnee = (annee) => {
    return useQuery({
      queryKey: ['tresoriers', 'annee', annee],
      queryFn: () => tresorierService.getByAnnee(annee),
      enabled: !!annee,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetByUserId = (userId) => {
    return useQuery({
      queryKey: ['tresoriers', 'user', userId],
      queryFn: () => tresorierService.getByUserId(userId),
      enabled: !!userId,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: (data) => tresorierService.create(data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['tresoriers']);
        queryClient.invalidateQueries(['users']);
        toast.success(response.message || 'Trésorier créé avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la création');
      },
    });
  };

  const useUpdate = () => {
    return useMutation({
      mutationFn: ({ id, data }) => tresorierService.update(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['tresoriers']);
        toast.success(response.message || 'Trésorier mis à jour avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
      },
    });
  };

  const useRemove = () => {
    return useMutation({
      mutationFn: (id) => tresorierService.delete(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['tresoriers']);
        toast.success(response.message || 'Trésorier supprimé avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      },
    });
  };

  return {
    useGetAll,
    useGetById,
    useGetByAnnee,
    useGetByUserId,
    useCreate,
    useUpdate,
    useRemove,
  };
};
