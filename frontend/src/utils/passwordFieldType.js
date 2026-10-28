// Le menu de suggestions d'identifiants de Chrome (voir ChangePasswordPage.jsx
// / ResetPasswordPage.jsx — readOnly différé + champs leurres, insuffisants à
// eux seuls) se déclenche précisément sur `<input type="password">`, quel que
// soit `autoComplete`. Astuce : garder le champ en `type="text"` (jamais
// reconnu comme champ mot de passe par ce menu) et masquer nous-mêmes les
// caractères via la propriété CSS `-webkit-text-security` (Chrome/Safari/
// Edge) — même rendu en points que le vrai type="password", mais plus aucune
// suggestion au focus.
//
// Support détecté une seule fois au chargement du module (CSS.supports ne
// change jamais en cours de session) — Firefox, qui ne supporte pas cette
// propriété, retombe simplement sur le vrai type="password" natif : il ne
// pose pas ce problème de suggestions aussi agressives, pas besoin d'astuce
// chez lui.
export const supportsTextSecurityMasking =
  typeof window !== "undefined" &&
  typeof CSS !== "undefined" &&
  typeof CSS.supports === "function" &&
  CSS.supports("-webkit-text-security", "disc");

// `visible` = l'utilisateur a cliqué l'œil pour voir son mot de passe en
// clair (voir showPasswords dans les deux pages) : toujours type="text",
// aucun masquage nécessaire dans ce cas. Sinon (masqué) : type="text" +
// -webkit-text-security si le navigateur le supporte, sinon repli sur le
// vrai type="password".
export const getPasswordInputType = (visible) => {
  if (visible) return "text";
  return supportsTextSecurityMasking ? "text" : "password";
};

// Style inline à appliquer en complément de getPasswordInputType — seulement
// quand on masque via CSS (jamais en clair, jamais si le navigateur retombe
// sur le vrai type="password", qui masque déjà nativement).
export const getPasswordInputStyle = (visible) =>
  !visible && supportsTextSecurityMasking
    ? { WebkitTextSecurity: "disc" }
    : undefined;
