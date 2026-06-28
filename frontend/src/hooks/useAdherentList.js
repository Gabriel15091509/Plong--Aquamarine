import { useQuery } from '@tanstack/react-query';
import adherentService from '../services/adherentService';

export const useAdherentList = () => {
  return useQuery({
    queryKey: ['adherents', 'list'],
    queryFn: () => adherentService.getAll(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};