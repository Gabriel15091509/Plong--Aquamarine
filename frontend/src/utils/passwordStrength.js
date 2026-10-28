// Critères de mot de passe fort — mêmes règles que
// backend/identite-service/src/utils/passwordPolicy.js (à garder
// synchronisées : un mot de passe jugé "fort" ici ne doit jamais être
// rejeté par l'API, et inversement). Utilisé par PasswordStrengthMeter.jsx
// et par les pages où l'utilisateur choisit lui-même son mot de passe
// (ChangePasswordPage, ResetPasswordPage) — jamais pour les mots de passe
// temporaires générés par le système, jamais saisis par un humain.
export const PASSWORD_CRITERIA = [
  { id: "length", label: "Au moins 8 caractères", test: (p) => p.length >= 8 },
  { id: "lowercase", label: "Une lettre minuscule", test: (p) => /[a-z]/.test(p) },
  { id: "uppercase", label: "Une lettre majuscule", test: (p) => /[A-Z]/.test(p) },
  { id: "number", label: "Un chiffre", test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "Un caractère spécial (!@#$…)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

// Paliers affichés sous la barre de progression, du score le plus bas
// (aucun critère) au plus haut (tous réunis) — index = nombre de critères
// validés.
const STRENGTH_LEVELS = [
  { label: "Très faible", barColor: "bg-red-500", textColor: "text-red-600 dark:text-red-400" },
  { label: "Faible", barColor: "bg-red-500", textColor: "text-red-600 dark:text-red-400" },
  { label: "Moyen", barColor: "bg-amber-500", textColor: "text-amber-600 dark:text-amber-400" },
  { label: "Bon", barColor: "bg-yellow-500", textColor: "text-yellow-600 dark:text-yellow-400" },
  { label: "Fort", barColor: "bg-lime-500", textColor: "text-lime-600 dark:text-lime-400" },
  { label: "Très fort", barColor: "bg-green-500", textColor: "text-green-600 dark:text-green-400" },
];

// Évalue un mot de passe contre les 5 critères ci-dessus. `score` va de 0 à
// PASSWORD_CRITERIA.length (5) ; `percent` sert directement de largeur de
// barre de progression.
export const evaluatePasswordStrength = (password = "") => {
  const criteria = PASSWORD_CRITERIA.map((c) => ({ ...c, passed: c.test(password) }));
  const score = criteria.filter((c) => c.passed).length;
  const total = PASSWORD_CRITERIA.length;
  const level = STRENGTH_LEVELS[score] || STRENGTH_LEVELS[0];
  return {
    criteria,
    score,
    total,
    percent: password ? Math.max((score / total) * 100, 6) : 0,
    ...level,
  };
};

// Un mot de passe "fort" doit réunir les 5 critères — même seuil que
// backend/identite-service/src/utils/passwordPolicy.js
// (getPasswordPolicyErrors), pour ne jamais laisser passer côté frontend un
// mot de passe que l'API rejettera ensuite.
export const isPasswordStrong = (password = "") =>
  evaluatePasswordStrength(password).score === PASSWORD_CRITERIA.length;
