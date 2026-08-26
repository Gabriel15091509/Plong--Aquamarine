import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import formationService from "../../services/Formation/formationService";
import toast from "react-hot-toast";
import { getByIdWithOfflineFallback } from "../../utils/offlineDetailFallback";

export const useFormations = () => {
  const queryClient = useQueryClient();

  const useGetAll = (params = {}, options = {}) => {
    return useQuery({
      queryKey: ["formations", params],
      queryFn: () => formationService.getAll(params),
      staleTime: 5 * 60 * 1000,
      ...options,
    });
  };

  const useGetById = (id) => {
    return useQuery({
      queryKey: ["formations", id],
      queryFn: () => getByIdWithOfflineFallback(formationService, id, 'id_formation'),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetByAdherent = (numAdherent) => {
    return useQuery({
      queryKey: ["formations", "adherent", numAdherent],
      queryFn: () => formationService.getByAdherent(numAdherent),
      enabled: !!numAdherent,
      staleTime: 2 * 60 * 1000,
    });
  };

  const useGetActive = () => {
    return useQuery({
      queryKey: ["formations", "active"],
      queryFn: () => formationService.getActive(),
      staleTime: 5 * 60 * 1000,
    });
  };

  // CORRECTION: useGetStats existe bien
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
        // La validation avant création (prérequis, dossier d'adhésion,
        // paiement initial requis...) renvoie un tableau `errors`, pas un
        // `message` unique — sans ce repli, l'utilisateur ne voyait qu'un
        // "Erreur lors de la création" générique sans savoir pourquoi
        // (ex: paiement non initié) ni quoi corriger.
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
      mutationFn: ({ id, data }) => formationService.complete(id, data),
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

  const useAjourner = () => {
    return useMutation({
      mutationFn: ({ id, motif }) => formationService.ajourner(id, motif),
      onSuccess: (response) => {
        queryClient.invalidateQueries(["formations"]);
        toast.success(response.message || "Formation ajournée");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de l'ajournement",
        );
      },
    });
  };

  const useEnregistrerPaiement = () => {
    return useMutation({
      mutationFn: ({ id, data }) => formationService.enregistrerPaiement(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(["formations"]);
        // Le versement crée aussi une ligne Paiement liée côté backend.
        queryClient.invalidateQueries(["paiements"]);
        toast.success(response.message || "Paiement enregistré avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de l'enregistrement du paiement",
        );
      },
    });
  };

  return {
    useGetAll,
    useGetById,
    useGetByAdherent,
    useGetActive,
    useGetStats, // Bien retourné
    useCreate,
    useUpdate,
    useRemove,
    useComplete,
    useAjourner,
    useEnregistrerPaiement,
  };
};
