import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import echeancierService from "../../services/Echeancier/echeancierService";
import toast from "react-hot-toast";

export const useEcheanciers = () => {
  const queryClient = useQueryClient();

  const useGetByReference = (type_paiement, reference_id) => {
    return useQuery({
      queryKey: ["echeanciers", type_paiement, reference_id],
      queryFn: () => echeancierService.getByReference(type_paiement, reference_id),
      enabled: !!type_paiement && !!reference_id,
      staleTime: 2 * 60 * 1000,
    });
  };

  const useGetByAdherent = (numAdherent) => {
    return useQuery({
      queryKey: ["echeanciers", "adherent", numAdherent],
      queryFn: () => echeancierService.getByAdherent(numAdherent),
      enabled: !!numAdherent,
      staleTime: 2 * 60 * 1000,
    });
  };

  const useCreate = () => {
    return useMutation({
      mutationFn: (data) => echeancierService.create(data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(["echeanciers"]);
        toast.success(response.message || "Échéancier créé avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors de la création de l'échéancier",
        );
      },
    });
  };

  // `ownerQueryKeys` : clés React Query de l'entité propriétaire à invalider
  // en plus (ex. [["formations"]] ou [["inscriptions"], ["inscription", id]]
  // quand liste et détail vivent sous deux clés racine différentes) — payer
  // une échéance met aussi à jour son montant_paye/statut_paiement côté
  // backend, exactement comme useFormations().useEnregistrerPaiement.
  const usePayerEcheance = (ownerQueryKeys = []) => {
    return useMutation({
      mutationFn: ({ id_echeance, data }) => echeancierService.payerEcheance(id_echeance, data),
      onSuccess: (response) => {
        queryClient.invalidateQueries(["echeanciers"]);
        queryClient.invalidateQueries(["paiements"]);
        ownerQueryKeys.forEach((key) => queryClient.invalidateQueries(key));
        toast.success(response.message || "Échéance réglée avec succès");
      },
      onError: (error) => {
        toast.error(
          error.response?.data?.message || "Erreur lors du règlement de l'échéance",
        );
      },
    });
  };

  return {
    useGetByReference,
    useGetByAdherent,
    useCreate,
    usePayerEcheance,
  };
};
