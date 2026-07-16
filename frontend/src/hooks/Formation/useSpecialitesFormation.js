import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import specialiteFormationService from "../../services/Formation/specialiteFormationService";
import toast from "react-hot-toast";

export const useSpecialitesFormation = () => {
  const queryClient = useQueryClient();

  const useGetAll = (params = {}) => {
    return useQuery({
      queryKey: ["specialites-formation", params],
      queryFn: () => specialiteFormationService.getAll(params),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetById = (id) => {
    return useQuery({
      queryKey: ["specialites-formation", id],
      queryFn: () => specialiteFormationService.getById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: (data) => specialiteFormationService.create(data),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["specialites-formation"] });
        toast.success(response.message || "Spécialité créée avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message ||
            (error.response?.data?.errors || []).join(", ") ||
            "Erreur lors de la création",
        );
      },
    });
  };

  const useUpdate = () => {
    return useMutation({
      mutationFn: ({ id, data }) => specialiteFormationService.update(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["specialites-formation"] });
        toast.success(response.message || "Spécialité mise à jour avec succès");
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
      mutationFn: (id) => specialiteFormationService.delete(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["specialites-formation"] });
        toast.success(response.message || "Spécialité supprimée avec succès");
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
    useCreate,
    useUpdate,
    useRemove,
  };
};
