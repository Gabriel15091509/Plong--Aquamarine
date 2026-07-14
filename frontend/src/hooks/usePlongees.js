import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import plongeeService from '../services/plongeeService';
import toast from 'react-hot-toast';

export const usePlongees = () => {
  const queryClient = useQueryClient();

  const useGetAll = (params = {}) => {
    return useQuery({
      queryKey: ['plongees', params],
      queryFn: () => plongeeService.getAll(params),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetById = (id) => {
    return useQuery({
      queryKey: ['plongees', id],
      queryFn: () => plongeeService.getById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetStats = () => {
    return useQuery({
      queryKey: ['plongees', 'stats'],
      queryFn: () => plongeeService.getStats(),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetByAdherent = (numAdherent) => {
    return useQuery({
      queryKey: ['plongees', 'adherent', numAdherent],
      queryFn: () => plongeeService.getByAdherent(numAdherent),
      enabled: !!numAdherent,
      staleTime: 2 * 60 * 1000,
    });
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: (data) => plongeeService.create(data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['plongees']);
        toast.success(response.message || 'Plongée créée avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la création');
      },
    });
  };

  const useUpdate = () => {
    return useMutation({
      mutationFn: ({ id, data }) => plongeeService.update(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['plongees']);
        toast.success(response.message || 'Plongée mise à jour avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
      },
    });
  };

  const useRemove = () => {
    return useMutation({
      mutationFn: (id) => plongeeService.delete(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['plongees']);
        toast.success(response.message || 'Plongée supprimée avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      },
    });
  };

  const useValidate = () => {
    return useMutation({
      mutationFn: (id) => plongeeService.validate(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['plongees']);
        toast.success(response.message || 'Plongée validée avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la validation');
      },
    });
  };

  return {
    useGetAll,
    useGetById,
    useGetStats,
    useGetByAdherent,
    useCreate,
    useUpdate,
    useRemove,
    useValidate,
  };
};