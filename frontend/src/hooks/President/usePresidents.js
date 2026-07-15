import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import presidentService from '../../services/President/presidentService';
import toast from 'react-hot-toast';

export const usePresidents = () => {
  const queryClient = useQueryClient();

  const useGetAll = (params = {}) => {
    return useQuery({
      queryKey: ['presidents', params],
      queryFn: () => presidentService.getAll(params),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetById = (id) => {
    return useQuery({
      queryKey: ['presidents', id],
      queryFn: () => presidentService.getById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetCurrent = () => {
    return useQuery({
      queryKey: ['presidents', 'current'],
      queryFn: () => presidentService.getCurrent(),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetByAnnee = (annee) => {
    return useQuery({
      queryKey: ['presidents', 'annee', annee],
      queryFn: () => presidentService.getByAnnee(annee),
      enabled: !!annee,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: (data) => presidentService.create(data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['presidents']);
        queryClient.invalidateQueries(['moniteurs']);
        queryClient.invalidateQueries(['users']);
        toast.success(response.message || 'Président créé avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la création');
      },
    });
  };

  const useUpdate = () => {
    return useMutation({
      mutationFn: ({ id, data }) => presidentService.update(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['presidents']);
        toast.success(response.message || 'Président mis à jour avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
      },
    });
  };

  const useRemove = () => {
    return useMutation({
      mutationFn: (id) => presidentService.delete(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['presidents']);
        toast.success(response.message || 'Président supprimé avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      },
    });
  };

  return {
    useGetAll,
    useGetById,
    useGetCurrent,
    useGetByAnnee,
    useCreate,
    useUpdate,
    useRemove,
  };
};
