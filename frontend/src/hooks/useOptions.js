import { useMemo } from 'react';

export const useAdherentOptions = (adherents) => {
  return useMemo(() => {
    if (!adherents) return [];
    return adherents.map(adherent => ({
      id: adherent.num_adherent,
      name: `${adherent.civilite} ${adherent.nom} ${adherent.prenom}`,
      email: adherent.email,
      nom: adherent.nom,
      prenom: adherent.prenom,
      niveau: adherent.niveau,
      statut: adherent.statut
    }));
  }, [adherents]);
};

export const useSortieOptions = (sorties) => {
  return useMemo(() => {
    if (!sorties) return [];
    return sorties.map(sortie => ({
      id: sortie.id_sortie,
      name: `${sortie.type} - ${sortie.lieu}`,
      description: `Niv. ${sortie.niveau_requis} - ${sortie.nb_places} places`,
      lieu: sortie.lieu,
      site: sortie.site,
      type: sortie.type,
      date: sortie.date_heure,
      statut: sortie.statut
    }));
  }, [sorties]);
};

export const useMaterielOptions = (materiels) => {
  return useMemo(() => {
    if (!materiels) return [];
    return materiels.map(materiel => ({
      id: materiel.num_inventaire,
      name: `${materiel.marque} ${materiel.modele}`,
      description: `${materiel.categorie} - ${materiel.etat}`,
      marque: materiel.marque,
      modele: materiel.modele,
      categorie: materiel.categorie,
      etat: materiel.etat
    }));
  }, [materiels]);
};

export const useFormationOptions = (formations) => {
  return useMemo(() => {
    if (!formations) return [];
    return formations.map(formation => ({
      id: formation.id_formation,
      name: `Niveau ${formation.niveau_vise}`,
      description: `${formation.nb_seances_realisees} séances réalisées`,
      niveau: formation.niveau_vise,
      statut: formation.statut,
      date_debut: formation.date_debut
    }));
  }, [formations]);
};