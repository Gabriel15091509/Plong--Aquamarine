// backend/src/utils/email.js
const nodemailer = require("nodemailer");

// 🔒 CACHE POUR BLOQUER LES DOUBLONS
const emailCache = new Map();

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn("⚠️ Variables email non configurées");
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

/**
 * FONCTION UNIQUE : Envoyer un email - BLOQUE LES DOUBLONS
 */
const sendEmail = async (params = {}) => {
  const { to, subject, html, text, from } = params;

  // 🔒 Vérifier si déjà envoyé
  const cacheKey = `${to}-${subject}`;
  if (emailCache.has(cacheKey)) {
    console.log(`⛔⛔ EMAIL DÉJÀ ENVOYÉ À ${to} - IGNORÉ !`);
    return {
      success: true,
      messageId: `blocked-${Date.now()}`,
      to,
      subject,
      blocked: true,
    };
  }

  console.log("📧 [sendEmail] Envoi à:", to);

  if (!to) throw new Error("❌ Destinataire requis");
  if (!subject) throw new Error("❌ Sujet requis");
  if (!html) throw new Error("❌ Contenu HTML requis");

  // 🔒 Marquer comme envoyé
  emailCache.set(cacheKey, Date.now());

  // Mode simulation
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log("📧 [SIMULATION] Email envoyé à", to);
    return {
      success: true,
      messageId: `sim-${Date.now()}`,
      to,
      subject,
      simulated: true,
    };
  }

  // Envoi réel
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

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email envoyé à ${to}`);
    console.log(`📧 Message ID: ${info.messageId}`);

    return {
      success: true,
      messageId: info.messageId,
      to,
      subject,
    };
  } catch (error) {
    console.error("❌ Erreur envoi:", error.message);
    // En cas d'erreur, retirer du cache
    emailCache.delete(cacheKey);
    throw error;
  }
};

/**
 * 🔑 Email de bienvenue - UTILISE STRICTEMENT le mot de passe du frontend
 */
const sendWelcomeEmail = async ({ to, user, temporaryPassword, loginUrl }) => {
  console.log("📧 [sendWelcomeEmail]");
  console.log(`🔑 Mot de passe REÇU: "${temporaryPassword}"`);

  const name = user?.name || "Utilisateur";
  const email = user?.email || to;
  const role = user?.role || "adhérent";
  const loginLink = loginUrl || "http://localhost:3000/login";

  // 🔑 HTML avec le mot de passe du frontend
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue au Club de Plongée</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f0f4f8; margin: 0; padding: 40px 20px; line-height: 1.6; color: #1a202c; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; box-shadow: 0 20px 60px rgba(0,0,0,0.08); overflow: hidden; }
    .header { background: linear-gradient(135deg, #06b6d4, #3b82f6, #4f46e5); padding: 48px 40px 40px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 32px; font-weight: 800; }
    .header p { color: rgba(255,255,255,0.85); font-size: 16px; }
    .header .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #ffffff; margin-top: 12px; }
    .content { padding: 40px; }
    .greeting { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    .greeting span { color: #3b82f6; }
    .sub-greeting { color: #718096; font-size: 16px; margin-bottom: 24px; }
    .info-card { background: #f7fafc; border-radius: 12px; padding: 16px; margin: 12px 0; border-left: 4px solid #3b82f6; }
    .info-card .label { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #a0aec0; }
    .info-card .value { font-size: 16px; font-weight: 600; color: #2d3748; margin-top: 4px; }
    .password-box { background: #fffbeb; border-radius: 12px; padding: 24px; margin: 20px 0; border: 2px dashed #f59e0b; text-align: center; }
    .password-box .pwd { font-family: 'Courier New', monospace; font-size: 28px; font-weight: 800; color: #92400e; letter-spacing: 4px; background: #fef3c7; padding: 8px 24px; border-radius: 8px; display: inline-block; margin-top: 8px; }
    .warning { background: #fef2f2; border-radius: 12px; padding: 16px; margin: 20px 0; border-left: 4px solid #ef4444; }
    .warning p { color: #991b1b; font-size: 14px; }
    .btn { display: inline-block; padding: 14px 40px; background: linear-gradient(135deg, #06b6d4, #3b82f6); color: #fff !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; }
    .footer { padding: 24px 40px; border-top: 1px solid #edf2f7; text-align: center; }
    .footer p { color: #a0aec0; font-size: 13px; }
    @media (max-width: 480px) {
      .header { padding: 32px 24px; }
      .content { padding: 24px 20px; }
      .password-box .pwd { font-size: 20px; letter-spacing: 2px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌊 Club de Plongée</h1>
      <p>Bienvenue dans l'aventure sous-marine</p>
      <span class="badge">🌟 Nouveau membre</span>
    </div>
    <div class="content">
      <div class="greeting">Bonjour <span>${name}</span>,</div>
      <p class="sub-greeting">Votre compte a été créé avec succès. Voici vos identifiants :</p>
      
      <div class="info-card">
        <div class="label">📧 Email de connexion</div>
        <div class="value">${email}</div>
      </div>
      
      <div class="info-card">
        <div class="label">👤 Rôle</div>
        <div class="value">${role}</div>
      </div>
      
      <div class="password-box">
        <div style="font-size:14px;color:#92400e;font-weight:600;">🔑 Mot de passe temporaire</div>
        <div class="pwd">${temporaryPassword}</div>
        <div style="font-size:12px;color:#92400e;opacity:0.7;margin-top:8px;">📋 Copiez ce mot de passe pour vous connecter</div>
      </div>
      
      <div class="warning">
        <p>⚠️ <strong>Important :</strong> Changez votre mot de passe lors de votre première connexion.</p>
      </div>
      
      <div style="text-align:center;margin:24px 0;">
        <a href="${loginLink}" class="btn">🔐 Se connecter</a>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Club de Plongée</p>
      <p style="font-size:12px;color:#cbd5e0;">Email automatique, ne pas répondre</p>
    </div>
  </div>
</body>
</html>`;

  const textContent = `
Bonjour ${name},

Bienvenue au Club de Plongée ! Votre compte a été créé avec succès.

📧 Email: ${email}
👤 Rôle: ${role}
🔑 Mot de passe temporaire: ${temporaryPassword}

⚠️ Important: Changez votre mot de passe à la première connexion.

🔐 Connectez-vous: ${loginLink}

À bientôt ! 🌊
  `;

  // 🔒 UN SEUL APPEL
  const result = await sendEmail({
    to,
    subject: "🌊 Bienvenue au Club de Plongée !",
    html: htmlContent,
    text: textContent,
  });

  console.log(`✅ Email envoyé avec: "${temporaryPassword}"`);

  return {
    ...result,
    temporaryPassword: temporaryPassword,
  };
};

