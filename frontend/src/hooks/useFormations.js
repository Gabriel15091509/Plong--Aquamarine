import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import formationService from "../services/formationService";
import toast from "react-hot-toast";

export const useFormations = () => {
  const queryClient = useQueryClient();

  const useGetAll = (params = {}) => {
    return useQuery({
      queryKey: ["formations", params],
      queryFn: () => formationService.getAll(params),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetById = (id) => {
    return useQuery({
      queryKey: ["formations", id],
      queryFn: () => formationService.getById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetActive = () => {
    return useQuery({
      queryKey: ["formations", "active"],
      queryFn: () => formationService.getActive(),
      staleTime: 5 * 60 * 1000,
    });
  };

  // ✅ CORRECTION: useGetStats existe bien
  const useGetStats = () => {
    return useQuery({
      queryKey: ["formations", "stats"],
      queryFn: () => formationService.getStats(),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: (data) => formationService.create(data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(["formations"]);
        toast.success(response.message || "Formation créée avec succès");
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
      mutationFn: ({ id, data }) => formationService.update(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(["formations"]);
        toast.success(response.message || "Formation mise à jour avec succès");
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
      mutationFn: (id) => formationService.delete(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries(["formations"]);
        toast.success(response.message || "Formation supprimée avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de la suppression",
        );
      },
    });
  };

  const useComplete = () => {
    return useMutation({
      mutationFn: (id) => formationService.complete(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries(["formations"]);
        toast.success(response.message || "Formation terminée avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de la finalisation",
        );
      },
    });
  };

  const useIncrementSessions = () => {
    return useMutation({
      mutationFn: (id) => formationService.incrementSessions(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries(["formations"]);
        toast.success(response.message || "Séance incrémentée avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de l'incrémentation",
        );
      },
    });
  };

  return {
    useGetAll,
    useGetById,
    useGetActive,
    useGetStats, // ✅ Bien retourné
    useCreate,
    useUpdate,
    useRemove,
    useComplete,
    useIncrementSessions,
  };
};
