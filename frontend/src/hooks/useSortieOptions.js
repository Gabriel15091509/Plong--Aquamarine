import { useMemo } from "react";
import { useSorties } from "./useSorties";

export const useSortieOptions = () => {
  const { useGetAll } = useSorties();
  const query = useGetAll();
  const { data, isLoading, error } = query;

  const options = useMemo(() => {
    if (!data?.data) return [];
    return data.data.map((sortie) => ({
      id: sortie.id_sortie,
      name: `${sortie.type} - ${sortie.lieu}`,
      description: `Niv. ${sortie.niveau_requis} - ${sortie.nb_places} places`,
      lieu: sortie.lieu,
      site: sortie.site,
      type: sortie.type,
      date: sortie.date_heure,
    }));
  }, [data]);

  return { options, isLoading, error };
};
