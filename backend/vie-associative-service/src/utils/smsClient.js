// Client SMS via l'API historique OVH SMS (HTTP2SMS) — choisie pour sa
// simplicité (une requête HTTP aux identifiants du compte SMS, pas de
// signature applicative comme l'API OVHcloud v1) et sa bonne couverture
// DOM-TOM (le club est à La Réunion). Même dégradation gracieuse que
// utils/email.js : sans identifiants configurés, le SMS est simulé (loggé,
// jamais réellement envoyé) plutôt que de faire échouer l'appelant — utile
// en dev/test, et tant que le club n'a pas encore ouvert de compte OVH SMS.
const OVH_SMS_ENDPOINT = "https://smsapi.ovh.com/1.6/http2sms.cgi";

// OVH attend un numéro au format international sans "+" (ex.
// "33612345678"). Les fiches adhérent sont saisies au format français
// "0X XX XX XX XX" : on convertit ce cas précis, un numéro déjà
// international (commence par "+" ou "33") ou tout autre format non reconnu
// est renvoyé tel quel — au cas où le club ait un jour un adhérent avec un
// numéro non métropolitain.
function normalizePhoneNumber(phone) {
  const digits = (phone || "").replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits.slice(1);
  if (digits.startsWith("0")) return `33${digits.slice(1)}`;
  return digits;
}

async function sendSms({ to, message }) {
  if (!to) throw new Error("Destinataire requis");
  if (!message) throw new Error("Message requis");

  const { OVH_SMS_ACCOUNT, OVH_SMS_LOGIN, OVH_SMS_PASSWORD, OVH_SMS_FROM } = process.env;
  if (!OVH_SMS_ACCOUNT || !OVH_SMS_LOGIN || !OVH_SMS_PASSWORD) {
    console.log("[SIMULATION] SMS envoyé à", to, ":", message);
    return { success: true, simulated: true, to };
  }

  const params = new URLSearchParams({
    account: OVH_SMS_ACCOUNT,
    login: OVH_SMS_LOGIN,
    password: OVH_SMS_PASSWORD,
    from: OVH_SMS_FROM || "Aquanature",
    to: normalizePhoneNumber(to),
    message,
    // SMS transactionnel (alerte du club à ses propres adhérents), pas une
    // campagne marketing : pas de mention STOP obligatoire.
    noStop: "1",
  });

  const response = await fetch(`${OVH_SMS_ENDPOINT}?${params.toString()}`);
  const body = await response.text();

  // L'API HTTP2SMS répond toujours 200 même en erreur métier : le vrai
  // statut est encodé dans le corps de la réponse ("OK <id>" ou "KO <code>").
  if (!response.ok || !body.startsWith("OK")) {
    throw new Error(`OVH SMS : échec de l'envoi (${body || response.status})`);
  }

  return { success: true, to, raw: body };
}

module.exports = { sendSms, normalizePhoneNumber };
