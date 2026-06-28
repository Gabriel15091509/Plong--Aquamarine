import { useMemo } from "react";
import { useAdherents } from "./useAdherents";

export const useAdherentOptions = () => {
  const { useGetAll } = useAdherents();
  // ✅ Appel du hook à l'extérieur pour éviter les appels conditionnels
  const query = useGetAll();
  const { data, isLoading, error } = query;

  const options = useMemo(() => {
    if (!data?.data) return [];
    return data.data.map((adherent) => ({
      id: adherent.num_adherent,
      name: `${adherent.civilite} ${adherent.nom} ${adherent.prenom}`,
      email: adherent.email,
      nom: adherent.nom,
      prenom: adherent.prenom,
      niveau: adherent.niveau,
      statut: adherent.statut,
    }));
  }, [data]);

  return { options, isLoading, error };
};
