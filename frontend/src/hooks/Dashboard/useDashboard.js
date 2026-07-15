import { useQuery } from "@tanstack/react-query";
import dashboardService from "../../services/Dashboard/dashboardService";

export const useDashboard = () => {
  const useGetTrends = () => {
    return useQuery({
      queryKey: ["dashboard", "trends"],
      queryFn: () => dashboardService.getTrends(),
      staleTime: 5 * 60 * 1000,
    });
  };

  return { useGetTrends };
};
