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

// Profondeur max encadrée standard par niveau (norme FFESM — les sorties
// club sont toujours encadrées par un moniteur/DP) : utilisée par
// SortieForm.jsx pour pré-remplir "Profondeur max" dès que "Niveau requis"
// est choisi/changé, au lieu de laisser les deux champs totalement
// déconnectés. Le champ reste modifiable ensuite (un site précis peut être
// moins profond que le max théorique du niveau). Même grille côté backend,
// voir activites-service/src/utils/roleScope.js.
export const PROFONDEUR_MAX_PAR_NIVEAU = {
  'Baptême': 6,
  'Niveau 1': 20,
  'Niveau 2': 40,
  'Niveau 3': 60,
  'Niveau 4': 60,
  'Moniteur': 60,
};

export const STATUT_ADHERENT_OPTIONS = [
  'Actif',
  'En formation',
  'Inactif',
  'Suspendu',
  'Ancien'
];

// Statuts d'adhérent qui ne doivent plus pouvoir être choisis pour une
// NOUVELLE inscription/formation/attribution matériel/adhésion — un ancien
// membre (RGPD ou parti du club) ou un membre suspendu ne doit pas être
// réengagé dans une nouvelle activité sans qu'on repasse d'abord son statut
// à "Actif" dans sa fiche. Utilisée par InscriptionForm/FormationForm/
// AttributionForm/AdhesionForm pour filtrer les options de leur
// SearchableSelect "Adhérent" — la valeur déjà sélectionnée (mode édition)
// reste affichée même si son statut est désormais dans cette liste, seule
// la sélection d'une NOUVELLE valeur exclue est empêchée.
export const STATUTS_ADHERENT_EXCLUS_SELECTION = ['Ancien', 'Suspendu'];

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

// Niveau minimum compatible avec chaque type de sortie — évite par exemple
// qu'une "Plongée technique" (plus exigeante) reste accessible à un Baptême,
// ou qu'une sortie "Baptême" (réservée aux non-plongeurs découvrant
// l'activité) exige un niveau déjà acquis. Même grille côté backend, voir
// backend/activites-service/src/utils/roleScope.js NIVEAU_MIN_PAR_TYPE_SORTIE
// — à faire évoluer en même temps si jamais modifiée. "Baptême" est un cas à
// part (voir isTypeNiveauCompatible, utils/helpers.js) : seul niveau
// compatible avec ce type, pas un simple minimum.
export const NIVEAU_MIN_PAR_TYPE_SORTIE = {
  'Baptême': 'Baptême',
  'Formation': 'Baptême',
  'Sortie bateau': 'Baptême',
  'Nettoyage': 'Baptême',
  "Plongée d'exploration": 'Niveau 1',
  'Plongée de nuit': 'Niveau 1',
  'Plongée technique': 'Niveau 2',
};

export const STATUT_SORTIE_OPTIONS = Object.values(STATUT_SORTIE);

export const TYPE_PLONGEE_OPTIONS = TYPE_ACTIVITE_OPTIONS;

// Partagées entre PlongeeForm (saisie complète) et PlongeeList (complétion
// rapide d'un brouillon) — un seul vocabulaire pour les deux.
export const VISIBILITE_OPTIONS = [
  'Très bonne',
  'Bonne',
  'Moyenne',
  'Mauvaise',
  'Très mauvaise',
];

export const COURANT_OPTIONS = ['Nul', 'Faible', 'Modéré', 'Fort', 'Très fort'];

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

// Prochain niveau de formation (code FFESM abrégé, NIVEAU_FORMATION_OPTIONS)
// à partir du niveau actuel de l'adhérent (NIVEAU_OPTIONS) — utilisée par
// FormationForm.jsx pour pré-remplir "Niveau visé" dès qu'un adhérent est
// sélectionné (celui qu'il vise logiquement ensuite), même principe que
// PROFONDEUR_MAX_PAR_NIVEAU ci-dessus : le champ reste modifiable ensuite
// (rattrapage, spécialisation...). Un Moniteur n'a pas de "niveau supérieur"
// prévu ici, la clé est donc absente pour ce cas.
export const NIVEAU_VISE_SUIVANT = {
  'Baptême': 'N1',
  'Niveau 1': 'N2',
  'Niveau 2': 'N3',
  'Niveau 3': 'N4',
  'Niveau 4': 'MF1',
};

// Inverse de NIVEAU_VISE_SUIVANT ci-dessus : niveau (NIVEAU_OPTIONS) qu'un
// stagiaire a déjà au minimum en entrant dans une formation visant ce niveau
// (même grille que backend/formation-service/src/services/FormationService.js
// PREREQUIS_FORMATION[niveau_vise].niveauMin, "Baptême" au lieu de `null`
// pour N1 — pas de plancher réel, mais aucun stagiaire n'a moins que ça).
// Sert à FormationSeances.jsx pour ne proposer, comme sortie support d'une
// séance pratique, que des sorties dont le niveau requis reste accessible à
// ce niveau d'entrée — sinon le stagiaire ne pourrait de toute façon pas s'y
// inscrire (voir isNiveauCompatible, même règle serveur).
export const NIVEAU_ENTREE_FORMATION = {
  N1: 'Baptême',
  N2: 'Niveau 1',
  N3: 'Niveau 2',
  N4: 'Niveau 3',
  MF1: 'Niveau 4',
};

export const STATUT_FORMATION_OPTIONS = Object.values(STATUT_FORMATION);

export const APPRECIATION_MONITEUR_OPTIONS = [
  'Insuffisant',
  'Satisfaisant',
  'Bien',
  'Excellent'
];

// Seuils utilisés pour SUGGÉRER une appréciation à partir de la moyenne des
// notes de séance /20 une fois toutes les séances réalisées (voir
// suggestAppreciationMoniteur dans utils/helpers.js, utilisé par
// FormationForm.jsx pour pré-remplir le select ci-dessus tant qu'aucune
// appréciation n'a encore été enregistrée) — le moniteur reste toujours
// libre de choisir une autre valeur, ce n'est qu'une proposition.
export const SEUILS_APPRECIATION_MONITEUR = [
  { seuil: 16, appreciation: 'Excellent' },
  { seuil: 14, appreciation: 'Bien' },
  { seuil: 10, appreciation: 'Satisfaisant' },
  { seuil: 0, appreciation: 'Insuffisant' },
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

// Disponibilités d'un moniteur (MoniteurForm.jsx) — jours de la semaine à
// cocher plutôt qu'un texte libre séparé par des virgules, pour éviter les
// variantes de saisie ("samedi" / "Samedi" / "Sam.") qui rendaient tout
// filtrage/affichage peu fiable (voir aussi randomDisponibilites() dans
// backend/gateway-service/scripts/seedAll.js, sur le même référentiel).
export const DISPONIBILITE_MONITEUR_OPTIONS = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche'
];

// Point de départ de l'itinéraire affiché vers le site d'une sortie — mêmes
// nom/localisation que sur la page "À propos" (AboutPage.jsx). Coordonnées
// provisoires (port de Saint-Leu), à ajuster si l'emplacement réel diffère.
export const CLUB_LOCATION = {
  name: 'Aquanature Plongée',
  address: '23 Rue de la Marine, 97436 Saint-Leu, La Réunion',
  lat: -21.166457,
  lng: 55.28697,
};