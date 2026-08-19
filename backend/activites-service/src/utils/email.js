// Version activites-service de utils/email.js : ne garde que le nécessaire
// pour ce domaine (confirmation/paiement d'inscription, promotion liste
// d'attente) — les autres gabarits restent dans le monolithe (ou le futur
// service propriétaire de chacun de ces domaines).
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

const sendInscriptionConfirmationEmail = async ({
  to,
  adherentName,
  sortieLabel,
}) => {
  const introHtml = `<p>Bonjour ${adherentName},</p><p>Votre inscription à la sortie "<strong>${sortieLabel}</strong>" a bien été enregistrée.</p>`;
  return sendEmail({
    to,
    subject: "Confirmation d'inscription — Sortie",
    html: buildSimpleEmailHtml("Inscription confirmée", introHtml, [
      { label: "Sortie", value: sortieLabel },
    ]),
  });
};

const sendInscriptionPaymentEmail = async ({
  to,
  adherentName,
  sortieLabel,
  montantRecu,
  montantPaye,
  montantDu,
  paye,
}) => {
  const solde = Math.max(Number(montantDu) - Number(montantPaye), 0);
  const introHtml = `<p>Bonjour ${adherentName},</p><p>Nous avons bien reçu votre paiement de <strong>${montantRecu} €</strong> pour la sortie "<strong>${sortieLabel}</strong>".</p>${
    !paye && solde > 0
      ? `<p>Il reste un solde de <strong>${solde.toFixed(2)} €</strong> à régler.</p>`
      : `<p>Votre participation à cette sortie est maintenant <strong>soldée</strong>.</p>`
  }`;
  return sendEmail({
    to,
    subject: "Confirmation de paiement — Sortie",
    html: buildSimpleEmailHtml("Paiement reçu", introHtml, [
      { label: "Sortie", value: sortieLabel },
      { label: "Statut", value: paye ? "Payé" : "Partiel" },
    ]),
  });
};

const sendWaitlistPromotedEmail = async ({ to, adherentName, sortieLabel }) => {
  const introHtml = `<p>Bonjour ${adherentName},</p><p>Une place s'est libérée pour la sortie "<strong>${sortieLabel}</strong>" : vous êtes désormais <strong>confirmé(e)</strong> !</p>`;
  return sendEmail({
    to,
    subject: "Une place s'est libérée !",
    html: buildSimpleEmailHtml("Place confirmée", introHtml, [
      { label: "Sortie", value: sortieLabel },
    ]),
  });
};

// Rappel 24h avant sortie (CDC 3.2.2). Le sujet inclut id_sortie : le cache
// anti-doublon de sendEmail est clé par (destinataire, sujet) et vit pour
// toute la durée du process — un sujet générique bloquerait silencieusement
// le rappel de toute sortie future pour cet adhérent après le premier envoi.
const sendSortieReminderEmail = async ({ to, adherentName, sortieLabel, id_sortie }) => {
  const introHtml = `<p>Bonjour ${adherentName},</p><p>Rappel : vous êtes inscrit(e) à la sortie "<strong>${sortieLabel}</strong>", qui a lieu demain.</p>`;
  return sendEmail({
    to,
    subject: `Rappel — Sortie demain (#${id_sortie})`,
    html: buildSimpleEmailHtml("Rappel de sortie", introHtml, [
      { label: "Sortie", value: sortieLabel },
    ]),
  });
};

