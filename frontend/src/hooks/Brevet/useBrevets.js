import { useQuery } from "@tanstack/react-query";
import brevetService from "../../services/Brevet/brevetService";

// Lecture seule : le brevet est alimenté automatiquement par le backend
// (passage de niveau), aucune création/modification/suppression n'est
// exposée côté frontend.
export const useBrevets = () => {
  const useGetAll = (params = {}, options = {}) => {
    return useQuery({
      queryKey: ["brevets", params],
      queryFn: () => brevetService.getAll(params),
      staleTime: 5 * 60 * 1000,
      ...options,
    });
  };

  const useGetByAdherent = (num_adherent, options = {}) => {
    return useQuery({
      queryKey: ["brevets", "adherent", num_adherent],
      queryFn: () => brevetService.getByAdherent(num_adherent),
      enabled: !!num_adherent,
      staleTime: 5 * 60 * 1000,
      ...options,
    });
  };

  return { useGetAll, useGetByAdherent };
};
