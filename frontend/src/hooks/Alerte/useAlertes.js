import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import alerteService from '../../services/Alerte/alerteService';
import toast from 'react-hot-toast';

export const useAlertes = () => {
  const queryClient = useQueryClient();

  const useGetAll = (params = {}) => {
    return useQuery({
      queryKey: ['alertes', params],
      queryFn: () => alerteService.getAll(params),
      staleTime: 30 * 1000, // 30 secondes
      refetchInterval: 60 * 1000, // Rafraîchir toutes les minutes
    });
  };

  // `limit` plafonne la liste renvoyée pour le dropdown de notifications
  // (défaut 20 côté backend, voir AlerteService.getUnread) — sans lui, un
  // club avec beaucoup d'alertes non lues charge (et garde en mémoire côté
  // navigateur) l'historique complet à chaque ouverture du dropdown.
  const useGetUnread = (params = {}) => {
    return useQuery({
      queryKey: ['alertes', 'unread', params],
      queryFn: () => alerteService.getUnread(params),
      staleTime: 30 * 1000,
      refetchInterval: 30 * 1000, // Rafraîchir toutes les 30 secondes
    });
  };

  // Liste complète (lues + non lues), paginée — page "Toutes les
  // notifications" (voir pages/Notification/NotificationsPage.jsx).
  const useGetAllPaginated = ({ page = 1, pageSize = 20 } = {}) => {
    return useQuery({
      queryKey: ['alertes', 'paginated', page, pageSize],
      queryFn: () => alerteService.getAllPaginated({ page, pageSize }),
      staleTime: 30 * 1000,
      keepPreviousData: true,
    });
  };

  // Compteur réel d'alertes non lues (indépendant de la limite de
  // useGetUnread) — c'est lui qui doit alimenter le badge du dropdown,
  // pas la longueur de la liste plafonnée.
  const useGetStats = () => {
    return useQuery({
      queryKey: ['alertes', 'stats'],
      queryFn: () => alerteService.getStats(),
      staleTime: 30 * 1000,
      refetchInterval: 30 * 1000,
    });
  };

  const useGetByAdherent = (numAdherent) => {
    return useQuery({
      queryKey: ['alertes', 'adherent', numAdherent],
      queryFn: () => alerteService.getByAdherent(numAdherent),
      enabled: !!numAdherent,
      staleTime: 30 * 1000,
    });
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: (data) => alerteService.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries(['alertes']);
        toast.success('Alerte créée avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la création');
      },
    });
  };

  const useMarkAsRead = () => {
    return useMutation({
      mutationFn: (id) => alerteService.markAsRead(id),
      onSuccess: () => {
        queryClient.invalidateQueries(['alertes']);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors du marquage');
      },
    });
  };

  const useMarkAllAsRead = () => {
    return useMutation({
      mutationFn: () => alerteService.markAllAsRead(),
      onSuccess: () => {
        queryClient.invalidateQueries(['alertes']);
        toast.success('Toutes les alertes marquées comme lues');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors du marquage');
      },
    });
  };

  const useRemove = () => {
    return useMutation({
      mutationFn: (id) => alerteService.delete(id),
      onSuccess: () => {
        queryClient.invalidateQueries(['alertes']);
        toast.success('Alerte supprimée');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      },
    });
  };

  const useRelancer = () => {
    return useMutation({
      mutationFn: (id) => alerteService.relancer(id),
      onSuccess: () => {
        queryClient.invalidateQueries(['alertes']);
        toast.success('Relance envoyée par email');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Erreur lors de l'envoi de la relance");
      },
    });
  };

  const useRelancerSms = () => {
    return useMutation({
      mutationFn: (id) => alerteService.relancerSms(id),
      onSuccess: () => {
        queryClient.invalidateQueries(['alertes']);
        toast.success('Relance envoyée par SMS');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || "Erreur lors de l'envoi du SMS");
      },
    });
  };

  return {
    useGetAll,
    useGetUnread,
    useGetAllPaginated,
    useGetStats,
    useGetByAdherent,
    useCreate,
    useMarkAsRead,
    useMarkAllAsRead,
    useRemove,
    useRelancer,
    useRelancerSms,
  };
};