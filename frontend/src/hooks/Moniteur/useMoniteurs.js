import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import moniteurService from '../../services/Moniteur/moniteurService';
import toast from 'react-hot-toast';

export const useMoniteurs = () => {
  const queryClient = useQueryClient();

  const useGetAll = (params = {}) => {
    return useQuery({
      queryKey: ['moniteurs', params],
      queryFn: () => moniteurService.getAll(params),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetById = (id) => {
    return useQuery({
      queryKey: ['moniteurs', id],
      queryFn: () => moniteurService.getById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetDisponibles = () => {
    return useQuery({
      queryKey: ['moniteurs', 'disponibles'],
      queryFn: () => moniteurService.getDisponibles(),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetBySpecialite = (specialite) => {
    return useQuery({
      queryKey: ['moniteurs', 'specialite', specialite],
      queryFn: () => moniteurService.getBySpecialite(specialite),
      enabled: !!specialite,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetByUserId = (userId) => {
    return useQuery({
      queryKey: ['moniteurs', 'user', userId],
      queryFn: () => moniteurService.getByUserId(userId),
      enabled: !!userId,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: (data) => moniteurService.create(data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['moniteurs']);
        queryClient.invalidateQueries(['users']);
        toast.success(response.message || 'Moniteur créé avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la création');
      },
    });
  };

  const useUpdate = () => {
    return useMutation({
      mutationFn: ({ id, data }) => moniteurService.update(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['moniteurs']);
        toast.success(response.message || 'Moniteur mis à jour avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
      },
    });
  };

  const useRemove = () => {
    return useMutation({
      mutationFn: (id) => moniteurService.delete(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['moniteurs']);
        toast.success(response.message || 'Moniteur supprimé avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      },
    });
  };

  return {
    useGetAll,
    useGetById,
    useGetDisponibles,
    useGetBySpecialite,
    useGetByUserId,
    useCreate,
    useUpdate,
    useRemove,
  };
};
