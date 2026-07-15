import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import attributionService from "../../services/Attribution/attributionService";
import toast from "react-hot-toast";

export const useAttributions = () => {
  const queryClient = useQueryClient();

  const useGetAll = (params = {}) => {
    return useQuery({
      queryKey: ["attributions", params],
      queryFn: () => attributionService.getAll(params),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetById = (id) => {
    return useQuery({
      queryKey: ["attributions", id],
      queryFn: () => attributionService.getById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetEnCours = () => {
    return useQuery({
      queryKey: ["attributions", "en-cours"],
      queryFn: () => attributionService.getEnCours(),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetByAdherent = (numAdherent) => {
    return useQuery({
      queryKey: ["attributions", "adherent", numAdherent],
      queryFn: () => attributionService.getByAdherent(numAdherent),
      enabled: !!numAdherent,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetByMateriel = (numInventaire) => {
    return useQuery({
      queryKey: ["attributions", "materiel", numInventaire],
      queryFn: () => attributionService.getByMateriel(numInventaire),
      enabled: !!numInventaire,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetByPalanquee = (idPalanquee) => {
    return useQuery({
      queryKey: ["attributions", "palanquee", idPalanquee],
      queryFn: () => attributionService.getByPalanquee(idPalanquee),
      enabled: !!idPalanquee,
      staleTime: 2 * 60 * 1000,
    });
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: (data) => attributionService.create(data),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["attributions"] });
        toast.success(response.message || "Attribution créée avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de la création",
        );
      },
    });
  };

  const useRetour = () => {
    return useMutation({
      mutationFn: ({ id, data }) => attributionService.retour(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["attributions"] });
        toast.success(response.message || "Retour enregistré avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message ||
            "Erreur lors de l'enregistrement du retour",
        );
      },
    });
  };

  const useUpdate = () => {
    return useMutation({
      mutationFn: ({ id, data }) => attributionService.update(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["attributions"] });
        toast.success(
          response.message || "Attribution mise à jour avec succès",
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
      mutationFn: (id) => attributionService.delete(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["attributions"] });
        toast.success(
          response.message || "Attribution supprimée avec succès",
        );
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de la suppression",
        );
      },
    });
  };

  const useEnregistrerCaution = () => {
    return useMutation({
      mutationFn: ({ id, data }) => attributionService.enregistrerCaution(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["attributions"] });
        // La caution crée aussi une ligne Paiement liée côté backend.
        queryClient.invalidateQueries({ queryKey: ["paiements"] });
        toast.success(response.message || "Caution enregistrée avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de l'enregistrement de la caution",
        );
      },
    });
  };

  const useRestituerCaution = () => {
    return useMutation({
      mutationFn: (id) => attributionService.restituerCaution(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["attributions"] });
        // Le statut du paiement de caution lié passe à "Remboursé" côté backend.
        queryClient.invalidateQueries({ queryKey: ["paiements"] });
        toast.success(response.message || "Caution restituée avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de la restitution de la caution",
        );
      },
    });
  };

  const useTraiterDeterioration = () => {
    return useMutation({
      mutationFn: ({ id, data }) => attributionService.traiterDeterioration(id, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["attributions"] });
        // Une Réparation est créée côté backend pour couvrir la détérioration.
        queryClient.invalidateQueries({ queryKey: ["reparations"] });
        toast.success(response.message || "Détérioration traitée avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors du traitement de la détérioration",
        );
      },
    });
  };

  return {
    useGetAll,
    useGetById,
    useGetEnCours,
    useGetByAdherent,
    useGetByMateriel,
    useGetByPalanquee,
    useCreate,
    useRetour,
    useUpdate,
    useRemove,
    useEnregistrerCaution,
    useRestituerCaution,
    useTraiterDeterioration,
  };
};
