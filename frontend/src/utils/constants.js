export const CIVILITE_OPTIONS = [
  { value: 'M.', label: 'M.' },
  { value: 'Mme', label: 'Mme' },
  { value: 'Mlle', label: 'Mlle' }
];

export const NIVEAU_OPTIONS = [
  'Débutant',
  'Niveau 1',
  'Niveau 2',
  'Niveau 3',
  'Niveau 4',
  'Moniteur'
];

export const STATUT_ADHERENT_OPTIONS = [
  'Actif',
  'Inactif',
  'Suspendu'
];

export const TYPE_ADHESION_OPTIONS = [
  { value: 'Club', label: 'Adhésion club', obligatoire: true },
  { value: 'FFESM', label: 'Licence FFESM', obligatoire: true },
  { value: 'Assurance RC', label: 'Assurance Responsabilité Civile', obligatoire: true },
  { value: 'Assurance IA', label: 'Assurance Individuelle Accident', obligatoire: false },
];

export const TYPES_ADHESION_OBLIGATOIRES = ['Club', 'FFESM', 'Assurance RC'];

export const STATUT_PAIEMENT_OPTIONS = [
  'En attente',
  'Payé',
  'Partiel',
  'Annulé'
];

export const MODE_PAIEMENT_OPTIONS = [
  'Espèces',
  'Carte',
  'Chèque',
  'Virement'
];

export const TYPE_PAIEMENT_OPTIONS = [
  'Adhesion',
  'Sortie',
  'Formation',
  'Caution',
  'Autre'
];

export const TYPE_SORTIE_OPTIONS = [
  'Plongée',
  'Formation',
  'Exploration',
  'Nettoyage'
];

export const STATUT_SORTIE_OPTIONS = [
  'Planifiée',
  'En cours',
  'Terminée',
  'Annulée'
];

export const TYPE_PLONGEE_OPTIONS = [
  'Loisir',
  'Formation',
  'Exploration',
  'Nuit',
  'Épave'
];

export const CATEGORIE_MATERIEL_OPTIONS = [
  'Bloc',
  'Détendeur',
  'Gilet',
  'Combinaison',
  'Palmes',
  'Masque',
  'Ordinateur'
];

export const ETAT_MATERIEL_OPTIONS = [
  'Neuf',
  'Bon',
  'Usagé',
  'À réparer',
  'Hors service'
];

export const NIVEAU_FORMATION_OPTIONS = [
  'N1',
  'N2',
  'N3',
  'N4',
  'MF1'
];

export const STATUT_FORMATION_OPTIONS = [
  'En cours',
  'Terminée',
  'Abandonnée',
  'Suspendue'
];