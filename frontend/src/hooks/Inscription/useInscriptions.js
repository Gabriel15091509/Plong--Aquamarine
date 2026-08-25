import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import inscriptionService from "../../services/Inscription/inscriptionService";
import toast from "react-hot-toast";

export const useInscriptions = () => {
  const queryClient = useQueryClient();

  const useGetAll = (options = {}) => {
    return useQuery({
      queryKey: ["inscriptions"],
      queryFn: async () => {
        const response = await inscriptionService.getAll();
        return response;
      },
      ...options,
    });
  };

  const useGetById = (id) => {
    return useQuery({
      queryKey: ["inscription", id],
      queryFn: async () => {
        const response = await inscriptionService.getById(id);
        return response;
      },
      enabled: !!id,
    });
  };

  const useGetByAdherent = (numAdherent) => {
    return useQuery({
      queryKey: ["inscriptions", "adherent", numAdherent],
      queryFn: async () => {
        const response = await inscriptionService.getByAdherent(numAdherent);
        return response;
      },
      enabled: !!numAdherent,
      staleTime: 2 * 60 * 1000,
    });
  };

  // AJOUTER useGetStats
  const useGetStats = () => {
    return useQuery({
      queryKey: ["inscriptions", "stats"],
      queryFn: async () => {
        const response = await inscriptionService.getStats();
        return response;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: async (data) => {
        const response = await inscriptionService.create(data);
        return response;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
        queryClient.invalidateQueries({ queryKey: ["inscriptions", "stats"] });
        queryClient.invalidateQueries({ queryKey: ["inscriptions", "capacity"] });
      },
    });
  };

  const useUpdate = () => {
    return useMutation({
      mutationFn: async ({ id, data }) => {
        const response = await inscriptionService.update(id, data);
        return response;
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
        queryClient.invalidateQueries({
          queryKey: ["inscription", data?.data?.id_inscription],
        });
        queryClient.invalidateQueries({ queryKey: ["inscriptions", "stats"] });
        queryClient.invalidateQueries({ queryKey: ["inscriptions", "capacity"] });
      },
      onError: (error) => {
        console.error("Échec de la mise à jour de l'inscription :", error);
      },
    });
  };

  const useRemove = () => {
    return useMutation({
      mutationFn: async (id) => {
        const response = await inscriptionService.delete(id);
        return response;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
        queryClient.invalidateQueries({ queryKey: ["inscriptions", "stats"] });
        queryClient.invalidateQueries({ queryKey: ["inscriptions", "capacity"] });
      },
    });
  };

  // Régression : `useGetById` ci-dessus met sa fiche en cache sous la clé
  // SINGULIER ["inscription", id] (voir InscriptionDetails.jsx), distincte
  // de la clé PLURIEL ["inscriptions", ...] utilisée par la liste/les stats/
  // la capacité — invalider seulement ["inscriptions"] ne touche donc jamais
  // ["inscription", id] (ce ne sont pas des préfixes communs). useUpdate et
  // useEnregistrerPaiement plus bas invalidaient déjà les deux clés
  // correctement ; useConfirm/useCancel les oubliaient, laissant la page de
  // détail d'une inscription affichée son ancien statut ("En attente" au
  // lieu de "Confirmée"/"Annulée") tant que la page n'était pas rechargée
  // manuellement.
  const useConfirm = () => {
    return useMutation({
      mutationFn: async (id) => {
        const response = await inscriptionService.confirm(id);
        return response;
      },
      onSuccess: (data, id) => {
        queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
        queryClient.invalidateQueries({ queryKey: ["inscription", id] });
        queryClient.invalidateQueries({ queryKey: ["inscriptions", "stats"] });
        queryClient.invalidateQueries({ queryKey: ["inscriptions", "capacity"] });
      },
    });
  };

  const useCancel = () => {
    return useMutation({
      mutationFn: async (id) => {
        const response = await inscriptionService.cancel(id);
        return response;
      },
      onSuccess: (data, id) => {
        queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
        queryClient.invalidateQueries({ queryKey: ["inscription", id] });
        queryClient.invalidateQueries({ queryKey: ["inscriptions", "stats"] });
        queryClient.invalidateQueries({ queryKey: ["inscriptions", "capacity"] });
      },
    });
  };

  const useEnregistrerPaiement = () => {
    return useMutation({
      mutationFn: ({ id, data }) => inscriptionService.enregistrerPaiement(id, data),
      onSuccess: (response, variables) => {
        queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
        queryClient.invalidateQueries({ queryKey: ["inscription", variables?.id] });
        // Le versement crée aussi une ligne Paiement liée côté backend.
        queryClient.invalidateQueries({ queryKey: ["paiements"] });
        toast.success(response.message || "Paiement enregistré avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de l'enregistrement du paiement",
        );
      },
    });
  };

  const useGetConfirmationsBySortie = (id_sortie) => {
    return useQuery({
      queryKey: ["inscriptions", "confirmations", id_sortie],
      queryFn: async () => {
        const response =
          await inscriptionService.getConfirmationsBySortie(id_sortie);
        return response;
      },
      enabled: !!id_sortie,
    });
  };

  const useGetPresentsBySortie = (id_sortie) => {
    return useQuery({
      queryKey: ["inscriptions", "presents", id_sortie],
      queryFn: async () => {
        const response = await inscriptionService.getPresentsBySortie(id_sortie);
        return response;
      },
      enabled: !!id_sortie,
    });
  };

  const useGetWaitlistBySortie = (id_sortie) => {
    return useQuery({
      queryKey: ["inscriptions", "waitlist", id_sortie],
      queryFn: async () => {
        const response =
          await inscriptionService.getWaitlistBySortie(id_sortie);
        return response;
      },
      enabled: !!id_sortie,
    });
  };

  const useGetCapacityBySortie = (id_sortie) => {
    return useQuery({
      queryKey: ["inscriptions", "capacity", id_sortie],
      queryFn: async () => {
        const response =
          await inscriptionService.getCapacityBySortie(id_sortie);
        return response;
      },
      enabled: !!id_sortie,
    });
  };

  return {
    useGetAll,
    useGetById,
    useGetByAdherent,
    useGetStats, // AJOUTÉ
    useCreate,
    useUpdate,
    useRemove,
    useConfirm,
    useCancel,
    useEnregistrerPaiement,
    useGetConfirmationsBySortie,
    useGetPresentsBySortie,
    useGetWaitlistBySortie,
    useGetCapacityBySortie,
  };
};
