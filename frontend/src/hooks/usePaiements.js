import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import paiementService from "../services/paiementService";
import toast from "react-hot-toast";

export const usePaiements = () => {
  const queryClient = useQueryClient();

  const useGetAll = (params = {}) => {
    return useQuery({
      queryKey: ["paiements", params],
      queryFn: () => paiementService.getAll(params),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetById = (id) => {
    return useQuery({
      queryKey: ["paiements", id],
      queryFn: () => paiementService.getById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetPending = () => {
    return useQuery({
      queryKey: ["paiements", "pending"],
      queryFn: () => paiementService.getPending(),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetByAdherent = (numAdherent) => {
    return useQuery({
      queryKey: ["paiements", "adherent", numAdherent],
      queryFn: () => paiementService.getByAdherent(numAdherent),
      enabled: !!numAdherent,
      staleTime: 2 * 60 * 1000,
    });
  };

  // ✅ CORRECTION: useGetStats existe bien
  const useGetStats = () => {
    return useQuery({
      queryKey: ["paiements", "stats"],
      queryFn: () => paiementService.getStats(),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: (data) => paiementService.create(data),
      onSuccess: (response, variables) => {
        queryClient.invalidateQueries(["paiements"]);
        // Le registre général délègue à Adhesion/Inscription/FormationService
        // selon le type choisi : invalider le cache de l'objet visé pour
        // refléter le nouveau statut/solde sans attendre le staleTime.
        if (variables?.type_paiement === "Adhesion") {
          queryClient.invalidateQueries(["adhesions"]);
        } else if (variables?.type_paiement === "Sortie") {
          queryClient.invalidateQueries(["inscriptions"]);
        } else if (variables?.type_paiement === "Formation") {
          queryClient.invalidateQueries(["formations"]);
        }
        toast.success(response.message || "Paiement créé avec succès");
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
      mutationFn: ({ id, data }) => paiementService.update(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(["paiements"]);
        toast.success(response.message || "Paiement mis à jour avec succès");
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
      mutationFn: (id) => paiementService.delete(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries(["paiements"]);
        toast.success(response.message || "Paiement supprimé avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de la suppression",
        );
      },
    });
  };

  const useProcess = () => {
    return useMutation({
      mutationFn: (id) => paiementService.process(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries(["paiements"]);
        toast.success(response.message || "Paiement validé avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de la validation",
        );
      },
    });
  };

  const useCancel = () => {
    return useMutation({
      mutationFn: (id) => paiementService.cancel(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries(["paiements"]);
        toast.success(response.message || "Paiement annulé avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de l'annulation",
        );
      },
    });
  };

  return {
    useGetAll,
    useGetById,
    useGetPending,
    useGetByAdherent,
    useGetStats, // ✅ Bien retourné
    useCreate,
    useUpdate,
    useRemove,
    useProcess,
    useCancel,
  };
};
