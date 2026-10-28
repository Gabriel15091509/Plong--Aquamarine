// Politique de mot de passe fort, partagée par tous les flux où un
// utilisateur choisit lui-même son mot de passe (changement volontaire,
// changement forcé au premier login, réinitialisation via lien mail) —
// jamais appliquée aux mots de passe temporaires générés automatiquement par
// le système (UserService.generateTempPassword), qui ne sont jamais saisis
// par un humain. Mêmes critères que la jauge de progression affichée côté
// frontend (voir frontend/src/utils/passwordStrength.js) : les deux doivent
// rester synchronisés, sous peine qu'un mot de passe jugé "fort" côté
// interface soit ensuite rejeté par l'API (ou l'inverse).
const PASSWORD_POLICY = [
  { test: (p) => p.length >= 8, message: "au moins 8 caractères" },
  { test: (p) => /[a-z]/.test(p), message: "une lettre minuscule" },
  { test: (p) => /[A-Z]/.test(p), message: "une lettre majuscule" },
  { test: (p) => /[0-9]/.test(p), message: "un chiffre" },
  { test: (p) => /[^A-Za-z0-9]/.test(p), message: "un caractère spécial" },
];

// Liste des règles non respectées (tableau vide = mot de passe conforme).
function getPasswordPolicyErrors(password) {
  if (!password) return ["le mot de passe est requis"];
  return PASSWORD_POLICY.filter((rule) => !rule.test(password)).map(
    (rule) => rule.message,
  );
}

// Lève une erreur listant ce qui manque — message directement affichable
// tel quel (voir AuthController.changePassword/resetPassword,
// UserService.changePassword).
function assertStrongPassword(password) {
  const missing = getPasswordPolicyErrors(password);
  if (missing.length > 0) {
    throw new Error(`Le mot de passe doit contenir ${missing.join(", ")}.`);
  }
}

module.exports = { PASSWORD_POLICY, getPasswordPolicyErrors, assertStrongPassword };
