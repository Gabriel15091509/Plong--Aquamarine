import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import palanqueeService from "../../services/Palanquee/palanqueeService";
import toast from "react-hot-toast";

export const usePalanquees = () => {
  const queryClient = useQueryClient();

  const useGetAll = (params = {}) => {
    return useQuery({
      queryKey: ["palanquees", params],
      queryFn: () => palanqueeService.getAll(params),
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetById = (id) => {
    return useQuery({
      queryKey: ["palanquees", id],
      queryFn: () => palanqueeService.getById(id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };

  const useGetByPlongee = (idPlongee) => {
    return useQuery({
      queryKey: ["palanquees", "plongee", idPlongee],
      queryFn: () => palanqueeService.getByPlongee(idPlongee),
      enabled: !!idPlongee,
      staleTime: 2 * 60 * 1000,
    });
  };

  const useGetBySortie = (idSortie) => {
    return useQuery({
      queryKey: ["palanquees", "sortie", idSortie],
      queryFn: () => palanqueeService.getBySortie(idSortie),
      enabled: !!idSortie,
      staleTime: 1 * 60 * 1000,
    });
  };

  const useGetStatsBySortie = (idSortie) => {
    return useQuery({
      queryKey: ["palanquees", "sortie", idSortie, "stats"],
      queryFn: () => palanqueeService.getStatsBySortie(idSortie),
      enabled: !!idSortie,
      staleTime: 1 * 60 * 1000,
    });
  };

  const useGetByMoniteur = (idMoniteur) => {
    return useQuery({
      queryKey: ["palanquees", "moniteur", idMoniteur],
      queryFn: () => palanqueeService.getByMoniteur(idMoniteur),
      enabled: !!idMoniteur,
      staleTime: 5 * 60 * 1000,
    });
  };

  const invalidateAll = (idSortie) => {
    queryClient.invalidateQueries({ queryKey: ["palanquees"] });
    if (idSortie) {
      queryClient.invalidateQueries({ queryKey: ["attributions", "palanquee"] });
    }
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: (data) => palanqueeService.create(data),
      onSuccess: (response) => {
        invalidateAll();
        toast.success(response.message || "Palanquée créée avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de la création",
        );
      },
    });
  };

  const useAddMembre = () => {
    return useMutation({
      mutationFn: ({ id, numAdherent }) =>
        palanqueeService.addMembre(id, numAdherent),
      onSuccess: (response) => {
        invalidateAll();
        toast.success(response.message || "Adhérent ajouté à la palanquée");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de l'ajout du membre",
        );
      },
    });
  };

  const useRemoveMembre = () => {
    return useMutation({
      mutationFn: ({ id, numAdherent }) =>
        palanqueeService.removeMembre(id, numAdherent),
      onSuccess: (response) => {
        invalidateAll();
        toast.success(response.message || "Adhérent retiré de la palanquée");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message ||
            "Erreur lors du retrait du membre",
        );
      },
    });
  };

  const useUpdateEncadrement = () => {
    return useMutation({
      mutationFn: ({ id, data }) => palanqueeService.updateEncadrement(id, data),
      onSuccess: (response) => {
        invalidateAll();
        toast.success(response.message || "Encadrement mis à jour");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de la mise à jour",
        );
      },
    });
  };

  const useEnregistrerDonneesPlongee = () => {
    return useMutation({
      mutationFn: ({ id, data }) =>
        palanqueeService.enregistrerDonneesPlongee(id, data),
      onSuccess: (response) => {
        invalidateAll();
        queryClient.invalidateQueries({ queryKey: ["plongees"] });
        toast.success(response.message || "Données de plongée enregistrées");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message ||
            "Erreur lors de l'enregistrement des données",
        );
      },
    });
  };

  const useRetournerMateriel = () => {
    return useMutation({
      mutationFn: ({ id, retours }) =>
        palanqueeService.retournerMateriel(id, retours),
      onSuccess: (response) => {
        invalidateAll();
        queryClient.invalidateQueries({ queryKey: ["reparations"] });
        queryClient.invalidateQueries({ queryKey: ["materiels"] });
        toast.success(response.message || "Retour de matériel enregistré");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors du retour de matériel",
        );
      },
    });
  };

  const useCloturer = () => {
    return useMutation({
      mutationFn: (id) => palanqueeService.cloturer(id),
      onSuccess: (response) => {
        invalidateAll();
        toast.success(response.message || "Palanquée clôturée");
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
      mutationFn: ({ id, data }) => palanqueeService.update(id, data),
      onSuccess: (response) => {
        invalidateAll();
        toast.success(response.message || "Palanquée mise à jour");
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
      mutationFn: (id) => palanqueeService.delete(id),
      onSuccess: (response) => {
        invalidateAll();
        toast.success(response.message || "Palanquée supprimée avec succès");
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
    useGetByPlongee,
    useGetBySortie,
    useGetStatsBySortie,
    useGetByMoniteur,
    useCreate,
    useAddMembre,
    useRemoveMembre,
    useUpdateEncadrement,
    useEnregistrerDonneesPlongee,
    useRetournerMateriel,
    useCloturer,
    useUpdate,
    useRemove,
  };
};
