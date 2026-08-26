import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import reparationService from "../../services/Reparation/reparationService";
import toast from "react-hot-toast";
import { getByIdWithOfflineFallback } from "../../utils/offlineDetailFallback";

export const useReparations = () => {
  const queryClient = useQueryClient();

  const useGetAll = (params = {}) => {
    return useQuery({
      queryKey: ["reparations", params],
      queryFn: () => reparationService.getAll(params),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetById = (id) => {
    return useQuery({
      queryKey: ["reparations", id],
      queryFn: () => getByIdWithOfflineFallback(reparationService, id, 'id_reparation'),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetEnCours = () => {
    return useQuery({
      queryKey: ["reparations", "en-cours"],
      queryFn: () => reparationService.getEnCours(),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetByMateriel = (numInventaire) => {
    return useQuery({
      queryKey: ["reparations", "materiel", numInventaire],
      queryFn: () => reparationService.getByMateriel(numInventaire),
      enabled: !!numInventaire,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: (data) => reparationService.create(data),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["reparations"] });
        toast.success(response.message || "Réparation créée avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de la création",
        );
      },
    });
  };

  const useTerminer = () => {
    return useMutation({
      mutationFn: ({ id, data }) => reparationService.terminer(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["reparations"] });
        toast.success(response.message || "Réparation terminée avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message ||
            "Erreur lors de la clôture de la réparation",
        );
      },
    });
  };

  const useUpdate = () => {
    return useMutation({
      mutationFn: ({ id, data }) => reparationService.update(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["reparations"] });
        toast.success(
          response.message || "Réparation mise à jour avec succès",
        );
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
      mutationFn: (id) => reparationService.delete(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["reparations"] });
        toast.success(response.message || "Réparation supprimée avec succès");
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
    useGetEnCours,
    useGetByMateriel,
    useCreate,
    useTerminer,
    useUpdate,
    useRemove,
  };
};
