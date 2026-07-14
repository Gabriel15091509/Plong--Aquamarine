import api from "../services/api";

// ✅ À appeler juste après la création réussie d'un compte (adhérent, moniteur,
// trésorier, président) lorsque la réponse contient `_welcomeEmail` (nouveau
// compte créé, avec son mot de passe temporaire en clair). N'échoue jamais
// bruyamment : le compte existe déjà à ce stade, un email raté ne doit pas
// bloquer l'utilisateur (le mot de passe reste consultable via
// "Réinitialiser le mot de passe" dans Gestion des utilisateurs).
export async function sendWelcomeEmailIfNeeded(result) {
  const info = result?.data?._welcomeEmail;
  if (!info) return;

  try {
    await api.post("/email/send-welcome", {
      to: info.to,
      user: { name: info.name, email: info.to, role: info.role },
      temporaryPassword: info.tempPassword,
      loginUrl: `${window.location.origin}/login`,
    });
  } catch (error) {
    console.error("Échec de l'envoi de l'email de bienvenue:", error);
  }
}
