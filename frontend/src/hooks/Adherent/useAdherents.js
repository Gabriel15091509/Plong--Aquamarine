import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import adherentService from "../../services/Adherent/adherentService";
import toast from "react-hot-toast";
import { getByIdWithOfflineFallback } from "../../utils/offlineDetailFallback";

export const useAdherents = () => {
  const queryClient = useQueryClient();

  const useGetAll = (params = {}) => {
    return useQuery({
      queryKey: ['adherents', params],
      queryFn: () => adherentService.getAll(params),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetById = (id) => {
    return useQuery({
      queryKey: ['adherents', id],
      queryFn: () => getByIdWithOfflineFallback(adherentService, id, 'num_adherent'),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetWithDetails = (id) => {
    return useQuery({
      queryKey: ['adherents', id, 'details'],
      queryFn: () => adherentService.getWithDetails(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetStats = () => {
    return useQuery({
      queryKey: ['adherents', 'stats'],
      queryFn: () => adherentService.getStats(),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: (data) => adherentService.create(data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['adherents']);
        toast.success(response.message || "Adhérent créé avec succès");
      },
      onError: (error) => {
        const message = error.response?.data?.message || "Erreur lors de la création";
        toast.error(message);
      },
    });
  };

  const useUpdate = () => {
    return useMutation({
      mutationFn: ({ id, data }) => adherentService.update(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['adherents']);
        toast.success(response.message || "Adhérent mis à jour avec succès");
      },
      onError: (error) => {
        const message = error.response?.data?.message || "Erreur lors de la mise à jour";
        toast.error(message);
      },
    });
  };

  const useRemove = () => {
    return useMutation({
      mutationFn: (id) => adherentService.delete(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['adherents']);
        toast.success(response.message || "Adhérent supprimé avec succès");
      },
      onError: (error) => {
        const message = error.response?.data?.message || "Erreur lors de la suppression";
        toast.error(message);
      },
    });
  };

  const useSendCommunication = () => {
    return useMutation({
      mutationFn: (data) => adherentService.sendCommunication(data),
      onSuccess: (response) => {
        toast.success(response.message || "Message envoyé");
      },
      onError: (error) => {
        const message = error.response?.data?.message || "Erreur lors de l'envoi";
        toast.error(message);
      },
    });
  };

  return {
    useGetAll,
    useGetById,
    useGetWithDetails,
    useGetStats,
    useCreate,
    useUpdate,
    useRemove,
    useSendCommunication,
  };
};