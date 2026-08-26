import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import incidentService from "../../services/Incident/incidentService";
import toast from "react-hot-toast";
import { getByIdWithOfflineFallback } from "../../utils/offlineDetailFallback";

export const useIncidents = () => {
  const queryClient = useQueryClient();

  const useGetAll = (params = {}) => {
    return useQuery({
      queryKey: ["incidents", params],
      queryFn: () => incidentService.getAll(params),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetById = (id) => {
    return useQuery({
      queryKey: ["incidents", id],
      queryFn: () => getByIdWithOfflineFallback(incidentService, id, 'id_incident'),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetNonClotures = () => {
    return useQuery({
      queryKey: ["incidents", "non-clotures"],
      queryFn: () => incidentService.getNonClotures(),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetBySortie = (idSortie) => {
    return useQuery({
      queryKey: ["incidents", "sortie", idSortie],
      queryFn: () => incidentService.getBySortie(idSortie),
      enabled: !!idSortie,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: (data) => incidentService.create(data),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["incidents"] });
        toast.success(response.message || "Incident déclaré avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de la déclaration",
        );
      },
    });
  };

  const useCloturer = () => {
    return useMutation({
      mutationFn: ({ id, data }) => incidentService.cloturer(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["incidents"] });
        toast.success(response.message || "Incident clôturé avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de la clôture",
        );
      },
    });
  };

  const useUpdate = () => {
    return useMutation({
      mutationFn: ({ id, data }) => incidentService.update(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["incidents"] });
        toast.success(response.message || "Incident mis à jour avec succès");
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
      mutationFn: (id) => incidentService.delete(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["incidents"] });
        toast.success(response.message || "Incident supprimé avec succès");
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
    useGetNonClotures,
    useGetBySortie,
    useCreate,
    useCloturer,
    useUpdate,
    useRemove,
  };
};
