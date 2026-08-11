// Version finance-service de utils/email.js : ne garde que le nécessaire
// pour ce domaine (rappels d'échéancier) — le pattern (transporteur,
// cache anti-doublon, gabarit HTML) est dupliqué depuis
// activites-service/src/utils/email.js, convention établie dans ce
// dépôt (pas de package partagé entre services).
const nodemailer = require("nodemailer");
const path = require("path");

const emailCache = new Map();
const LOGO_PATH = path.join(__dirname, "../assets/logo.png");
const LOGO_CID = "logo-aquanature";

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
        attachments: [
          { filename: "logo.png", path: LOGO_PATH, cid: LOGO_CID },
        ],
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — Aquanature Plongée</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #eef1f4; margin: 0; padding: 40px 20px; line-height: 1.6; color: #1f2937; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(15,23,42,0.08), 0 10px 30px rgba(15,23,42,0.06); overflow: hidden; }
    .header { background: #0b3552; padding: 28px 40px; text-align: center; border-bottom: 3px solid #c9a227; }
    .header .logo-badge { display: inline-block; width: 64px; height: 64px; border-radius: 50%; background: #ffffff; padding: 4px; margin-bottom: 12px; }
    .header .logo-badge img { display: block; width: 100%; height: 100%; border-radius: 50%; }
    .header .brand { color: #ffffff; font-size: 15px; font-weight: 700; letter-spacing: 0.5px; }
    .header .tagline { color: rgba(255,255,255,0.6); font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 3px; }
    .eyebrow { padding: 24px 40px 0; }
    .eyebrow span { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; color: #9a7817; background: #fdf6e3; padding: 4px 10px; border-radius: 4px; }
    .content { padding: 14px 40px 32px; }
    .content p { margin-bottom: 12px; color: #374151; font-size: 15px; }
    .info-card { background: #f8fafc; border-radius: 8px; padding: 14px 16px; margin: 8px 0; border-left: 3px solid #0b3552; }
    .info-card .label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; }
    .info-card .value { font-size: 15px; font-weight: 600; color: #1f2937; margin-top: 2px; }
    .footer { padding: 20px 40px; border-top: 1px solid #eef1f4; text-align: center; }
    .footer p { color: #94a3b8; font-size: 12px; }
    .footer .club { color: #64748b; font-weight: 600; margin-bottom: 2px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-badge"><img src="cid:${LOGO_CID}" width="56" height="56" alt="Aquanature Plongée" /></div>
      <div class="brand">AQUANATURE PLONGÉE</div>
      <div class="tagline">Club de plongée · Saint-Leu · La Réunion</div>
    </div>
    <div class="eyebrow"><span>${title}</span></div>
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
      <p class="club">Aquanature Plongée</p>
      <p>© ${new Date().getFullYear()} — email automatique, ne pas répondre</p>
    </div>
  </div>
</body>
</html>`;

// Rappel avant échéance (J-3). Le sujet inclut id_echeance : le cache
// anti-doublon de sendEmail est clé par (destinataire, sujet) et vit pour
// toute la durée du process — un sujet générique bloquerait silencieusement
// le rappel de toute échéance future pour cet adhérent après le premier envoi.
const sendEcheanceUpcomingEmail = async ({ to, adherentName, label, montant, date_echeance, id_echeance }) => {
  const dateFr = new Date(date_echeance).toLocaleDateString("fr-FR");
  const introHtml = `<p>Bonjour ${adherentName},</p><p>Rappel : une échéance de paiement pour "<strong>${label}</strong>" arrive à échéance le <strong>${dateFr}</strong>.</p>`;
  return sendEmail({
    to,
    subject: `Rappel — Échéance à venir (#${id_echeance})`,
    html: buildSimpleEmailHtml("Échéance à venir", introHtml, [
      { label: "Concerne", value: label },
      { label: "Montant", value: `${montant} €` },
      { label: "Date d'échéance", value: dateFr },
    ]),
  });
};

const sendEcheanceOverdueEmail = async ({ to, adherentName, label, montant, date_echeance, id_echeance }) => {
  const dateFr = new Date(date_echeance).toLocaleDateString("fr-FR");
  const introHtml = `<p>Bonjour ${adherentName},</p><p>Une échéance de paiement pour "<strong>${label}</strong>", due le <strong>${dateFr}</strong>, est désormais <strong>en retard</strong>.</p>`;
  return sendEmail({
    to,
    subject: `Rappel — Échéance en retard (#${id_echeance})`,
    html: buildSimpleEmailHtml("Échéance en retard", introHtml, [
      { label: "Concerne", value: label },
      { label: "Montant", value: `${montant} €` },
      { label: "Date d'échéance", value: dateFr },
    ]),
  });
};

module.exports = {
  sendEmail,
  sendEcheanceUpcomingEmail,
  sendEcheanceOverdueEmail,
};
