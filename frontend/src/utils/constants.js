export const CIVILITE_OPTIONS = [
  { value: 'M.', label: 'M.' },
  { value: 'Mme', label: 'Mme' },
  { value: 'Mlle', label: 'Mlle' }
];

export const NIVEAU_OPTIONS = [
  'Baptême',
  'Niveau 1',
  'Niveau 2',
  'Niveau 3',
  'Niveau 4',
  'Moniteur'
];

export const STATUT_ADHERENT_OPTIONS = [
  'Actif',
  'En formation',
  'Inactif',
  'Suspendu',
  'Ancien'
];

export const TYPE_ADHESION_OPTIONS = [
  { value: 'Club', label: 'Adhésion club', obligatoire: true },
  { value: 'FFESM', label: 'Licence FFESM', obligatoire: true },
  { value: 'Assurance RC', label: 'Assurance Responsabilité Civile', obligatoire: true },
  { value: 'Assurance IA', label: 'Assurance Individuelle Accident', obligatoire: false },
];

export const TYPES_ADHESION_OBLIGATOIRES = ['Club', 'FFESM', 'Assurance RC'];

// Constantes nommées (comparaisons d'égalité dans le code) — les tableaux
// `_OPTIONS` ci-dessous (utilisés pour peupler les <select>) en dérivent pour
// n'avoir qu'une seule source de vérité par vocabulaire de statut.
export const STATUT_PAIEMENT = {
  EN_ATTENTE: 'En attente',
  PARTIEL: 'Partiel',
  PAYE: 'Payé',
  ANNULE: 'Annulé',
};

export const STATUT_INSCRIPTION = {
  CONFIRMEE: 'Confirmée',
  LISTE_ATTENTE: "Liste d'attente",
  EN_ATTENTE: 'En attente',
  ANNULEE: 'Annulée',
};

export const STATUT_SORTIE = {
  PLANIFIEE: 'Planifiée',
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
};

export const STATUT_FORMATION = {
  EN_COURS: 'En cours',
  TERMINEE: 'Terminée',
  ABANDONNEE: 'Abandonnée',
  SUSPENDUE: 'Suspendue',
};

export const STATUT_PAIEMENT_OPTIONS = Object.values(STATUT_PAIEMENT);

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

export const STATUT_SORTIE_OPTIONS = Object.values(STATUT_SORTIE);

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

export const STATUT_FORMATION_OPTIONS = Object.values(STATUT_FORMATION);

export const APPRECIATION_MONITEUR_OPTIONS = [
  'Insuffisant',
  'Satisfaisant',
  'Bien',
  'Excellent'
];

export const TYPE_SPECIALITE_OPTIONS = [
  'Nitrox',
  'Plongée profonde',
  'Plongée nocturne',
  'Photo sous-marine'
];

export const STATUT_SPECIALITE_OPTIONS = [
  'En cours',
  'Terminée',
  'Abandonnée'
];

export const NIVEAU_MONITEUR_OPTIONS = [
  'Niveau 4',
  'Moniteur'
];

export const SPECIALITE_ENCADREMENT_OPTIONS = [
  'Encadrant N1',
  'Encadrant N2',
  'Encadrant N3',
  'Encadrant baptême'
];