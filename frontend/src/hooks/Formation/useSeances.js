import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import seanceService from "../../services/Formation/seanceService";
import toast from "react-hot-toast";

export const useSeances = () => {
  const queryClient = useQueryClient();

  const useGetByFormation = (idFormation) => {
    return useQuery({
      queryKey: ["seances", "formation", idFormation],
      queryFn: () => seanceService.getByFormation(idFormation),
      enabled: !!idFormation,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetEncadrementByMoniteur = (idMoniteur) => {
    return useQuery({
      queryKey: ["seances", "moniteur", idMoniteur, "encadrement"],
      queryFn: () => seanceService.getEncadrementByMoniteur(idMoniteur),
      enabled: !!idMoniteur,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: (data) => seanceService.create(data),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["seances"] });
        queryClient.invalidateQueries({ queryKey: ["formations"] });
        toast.success(response.message || "Séance planifiée avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de la planification",
        );
      },
    });
  };

  const useUpdateStatut = () => {
    return useMutation({
      mutationFn: ({ id, data }) => seanceService.updateStatut(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["seances"] });
        queryClient.invalidateQueries({ queryKey: ["formations"] });
        toast.success(response.message || "Statut de la séance mis à jour");
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
      mutationFn: (id) => seanceService.delete(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["seances"] });
        queryClient.invalidateQueries({ queryKey: ["formations"] });
        toast.success(response.message || "Séance supprimée avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de la suppression",
        );
      },
    });
  };

  return {
    useGetByFormation,
    useGetEncadrementByMoniteur,
    useCreate,
    useUpdateStatut,
    useRemove,
  };
};
