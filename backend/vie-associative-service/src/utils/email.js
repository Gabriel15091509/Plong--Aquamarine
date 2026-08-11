// Version vie-associative-service de utils/email.js : ne garde que le
// nécessaire pour ce domaine (confirmation de paiement d'adhésion) — les
// gabarits bienvenue/inscription/formation/liste d'attente restent dans le
// monolithe (ou dans le futur service propriétaire de chacun de ces
// domaines).
const nodemailer = require("nodemailer");

const emailCache = new Map();

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn("Variables email non configurées");
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === "true" || false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

const sendEmail = async (params = {}) => {
  const { to, subject, html, text, from } = params;

  const cacheKey = `${to}-${subject}`;
  if (emailCache.has(cacheKey)) {
    console.log(`EMAIL DÉJÀ ENVOYÉ À ${to} - IGNORÉ !`);
    return {
      success: true,
      messageId: `blocked-${Date.now()}`,
      to,
      subject,
      blocked: true,
    };
  }

  if (!to) throw new Error("Destinataire requis");
  if (!subject) throw new Error("Sujet requis");
  if (!html) throw new Error("Contenu HTML requis");

  emailCache.set(cacheKey, Date.now());

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log("[SIMULATION] Email envoyé à", to);
    return {
      success: true,
      messageId: `sim-${Date.now()}`,
      to,
      subject,
      simulated: true,
    };
  }

  // L'envoi réel (verify() + sendMail()) fait un aller-retour réseau vers le
  // serveur SMTP, potentiellement long (plusieurs secondes) : on ne le fait
  // plus attendre par l'appelant (qui doit répondre vite à l'interface) —
  // exécuté en arrière-plan, erreurs journalisées ici plutôt que remontées.
  (async () => {
    try {
      const transporter = createTransporter();
      if (!transporter) throw new Error("Transporteur non configuré");
      await transporter.verify();

      const mailOptions = {
        from:
          from ||
          process.env.EMAIL_FROM ||
          "Club de Plongée <no-reply@club-plongee.fr>",
        to,
        subject,
        html,
        text:
          text ||
          html
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim(),
      };

      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Erreur envoi:", error.message);
      emailCache.delete(cacheKey);
    }
  })();

  return { success: true, messageId: `queued-${Date.now()}`, to, subject, queued: true };
};

const buildSimpleEmailHtml = (title, introHtml, rows = []) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f0f4f8; margin: 0; padding: 40px 20px; line-height: 1.6; color: #1a202c; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: linear-gradient(135deg, #06b6d4, #3b82f6, #4f46e5); padding: 32px 40px; }
    .header h1 { color: #ffffff; font-size: 22px; font-weight: 800; }
    .content { padding: 32px 40px; }
    .content p { margin-bottom: 12px; color: #2d3748; }
    .info-card { background: #f7fafc; border-radius: 12px; padding: 14px 16px; margin: 8px 0; border-left: 4px solid #3b82f6; }
    .info-card .label { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #a0aec0; }
    .info-card .value { font-size: 16px; font-weight: 600; color: #2d3748; margin-top: 2px; }
    .footer { padding: 20px 40px; border-top: 1px solid #edf2f7; text-align: center; }
    .footer p { color: #a0aec0; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Aquanature Plongée</h1></div>
    <div class="content">
      ${introHtml}
      ${rows
        .map(
          (r) => `
      <div class="info-card">
        <div class="label">${r.label}</div>
        <div class="value">${r.value}</div>
      </div>`,
        )
        .join("")}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Aquanature Plongée — email automatique, ne pas répondre</p>
    </div>
  </div>
</body>
</html>`;

const sendAdhesionPaymentEmail = async ({
  to,
  adherentName,
  type,
  montantRecu,
  montantPaye,
  montant,
  statutPaiement,
  dossier,
}) => {
  const solde = Math.max(Number(montant) - Number(montantPaye), 0);
  const introHtml = `<p>Bonjour ${adherentName},</p><p>Nous avons bien reçu votre paiement de <strong>${montantRecu} €</strong> pour votre adhésion "<strong>${type}</strong>".</p>${
    solde > 0
      ? `<p>Il reste un solde de <strong>${solde.toFixed(2)} €</strong> à régler.</p>`
      : `<p>Votre adhésion "${type}" est maintenant <strong>soldée</strong>.</p>`
  }${
    dossier && dossier.valid
      ? `<p>Votre dossier d'adhésion est complet : vous êtes à jour pour le Club, la licence FFESM et l'Assurance Responsabilité Civile.</p>`
      : dossier
        ? `<p>Votre dossier d'adhésion reste incomplet (manquant : ${dossier.missing.join(", ")}).</p>`
        : ""
  }`;
  return sendEmail({
    to,
    subject: "Confirmation de paiement — Adhésion",
    html: buildSimpleEmailHtml("Paiement reçu", introHtml, [
      { label: "Type d'adhésion", value: type },
      { label: "Statut", value: statutPaiement },
    ]),
  });
};

const sendAlerteRelanceEmail = async ({
  to,
  adherentName,
  type,
  description,
  idAlerte,
}) => {
  const introHtml = `<p>Bonjour ${adherentName},</p><p>Nous revenons vers vous au sujet de l'alerte suivante concernant votre dossier :</p>`;
  return sendEmail({
    to,
    // L'id d'alerte dans le sujet contourne le cache anti-doublon
    // (clé recipient+sujet) : une même alerte peut être relancée plusieurs fois.
    subject: `Rappel — ${type} (#${idAlerte})`,
    html: buildSimpleEmailHtml("Rappel", introHtml, [
      { label: "Type d'alerte", value: type },
      { label: "Détail", value: description },
    ]),
  });
};

module.exports = {
  sendEmail,
  sendAdhesionPaymentEmail,
  sendAlerteRelanceEmail,
};