/**
 * Gabarit HTML léger et réutilisé par toutes les notifications de paiement/
 * inscription ci-dessous (reprend le style de sendWelcomeEmail en plus sobre).
 */
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
    <div class="header"><h1>🌊 Aquanature Plongée</h1></div>
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
      ? `<p>✅ Votre dossier d'adhésion est complet : vous êtes à jour pour le Club, la licence FFESM et l'Assurance Responsabilité Civile.</p>`
      : dossier
        ? `<p>⚠️ Votre dossier d'adhésion reste incomplet (manquant : ${dossier.missing.join(", ")}).</p>`
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

const sendFormationPaymentEmail = async ({
  to,
  adherentName,
  niveauVise,
  montantPaye,
  montantTotal,
  statutPaiement,
}) => {
  const solde = Math.max(Number(montantTotal) - Number(montantPaye), 0);
  const introHtml = `<p>Bonjour ${adherentName},</p><p>Nous avons bien reçu votre paiement pour la formation "<strong>${niveauVise}</strong>".</p>${
    solde > 0
      ? `<p>Il reste un solde de <strong>${solde.toFixed(2)} €</strong> à régler.</p>`
      : `<p>Votre formation "${niveauVise}" est maintenant <strong>soldée</strong>.</p>`
  }`;
  return sendEmail({
    to,
    subject: "Confirmation de paiement — Formation",
    html: buildSimpleEmailHtml("Paiement reçu", introHtml, [
      { label: "Formation", value: niveauVise },
      { label: "Statut", value: statutPaiement },
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

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendAdhesionPaymentEmail,
  sendInscriptionConfirmationEmail,
  sendInscriptionPaymentEmail,
  sendFormationPaymentEmail,
  sendWaitlistPromotedEmail,
};
