import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import sortieService from "../../services/Sortie/sortieService";
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

  // ✅ NOUVEAU - Récupérer les détails d'une sortie avec inscriptions
  const useGetDetails = (id) => {
    return useQuery({
      queryKey: ["sorties", id, "details"],
      queryFn: () => sortieService.getDetails(id),
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    });
  };

  // ✅ NOUVEAU - Récupérer le pointage d'une sortie
  const useGetPointage = (id) => {
    return useQuery({
      queryKey: ["sorties", id, "pointage"],
      queryFn: () => sortieService.getPointage(id),
      enabled: !!id,
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 5,
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

  // ✅ NOUVEAU - Enregistrer le pointage
  const useEnregistrerPointage = () => {
    return useMutation({
      mutationFn: ({ id_sortie, inscriptions }) =>
        sortieService.enregistrerPointage(id_sortie, inscriptions),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["sorties"] });
        queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
        toast.success(response.message || "Pointage enregistré avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message ||
            "Erreur lors de l'enregistrement du pointage",
        );
      },
    });
  };

  // ✅ NOUVEAU - Modifier un pointage
  const useModifierPointage = () => {
    return useMutation({
      mutationFn: ({ id_inscription, data }) =>
        sortieService.modifierPointage(id_inscription, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["sorties"] });
        queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
        toast.success(response.message || "Pointage modifié avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message ||
            "Erreur lors de la modification du pointage",
        );
      },
    });
  };

  // ✅ NOUVEAU - Annuler un pointage
  const useAnnulerPointage = () => {
    return useMutation({
      mutationFn: (id_inscription) =>
        sortieService.annulerPointage(id_inscription),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["sorties"] });
        queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
        toast.success(response.message || "Pointage annulé avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message ||
            "Erreur lors de l'annulation du pointage",
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
    useGetDetails, // ✅ Nouveau
    useGetPointage, // ✅ Nouveau
    useCreate,
    useUpdate,
    useRemove,
    useEnregistrerPointage, // ✅ Nouveau
    useModifierPointage, // ✅ Nouveau
    useAnnulerPointage, // ✅ Nouveau
  };
};
