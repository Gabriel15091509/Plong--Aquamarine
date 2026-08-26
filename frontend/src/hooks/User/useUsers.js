import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import userService from '../../services/User/userService';
import toast from 'react-hot-toast';
import { getByIdWithOfflineFallback } from '../../utils/offlineDetailFallback';

export const useUsers = () => {
  const queryClient = useQueryClient();

  // Récupérer tous les utilisateurs (réservé au président côté backend —
  // `options.enabled` permet à l'appelant de désactiver la requête pour les
  // autres rôles plutôt que de subir un 403 systématique)
  const useGetAll = (params = {}, options = {}) => {
    return useQuery({
      queryKey: ['users', params],
      queryFn: () => userService.getAll(params),
      staleTime: 5 * 60 * 1000,
      ...options,
    });
  };

  // Récupérer un utilisateur
  const useGetById = (id) => {
    return useQuery({
      queryKey: ['users', id],
      queryFn: () => getByIdWithOfflineFallback(userService, id, 'id'),
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    });
  };

  // Récupérer les utilisateurs créés par moi
  const useGetCreatedByMe = () => {
    return useQuery({
      queryKey: ['users', 'created-by-me'],
      queryFn: () => userService.getCreatedByMe(),
      staleTime: 5 * 60 * 1000,
    });
  };

  // Créer un utilisateur
  const useCreate = () => {
    return useMutation({
      mutationFn: (data) => userService.create(data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['users']);
        toast.success(response.message || 'Utilisateur créé avec succès');
        if (response.tempPassword) {
          toast.success(`Mot de passe temporaire: ${response.tempPassword}`, {
            duration: 10000,
          });
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la création');
      },
    });
  };

  // Mettre à jour son profil
  const useUpdateProfile = () => {
    return useMutation({
      mutationFn: (data) => userService.updateProfile(data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['users']);
        queryClient.invalidateQueries(['profile']);
        toast.success(response.message || 'Profil mis à jour avec succès');
      },
      onError: (error) => {
        const message =
          error.response?.status === 413
            ? 'Photo trop volumineuse : la taille maximale autorisée est de 8 Mo.'
            : error.response?.data?.message || 'Erreur lors de la mise à jour';
        toast.error(message);
      },
    });
  };

  // Changer le mot de passe
  const useChangePassword = () => {
    return useMutation({
      mutationFn: ({ oldPassword, newPassword }) => 
        userService.changePassword(oldPassword, newPassword),
      onSuccess: (response) => {
        toast.success(response.message || 'Mot de passe changé avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors du changement');
      },
    });
  };

  // Réinitialiser le mot de passe
  const useResetPassword = () => {
    return useMutation({
      mutationFn: (id) => userService.resetPassword(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['users']);
        toast.success(response.message || 'Mot de passe réinitialisé');
        if (response.tempPassword) {
          toast.success(`Nouveau mot de passe: ${response.tempPassword}`, {
            duration: 10000,
          });
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la réinitialisation');
      },
    });
  };

  // Changer le niveau
  const useChangeNiveau = () => {
    return useMutation({
      mutationFn: ({ id, niveau }) => userService.changeNiveau(id, niveau),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['users']);
        toast.success(response.message || 'Niveau mis à jour avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors du changement de niveau');
      },
    });
  };

  // Mettre à jour la photo (par un président, pour un autre utilisateur)
  const useUpdatePhoto = () => {
    return useMutation({
      mutationFn: ({ id, formData }) => userService.updatePhoto(id, formData),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['users']);
        queryClient.invalidateQueries(['adherents']);
        toast.success(response.message || 'Photo mise à jour avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour de la photo');
      },
    });
  };

  // Changer le rôle
  const useChangeRole = () => {
    return useMutation({
      mutationFn: ({ id, role }) => userService.changeRole(id, role),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['users']);
        toast.success(response.message || 'Rôle mis à jour avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors du changement de rôle');
      },
    });
  };

  // Désactiver un compte
  const useDisableAccount = () => {
    return useMutation({
      mutationFn: (id) => userService.disableAccount(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['users']);
        toast.success(response.message || 'Compte désactivé avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la désactivation');
      },
    });
  };

  // Réactiver un compte
  const useEnableAccount = () => {
    return useMutation({
      mutationFn: (id) => userService.enableAccount(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['users']);
        toast.success(response.message || 'Compte réactivé avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la réactivation');
      },
    });
  };

  // Supprimer un compte
  const useDeleteAccount = () => {
    return useMutation({
      mutationFn: (id) => userService.deleteAccount(id),
      onSuccess: (response) => {
        queryClient.invalidateQueries(['users']);
        toast.success(response.message || 'Compte supprimé avec succès');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      },
    });
  };

  return {
    useGetAll,
    useGetById,
    useGetCreatedByMe,
    useCreate,
    useUpdateProfile,
    useChangePassword,
    useResetPassword,
    useChangeNiveau,
    useUpdatePhoto,
    useChangeRole,
    useDisableAccount,
    useEnableAccount,
    useDeleteAccount,
  };
};