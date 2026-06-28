import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import sortieService from "../services/sortieService";
import toast from "react-hot-toast";

export const useSorties = () => {
  const queryClient = useQueryClient();

  const useGetAll = (params = {}) => {
    return useQuery({
      queryKey: ["sorties", "all", JSON.stringify(params)],
      queryFn: () => sortieService.getAll(params),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: 1,
    });
  };

  const useGetById = (id) => {
    return useQuery({
      queryKey: ["sorties", id],
      queryFn: () => sortieService.getById(id),
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    });
  };

  const useGetUpcoming = () => {
    return useQuery({
      queryKey: ["sorties", "upcoming"],
      queryFn: () => sortieService.getUpcoming(),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    });
  };

  const useGetStats = () => {
    return useQuery({
      queryKey: ["sorties", "stats"],
      queryFn: () => sortieService.getStats(),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    });
  };

  const useGetAvailablePlaces = () => {
    return useQuery({
      queryKey: ["sorties", "available-places"],
      queryFn: () => sortieService.getAvailablePlaces(),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    });
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: (data) => sortieService.create(data),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["sorties"] });
        toast.success(response.message || "Sortie créée avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de la création",
        );
      },
    });
  };

  const useUpdate = () => {
    return useMutation({
      mutationFn: ({ id, data }) => sortieService.update(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["sorties"] });
        toast.success(response.message || "Sortie mise à jour avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de la mise à jour",
        );
      },
    });
  };

  const useRemove = () => {
    return useMutation({
      mutationFn: (id) => sortieService.delete(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["sorties"] });
        toast.success(response.message || "Sortie supprimée avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de la suppression",
        );
      },
    });
  };

  return {
    useGetAll,
    useGetById,
    useGetUpcoming,
    useGetStats,
    useGetAvailablePlaces,
    useCreate,
    useUpdate,
    useRemove,
  };
};
