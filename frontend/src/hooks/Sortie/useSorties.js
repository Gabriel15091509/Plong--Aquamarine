import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import sortieService from "../../services/Sortie/sortieService";
import toast from "react-hot-toast";
import { getByIdWithOfflineFallback } from "../../utils/offlineDetailFallback";

export const useSorties = () => {
  const queryClient = useQueryClient();

  const useGetAll = (params = {}) => {
    return useQuery({
      queryKey: ["sorties", "all", JSON.stringify(params)],
      queryFn: () => sortieService.getAll(params),
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      retry: 1,
    });
  };

  const useGetById = (id) => {
    return useQuery({
      queryKey: ["sorties", id],
      queryFn: () => getByIdWithOfflineFallback(sortieService, id, 'id_sortie'),
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    });
  };

  const useGetUpcoming = (options = {}) => {
    return useQuery({
      queryKey: ["sorties", "upcoming"],
      queryFn: () => sortieService.getUpcoming(),
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      ...options,
    });
  };

  const useGetStats = () => {
    return useQuery({
      queryKey: ["sorties", "stats"],
      queryFn: () => sortieService.getStats(),
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    });
  };

  const useGetAvailablePlaces = () => {
    return useQuery({
      queryKey: ["sorties", "available-places"],
      queryFn: () => sortieService.getAvailablePlaces(),
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    });
  };

  // NOUVEAU - Récupérer les détails d'une sortie avec inscriptions
  const useGetDetails = (id) => {
    return useQuery({
      queryKey: ["sorties", id, "details"],
      queryFn: () => sortieService.getDetails(id),
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
    });
  };

  // Prévision météo (vent, houle, orage...) de la sortie — voir
  // SortieService.getPrevisionMeteo côté backend. staleTime plus court que
  // les autres requêtes de cette sortie : une prévision se rafraîchit plus
  // vite qu'une donnée métier stable.
  const useGetMeteo = (id) => {
    return useQuery({
      queryKey: ["sorties", id, "meteo"],
      queryFn: () => sortieService.getMeteo(id),
      enabled: !!id,
      staleTime: 1000 * 60 * 10,
      cacheTime: 1000 * 60 * 20,
      refetchOnWindowFocus: false,
      retry: 1,
    });
  };

  // NOUVEAU - Récupérer le pointage d'une sortie
  const useGetPointage = (id) => {
    return useQuery({
      queryKey: ["sorties", id, "pointage"],
      queryFn: () => sortieService.getPointage(id),
      enabled: !!id,
      staleTime: 1000 * 60 * 2, // 2 minutes
      cacheTime: 1000 * 60 * 5,
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

  // NOUVEAU - Enregistrer le pointage
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

  // NOUVEAU - Modifier un pointage
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

  // Annulation manuelle pour météo dangereuse (voir SortieService.
  // annulerPourMeteo côté backend) — invalide aussi la prévision météo de la
  // sortie (et pas seulement la liste), pour repasser immédiatement le
  // badge sur "Annulée pour météo" sans recharger la page.
  const useAnnulerPourMeteo = () => {
    return useMutation({
      mutationFn: (id) => sortieService.annulerPourMeteo(id),
      onSuccess: (response, id) => {
        queryClient.invalidateQueries({ queryKey: ["sorties"] });
        queryClient.invalidateQueries({ queryKey: ["sorties", id, "meteo"] });
        toast.success(response.message || "Sortie annulée pour cause météorologique");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message ||
            "Erreur lors de l'annulation pour cause météorologique",
        );
      },
    });
  };

  // Dates de repli proposées pour une sortie annulée météo (voir
  // SortieService.getPropositionsReprogrammation côté backend) — n'a de
  // sens que sur une sortie "Annulée" pour ce motif, laissé au composant
  // appelant de conditionner `enabled` en conséquence (voir SortieDetails).
  const useGetPropositionsReprogrammation = (id, options = {}) => {
    return useQuery({
      queryKey: ["sorties", id, "propositions-reprogrammation"],
      queryFn: () => sortieService.getPropositionsReprogrammation(id),
      enabled: !!id && options.enabled !== false,
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      retry: 1,
    });
  };

  // Reprogrammation d'une sortie annulée météo sur une nouvelle date (voir
  // SortieService.replanifier côté backend) — invalide aussi bien la liste
  // que la prévision météo et les propositions (une fois "Planifiée", ni
  // l'une ni l'autre ne concerne plus cette sortie sous cette forme).
  const useReplanifier = () => {
    return useMutation({
      mutationFn: ({ id, data }) => sortieService.replanifier(id, data),
      onSuccess: (response, { id }) => {
        queryClient.invalidateQueries({ queryKey: ["sorties"] });
        queryClient.invalidateQueries({ queryKey: ["sorties", id, "meteo"] });
        queryClient.invalidateQueries({
          queryKey: ["sorties", id, "propositions-reprogrammation"],
        });
        toast.success(response.message || "Sortie replanifiée");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de la replanification",
        );
      },
    });
  };

  // Photos de la sortie — réservées aux participants (le backend refuse un
  // 403 aux autres, voir SortieService.assertCanAccessPhotos) : `retry:
  // false`, un 403 n'a aucune raison de réussir en re-tentant, et le
  // composant appelant distingue ce cas (message "réservé aux
  // participants") d'une vraie erreur via `error?.response?.status`.
  const useGetPhotos = (id, options = {}) => {
    return useQuery({
      queryKey: ["sorties", id, "photos"],
      queryFn: () => sortieService.getPhotos(id),
      enabled: !!id && options.enabled !== false,
      staleTime: 1000 * 60 * 2,
      cacheTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      retry: false,
    });
  };

  // `urls` : plusieurs liens à la fois, voir SortieService.addPhotos côté
  // backend (un seul appel, pas un aller-retour par photo).
  const useAddPhotos = () => {
    return useMutation({
      mutationFn: ({ id, urls }) => sortieService.addPhotos(id, urls),
      onSuccess: (response, { id }) => {
        queryClient.invalidateQueries({ queryKey: ["sorties", id, "photos"] });
        // photos_count (voir SortieService.attachCapacity) affiché sur la
        // liste/fiche générale : à rafraîchir aussi.
        queryClient.invalidateQueries({ queryKey: ["sorties"] });
        toast.success(response.message || "Photo(s) ajoutée(s) avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de l'ajout des photos",
        );
      },
    });
  };

  const useRemovePhoto = () => {
    return useMutation({
      mutationFn: ({ id, photoId }) => sortieService.removePhoto(id, photoId),
      onSuccess: (response, { id }) => {
        queryClient.invalidateQueries({ queryKey: ["sorties", id, "photos"] });
        queryClient.invalidateQueries({ queryKey: ["sorties"] });
        toast.success(response.message || "Photo supprimée avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message ||
            "Erreur lors de la suppression de la photo",
        );
      },
    });
  };

  // NOUVEAU - Annuler un pointage
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
    useGetDetails, // Nouveau
    useGetMeteo,
    useGetPointage, // Nouveau
    useCreate,
    useUpdate,
    useRemove,
    useAnnulerPourMeteo,
    useGetPropositionsReprogrammation,
    useReplanifier,
    useEnregistrerPointage, // Nouveau
    useModifierPointage, // Nouveau
    useAnnulerPointage, // Nouveau
    useGetPhotos,
    useAddPhotos,
    useRemovePhoto,
  };
};
