import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import materielService from '../../services/Materiel/materielService';
import toast from 'react-hot-toast';
import { getByIdWithOfflineFallback } from '../../utils/offlineDetailFallback';

export const useMateriels = () => {
  const queryClient = useQueryClient();

  const useGetAll = (params = {}) => {
    return useQuery({
      queryKey: ['materiels', params],
      queryFn: () => materielService.getAll(params),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetById = (id) => {
    return useQuery({
      queryKey: ['materiels', id],
      queryFn: () => getByIdWithOfflineFallback(materielService, id, 'num_inventaire'),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetAvailable = () => {
    return useQuery({
      queryKey: ['materiels', 'available'],
      queryFn: () => materielService.getAvailable(),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetStats = () => {
    return useQuery({
      queryKey: ['materiels', 'stats'],
      queryFn: () => materielService.getStats(),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: (data) => materielService.create(data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['materiels']);
        toast.success(response.message || 'Matériel créé avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la création');
      },
    });
  };

  const useUpdate = () => {
    return useMutation({
      mutationFn: ({ id, data }) => materielService.update(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['materiels']);
        toast.success(response.message || 'Matériel mis à jour avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
      },
    });
  };

  const useUpdatePhoto = () => {
    return useMutation({
      mutationFn: ({ id, formData }) => materielService.updatePhoto(id, formData),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['materiels']);
        toast.success(response.message || 'Photo mise à jour avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour de la photo');
      },
    });
  };

  const useRemove = () => {
    return useMutation({
      mutationFn: (id) => materielService.delete(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['materiels']);
        toast.success(response.message || 'Matériel supprimé avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      },
    });
  };

  return {
    useGetAll,
    useGetById,
    useGetAvailable,
    useGetStats,
    useCreate,
    useUpdate,
    useUpdatePhoto,
    useRemove,
  };
};