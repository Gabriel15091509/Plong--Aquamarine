// Les photos (adhérent/moniteur/président/trésorier, toutes stockées sur le
// compte User partagé) sont servies par le backend en chemin relatif
// (/uploads/avatars/...), routé par le même Ingress que le frontend
// (k8s/08-ingress.yaml) : pas de préfixe d'origine séparé nécessaire, le
// chemin relatif suffit et reste correct quel que soit l'hôte/domaine.
export const photoUrl = (photo) => (photo ? photo : null);
