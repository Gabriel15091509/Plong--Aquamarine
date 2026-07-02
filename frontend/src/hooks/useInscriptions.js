import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import inscriptionService from "../services/inscriptionService";

export const useInscriptions = () => {
  const queryClient = useQueryClient();

  const useGetAll = () => {
    return useQuery({
      queryKey: ["inscriptions"],
      queryFn: async () => {
        const response = await inscriptionService.getAll();
        return response;
      },
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

  const useCreate = () => {
    return useMutation({
      mutationFn: async (data) => {
        const response = await inscriptionService.create(data);
        return response;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
      },
    });
  };

  // ✅ useUpdate avec logs
  const useUpdate = () => {
    return useMutation({
      mutationFn: async ({ id, data }) => {
        console.log("📝 useUpdate - ID:", id, "Data:", data);
        const response = await inscriptionService.update(id, data);
        return response;
      },
      onSuccess: (data) => {
        console.log("✅ Update success:", data);
        queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
        queryClient.invalidateQueries({
          queryKey: ["inscription", data?.data?.id_inscription],
        });
      },
      onError: (error) => {
        console.error("❌ Update error:", error);
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
      },
    });
  };

  const useConfirm = () => {
    return useMutation({
      mutationFn: async (id) => {
        const response = await inscriptionService.confirm(id);
        return response;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
      },
    });
  };

  const useCancel = () => {
    return useMutation({
      mutationFn: async (id) => {
        const response = await inscriptionService.cancel(id);
        return response;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["inscriptions"] });
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

  return {
    useGetAll,
    useGetById,
    useCreate,
    useUpdate,
    useRemove,
    useConfirm,
    useCancel,
    useGetConfirmationsBySortie,
    useGetWaitlistBySortie,
  };
};
