import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import competenceService from "../../services/Formation/competenceService";
import toast from "react-hot-toast";

export const useCompetences = () => {
  const queryClient = useQueryClient();

  const useGetAll = (params = {}) => {
    return useQuery({
      queryKey: ["competences", params],
      queryFn: () => competenceService.getAll(params),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetById = (id) => {
    return useQuery({
      queryKey: ["competences", id],
      queryFn: () => competenceService.getById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetByFormation = (idFormation) => {
    return useQuery({
      queryKey: ["competences", "formation", idFormation],
      queryFn: () => competenceService.getByFormation(idFormation),
      enabled: !!idFormation,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: (data) => competenceService.create(data),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["competences"] });
        toast.success(response.message || "Compétence ajoutée avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de la création",
        );
      },
    });
  };

  const useValider = () => {
    return useMutation({
      mutationFn: ({ id, data }) => competenceService.valider(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["competences"] });
        toast.success(response.message || "Compétence validée avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de la validation",
        );
      },
    });
  };

  const useUpdate = () => {
    return useMutation({
      mutationFn: ({ id, data }) => competenceService.update(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["competences"] });
        toast.success(
          response.message || "Compétence mise à jour avec succès",
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
      mutationFn: (id) => competenceService.delete(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["competences"] });
        toast.success(response.message || "Compétence supprimée avec succès");
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
    useGetByFormation,
    useCreate,
    useValider,
    useUpdate,
    useRemove,
  };
};
