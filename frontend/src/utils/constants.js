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

// Minimum réaliste de plongées par niveau (Baptême exclu, pas de minimum) :
// Niveau 1 initiation, Niveau 2 autonomie 20m, Niveau 3 autonomie 40m,
// Niveau 4, Moniteur (bien au-delà du minimum Niveau 4 en pratique).
export const NB_PLONGEES_MIN_PAR_NIVEAU = {
  'Niveau 1': 6,
  'Niveau 2': 8,
  'Niveau 3': 10,
  'Niveau 4': 20,
  'Moniteur': 60,
};

export const TYPE_ADHESION_OPTIONS = [
  { value: 'Club', label: 'Adhésion club', obligatoire: true },
  { value: 'FFESM', label: 'Licence FFESM', obligatoire: true },
  { value: 'Assurance RC', label: 'Assurance Responsabilité Civile', obligatoire: true },
  { value: 'Assurance IA', label: 'Assurance Individuelle Accident', obligatoire: false },
];

export const TYPES_ADHESION_OBLIGATOIRES = ['Club', 'FFESM', 'Assurance RC'];

export const CERTIFICAT_TYPE_OPTIONS = ['Sportif', 'Plongée', 'Généraliste', 'Médecin hyperbare'];

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
  AJOURNEE: 'Ajournée',
};

export const STATUT_ECHEANCIER = {
  EN_COURS: 'En cours',
  SOLDE: 'Soldé',
  ANNULEE: 'Annulée',
};

export const STATUT_ECHEANCE = {
  EN_ATTENTE: 'En attente',
  PAYEE: 'Payée',
  EN_RETARD: 'En retard',
  ANNULEE: 'Annulée',
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

// Types d'activités du club — communs aux sorties et aux plongées : une
// sortie porte le type d'activité organisée (ex: "Sortie bateau", "Baptême"),
// une plongée individuelle au sein de cette sortie reprend le même
// vocabulaire (ex: "Plongée technique", "Plongée de nuit").
export const TYPE_ACTIVITE_OPTIONS = [
  "Plongée d'exploration",
  'Baptême',
  'Formation',
  'Plongée technique',
  'Nettoyage',
  'Sortie bateau',
  'Plongée de nuit',
];

export const TYPE_SORTIE_OPTIONS = TYPE_ACTIVITE_OPTIONS;

export const STATUT_SORTIE_OPTIONS = Object.values(STATUT_SORTIE);

export const TYPE_PLONGEE_OPTIONS = TYPE_ACTIVITE_OPTIONS;

export const CATEGORIE_MATERIEL_OPTIONS = [
  'Bloc',
  'Détendeur',
  'Combinaison',
  'Stabilisateur',
  'Masque',
  'Tuba',
  'Palmes',
  'Ordinateur',
  'Accessoire',
];

export const ETAT_MATERIEL_OPTIONS = [
  'Neuf',
  'Bon',
  'Usagé',
  'À réparer',
  'Hors service'
];

// Trois états réels de localisation d'une pièce de matériel — mis à jour
// automatiquement par le prêt (Attribution) et la réparation (Reparation),
// modifiable manuellement en secours (voir MaterielForm).
export const LOCALISATION_MATERIEL_OPTIONS = ['Local', 'Prêté', 'En réparation'];

// Ordinateurs de plongée uniquement (voir Materiel.batterie).
export const BATTERIE_MATERIEL_OPTIONS = ['Bonne', 'Faible', 'À changer'];

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

// Point de départ de l'itinéraire affiché vers le site d'une sortie — mêmes
// nom/localisation que sur la page "À propos" (AboutPage.jsx). Coordonnées
// provisoires (port de Saint-Leu), à ajuster si l'emplacement réel diffère.
export const CLUB_LOCATION = {
  name: 'Aquanature Plongée',
  address: 'Saint-Leu, La Réunion',
  lat: -21.1706,
  lng: 55.2894,
};