const formatDateFr = (date) =>
  new Date(date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// Annulation automatique d'une sortie pour météo dangereuse (voir
// SortieService.verifierMeteoEtAnnulerSiDangereux) — envoyé à chaque inscrit
// non annulé. `propositions` (dates Date[], sans chevauchement avec une
// autre sortie) sont indicatives : c'est l'organisateur, prévenu séparément
// (sendPropositionsReprogrammationEmail), qui décide et recrée la sortie.
const sendSortieAnnuleeMeteoEmail = async ({
  to,
  adherentName,
  sortieLabel,
  motifs = [],
  propositions = [],
}) => {
  const motifsHtml = motifs.length
    ? `<ul>${motifs.map((m) => `<li>${m}</li>`).join("")}</ul>`
    : "";
  const propositionsHtml = propositions.length
    ? `<p>Le club étudie une reprogrammation, dates envisagées (à confirmer) :</p><ul>${propositions
        .map((d) => `<li>${formatDateFr(d)}</li>`)
        .join("")}</ul>`
    : "<p>Une nouvelle date vous sera communiquée dès que possible.</p>";
  const introHtml = `<p>Bonjour ${adherentName},</p><p>La sortie "<strong>${sortieLabel}</strong>" est <strong>annulée</strong> : les conditions météo prévues sont jugées dangereuses.</p>${motifsHtml}${propositionsHtml}`;
  return sendEmail({
    to,
    subject: `Sortie annulée (météo) — ${sortieLabel}`,
    html: buildSimpleEmailHtml("Sortie annulée — météo", introHtml, [
      { label: "Sortie", value: sortieLabel },
    ]),
  });
};

// Envoyé à l'organisateur (Sortie.created_by) d'une sortie annulée
// automatiquement pour météo dangereuse, avec des propositions de dates de
// remplacement ne chevauchant aucune autre sortie existante — à lui de
// choisir et de recréer la sortie (aucune création automatique : trop de
// décisions métier engagées, tarifs/encadrants/capacité, pour les prendre
// sans validation humaine).
const sendPropositionsReprogrammationEmail = async ({
  to,
  organisateurName,
  sortieLabel,
  motifs = [],
  propositions = [],
}) => {
  const motifsHtml = motifs.length
    ? `<ul>${motifs.map((m) => `<li>${m}</li>`).join("")}</ul>`
    : "";
  const propositionsHtml = propositions.length
    ? `<ul>${propositions.map((d) => `<li>${formatDateFr(d)}</li>`).join("")}</ul>`
    : "<p>Aucun créneau libre trouvé automatiquement dans les 3 prochaines semaines — une reprogrammation manuelle est nécessaire.</p>";
  const introHtml = `<p>Bonjour ${organisateurName},</p><p>La sortie "<strong>${sortieLabel}</strong>" que vous avez organisée a été <strong>annulée automatiquement</strong> (météo défavorable) :</p>${motifsHtml}<p>Dates alternatives sans chevauchement avec une autre sortie :</p>${propositionsHtml}`;
  return sendEmail({
    to,
    subject: `Sortie annulée (météo) — reprogrammation à valider — ${sortieLabel}`,
    html: buildSimpleEmailHtml("Reprogrammation à valider", introHtml, [
      { label: "Sortie annulée", value: sortieLabel },
    ]),
  });
};

// Alerte J-1 (voir SortieService.verifierMeteoEtAnnulerSiDangereux) :
// conditions jugées à risque la veille de la sortie, mais contrairement au
// test à J-3, aucune annulation automatique n'est déclenchée à ce stade —
// trop tard pour une décision purement algorithmique. Envoyé au seul
// organisateur (Sortie.created_by) : c'est à lui de décider (annuler
// manuellement via l'application, ou maintenir la sortie).
const sendAlerteMeteoDouteuseEmail = async ({
  to,
  organisateurName,
  sortieLabel,
  motifs = [],
}) => {
  const motifsHtml = motifs.length
    ? `<ul>${motifs.map((m) => `<li>${m}</li>`).join("")}</ul>`
    : "";
  const introHtml = `<p>Bonjour ${organisateurName},</p><p>La météo prévue pour demain sur la sortie "<strong>${sortieLabel}</strong>" est jugée à risque :</p>${motifsHtml}<p>Il ne s'agit pas d'une annulation automatique : à vous de décider, au vu des conditions, si la sortie doit être maintenue ou annulée.</p>`;
  return sendEmail({
    to,
    subject: `Météo incertaine demain — décision à prendre — ${sortieLabel}`,
    html: buildSimpleEmailHtml("Météo incertaine — à vous de décider", introHtml, [
      { label: "Sortie", value: sortieLabel },
    ]),
  });
};

module.exports = {
  sendEmail,
  sendInscriptionConfirmationEmail,
  sendInscriptionPaymentEmail,
  sendWaitlistPromotedEmail,
  sendSortieReminderEmail,
  sendSortieAnnuleeMeteoEmail,
  sendPropositionsReprogrammationEmail,
  sendAlerteMeteoDouteuseEmail,
};
