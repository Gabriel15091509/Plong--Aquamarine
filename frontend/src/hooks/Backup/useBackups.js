import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import backupService from "../../services/Backup/backupService";
import toast from "react-hot-toast";

export const useBackups = () => {
  const queryClient = useQueryClient();

  const useGetAll = (options = {}) => {
    return useQuery({
      queryKey: ["backups"],
      queryFn: () => backupService.getAll(),
      staleTime: 30 * 1000,
      ...options,
    });
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: () => backupService.create(),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["backups"] });
        toast.success(response.message || "Sauvegarde créée avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de la sauvegarde",
        );
      },
    });
  };

  // Le succès affiche son propre toast ET invalide toutes les requêtes en
  // cache : la base a potentiellement changé sous les pieds de l'appli
  // entière (pas seulement les sauvegardes), pas de sens à ne rafraîchir
  // qu'un coin précis.
  const useRestore = () => {
    return useMutation({
      mutationFn: ({ id, confirmation }) => backupService.restore(id, confirmation),
      onSuccess: (response) => {
        queryClient.invalidateQueries();
        toast.success(response.message || "Base de données restaurée avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de la restauration",
        );
      },
    });
  };

  const useRemove = () => {
    return useMutation({
      mutationFn: (id) => backupService.delete(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ["backups"] });
        toast.success(response.message || "Sauvegarde supprimée avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de la suppression",
        );
      },
    });
  };

  return { useGetAll, useCreate, useRestore, useRemove };
};
